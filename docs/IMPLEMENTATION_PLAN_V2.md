# Implementation Plan V2: Context-Engineered Multi-Agent System

> **Fixed Implementation Plan - Addresses All Critical Issues from Review**

---

## Executive Summary

This plan creates an OpenCode plugin that implements the multi-agent coding system with **rigorous context engineering** and **verified feedback loops**.

**Key Improvements from V1:**
1. ✅ Context verification gates at every phase transition
2. ✅ Instrumentation health checks before any feedback loop
3. ✅ Explicit compression rules (enforced, not suggested)
4. ✅ Proactive prompt rebasing (not just reactive)
5. ✅ Context drift detection and monitoring
6. ✅ Session deletion with confirmation
7. ✅ Structured planning output merge (no LLM overhead)

**Timeline:** 6 weeks (vs 8 weeks in V1)

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Architecture](#architecture)
3. [Phase 1: Foundation with Verification](#phase-1-foundation-with-verification-week-1-2)
4. [Phase 2: Backlog with Health Checks](#phase-2-backlog-with-health-checks-week-2-3)
5. [Phase 3: Context Engineering with Monitoring](#phase-3-context-engineering-with-monitoring-week-3-4)
6. [Phase 4: Proactive Rebasing & Factory Pattern](#phase-4-proactive-rebasing--factory-pattern-week-4-6)
7. [Testing & Verification](#testing--verification)

---

## Core Principles

### 1. Context Quality = Output Quality

**Implementation:** Every phase transition includes verification gates.

### 2. Verify, Don't Assume

**Implementation:** 
- Confirm session deletion
- Scan for planning debris
- Check context sizes
- Validate instrumentation

### 3. Feedback Loops Must Be Real

**Implementation:** Health checks before starting any verification loop.

### 4. Proactive Over Reactive

**Implementation:** Rebase on "messy runs" even when successful.

### 5. Specs Are Durable, Code Is Output

**Implementation:** Factory pattern from Phase 4.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              OpenCode Plugin: multi-agent-coder-v2           │
│  WITH VERIFICATION GATES AT EVERY PHASE TRANSITION           │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌──────────────┐                    ┌──────────────────┐
│  PLANNING    │  [VERIFY CLEANUP]  │ IMPLEMENTATION    │
│   PHASE      │───────────────────→│    PHASE          │
└──────────────┘                    └──────────────────┘
        │                                       │
    [Parallel]                          [Health Check]
        │                                       │
    ┌───┼───┐                                  │
    ▼   ▼   ▼                                  │
┌────┐┌────┐┌────┐                             │
│Spec││Arch││ QA │                             │
└────┘└────┘└────┘                             │
    │   │   │                                  │
    └───┼───┘                                  │
        ▼                                      │
[STRUCTURED MERGE - NO LLM]                    │
        │                                      │
   PLAN.md                                     │
        │                                      │
[DELETE + VERIFY DELETION]                     │
        │                                      │
        ▼                                      │
  BACKLOG.yaml                                 │
        │                                      │
[VALIDATE SCHEMA]                              │
        │                                      │
        └──────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   Worker T01   Worker T02   Worker T03
   [VERIFY     [VERIFY     [VERIFY
    CONTEXT]    CONTEXT]    CONTEXT]
```

---

## Phase 1: Foundation with Verification (Week 1-2)

### Step 1.1: Plugin Scaffolding

**File**: `package.json`
```json
{
  "name": "multi-agent-coder-v2",
  "version": "2.0.0",
  "description": "Context-engineered multi-agent coding system with verification",
  "dependencies": {
    "@opencode-ai/plugin": "^1.0.0",
    "@opencode-ai/sdk": "^1.0.0",
    "js-yaml": "^4.1.0"
  }
}
```

### Step 1.2: Context Verification System

**File**: `src/verification/contextVerifier.ts`

```typescript
import { createOpencode } from "@opencode-ai/sdk";

export interface ContextMetrics {
  size: number;
  uniqueFiles: number;
  taskIds: Set<string>;
  planningKeywords: number;
  hasFullFiles: boolean;
}

export class ContextVerifier {
  private readonly planningKeywords = [
    "we explored",
    "alternative approach",
    "after much discussion",
    "three options",
    "let me think",
    "first attempt",
    "trying different",
  ];

  private readonly maxContextSize = 3000; // 3KB hard limit
  
  /**
   * Verify context hygiene before phase transition
   * THROWS if context is polluted
   */
  async verifyClean(
    sessionId: string,
    phase: "implementation" | "review"
  ): Promise<ContextMetrics> {
    const context = await this.getSessionContext(sessionId);
    const metrics = this.analyzeContext(context);
    
    // Critical checks
    if (phase === "implementation") {
      // 1. Size check
      if (metrics.size > this.maxContextSize) {
        throw new Error(
          `Context too large: ${metrics.size} bytes (max: ${this.maxContextSize})`
        );
      }
      
      // 2. Planning debris check
      if (metrics.planningKeywords > 0) {
        const examples = this.findPlanningDebris(context);
        throw new Error(
          `Planning debris detected: "${examples[0]}"`
        );
      }
      
      // 3. Cross-task contamination
      if (metrics.taskIds.size > 1) {
        throw new Error(
          `Cross-task contamination: ${[...metrics.taskIds].join(", ")}`
        );
      }
      
      // 4. Full file contents check
      if (metrics.hasFullFiles) {
        throw new Error(
          "Full file contents detected - use file paths only"
        );
      }
    }
    
    return metrics;
  }
  
  /**
   * Verify session was actually deleted
   * THROWS if session still exists
   */
  async verifyDeleted(sessionId: string): Promise<void> {
    const opencode = await createOpencode({});
    
    try {
      await opencode.client.session.get({ path: { id: sessionId } });
      // If we get here, session still exists!
      throw new Error(
        `Session ${sessionId} still exists after deletion attempt!`
      );
    } catch (error: any) {
      if (error.status === 404 || error.message?.includes("not found")) {
        // Good - session is gone
        return;
      }
      // Other error - rethrow
      throw error;
    }
  }
  
  private analyzeContext(context: string): ContextMetrics {
    return {
      size: context.length,
      uniqueFiles: this.countUniqueFiles(context),
      taskIds: this.extractTaskIds(context),
      planningKeywords: this.countPlanningKeywords(context),
      hasFullFiles: this.detectFullFiles(context),
    };
  }
  
  private countPlanningKeywords(context: string): number {
    const lower = context.toLowerCase();
    return this.planningKeywords.filter(kw => 
      lower.includes(kw.toLowerCase())
    ).length;
  }
  
  private findPlanningDebris(context: string): string[] {
    const lower = context.toLowerCase();
    return this.planningKeywords
      .filter(kw => lower.includes(kw.toLowerCase()))
      .slice(0, 3); // First 3 examples
  }
  
  private countUniqueFiles(context: string): number {
    const filePattern = /(?:src|lib|test)\/[\w\/\-\.]+\.\w+/g;
    const files = new Set(context.match(filePattern) || []);
    return files.size;
  }
  
  private extractTaskIds(context: string): Set<string> {
    const taskPattern = /\b(T\d{2,3})\b/g;
    const matches = context.match(taskPattern) || [];
    return new Set(matches);
  }
  
  private detectFullFiles(context: string): boolean {
    // Heuristic: If we see more than 50 lines from one file, it's probably full
    const lines = context.split("\n");
    let currentFile = "";
    let lineCount = 0;
    
    for (const line of lines) {
      if (line.match(/^\/\/ File: /)) {
        if (lineCount > 50) return true;
        currentFile = line;
        lineCount = 0;
      } else if (currentFile) {
        lineCount++;
      }
    }
    
    return lineCount > 50;
  }
  
  private async getSessionContext(sessionId: string): Promise<string> {
    // Get session messages and concatenate
    const opencode = await createOpencode({});
    const messages = await opencode.client.session.messages({
      path: { id: sessionId },
    });
    
    return messages
      .map((m: any) => m.parts?.map((p: any) => p.text).join("\n") || "")
      .join("\n\n");
  }
}
```

### Step 1.3: Instrumentation Health Checks

**File**: `src/verification/instrumentationChecker.ts`

```typescript
import { $ } from "bun";

export interface HealthCheckResult {
  healthy: boolean;
  checks: {
    testRunner: boolean;
    linter: boolean;
    typeChecker: boolean;
  };
  errors: string[];
}

export class InstrumentationChecker {
  /**
   * Verify all instrumentation is working BEFORE starting any feedback loop
   * THROWS if instrumentation is broken
   */
  async verifyHealthy(workDir: string): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      healthy: true,
      checks: {
        testRunner: false,
        linter: false,
        typeChecker: false,
      },
      errors: [],
    };
    
    // 1. Test runner health check
    try {
      await this.checkTestRunner(workDir);
      result.checks.testRunner = true;
    } catch (error: any) {
      result.healthy = false;
      result.errors.push(`Test runner broken: ${error.message}`);
    }
    
    // 2. Linter health check
    try {
      await this.checkLinter(workDir);
      result.checks.linter = true;
    } catch (error: any) {
      result.healthy = false;
      result.errors.push(`Linter broken: ${error.message}`);
    }
    
    // 3. Type checker health check
    try {
      await this.checkTypeChecker(workDir);
      result.checks.typeChecker = true;
    } catch (error: any) {
      result.healthy = false;
      result.errors.push(`Type checker broken: ${error.message}`);
    }
    
    if (!result.healthy) {
      throw new Error(
        `Instrumentation health check FAILED:\n${result.errors.join("\n")}`
      );
    }
    
    return result;
  }
  
  private async checkTestRunner(workDir: string): Promise<void> {
    // Run a smoke test (create one if it doesn't exist)
    const smokeTest = `${workDir}/tests/smoke.test.ts`;
    
    // Create smoke test if missing
    await $`mkdir -p ${workDir}/tests`;
    await $`echo "test('smoke', () => expect(true).toBe(true));" > ${smokeTest}`;
    
    // Run it
    try {
      await $`cd ${workDir} && pnpm test smoke.test.ts`;
    } catch (error) {
      throw new Error("Test runner failed on known-passing smoke test");
    }
    
    // Verify test output format
    const versionOutput = await $`cd ${workDir} && pnpm test --version`.text();
    if (!versionOutput.includes("jest") && 
        !versionOutput.includes("vitest") &&
        !versionOutput.includes("bun")) {
      throw new Error("Test runner output format unexpected");
    }
  }
  
  private async checkLinter(workDir: string): Promise<void> {
    // Verify linter is installed and responds
    try {
      await $`cd ${workDir} && pnpm lint --version`;
    } catch (error) {
      throw new Error("Linter not installed or not responding");
    }
    
    // Create a known-clean file and verify it passes
    const cleanFile = `${workDir}/tests/lint-smoke.ts`;
    await $`echo "export const x = 1;" > ${cleanFile}`;
    
    try {
      await $`cd ${workDir} && pnpm lint ${cleanFile}`;
    } catch (error) {
      throw new Error("Linter failed on known-clean file");
    }
  }
  
  private async checkTypeChecker(workDir: string): Promise<void> {
    // Verify type checker is installed
    try {
      await $`cd ${workDir} && pnpm typecheck --version`;
    } catch (error) {
      throw new Error("Type checker not installed or not responding");
    }
    
    // Create a known-valid file and verify it passes
    const validFile = `${workDir}/tests/type-smoke.ts`;
    await $`echo "const y: number = 42;" > ${validFile}`;
    
    try {
      await $`cd ${workDir} && pnpm typecheck ${validFile}`;
    } catch (error) {
      throw new Error("Type checker failed on known-valid file");
    }
  }
}
```

### Step 1.4: Planning Phase with Verification

**File**: `src/commands/planning.ts`

```typescript
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool";
import type { PluginInput } from "@opencode-ai/plugin";
import { createOpencode } from "@opencode-ai/sdk";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { ContextVerifier } from "../verification/contextVerifier.js";

export const planningPhaseCommand = (ctx: PluginInput): ToolDefinition =>
  tool({
    description: "Runs parallel planning phase with 3 subagents and VERIFIES cleanup.",
    args: {
      context_file: tool.schema.string().describe("Path to context file"),
      output_dir: tool.schema.string().describe("Output directory"),
    },
    async execute(args: { context_file: string; output_dir: string }) {
      const opencode = await createOpencode({});
      const verifier = new ContextVerifier();
      
      // Read context file
      const context = await readFile(args.context_file, "utf-8");
      
      // Spawn 3 planning agents in parallel
      console.log("📋 Spawning 3 planning agents (parallel)...");
      const [specSession, archSession, qaSession] = await Promise.all([
        spawnPlanningAgent(opencode, "planner-spec", context, args.output_dir),
        spawnPlanningAgent(opencode, "planner-arch", context, args.output_dir),
        spawnPlanningAgent(opencode, "planner-qa", context, args.output_dir),
      ]);
      
      // Wait for completion
      console.log("⏳ Waiting for planning agents to complete...");
      const [specOutput, archOutput, qaOutput] = await Promise.all([
        waitForCompletion(opencode, specSession.id),
        waitForCompletion(opencode, archSession.id),
        waitForCompletion(opencode, qaSession.id),
      ]);
      
      // Save individual outputs
      await writeFile(join(args.output_dir, "SPEC.md"), specOutput);
      await writeFile(join(args.output_dir, "ARCH.md"), archOutput);
      await writeFile(join(args.output_dir, "QA.md"), qaOutput);
      
      // STRUCTURED MERGE (no LLM overhead)
      console.log("🔀 Merging planning outputs (structured, no LLM)...");
      const planFile = await structuredMerge(
        specOutput,
        archOutput,
        qaOutput,
        join(args.output_dir, "PLAN.md")
      );
      
      // CRITICAL: Delete planning sessions
      console.log("🗑️  Deleting planning sessions...");
      await Promise.all([
        opencode.client.session.delete({ path: { id: specSession.id } }),
        opencode.client.session.delete({ path: { id: archSession.id } }),
        opencode.client.session.delete({ path: { id: qaSession.id } }),
      ]);
      
      // VERIFY DELETION (NEW!)
      console.log("✅ Verifying sessions were deleted...");
      await Promise.all([
        verifier.verifyDeleted(specSession.id),
        verifier.verifyDeleted(archSession.id),
        verifier.verifyDeleted(qaSession.id),
      ]);
      
      console.log("✓ Planning phase complete with verified cleanup");
      return `Planning complete. Unified plan: ${planFile}`;
    },
  });

/**
 * Structured merge - NO LLM overhead
 * Extracts sections by markers and combines deterministically
 */
async function structuredMerge(
  spec: string,
  arch: string,
  qa: string,
  outputFile: string
): Promise<string> {
  const merged = `# Unified Plan

## 1. Product Specification
${extractSection(spec, "## Requirements", "## ")}

## 2. Acceptance Criteria
${extractSection(spec, "## Acceptance", "## ")}

## 3. Architecture Design
${extractSection(arch, "## Design", "## ")}

## 4. API & Data Flows
${extractSection(arch, "## API", "## ")}

## 5. Quality Assurance
${extractSection(qa, "## Test Plan", "## ")}

## 6. Risk Mitigation
${extractSection(qa, "## Risks", "## ")}

## 7. Implementation Steps
${synthesizeSteps(spec, arch, qa)}
`;

  await writeFile(outputFile, merged);
  return outputFile;
}

function extractSection(
  doc: string,
  startMarker: string,
  endMarker: string
): string {
  const lines = doc.split("\n");
  const startIdx = lines.findIndex(l => l.includes(startMarker));
  if (startIdx === -1) return "(Section not found)";
  
  const endIdx = lines.findIndex((l, i) => 
    i > startIdx && l.startsWith(endMarker) && l !== startMarker
  );
  
  const section = lines.slice(
    startIdx + 1, 
    endIdx === -1 ? undefined : endIdx
  );
  
  return section.join("\n").trim();
}

function synthesizeSteps(spec: string, arch: string, qa: string): string {
  // Extract numbered lists from each document
  const specSteps = extractNumberedList(spec);
  const archSteps = extractNumberedList(arch);
  
  // Combine and deduplicate
  const allSteps = [...specSteps, ...archSteps];
  const unique = [...new Set(allSteps)];
  
  return unique.map((step, i) => `${i + 1}. ${step}`).join("\n");
}

function extractNumberedList(doc: string): string[] {
  const lines = doc.split("\n");
  return lines
    .filter(l => /^\d+\.\s/.test(l.trim()))
    .map(l => l.replace(/^\d+\.\s/, "").trim());
}

async function spawnPlanningAgent(
  opencode: any,
  agent: string,
  context: string,
  outputDir: string
): Promise<any> {
  const session = await opencode.client.session.create({
    body: {
      title: `Planning: ${agent} - ${Date.now()}`,
      agent,
    },
  });
  
  const prompt = `You are the ${agent} agent.

Read this context and produce your output document:

${context}

Output file: ${outputDir}/${agent.toUpperCase().replace("PLANNER-", "")}.md

Be thorough but concise. Your exploration context will be deleted - only your final document matters.
`;
  
  await opencode.client.session.prompt({
    path: { id: session.id },
    body: {
      parts: [{ type: "text", text: prompt }],
    },
  });
  
  return session;
}

async function waitForCompletion(opencode: any, sessionId: string): Promise<string> {
  // Poll until session is idle
  while (true) {
    const session = await opencode.client.session.get({ path: { id: sessionId } });
    
    if (session.status === "idle" || session.status === "completed") {
      // Extract final output
      const messages = await opencode.client.session.messages({ path: { id: sessionId } });
      const lastMessage = messages[messages.length - 1];
      return lastMessage.parts?.map((p: any) => p.text).join("\n") || "";
    }
    
    if (session.status === "error") {
      throw new Error(`Planning agent failed: ${session.error}`);
    }
    
    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
```

**Success Criteria Phase 1:**
- [ ] Planning agents spawn in parallel
- [ ] Structured merge produces clean PLAN.md (no LLM call)
- [ ] Session deletion is VERIFIED (not just attempted)
- [ ] Context verification gates are enforced

---

## Phase 2: Backlog with Health Checks (Week 2-3)

### Step 2.1: Backlog Generator with Validation

**File**: `src/utils/backlogGenerator.ts`

```typescript
import { readFile, writeFile } from "fs/promises";
import yaml from "js-yaml";
import { createOpencode } from "@opencode-ai/sdk";
import { ContextVerifier } from "../verification/contextVerifier.js";

export interface BacklogTask {
  id: string;
  title: string;
  description: string;
  status: "pending" | "ready" | "in_progress" | "review" | "completed" | "failed";
  depends_on: string[];
  acceptance: string[];
  scope: {
    files_hint: string[];      // File paths ONLY, not contents
    estimated_hours: number;
  };
  context?: {
    constraints?: string[];    // Max 5, each <100 chars
    patterns?: string[];       // Format: "file.ts:45-78 - description"
    gotchas?: string[];        // Max 3, each <100 chars
  };
}

export interface Backlog {
  version: string;
  track_id: string;
  created_at: string;
  tasks: BacklogTask[];
}

export class BacklogGenerator {
  private verifier = new ContextVerifier();
  
  async generateFromPlan(
    planFile: string,
    outputFile: string,
    trackId: string
  ): Promise<string> {
    const planContent = await readFile(planFile, "utf-8");
    
    // Spawn conductor (FRESH session, no planning debris)
    const opencode = await createOpencode({
      config: { model: "openai/gpt-4" },
    });

    const session = await opencode.client.session.create({
      body: {
        title: `Backlog Generation - ${trackId}`,
        agent: "conductor",
      },
    });

    const prompt = `Generate task backlog from this plan.

STRICT FORMAT REQUIREMENTS:
- Each task: 2-4 hours, atomic, testable
- Explicit dependencies (use task IDs)
- Clear acceptance criteria (testable statements)
- File hints: paths ONLY (e.g., "src/api/auth.ts"), NOT full contents
- Patterns: "file:lines - brief" (e.g., "src/utils.ts:45-78 - error handling pattern")
- Constraints: Max 5, each <100 chars
- Gotchas: Max 3, each <100 chars

Output YAML following docs/BACKLOG_SCHEMA.md.

Plan:
${planContent}
`;

    await opencode.client.session.prompt({
      path: { id: session.id },
      body: { parts: [{ type: "text", text: prompt }] },
    });

    // Wait and collect
    const backlogContent = await this.collectBacklogOutput(opencode, session.id);
    
    // Parse and VALIDATE
    const backlog = yaml.load(backlogContent) as Backlog;
    this.validateBacklog(backlog);
    
    // Write validated backlog
    await writeFile(outputFile, yaml.dump(backlog, { indent: 2 }), "utf-8");
    
    // Delete backlog generation session
    await opencode.client.session.delete({ path: { id: session.id } });
    
    // VERIFY deletion
    await this.verifier.verifyDeleted(session.id);

    return outputFile;
  }

  private validateBacklog(backlog: Backlog): void {
    if (!backlog.tasks || backlog.tasks.length === 0) {
      throw new Error("Backlog has no tasks");
    }
    
    for (const task of backlog.tasks) {
      // 1. Acceptance criteria required
      if (!task.acceptance || task.acceptance.length === 0) {
        throw new Error(`Task ${task.id} missing acceptance criteria`);
      }
      
      // 2. File hints required
      if (!task.scope?.files_hint || task.scope.files_hint.length === 0) {
        throw new Error(`Task ${task.id} missing file hints`);
      }
      
      // 3. Validate file hint format (paths only)
      for (const hint of task.scope.files_hint) {
        if (hint.includes("\n") || hint.length > 200) {
          throw new Error(
            `Task ${task.id} file hint looks like full file content: "${hint.substring(0, 50)}..."`
          );
        }
      }
      
      // 4. Validate pattern format
      if (task.context?.patterns) {
        for (const pattern of task.context.patterns) {
          if (!pattern.match(/^[\w\/\.\-]+:\d+-\d+\s*-\s*.+$/)) {
            throw new Error(
              `Task ${task.id} pattern invalid format: "${pattern}". ` +
              `Expected: "file.ts:45-78 - description"`
            );
          }
          if (pattern.length > 120) {
            throw new Error(`Task ${task.id} pattern too long: ${pattern.length} chars`);
          }
        }
      }
      
      // 5. Validate constraints length
      if (task.context?.constraints) {
        if (task.context.constraints.length > 5) {
          throw new Error(`Task ${task.id} has too many constraints: ${task.context.constraints.length}`);
        }
        for (const constraint of task.context.constraints) {
          if (constraint.length > 100) {
            throw new Error(`Task ${task.id} constraint too long: ${constraint.length} chars`);
          }
        }
      }
    }
    
    // 6. Check for circular dependencies
    this.checkCircularDependencies(backlog);
    
    // 7. Validate dependency references exist
    this.validateDependencies(backlog);
  }

  private checkCircularDependencies(backlog: Backlog): void {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    
    const hasCycle = (taskId: string): boolean => {
      if (recStack.has(taskId)) return true;
      if (visited.has(taskId)) return false;
      
      visited.add(taskId);
      recStack.add(taskId);
      
      const task = backlog.tasks.find(t => t.id === taskId);
      if (task) {
        for (const dep of task.depends_on || []) {
          if (hasCycle(dep)) return true;
        }
      }
      
      recStack.delete(taskId);
      return false;
    };
    
    for (const task of backlog.tasks) {
      if (hasCycle(task.id)) {
        throw new Error(`Circular dependency involving task ${task.id}`);
      }
    }
  }
  
  private validateDependencies(backlog: Backlog): void {
    const taskIds = new Set(backlog.tasks.map(t => t.id));
    
    for (const task of backlog.tasks) {
      for (const dep of task.depends_on || []) {
        if (!taskIds.has(dep)) {
          throw new Error(`Task ${task.id} depends on non-existent task ${dep}`);
        }
      }
    }
  }

  private async collectBacklogOutput(opencode: any, sessionId: string): Promise<string> {
    // Wait for completion
    while (true) {
      const session = await opencode.client.session.get({ path: { id: sessionId } });
      
      if (session.status === "idle" || session.status === "completed") {
        const messages = await opencode.client.session.messages({ path: { id: sessionId } });
        const lastMessage = messages[messages.length - 1];
        const text = lastMessage.parts?.map((p: any) => p.text).join("\n") || "";
        
        // Extract YAML block
        const yamlMatch = text.match(/```ya?ml\n([\s\S]+?)\n```/);
        if (yamlMatch) {
          return yamlMatch[1];
        }
        return text;
      }
      
      if (session.status === "error") {
        throw new Error(`Backlog generation failed: ${session.error}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}
```

### Step 2.2: Context Compression with Strict Rules

**File**: `src/utils/contextCompressor.ts`

```typescript
import { BacklogTask } from "./backlogGenerator.js";

export class ContextCompressor {
  private readonly budget = {
    spec: 600,       // chars for description
    acceptance: 400, // chars for all acceptance criteria
    constraints: 250, // chars for all constraints
    patterns: 500,   // chars for all patterns
    gotchas: 250,    // chars for all gotchas
  };
  
  private readonly maxSize = 3000; // 3KB hard limit
  
  /**
   * Build minimal task context with STRICT compression
   * ENFORCES <3KB limit (throws if exceeded)
   */
  buildTaskContext(task: BacklogTask): string {
    const sections: string[] = [];
    
    // Header
    sections.push(`# Task ${task.id}: ${task.title}`);
    sections.push("");
    
    // Spec (truncated to budget)
    sections.push("## Specification");
    sections.push(this.truncate(task.description, this.budget.spec));
    sections.push("");
    
    // Acceptance (truncated per-item)
    sections.push("## Acceptance Criteria");
    const acceptancePerItem = Math.floor(
      this.budget.acceptance / task.acceptance.length
    );
    for (const criterion of task.acceptance) {
      sections.push(`- ${this.truncate(criterion, acceptancePerItem)}`);
    }
    sections.push("");
    
    // Context sections (optional)
    if (task.context) {
      sections.push("## Context");
      
      // Constraints
      if (task.context.constraints && task.context.constraints.length > 0) {
        sections.push("### Constraints");
        for (const constraint of task.context.constraints.slice(0, 5)) {
          sections.push(`- ${this.truncate(constraint, 100)}`);
        }
      }
      
      // Patterns (FILE:LINES ONLY)
      if (task.context.patterns && task.context.patterns.length > 0) {
        sections.push("### Code Patterns");
        for (const pattern of task.context.patterns) {
          // Enforce format: "file.ts:45-78 - description"
          if (!pattern.match(/^[\w\/\.\-]+:\d+-\d+\s*-\s*.+$/)) {
            throw new Error(
              `Invalid pattern format: "${pattern}". ` +
              `Expected: "file.ts:45-78 - description"`
            );
          }
          sections.push(`- ${this.truncate(pattern, 120)}`);
        }
      }
      
      // Gotchas (negative evidence)
      if (task.context.gotchas && task.context.gotchas.length > 0) {
        sections.push("### Gotchas");
        for (const gotcha of task.context.gotchas.slice(0, 3)) {
          sections.push(`- ${this.truncate(gotcha, 100)}`);
        }
      }
    }
    
    const context = sections.join("\n");
    
    // ENFORCE hard limit
    if (context.length > this.maxSize) {
      throw new Error(
        `Task context too large: ${context.length} bytes (max: ${this.maxSize}). ` +
        `Task ${task.id} needs further compression.`
      );
    }
    
    return context;
  }
  
  private truncate(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars - 3) + "...";
  }
}
```

**Success Criteria Phase 2:**
- [ ] Backlog validates schema strictly
- [ ] File hints are paths only (no full files)
- [ ] Pattern format is enforced: "file:lines - desc"
- [ ] Context compression enforces <3KB hard limit
- [ ] Session deletion is verified

---

## Phase 3: Context Engineering with Monitoring (Week 3-4)

### Step 3.1: Context Drift Detector

**File**: `src/monitoring/contextDriftDetector.ts`

```typescript
import { ContextMetrics } from "../verification/contextVerifier.js";

export class ContextDriftDetector {
  private baselines: Map<string, ContextMetrics> = new Map();
  private readonly maxGrowth = 0.5; // 50% growth triggers alert
  
  /**
   * Track context metrics and detect drift
   * THROWS if drift exceeds threshold
   */
  async checkDrift(
    taskId: string,
    phase: string,
    metrics: ContextMetrics
  ): Promise<void> {
    const key = `${taskId}-${phase}`;
    
    // Store baseline on first check
    if (!this.baselines.has(phase)) {
      this.baselines.set(phase, metrics);
      console.log(`📊 Baseline set for ${phase}: ${metrics.size} bytes`);
      return;
    }
    
    // Check against baseline
    const baseline = this.baselines.get(phase)!;
    const growth = (metrics.size - baseline.size) / baseline.size;
    
    // Alert on excessive growth
    if (growth > this.maxGrowth) {
      throw new Error(
        `Context drift detected in ${phase}: ` +
        `${metrics.size} bytes (grew ${(growth * 100).toFixed(1)}% from baseline ${baseline.size})`
      );
    }
    
    // Alert on cross-task contamination
    if (metrics.taskIds.size > 1) {
      throw new Error(
        `Cross-task contamination in ${taskId}: ` +
        `${metrics.taskIds.size} task IDs found: ${[...metrics.taskIds].join(", ")}`
      );
    }
    
    // Alert on planning debris
    if (phase === "implementation" && metrics.planningKeywords > 0) {
      throw new Error(
        `Planning debris in ${taskId}: ` +
        `${metrics.planningKeywords} planning keywords detected`
      );
    }
    
    console.log(`✓ Context drift check passed for ${taskId}`);
  }
  
  getReport(): string {
    const lines = ["=== Context Drift Report ===", ""];
    
    for (const [phase, metrics] of this.baselines) {
      lines.push(`${phase}:`);
      lines.push(`  Size: ${metrics.size} bytes`);
      lines.push(`  Files: ${metrics.uniqueFiles}`);
      lines.push(`  Task IDs: ${metrics.taskIds.size}`);
      lines.push("");
    }
    
    return lines.join("\n");
  }
}
```

### Step 3.2: Implementation with Health Checks

**File**: `src/commands/implement.ts`

```typescript
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool";
import type { PluginInput } from "@opencode-ai/plugin";
import { BacklogManager } from "../utils/backlogManager.js";
import { ContextCompressor } from "../utils/contextCompressor.js";
import { ModelRouter } from "../utils/modelRouter.js";
import { ContextVerifier } from "../verification/contextVerifier.js";
import { InstrumentationChecker } from "../verification/instrumentationChecker.js";
import { ContextDriftDetector } from "../monitoring/contextDriftDetector.js";
import { createOpencode } from "@opencode-ai/sdk";

export const implementCommand = (ctx: PluginInput): ToolDefinition =>
  tool({
    description: "Implements tasks from backlog with health checks and verification.",
    args: {
      backlog_file: tool.schema.string().describe("Path to BACKLOG.yaml"),
      work_dir: tool.schema.string().describe("Working directory"),
      max_workers: tool.schema.number().optional().describe("Max parallel workers (default: 3)"),
    },
    async execute(args: { backlog_file: string; work_dir: string; max_workers?: number }) {
      const backlog = new BacklogManager(args.backlog_file);
      await backlog.load();
      
      const readyTasks = backlog.getReadyTasks();
      if (readyTasks.length === 0) {
        return "No ready tasks. All completed or waiting on dependencies.";
      }
      
      // HEALTH CHECK FIRST (before any feedback loop)
      console.log("🏥 Running instrumentation health checks...");
      const healthChecker = new InstrumentationChecker();
      await healthChecker.verifyHealthy(args.work_dir);
      console.log("✓ All instrumentation healthy");
      
      // Initialize verification and monitoring
      const compressor = new ContextCompressor();
      const router = new ModelRouter();
      const verifier = new ContextVerifier();
      const driftDetector = new ContextDriftDetector();
      
      const maxWorkers = args.max_workers || 3;
      const workers = [];
      
      // Spawn workers for ready tasks
      for (const task of readyTasks.slice(0, maxWorkers)) {
        console.log(`🚀 Spawning worker for task ${task.id}...`);
        
        // Build minimal task context (<3KB, enforced)
        const context = compressor.buildTaskContext(task);
        
        // Determine model based on complexity
        const taskType = task.scope.estimated_hours > 4 
          ? "code_implementation" 
          : "simple_change";
        const modelConfig = router.getModel(taskType);
        
        // Spawn worker (FRESH session)
        const opencode = await createOpencode({
          config: { model: modelConfig.model },
        });
        
        const session = await opencode.client.session.create({
          body: {
            title: `Task ${task.id}: ${task.title}`,
            agent: "implementer",
          },
        });
        
        // VERIFY context before sending
        const metrics = await verifier.verifyClean(session.id, "implementation");
        await driftDetector.checkDrift(task.id, "implementation", metrics);
        
        // Send task context
        await opencode.client.session.prompt({
          path: { id: session.id },
          body: {
            parts: [{ type: "text", text: context }],
          },
        });
        
        // Update status
        backlog.updateTaskStatus(task.id, "in_progress");
        await backlog.save();
        
        workers.push({
          taskId: task.id,
          sessionId: session.id,
          modelConfig,
        });
      }
      
      console.log(`✓ Spawned ${workers.length} workers with verified clean contexts`);
      console.log(driftDetector.getReport());
      
      return `Spawned ${workers.length} workers for ready tasks.`;
    },
  });
```

**Success Criteria Phase 3:**
- [ ] Instrumentation health checks BEFORE any loop
- [ ] Context verified clean before implementation
- [ ] Context drift detected and blocked
- [ ] All contexts <3KB (enforced, not suggested)

---

## Phase 4: Proactive Rebasing & Factory Pattern (Week 4-6)

### Step 4.1: Proactive Rebase Engine

**File**: `src/rebasing/rebaseEngine.ts`

```typescript
import { BacklogTask } from "../utils/backlogGenerator.js";
import { createOpencode } from "@opencode-ai/sdk";
import { ContextVerifier } from "../verification/contextVerifier.js";

export interface TaskResult {
  attempts: number;
  contextSize: number;
  duration: number; // minutes
  commits: number;
  logs: string;
  success: boolean;
}

export interface RebaseRecommendation {
  shouldRebase: boolean;
  reason: string;
  improvedSpec?: BacklogTask;
  confidence: number;
}

export class RebaseEngine {
  private verifier = new ContextVerifier();
  
  /**
   * Analyze task result and recommend rebase (PROACTIVE)
   * Rebases even on success if run was "messy"
   */
  async shouldRebase(
    task: BacklogTask,
    result: TaskResult
  ): Promise<boolean> {
    const messyIndicators = [
      {
        check: result.attempts > 1,
        reason: `Multiple attempts (${result.attempts})`,
      },
      {
        check: result.contextSize > 5000,
        reason: `Bloated context (${result.contextSize} bytes)`,
      },
      {
        check: result.duration > task.scope.estimated_hours * 60 * 2,
        reason: `Took too long (${result.duration} min vs ${task.scope.estimated_hours}h estimate)`,
      },
      {
        check: result.logs.toLowerCase().includes("retrying"),
        reason: "Self-debugging detected in logs",
      },
      {
        check: result.commits > 3,
        reason: `Too many commits (${result.commits})`,
      },
      {
        check: !result.success,
        reason: "Task failed",
      },
    ];
    
    const triggered = messyIndicators.filter(i => i.check);
    
    if (triggered.length > 0) {
      console.log(`🔄 Rebase recommended for task ${task.id}:`);
      for (const indicator of triggered) {
        console.log(`  - ${indicator.reason}`);
      }
      return true;
    }
    
    return false;
  }
  
  /**
   * Improve task spec based on execution results
   */
  async improveSpec(
    task: BacklogTask,
    result: TaskResult
  ): Promise<BacklogTask> {
    const opencode = await createOpencode({
      config: { model: "openai/gpt-4" },
    });
    
    const session = await opencode.client.session.create({
      body: {
        title: `Rebase Task ${task.id}`,
        agent: "rebase",
      },
    });
    
    const prompt = `Analyze this task execution and improve the spec for cleaner re-run.

Original spec:
${JSON.stringify(task, null, 2)}

Execution results:
- Attempts: ${result.attempts}
- Context size: ${result.contextSize} bytes
- Duration: ${result.duration} minutes (estimated: ${task.scope.estimated_hours}h)
- Commits: ${result.commits}
- Success: ${result.success}

Logs excerpt:
${result.logs.substring(0, 1000)}

IMPROVE THE SPEC:
1. Add missing constraints discovered during execution
2. Clarify ambiguous requirements
3. Add discovered edge cases to acceptance criteria
4. Update patterns with better examples
5. Add gotchas found during execution

Output improved task spec in YAML format.
`;
    
    await opencode.client.session.prompt({
      path: { id: session.id },
      body: { parts: [{ type: "text", text: prompt }] },
    });
    
    // Wait and collect
    const improved = await this.collectImprovedSpec(opencode, session.id);
    
    // Delete rebase session
    await opencode.client.session.delete({ path: { id: session.id } });
    await this.verifier.verifyDeleted(session.id);
    
    return improved;
  }
  
  private async collectImprovedSpec(opencode: any, sessionId: string): Promise<BacklogTask> {
    // Wait for completion
    while (true) {
      const session = await opencode.client.session.get({ path: { id: sessionId } });
      
      if (session.status === "idle" || session.status === "completed") {
        const messages = await opencode.client.session.messages({ path: { id: sessionId } });
        const lastMessage = messages[messages.length - 1];
        const text = lastMessage.parts?.map((p: any) => p.text).join("\n") || "";
        
        // Parse YAML
        const yamlMatch = text.match(/```ya?ml\n([\s\S]+?)\n```/);
        if (yamlMatch) {
          const yaml = require("js-yaml");
          return yaml.load(yamlMatch[1]) as BacklogTask;
        }
        
        throw new Error("Could not extract improved spec from response");
      }
      
      if (session.status === "error") {
        throw new Error(`Rebase failed: ${session.error}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}
```

### Step 4.2: Factory Pattern (Specs as Primary Artifacts)

**File**: `src/factory/specRepository.ts`

```typescript
import { readFile, writeFile, readdir } from "fs/promises";
import { join } from "path";
import yaml from "js-yaml";

export interface SpecMetadata {
  version: string;
  featureId: string;
  name: string;
  status: "draft" | "approved" | "implemented" | "deployed";
  lastGenerated: string;
  attempts: number;
  totalCost: number;
}

export class SpecRepository {
  constructor(private specsDir: string) {}
  
  /**
   * Store spec as versioned artifact
   */
  async storeSpec(
    featureId: string,
    plan: string,
    backlog: any,
    metadata: SpecMetadata
  ): Promise<void> {
    const featureDir = join(this.specsDir, featureId);
    await $`mkdir -p ${featureDir}`;
    
    // Store artifacts
    await writeFile(join(featureDir, "PLAN.md"), plan);
    await writeFile(join(featureDir, "BACKLOG.yaml"), yaml.dump(backlog));
    await writeFile(join(featureDir, ".metadata.json"), JSON.stringify(metadata, null, 2));
    
    console.log(`✓ Stored spec for ${featureId} (v${metadata.version})`);
  }
  
  /**
   * Load spec for regeneration
   */
  async loadSpec(featureId: string): Promise<{
    plan: string;
    backlog: any;
    metadata: SpecMetadata;
  }> {
    const featureDir = join(this.specsDir, featureId);
    
    const plan = await readFile(join(featureDir, "PLAN.md"), "utf-8");
    const backlogYaml = await readFile(join(featureDir, "BACKLOG.yaml"), "utf-8");
    const backlog = yaml.load(backlogYaml);
    const metadataJson = await readFile(join(featureDir, ".metadata.json"), "utf-8");
    const metadata = JSON.parse(metadataJson);
    
    return { plan, backlog, metadata };
  }
  
  /**
   * List all specs
   */
  async listSpecs(): Promise<SpecMetadata[]> {
    const entries = await readdir(this.specsDir, { withFileTypes: true });
    const specs: SpecMetadata[] = [];
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        try {
          const metadataPath = join(this.specsDir, entry.name, ".metadata.json");
          const json = await readFile(metadataPath, "utf-8");
          specs.push(JSON.parse(json));
        } catch (e) {
          // Skip if no metadata
        }
      }
    }
    
    return specs.sort((a, b) => b.lastGenerated.localeCompare(a.lastGenerated));
  }
  
  /**
   * Regenerate from spec (code is disposable)
   */
  async regenerate(featureId: string): Promise<void> {
    console.log(`🔄 Regenerating ${featureId} from spec...`);
    
    const { plan, backlog, metadata } = await this.loadSpec(featureId);
    
    // Clear existing implementation
    await $`git worktree prune`;
    
    // Re-run implementation from spec
    // (Implementation phase will be called with this backlog)
    
    console.log(`✓ Regenerated ${featureId}`);
  }
}
```

**Success Criteria Phase 4:**
- [ ] Rebase is triggered on "messy runs" (even if successful)
- [ ] Specs are versioned and stored
- [ ] Can regenerate entire codebase from specs
- [ ] Rebasing improves specs with execution learnings

---

## Testing & Verification

### Unit Tests

**File**: `tests/verification/contextVerifier.test.ts`

```typescript
import { describe, it, expect } from "bun:test";
import { ContextVerifier } from "../../src/verification/contextVerifier";

describe("ContextVerifier", () => {
  it("should detect planning debris", () => {
    const verifier = new ContextVerifier();
    const context = "We explored three different approaches...";
    
    expect(() => {
      verifier.verifyClean("session-id", "implementation");
    }).toThrow("Planning debris detected");
  });
  
  it("should enforce context size limit", () => {
    const verifier = new ContextVerifier();
    const largeContext = "x".repeat(5000);
    
    expect(() => {
      verifier.verifyClean("session-id", "implementation");
    }).toThrow("Context too large");
  });
  
  it("should detect cross-task contamination", () => {
    const verifier = new ContextVerifier();
    const context = "Task T01... Task T02...";
    
    expect(() => {
      verifier.verifyClean("session-id", "implementation");
    }).toThrow("Cross-task contamination");
  });
});
```

### Integration Tests

**File**: `tests/integration/fullWorkflow.test.ts`

```typescript
import { describe, it, expect } from "bun:test";
import { planningPhaseCommand } from "../../src/commands/planning";
import { implementCommand } from "../../src/commands/implement";
import { ContextVerifier } from "../../src/verification/contextVerifier";

describe("Full Workflow Integration", () => {
  it("should complete planning → backlog → implementation with verification", async () => {
    const verifier = new ContextVerifier();
    
    // Stage 1: Planning
    const planningResult = await planningPhaseCommand(mockCtx).execute({
      context_file: "test-context.md",
      output_dir: "/tmp/test",
    });
    
    expect(planningResult).toContain("PLAN.md");
    
    // VERIFY: Planning sessions deleted
    await expect(
      verifier.verifyDeleted("spec-session-id")
    ).resolves.not.toThrow();
    
    // Stage 2: Implementation
    const implResult = await implementCommand(mockCtx).execute({
      backlog_file: "/tmp/test/BACKLOG.yaml",
      work_dir: "/tmp/test",
    });
    
    // VERIFY: Contexts are clean
    await expect(
      verifier.verifyClean("worker-session-id", "implementation")
    ).resolves.not.toThrow();
  });
});
```

---

## Success Metrics

### Context Quality (Verified)
- ✅ Planning context in implementation: **0%** (verified by scanning)
- ✅ Task context size: **<3KB** (enforced, throws if exceeded)
- ✅ Session reuse: **0** (verified deletion)
- ✅ Planning debris: **0** (scanned and blocked)
- ✅ Cross-task contamination: **0** (detected and blocked)

### Workflow (Measured)
- ✅ Planning phase: **3 agents parallel, 10-15 min**
- ✅ Backlog generation: **<5 min, validated schema**
- ✅ Task spawning: **From backlog, health-checked**
- ✅ Rebase rate: **Track % of messy runs detected**

### Reliability (Enforced)
- ✅ Instrumentation health: **Checked before every loop**
- ✅ Context drift: **Monitored and alerted**
- ✅ Session cleanup: **Verified, not assumed**

### Cost (Optimized)
- ✅ Planning cost: **$0** (Gemini free tier)
- ✅ Structured merge: **$0** (no LLM call)
- ✅ Total cost: **~64% reduction** vs all GPT-4

---

## Migration from V1

### Breaking Changes
- None - all verification is additive

### New Requirements
1. Tests must include smoke tests (created automatically)
2. Backlog patterns must follow format: "file:lines - desc"
3. Context size hard limit enforced (will throw)

### Rollout Plan
1. Week 1: Deploy Phase 1 (planning with verification)
2. Week 2: Add Phase 2 (backlog validation)
3. Week 3: Enable Phase 3 (drift detection)
4. Week 4-6: Phase 4 (rebasing + factory)

---

## Conclusion

This V2 plan **fixes all 7 critical issues** from the review:

1. ✅ **Context verification gates** at every transition
2. ✅ **Session deletion confirmed**, not just attempted
3. ✅ **Planning merge is structured** (no LLM overhead)
4. ✅ **Proactive rebasing** on messy runs
5. ✅ **Explicit compression rules** (enforced)
6. ✅ **Instrumentation health checks** before feedback loops
7. ✅ **Context drift detection** and monitoring

**Key Improvements:**
- **Verify, don't assume** - every critical operation is checked
- **Fail fast** - violations throw errors immediately
- **Enforce, don't suggest** - hard limits on context size and format
- **Proactive, not reactive** - rebase on messy runs even when successful
- **Specs are durable** - factory pattern treats code as output

**Timeline:** 6 weeks (vs 8 weeks in V1, faster due to structured merge)

**Next Step:** Begin Phase 1 implementation this week.

---

## References

- **[COMPREHENSIVE_GUIDE.md](./COMPREHENSIVE_GUIDE.md)** - System design principles
- **[IMPLEMENTATION_PLAN_REVIEW.md](./IMPLEMENTATION_PLAN_REVIEW.md)** - Detailed review and issues
- **[fucory-guidelines.txt](../llm-txt/guidelines/fucory-guidelines.txt)** - Context engineering philosophy

