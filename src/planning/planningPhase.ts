/**
 * Planning phase orchestration
 */

import { createOpencode } from "@opencode-ai/sdk";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { ContextVerifier } from "../verification/contextVerifier.js";
import { spawnPlanningAgent, waitForCompletion } from "./planningAgents.js";
import { structuredMerge } from "./structuredMerge.js";
import { onShutdown } from "../core/gracefulShutdown.js";
import { CONFIG } from "../config.js";

export interface PlanningResult {
  planFile: string;
  specFile: string;
  archFile: string;
  qaFile: string;
  duration: number;
}

export async function runPlanningPhase(
  contextFile: string,
  outputDir: string
): Promise<PlanningResult> {
  const startTime = Date.now();
  const verifier = new ContextVerifier();
  
  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });
  
  // Track sessions for cleanup
  const sessionIds: string[] = [];
  
  // Register cleanup on shutdown
  onShutdown(async () => {
    console.log("🧹 Cleaning up planning sessions...");
    for (const id of sessionIds) {
      try {
        const opencode = await createOpencode({});
        await opencode.client.session.delete({ path: { id } });
      } catch {
        // Ignore cleanup errors during shutdown
      }
    }
  });
  
  try {
    // Read context file
    const context = await readFile(contextFile, "utf-8");
    
    // Create OpenCode client configured for planning (Gemini free tier)
    const opencode = await createOpencode({
      config: { 
        model: `${CONFIG.models.planning.provider}/${CONFIG.models.planning.model}`,
      },
    });
    
    // Spawn 3 planning agents in parallel
    console.log("📋 Spawning 3 planning agents (parallel, Gemini free tier)...");
    const [specSession, archSession, qaSession] = await Promise.all([
      spawnPlanningAgent(opencode, "planner-spec", context, outputDir),
      spawnPlanningAgent(opencode, "planner-arch", context, outputDir),
      spawnPlanningAgent(opencode, "planner-qa", context, outputDir),
    ]);
    
    // Track for cleanup
    sessionIds.push(specSession.id, archSession.id, qaSession.id);
    
    // Wait for completion with timeout
    console.log("⏳ Waiting for planning agents to complete...");
    const [specOutput, archOutput, qaOutput] = await Promise.all([
      waitForCompletion(opencode, specSession.id, CONFIG.planningTimeoutMs),
      waitForCompletion(opencode, archSession.id, CONFIG.planningTimeoutMs),
      waitForCompletion(opencode, qaSession.id, CONFIG.planningTimeoutMs),
    ]);
    
    // Save individual outputs
    const specFile = join(outputDir, "SPEC.md");
    const archFile = join(outputDir, "ARCH.md");
    const qaFile = join(outputDir, "QA.md");
    
    await Promise.all([
      writeFile(specFile, specOutput, "utf-8"),
      writeFile(archFile, archOutput, "utf-8"),
      writeFile(qaFile, qaOutput, "utf-8"),
    ]);
    
    // STRUCTURED MERGE (no LLM overhead)
    console.log("🔀 Merging planning outputs (structured, no LLM)...");
    const planFile = join(outputDir, "PLAN.md");
    await structuredMerge(specOutput, archOutput, qaOutput, planFile);
    
    // CRITICAL: Delete planning sessions
    console.log("🗑️  Deleting planning sessions...");
    await Promise.all([
      opencode.client.session.delete({ path: { id: specSession.id } }),
      opencode.client.session.delete({ path: { id: archSession.id } }),
      opencode.client.session.delete({ path: { id: qaSession.id } }),
    ]);
    
    // VERIFY DELETION
    console.log("✅ Verifying sessions were deleted...");
    await Promise.all([
      verifier.verifyDeleted(specSession.id),
      verifier.verifyDeleted(archSession.id),
      verifier.verifyDeleted(qaSession.id),
    ]);
    
    // Clear from tracking (cleanup complete)
    sessionIds.length = 0;
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`✓ Planning phase complete in ${duration.toFixed(1)}s (verified cleanup)`);
    
    return {
      planFile,
      specFile,
      archFile,
      qaFile,
      duration,
    };
  } catch (error) {
    // Cleanup on error
    console.error("❌ Planning phase failed:", error);
    for (const id of sessionIds) {
      try {
        const opencode = await createOpencode({});
        await opencode.client.session.delete({ path: { id } });
      } catch {
        // Ignore cleanup errors
      }
    }
    throw error;
  }
}

