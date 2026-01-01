# Final Implementation Plan: Multi-Agent Coding System Plugin

> **Unified Implementation Plan for Context-Engineered Multi-Agent Coding System as OpenCode Plugin**

---

## Executive Summary

This document provides the **final, unified implementation plan** for building a new OpenCode plugin that implements the **Multi-Agent Coding System** described in [COMPREHENSIVE_GUIDE.md](./COMPREHENSIVE_GUIDE.md).

**Approach**: Create a new OpenCode plugin (similar to OpenCode Conductor) that combines:
- **OpenCode Conductor's** structured workflow and plugin architecture
- **Oh My OpenCode's** background task system and model routing
- **Claude Army's** worktree isolation concepts
- **Comprehensive Guide's** context engineering principles

**Key Features**:
1. **Parallel Planning Subagents** (Spec, Arch, QA) using Gemini (free tier)
2. **Backlog System** (YAML-based, atomic tasks with dependencies)
3. **Context Engineering** (explicit context hygiene, compression, session lifecycle)
4. **Model Routing** (GPT-4 for critical paths, Gemini for planning/docs)
5. **Background Task Orchestration** (parallel execution)
6. **Worktree Isolation** (optional, for true parallelism)

---

## Table of Contents

1. [Plugin Architecture](#plugin-architecture)
2. [Core Components](#core-components)
3. [Implementation Phases](#implementation-phases)
4. [Code Structure](#code-structure)
5. [Model Routing Strategy](#model-routing-strategy)
6. [Context Engineering Implementation](#context-engineering-implementation)
7. [Testing Strategy](#testing-strategy)
8. [Migration & Backward Compatibility](#migration--backward-compatibility)
9. [Success Metrics](#success-metrics)

---

## Plugin Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              OpenCode Plugin: multi-agent-coder              │
├─────────────────────────────────────────────────────────────┤
│  User ↔ Conductor Agent (GPT-4)                            │
│  Slash Commands: /ma-plan, /ma-backlog, /ma-implement      │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌──────────────┐            ┌──────────────────┐
│  PLANNING    │            │ IMPLEMENTATION    │
│   PHASE      │            │    PHASE          │
└──────────────┘            └──────────────────┘
        │                             │
    ┌───┼───┐                         │
    ▼   ▼   ▼                         │
┌────┐┌────┐┌────┐                    │
│Spec││Arch││ QA │                    │
│Gem ││Gem ││Gem │                    │
│Bkg ││Bkg ││Bkg │                    │
└────┘└────┘└────┘                    │
    │   │   │                         │
    └───┼───┘                         │
        ▼                             │
   PLAN.md                            │
        │                             │
        ▼                             │
  BACKLOG.yaml                        │
        │                             │
        └─────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   Worker T01   Worker T02   Worker T03
   (GPT-4)      (GPT-4)      (Gemini)
   Bkg Task     Bkg Task     Bkg Task
   Context<3KB  Context<3KB  Context<3KB
```

### Plugin Structure

```
multi-agent-coder/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # Plugin entry point
│   ├── commands/
│   │   ├── planning.ts             # Planning phase orchestration
│   │   ├── backlog.ts              # Backlog generation & management
│   │   ├── implement.ts            # Implementation orchestration
│   │   └── status.ts               # Status tracking
│   ├── agents/
│   │   ├── conductor.ts            # Main orchestrator agent
│   │   ├── planner-spec.ts         # Spec planning agent
│   │   ├── planner-arch.ts         # Architecture planning agent
│   │   ├── planner-qa.ts            # QA/Risk planning agent
│   │   ├── implementer.ts          # Code implementation agent
│   │   └── rebase.ts                # Rebase agent
│   ├── utils/
│   │   ├── backlogGenerator.ts     # Backlog generation logic
│   │   ├── backlogManager.ts       # Backlog state management
│   │   ├── contextCompressor.ts    # Context compression
│   │   ├── sessionLifecycle.ts      # Session lifecycle tracking
│   │   └── modelRouter.ts           # Model routing logic
│   ├── tools/
│   │   ├── planning-phase.ts       # Planning phase tool
│   │   ├── backlog-generator.ts    # Backlog generation tool
│   │   └── context-compressor.ts   # Context compression tool
│   └── prompts/
│       ├── agent/
│       │   ├── conductor.md
│       │   ├── planner-spec.md
│       │   ├── planner-arch.md
│       │   ├── planner-qa.md
│       │   └── implementer.md
│       └── templates/
│           ├── planning-phase.toml
│           └── backlog-generation.toml
└── README.md
```

---

## Core Components

### 1. Conductor Agent (Orchestrator)

**Model**: `openai/gpt-4` (strong reasoning needed)

**Responsibilities**:
- Orchestrates all phases (Planning → Backlog → Implementation)
- Enforces context hygiene (never carries planning debris)
- Manages session lifecycle
- Coordinates background tasks

**Key Rules**:
- Never carry planning debris into implementation
- Clear context between major phases
- Maintain only: backlog state + task status
- Discard: all subagent exploration contexts

### 2. Planning Subagents (Context Garbage Collectors)

**Pattern**: Explore messily → Produce cleanly → Delete context

**Models**: `google/gemini-2.0-flash-exp` (free tier)

**Roles**:
- **Spec Agent**: Requirements, acceptance criteria, edge cases
- **Arch Agent**: Module boundaries, APIs, data flows
- **QA Agent**: Test plan, failure modes, rollout safety

**Context Lifecycle**:
1. Receive: Repo map + feature request
2. Explore: Grep, read, search (messy OK)
3. Distill: Produce clean markdown document
4. Discard: ALL exploration context (session deleted)
5. Handoff: Only final document survives

### 3. Backlog System

**Format**: YAML (machine-readable)

**Purpose**:
- Single source of truth for work items
- Dependency tracking
- Status updates without agent-to-agent chatter

**Schema**: See [BACKLOG_SCHEMA.md](./BACKLOG_SCHEMA.md)

### 4. Worker Agents (Implementers)

**Model Routing**:
- **GPT-4**: Code edits, refactors, debugging (critical path)
- **Gemini**: Documentation, comments, simple changes

**Context Requirements**:
- Start with clean context (<3KB)
- Task spec + acceptance criteria + minimal constraints only
- No planning debris, no other task residue

**Execution**: Background tasks (parallel execution)

---

## Implementation Phases

### Phase 1: Foundation & Planning (Week 1-2)

#### Step 1.1: Plugin Scaffolding

**Create plugin structure**:
```bash
mkdir -p multi-agent-coder/src/{commands,agents,utils,tools,prompts/agent}
cd multi-agent-coder
npm init -y
npm install @opencode-ai/plugin @opencode-ai/sdk
npm install -D typescript @types/node
```

**File**: `src/index.ts`
```typescript
import { type Plugin } from "@opencode-ai/plugin";
import { planningPhaseCommand } from "./commands/planning.js";
import { backlogCommand } from "./commands/backlog.js";
import { implementCommand } from "./commands/implement.js";
import { statusCommand } from "./commands/status.js";

const MultiAgentCoderPlugin: Plugin = async (ctx) => {
  console.log("[Multi-Agent Coder] Plugin loaded.");

  return {
    tool: {
      ma_planning_phase: planningPhaseCommand(ctx),
      ma_backlog: backlogCommand(ctx),
      ma_implement: implementCommand(ctx),
      ma_status: statusCommand(ctx),
    },
  };
};

export default MultiAgentCoderPlugin;
```

#### Step 1.2: Planning Agents

**File**: `src/agents/planner-spec.ts`
```typescript
import type { AgentConfig } from "@opencode-ai/sdk";

const DEFAULT_MODEL = "google/gemini-2.0-flash-exp";

const PLANNER_SPEC_PROMPT = `You are the Spec Planning Agent.

## Your Role
Explore the codebase messily, then produce a clean SPEC.md document.

## Process
1. **Explore** (messy OK):
   - Grep for related code
   - Read relevant files
   - Search for patterns
   - Use explore agent if needed

2. **Produce** (clean output):
   - SPEC.md with:
     - Requirements (functional, non-functional)
     - Acceptance criteria (testable)
     - Edge cases
     - Explicit non-goals

3. **Discard** (context garbage collection):
   - Your exploration context will be deleted
   - Only SPEC.md survives

## Output Format
See docs/AGENT_ROLES.md (Product/Spec Agent section).

## Constraints
- NO implementation code
- NO planning discussion in output
- ONLY final specification document
`;

export function createPlannerSpecAgent(model: string = DEFAULT_MODEL): AgentConfig {
  return {
    description: "Product/spec planning agent. Explores codebase and produces SPEC.md.",
    mode: "subagent" as const,
    model,
    temperature: 0.1,
    tools: {
      include: ["read", "grep", "glob", "lsp_*", "ast_grep"],
      exclude: ["write", "edit", "bash", "background_task"],
    },
    prompt: PLANNER_SPEC_PROMPT,
  };
}

export const plannerSpecAgent = createPlannerSpecAgent();
```

**Similar files**: `planner-arch.ts`, `planner-qa.ts`

#### Step 1.3: Planning Phase Tool

**File**: `src/tools/planning-phase.ts`
```typescript
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool";
import type { PluginInput } from "@opencode-ai/plugin";
import { createOpencode } from "@opencode-ai/sdk";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

export const planningPhaseTool = (ctx: PluginInput): ToolDefinition =>
  tool({
    description: "Runs parallel planning phase with 3 subagents (Spec, Arch, QA).",
    args: {
      context_file: tool.schema.string().describe("Path to context file (repo map + feature request)"),
      output_dir: tool.schema.string().describe("Output directory for planning outputs"),
    },
    async execute(args: { context_file: string; output_dir: string }) {
      const opencode = await createOpencode({});
      
      // Read context file
      const context = await readFile(args.context_file, "utf-8");
      
      // Spawn 3 planning agents as background tasks (parallel)
      const [specSession, archSession, qaSession] = await Promise.all([
        spawnPlanningAgent(opencode, "planner-spec", context, args.output_dir, "SPEC.md"),
        spawnPlanningAgent(opencode, "planner-arch", context, args.output_dir, "ARCH.md"),
        spawnPlanningAgent(opencode, "planner-qa", context, args.output_dir, "QA.md"),
      ]);
      
      // Wait for all to complete
      const [specOutput, archOutput, qaOutput] = await Promise.all([
        waitForCompletion(opencode, specSession.id),
        waitForCompletion(opencode, archSession.id),
        waitForCompletion(opencode, qaSession.id),
      ]);
      
      // Save outputs
      await writeFile(join(args.output_dir, "SPEC.md"), specOutput);
      await writeFile(join(args.output_dir, "ARCH.md"), archOutput);
      await writeFile(join(args.output_dir, "QA.md"), qaOutput);
      
      // Merge planning outputs
      const planFile = await mergePlanningOutputs(
        join(args.output_dir, "SPEC.md"),
        join(args.output_dir, "ARCH.md"),
        join(args.output_dir, "QA.md"),
        join(args.output_dir, "PLAN.md")
      );
      
      // CRITICAL: Delete planning sessions (context garbage collection)
      await Promise.all([
        opencode.client.session.delete({ path: { id: specSession.id } }),
        opencode.client.session.delete({ path: { id: archSession.id } }),
        opencode.client.session.delete({ path: { id: qaSession.id } }),
      ]);
      
      return `Planning phase complete. Unified plan: ${planFile}`;
    },
  });

async function spawnPlanningAgent(
  opencode: any,
  agent: string,
  context: string,
  outputDir: string,
  outputFile: string
): Promise<any> {
  const session = await opencode.client.session.create({
    body: {
      title: `Planning: ${agent} - ${Date.now()}`,
      agent,
    },
  });
  
  const prompt = buildPlanningPrompt(context, outputDir, outputFile);
  
  await opencode.client.session.prompt({
    path: { id: session.id },
    body: {
      parts: [{ type: "text", text: prompt }],
    },
  });
  
  return session;
}

async function waitForCompletion(opencode: any, sessionId: string): Promise<string> {
  // Poll until completion, extract markdown output
  // Implementation details...
  return "";
}

async function mergePlanningOutputs(
  specFile: string,
  archFile: string,
  qaFile: string,
  outputFile: string
): Promise<string> {
  // Merge three documents into unified PLAN.md
  // Implementation details...
  return outputFile;
}
```

**Success Criteria**:
- [ ] 3 planning agents spawn in parallel
- [ ] Each produces clean output document
- [ ] Planning sessions are deleted after merge
- [ ] Planning context never enters implementation

### Phase 2: Backlog System (Week 2-3)

#### Step 2.1: Backlog Generator

**File**: `src/utils/backlogGenerator.ts`
```typescript
import { readFile, writeFile } from "fs/promises";
import yaml from "js-yaml";
import { createOpencode } from "@opencode-ai/sdk";

export interface BacklogTask {
  id: string;
  title: string;
  description: string;
  status: "pending" | "ready" | "in_progress" | "review" | "completed" | "failed";
  depends_on: string[];
  acceptance: string[];
  scope: {
    files_hint: string[];
    estimated_hours: number;
  };
  context?: {
    constraints?: string[];
    patterns?: string[];
    gotchas?: string[];
  };
}

export interface Backlog {
  version: string;
  track_id: string;
  created_at: string;
  tasks: BacklogTask[];
}

export class BacklogGenerator {
  async generateFromPlan(
    planFile: string,
    outputFile: string,
    trackId: string
  ): Promise<string> {
    // Read plan.md
    const planContent = await readFile(planFile, "utf-8");
    
    // Spawn conductor agent (fresh session, no planning debris)
    const opencode = await createOpencode({
      config: {
        model: "openai/gpt-4", // Strong reasoning needed
      },
    });

    const session = await opencode.client.session.create({
      body: {
        title: `Backlog Generation - ${trackId}`,
        agent: "conductor",
      },
    });

    const prompt = `You are the Conductor generating a task backlog.

Read: ${planFile}

Generate BACKLOG.yaml with atomic tasks following docs/BACKLOG_SCHEMA.md.

Requirements:
- Each task: 2-4 hours, atomic, testable
- Explicit dependencies
- Clear acceptance criteria
- File hints (not full files)

Output: BACKLOG.yaml only. No planning discussion.

Plan content:
${planContent}
`;

    await opencode.client.session.prompt({
      path: { id: session.id },
      body: {
        parts: [{ type: "text", text: prompt }],
      },
    });

    // Collect BACKLOG.yaml
    const backlogContent = await collectBacklogOutput(opencode, session.id);
    
    // Validate backlog
    const backlog = yaml.load(backlogContent) as Backlog;
    this.validateBacklog(backlog);
    
    // Write to file
    await writeFile(outputFile, backlogContent, "utf-8");
    
    // Delete backlog generation session
    await opencode.client.session.delete({
      path: { id: session.id },
    });

    return outputFile;
  }

  validateBacklog(backlog: Backlog): void {
    // Check all tasks have acceptance criteria
    for (const task of backlog.tasks) {
      if (!task.acceptance || task.acceptance.length === 0) {
        throw new Error(`Task ${task.id} missing acceptance criteria`);
      }
      
      if (!task.scope.files_hint || task.scope.files_hint.length === 0) {
        throw new Error(`Task ${task.id} missing file hints`);
      }
    }
    
    // Check for circular dependencies
    this.checkDependencies(backlog);
  }

  checkDependencies(backlog: Backlog): void {
    // DFS to detect cycles
    const visited = new Set<string>();
    const recStack = new Set<string>();
    
    const hasCycle = (taskId: string): boolean => {
      if (recStack.has(taskId)) return true;
      if (visited.has(taskId)) return false;
      
      visited.add(taskId);
      recStack.add(taskId);
      
      const task = backlog.tasks.find(t => t.id === taskId);
      if (task) {
        for (const dep of task.depends_on) {
          if (hasCycle(dep)) return true;
        }
      }
      
      recStack.delete(taskId);
      return false;
    };
    
    for (const task of backlog.tasks) {
      if (hasCycle(task.id)) {
        throw new Error(`Circular dependency detected involving task ${task.id}`);
      }
    }
  }
}
```

#### Step 2.2: Backlog Manager

**File**: `src/utils/backlogManager.ts`
```typescript
import { readFile, writeFile } from "fs/promises";
import yaml from "js-yaml";
import { Backlog, BacklogTask } from "./backlogGenerator.js";

export class BacklogManager {
  private backlogFile: string;
  private backlog: Backlog;

  constructor(backlogFile: string) {
    this.backlogFile = backlogFile;
  }

  async load(): Promise<void> {
    const content = await readFile(this.backlogFile, "utf-8");
    this.backlog = yaml.load(content) as Backlog;
  }

  async save(): Promise<void> {
    const content = yaml.dump(this.backlog, { indent: 2 });
    await writeFile(this.backlogFile, content, "utf-8");
  }

  getReadyTasks(): BacklogTask[] {
    const completed = new Set(
      this.backlog.tasks
        .filter(t => t.status === "completed")
        .map(t => t.id)
    );

    return this.backlog.tasks.filter(task => {
      if (task.status !== "pending" && task.status !== "ready") {
        return false;
      }
      
      const deps = new Set(task.depends_on);
      return deps.size === 0 || [...deps].every(dep => completed.has(dep));
    });
  }

  updateTaskStatus(taskId: string, status: BacklogTask["status"]): void {
    const task = this.backlog.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
    }
  }

  getTask(taskId: string): BacklogTask | undefined {
    return this.backlog.tasks.find(t => t.id === taskId);
  }
}
```

**Success Criteria**:
- [ ] Backlog generated from PLAN.md
- [ ] Tasks are atomic with dependencies
- [ ] Ready tasks identified automatically
- [ ] Dependency validation works

### Phase 3: Context Engineering (Week 3-4)

#### Step 3.1: Context Compressor

**File**: `src/utils/contextCompressor.ts`
```typescript
import { createOpencode } from "@opencode-ai/sdk";
import { BacklogTask } from "./backlogGenerator.js";

export class ContextCompressor {
  async compressTaskContext(task: BacklogTask): Promise<string> {
    // Build full context
    const fullContext = this.buildFullContext(task);
    
    // Check size
    if (fullContext.length < 3000) {
      return fullContext;
    }
    
    // Spawn compressor agent (Gemini)
    const opencode = await createOpencode({
      config: {
        model: "google/gemini-2.0-flash-exp",
      },
    });
    
    const session = await opencode.client.session.create({
      body: {
        title: `Compress Context - ${task.id}`,
        agent: "compressor",
      },
    });
    
    const prompt = `Compress this task context following rules in docs/AGENT_ROLES.md:

${fullContext}

Target: <3KB
Keep: Requirements, constraints, patterns, gotchas
Discard: Planning discussion, full files, noise
`;
    
    await opencode.client.session.prompt({
      path: { id: session.id },
      body: {
        parts: [{ type: "text", text: prompt }],
      },
    });
    
    const compressed = await collectCompressedOutput(opencode, session.id);
    
    // Delete compressor session
    await opencode.client.session.delete({
      path: { id: session.id },
    });
    
    return compressed;
  }

  buildTaskContext(task: BacklogTask): string {
    const lines = [
      `# Task ${task.id}: ${task.title}`,
      "",
      "## Specification",
      task.description,
      "",
      "## Acceptance Criteria",
    ];
    
    for (const criterion of task.acceptance) {
      lines.push(`- ${criterion}`);
    }
    
    lines.push("");
    lines.push("## Context (Compressed)");
    
    // Constraints only
    if (task.context?.constraints) {
      lines.push("### Constraints");
      for (const constraint of task.context.constraints) {
        lines.push(`- ${constraint}`);
      }
    }
    
    // Patterns (snippets only)
    if (task.context?.patterns) {
      lines.push("### Code Patterns");
      for (const pattern of task.context.patterns) {
        lines.push(`- ${pattern}`); // File path + line range
      }
    }
    
    // Negative evidence
    if (task.context?.gotchas) {
      lines.push("### Gotchas");
      for (const gotcha of task.context.gotchas) {
        lines.push(`- ${gotcha}`);
      }
    }
    
    return lines.join("\n");
  }
}
```

#### Step 3.2: Session Lifecycle Tracking

**File**: `src/utils/sessionLifecycle.ts`
```typescript
import { createOpencode } from "@opencode-ai/sdk";

export type SessionPhase = "planning" | "backlog" | "implementation" | "review";

export interface SessionLifecycle {
  phase: SessionPhase;
  created: Date;
  context_size: number;
  will_delete: boolean; // Planning sessions are disposable
}

export class SessionLifecycleManager {
  private opencode: any;
  private lifecycle: Map<string, SessionLifecycle> = new Map();

  async initialize() {
    this.opencode = await createOpencode({});
  }

  async createSession(
    sessionId: string,
    phase: SessionPhase,
    willDelete: boolean = false
  ): Promise<void> {
    this.lifecycle.set(sessionId, {
      phase,
      created: new Date(),
      context_size: 0,
      will_delete: willDelete,
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    const lifecycle = this.lifecycle.get(sessionId);
    
    if (lifecycle?.will_delete) {
      // Delete session completely (context garbage collection)
      await this.opencode.client.session.delete({
        path: { id: sessionId },
      });
      
      this.lifecycle.delete(sessionId);
      console.log(`Deleted session: ${sessionId} (context discarded)`);
    }
  }

  async cleanupPlanningSessions(): Promise<void> {
    // Delete all planning sessions
    for (const [sessionId, lifecycle] of this.lifecycle.entries()) {
      if (lifecycle.phase === "planning") {
        await this.deleteSession(sessionId);
      }
    }
  }
}
```

**Success Criteria**:
- [ ] Task contexts compressed to <3KB
- [ ] Planning sessions deleted after merge
- [ ] Context cleared between phases
- [ ] Session lifecycle tracked correctly

### Phase 4: Implementation Orchestration (Week 4-5)

#### Step 4.1: Implementation Command

**File**: `src/commands/implement.ts`
```typescript
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool";
import type { PluginInput } from "@opencode-ai/plugin";
import { BacklogManager } from "../utils/backlogManager.js";
import { ContextCompressor } from "../utils/contextCompressor.js";
import { ModelRouter } from "../utils/modelRouter.js";
import { createOpencode } from "@opencode-ai/sdk";
import { join } from "path";

export const implementCommand = (ctx: PluginInput): ToolDefinition =>
  tool({
    description: "Implements tasks from backlog.",
    args: {
      backlog_file: tool.schema.string().describe("Path to BACKLOG.yaml"),
      max_workers: tool.schema.number().optional().describe("Maximum parallel workers (default: 3)"),
    },
    async execute(args: { backlog_file: string; max_workers?: number }) {
      const backlog = new BacklogManager(args.backlog_file);
      await backlog.load();
      
      const readyTasks = backlog.getReadyTasks();
      const maxWorkers = args.max_workers || 3;
      
      if (readyTasks.length === 0) {
        return "No ready tasks. All tasks completed or waiting on dependencies.";
      }
      
      const compressor = new ContextCompressor();
      const router = new ModelRouter();
      
      // Spawn workers for ready tasks (up to max_workers)
      const workers = readyTasks.slice(0, maxWorkers).map(async (task) => {
        // Build minimal task context (<3KB)
        const context = await compressor.compressTaskContext(task);
        
        // Determine model based on task complexity
        const taskType = task.scope.estimated_hours > 4 ? "code_implementation" : "simple_change";
        const modelConfig = router.getModel(taskType);
        
        // Spawn worker agent (fresh session)
        const opencode = await createOpencode({
          config: {
            model: modelConfig.model,
          },
        });
        
        const session = await opencode.client.session.create({
          body: {
            title: `Task ${task.id}: ${task.title}`,
            agent: "implementer",
          },
        });
        
        // Send task context
        await opencode.client.session.prompt({
          path: { id: session.id },
          body: {
            parts: [{ type: "text", text: context }],
          },
        });
        
        // Update backlog status
        backlog.updateTaskStatus(task.id, "in_progress");
        await backlog.save();
        
        return { taskId: task.id, sessionId: session.id };
      });
      
      await Promise.all(workers);
      
      return `Spawned ${workers.length} workers for ready tasks.`;
    },
  });
```

**Success Criteria**:
- [ ] Workers spawned from backlog
- [ ] Task contexts <3KB
- [ ] Model routing works correctly
- [ ] Parallel execution works

---

## Model Routing Strategy

### Routing Policy

| Task Type | Model | Cost | Rationale |
|-----------|-------|------|-----------|
| Planning (Spec, Arch, QA) | Gemini Flash | Free | Read-heavy, high token volume |
| Backlog Generation | GPT-4 | $$$ | Needs strong decomposition |
| Code Implementation (>4h) | GPT-4 | $$$ | Critical quality path |
| Code Implementation (<4h) | Gemini Flash | Free | Simple changes |
| Documentation | Gemini Flash | Free | Writing, formatting |
| Code Review | GPT-4 | $$ | Quality gate |
| Rebase | GPT-4 | $$ | Needs strong reasoning |

### Implementation

**File**: `src/utils/modelRouter.ts`
```typescript
export type TaskType = 
  | "planning"
  | "backlog_generation"
  | "code_implementation"
  | "documentation"
  | "simple_change"
  | "code_review"
  | "rebase";

export interface ModelConfig {
  model: string;
  cost: "free" | "low" | "medium" | "high";
}

export class ModelRouter {
  private routingPolicy: Map<TaskType, ModelConfig> = new Map([
    ["planning", { model: "google/gemini-2.0-flash-exp", cost: "free" }],
    ["backlog_generation", { model: "openai/gpt-4", cost: "high" }],
    ["code_implementation", { model: "openai/gpt-4", cost: "high" }],
    ["documentation", { model: "google/gemini-2.0-flash-exp", cost: "free" }],
    ["simple_change", { model: "google/gemini-2.0-flash-exp", cost: "free" }],
    ["code_review", { model: "openai/gpt-4", cost: "medium" }],
    ["rebase", { model: "openai/gpt-4", cost: "medium" }],
  ]);

  getModel(taskType: TaskType): ModelConfig {
    return this.routingPolicy.get(taskType) || {
      model: "openai/gpt-4",
      cost: "high",
    };
  }
}
```

**Cost Savings**: ~64% reduction vs all GPT-4

---

## Context Engineering Implementation

### Context Hygiene Checklist

- [ ] Fresh session per task
- [ ] Delete planning sessions after merge
- [ ] Clear context between phases
- [ ] Compress to <3KB per task
- [ ] Use file paths (not full contents)
- [ ] Distill failures to negative evidence
- [ ] Never reuse sessions across tasks
- [ ] Never carry planning debris into implementation

### Context Compression Rules

**Keep**:
- Task-specific requirements
- Acceptance criteria
- Minimal code patterns (snippets, not full files)
- Explicit constraints
- Edge cases to handle
- Negative evidence ("don't do X because Y")

**Discard**:
- Planning discussion
- Alternative approaches explored
- Full file contents (use file paths instead)
- Other task contexts
- Conductor's reasoning
- Failed attempt histories (unless distilled)

---

## Testing Strategy

### Unit Tests

**File**: `tests/planning.test.ts`
```typescript
import { planningPhaseTool } from "../src/tools/planning-phase";

describe("Planning Phase", () => {
  it("should spawn 3 agents in parallel", async () => {
    const tool = planningPhaseTool(mockCtx);
    const result = await tool.execute({
      context_file: "test-context.md",
      output_dir: "/tmp/test-output",
    });
    
    expect(result).toContain("PLAN.md");
    // Verify planning sessions deleted
  });
});
```

### Integration Tests

**File**: `tests/integration/workflow.test.ts`
```typescript
describe("Full Workflow", () => {
  it("should complete planning → backlog → implementation", async () => {
    // Stage 1: Planning
    const planningResult = await planningPhaseTool(mockCtx).execute({...});
    expect(planningResult).toContain("PLAN.md");
    
    // Verify planning sessions deleted
    
    // Stage 2: Backlog
    const backlogResult = await backlogGenerator.generateFromPlan(...);
    expect(backlogResult).toContain("BACKLOG.yaml");
    
    // Stage 3: Implementation
    const backlog = new BacklogManager(backlogFile);
    await backlog.load();
    const readyTasks = backlog.getReadyTasks();
    
    // Spawn workers
    await implementCommand(mockCtx).execute({
      backlog_file: backlogFile,
      max_workers: 3,
    });
    
    // Verify workers have clean contexts
  });
});
```

---

## Migration & Backward Compatibility

### Plugin Installation

**File**: `~/.config/opencode/opencode.json`
```json
{
  "plugin": [
    "multi-agent-coder"
  ],
  "agent": {
    "conductor": {
      "model": "openai/gpt-4"
    },
    "planner-spec": {
      "model": "google/gemini-2.0-flash-exp"
    },
    "planner-arch": {
      "model": "google/gemini-2.0-flash-exp"
    },
    "planner-qa": {
      "model": "google/gemini-2.0-flash-exp"
    },
    "implementer": {
      "model": "openai/gpt-4"
    }
  }
}
```

### Backward Compatibility

- **Non-breaking**: All features are opt-in
- **Can coexist**: Works alongside OpenCode Conductor and Oh My OpenCode
- **Gradual migration**: Can use planning phase independently

---

## Success Metrics

### Context Quality

- **Planning context in implementation**: 0% ✓
- **Task context size**: <3KB ✓
- **Session reuse**: 0 ✓

### Workflow

- **Planning phase**: 3 agents parallel, 10-15 min ✓
- **Backlog generation**: <5 min ✓
- **Task spawning**: From backlog, not ad-hoc ✓

### Cost Optimization

- **Planning cost**: $0 (Gemini free tier) ✓
- **Implementation cost**: GPT-4 only for critical paths ✓
- **Total cost reduction**: ~64% vs all GPT-4 ✓

---

## Next Steps

### Immediate (This Week)

1. **Set up plugin structure**
2. **Implement Phase 1** (Planning subagents)
3. **Test planning phase** end-to-end

### Short-term (Next 2 Weeks)

1. **Implement Phase 2** (Backlog system)
2. **Implement Phase 3** (Context engineering)
3. **Integration testing**

### Medium-term (Next Month)

1. **Implement Phase 4** (Implementation orchestration)
2. **Performance optimization**
3. **Documentation**

---

## Conclusion

This unified implementation plan creates a new OpenCode plugin that:

1. **Leverages existing patterns**: Uses OpenCode Conductor's plugin structure, Oh My OpenCode's background tasks, and Claude Army's isolation concepts
2. **Implements context engineering**: Explicit context hygiene, compression, and session lifecycle management
3. **Optimizes costs**: Model routing saves ~64% via free tier for planning
4. **Maintains compatibility**: Non-breaking, opt-in features

**Estimated Effort**: 4-5 weeks for MVP (all phases)

**Risk Level**: Low (incremental, backward compatible, leverages proven patterns)

**Recommendation**: Start with Phase 1 (Planning), validate the pattern, then proceed to Phases 2-4.

---

## References

- **[COMPREHENSIVE_GUIDE.md](./COMPREHENSIVE_GUIDE.md)** - Complete system design
- **[SYSTEM_SPEC.md](./SYSTEM_SPEC.md)** - System specification
- **[AGENT_ROLES.md](./AGENT_ROLES.md)** - Agent specifications
- **[BACKLOG_SCHEMA.md](./BACKLOG_SCHEMA.md)** - Task format
- **[OpenCode Conductor](../../lookout-projects/opencode-conductor/README.md)** - Plugin architecture reference
- **[Oh My OpenCode](../../lookout-projects/oh-my-opencode/README.md)** - Background tasks reference

