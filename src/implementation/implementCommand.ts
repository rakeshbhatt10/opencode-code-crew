/**
 * Implementation phase orchestration
 */

import { createOpencode } from "@opencode-ai/sdk";
import { BacklogManager } from "../backlog/backlogManager.js";
import { ContextCompressor } from "../backlog/contextCompressor.js";
import { ModelRouter } from "./modelRouter.js";
import { WorktreeManager } from "./worktreeManager.js";
import { ContextVerifier } from "../verification/contextVerifier.js";
import { InstrumentationChecker } from "../verification/instrumentationChecker.js";
import { ContextDriftDetector } from "../monitoring/contextDriftDetector.js";
import { onShutdown } from "../core/gracefulShutdown.js";
import { implementationLimiter } from "../core/rateLimit.js";
import { CONFIG } from "../config.js";
import type { BacklogTask, TaskResult } from "../types.js";

export async function runImplementation(
  backlogFile: string,
  projectRoot: string
): Promise<TaskResult[]> {
  const backlog = new BacklogManager(backlogFile);
  await backlog.load();
  
  const readyTasks = backlog.getReadyTasks();
  if (readyTasks.length === 0) {
    console.log("No ready tasks. All completed or waiting on dependencies.");
    return [];
  }
  
  // HEALTH CHECK FIRST
  console.log("🏥 Running instrumentation health checks...");
  const healthChecker = new InstrumentationChecker();
  await healthChecker.verifyHealthy(projectRoot);
  console.log("✓ All instrumentation healthy\n");
  
  // Initialize components
  const compressor = new ContextCompressor();
  const router = new ModelRouter();
  const verifier = new ContextVerifier();
  const driftDetector = new ContextDriftDetector();
  const worktreeManager = new WorktreeManager(projectRoot);
  
  // Register cleanup on shutdown
  onShutdown(async () => {
    await worktreeManager.cleanupAll();
  });
  
  const results: TaskResult[] = [];
  
  // Spawn workers for ready tasks (rate-limited)
  const tasksToProcess = readyTasks.slice(0, CONFIG.maxWorkers);
  
  console.log(`📋 Processing ${tasksToProcess.length} tasks in parallel...\n`);
  
  const workerPromises = tasksToProcess.map(task => 
    implementationLimiter.run(() => processTask(
      task,
      backlog,
      compressor,
      router,
      verifier,
      driftDetector,
      worktreeManager,
      projectRoot
    ))
  );
  
  const taskResults = await Promise.allSettled(workerPromises);
  
  // Collect results
  for (let i = 0; i < taskResults.length; i++) {
    const result = taskResults[i];
    const task = tasksToProcess[i];
    
    if (result.status === "fulfilled") {
      results.push(result.value);
    } else {
      console.error(`❌ Task ${task.id} failed:`, result.reason);
      results.push({
        taskId: task.id,
        attempts: task.attempts + 1,
        contextSize: 0,
        duration: 0,
        commits: 0,
        logs: String(result.reason),
        success: false,
      });
    }
  }
  
  // Save backlog
  await backlog.save();
  
  // Print summary
  console.log("\n=== Implementation Summary ===");
  const stats = backlog.getStats();
  console.log(`Total: ${stats.total}`);
  console.log(`Completed: ${stats.completed}`);
  console.log(`In Progress: ${stats.inProgress}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Pending: ${stats.pending}`);
  
  return results;
}

async function processTask(
  task: BacklogTask,
  backlog: BacklogManager,
  compressor: ContextCompressor,
  router: ModelRouter,
  verifier: ContextVerifier,
  driftDetector: ContextDriftDetector,
  worktreeManager: WorktreeManager,
  projectRoot: string
): Promise<TaskResult> {
  const startTime = Date.now();
  
  console.log(`🚀 Starting task ${task.id}: ${task.title}`);
  
  // Update status
  backlog.updateTaskStatus(task.id, "in_progress");
  backlog.incrementAttempts(task.id);
  await backlog.save();
  
  // Create isolated worktree
  const worktreePath = await worktreeManager.create(task.id);
  
  try {
    // Build compressed context
    const context = compressor.buildTaskContext(task);
    
    // Get model for task
    const modelString = router.getModelString(task);
    
    // Create OpenCode session
    const opencode = await createOpencode({
      config: { model: modelString },
    });
    
    const sessionResponse = await opencode.client.session.create({
      body: {
        title: `Task ${task.id}: ${task.title}`,
      },
    });
    
    if (!sessionResponse.data) {
      throw new Error("Failed to create session");
    }
    
    const session = sessionResponse.data;
    
    // Verify context is clean before sending
    const metrics = await verifier.verifyClean(session.id, "implementation");
    await driftDetector.checkDrift(task.id, "implementation-start", metrics);
    
    // Send implementation prompt
    const prompt = `${context}

## Instructions
1. Implement the task according to the specification
2. Create or modify files as needed
3. Write tests for your implementation
4. Ensure all tests pass
5. Commit your changes with a descriptive message

Working directory: ${worktreePath}
`;

    await opencode.client.session.prompt({
      path: { id: session.id },
      body: { parts: [{ type: "text", text: prompt }] },
    });
    
    // Wait for completion
    await waitForTaskCompletion(opencode, session.id, CONFIG.implementationTimeoutMs);
    
    // Verify final context
    const finalMetrics = await verifier.verifyClean(session.id, "implementation");
    await driftDetector.checkDrift(task.id, "implementation-end", finalMetrics);
    
    // Cleanup session
    await opencode.client.session.delete({ path: { id: session.id } });
    await verifier.verifyDeleted(session.id);
    
    // Merge worktree back
    await worktreeManager.merge(task.id);
    await worktreeManager.cleanup(task.id);
    
    // Update status
    backlog.updateTaskStatus(task.id, "completed");
    await backlog.save();
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`✓ Task ${task.id} completed in ${duration.toFixed(1)}s`);
    
    return {
      taskId: task.id,
      attempts: task.attempts,
      contextSize: finalMetrics.size,
      duration,
      commits: 1, // Simplified
      logs: "",
      success: true,
    };
  } catch (error: any) {
    console.error(`❌ Task ${task.id} failed:`, error.message);
    
    // Cleanup on failure
    await worktreeManager.cleanup(task.id);
    
    // Update status
    backlog.updateTaskStatus(task.id, "failed");
    await backlog.save();
    
    const duration = (Date.now() - startTime) / 1000;
    
    return {
      taskId: task.id,
      attempts: task.attempts,
      contextSize: 0,
      duration,
      commits: 0,
      logs: error.message,
      success: false,
    };
  }
}

async function waitForTaskCompletion(
  opencode: any,
  sessionId: string,
  timeoutMs: number
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const session = await opencode.client.session.get({
      path: { id: sessionId },
    });
    
    if (session.status === "completed" || session.status === "idle") {
      return;
    }
    
    if (session.status === "failed" || session.status === "error") {
      throw new Error(`Task failed with status: ${session.status}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, CONFIG.pollIntervalMs));
  }
  
  throw new Error(`Task timed out after ${timeoutMs}ms`);
}

