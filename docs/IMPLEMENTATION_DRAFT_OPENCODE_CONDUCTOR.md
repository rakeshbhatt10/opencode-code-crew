# Implementation Draft: Multi-Agent System Based on OpenCode Conductor

> **Adapting OpenCode Conductor Plugin to Implement Context-Engineered Multi-Agent Coding System**

---

## Executive Summary

This document provides a concrete implementation plan for adapting the existing **OpenCode Conductor** plugin to implement the **Multi-Agent Coding System** described in [COMPREHENSIVE_GUIDE.md](./COMPREHENSIVE_GUIDE.md).

**Key Insight**: OpenCode Conductor already implements many foundational patterns (structured workflow, spec-driven development, track management). We need to add:
1. **Planning subagents** (currently single conductor does everything)
2. **Parallel planning phase** (currently sequential Q&A)
3. **Backlog system** (currently plan.md with checkboxes)
4. **Context engineering** (explicit context hygiene and compression)
5. **Model routing** (currently single model per agent)

---

## Table of Contents

1. [Architecture Mapping](#architecture-mapping)
2. [Current State Analysis](#current-state-analysis)
3. [Gap Analysis](#gap-analysis)
4. [Implementation Plan](#implementation-plan)
5. [Code Changes Required](#code-changes-required)
6. [Migration Strategy](#migration-strategy)
7. [Testing Strategy](#testing-strategy)

---

## Architecture Mapping

### Current OpenCode Conductor Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenCode Plugin System                    │
├─────────────────────────────────────────────────────────────┤
│  User ↔ OpenCode Agent                                      │
│  Slash Commands: /c-setup, /c-new, /c-implement             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │    @conductor Agent          │
        │  (Single agent, all phases)  │
        │                              │
        │  Tools:                      │
        │  - conductor_setup          │
        │  - conductor_new_track      │
        │  - conductor_implement      │
        │  - conductor_status         │
        │  - conductor_revert          │
        └──────────────────────────────┘
                       │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Setup     │ │  New Track  │ │ Implement   │
│             │ │             │ │             │
│ product.md  │ │ spec.md     │ │ plan.md     │
│ workflow.md │ │ plan.md     │ │ (tasks)     │
│ tech-stack  │ │ metadata    │ │ (phases)    │
└─────────────┘ └─────────────┘ └─────────────┘
```

### Target Multi-Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CONDUCTOR (Enhanced)                      │
│  • Orchestrates all phases                                   │
│  • Enforces context hygiene                                  │
│  • Never carries planning debris into implementation         │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
        ┌──────────────┐        ┌──────────────┐
        │  PLANNING    │        │ IMPLEMENTATION│
        │   PHASE      │        │    PHASE      │
        └──────────────┘        └──────────────┘
                │                       │
    ┌───────────┼───────────┐          │
    ▼           ▼           ▼          │
┌────────┐ ┌────────┐ ┌────────┐      │
│ Spec   │ │ Arch   │ │  QA    │      │
│ Agent  │ │ Agent  │ │ Agent  │      │
│(Gemini)│ │(Gemini)│ │(Gemini)│      │
└────────┘ └────────┘ └────────┘      │
    │           │           │          │
    └───────────┼───────────┘          │
                ▼                      │
        ┌──────────────┐               │
        │   PLAN.md    │               │
        │   (merged)   │               │
        └──────────────┘               │
                │                      │
                ▼                      │
        ┌──────────────┐               │
        │BACKLOG.yaml  │               │
        │(atomic tasks)│               │
        └──────────────┘               │
                │                      │
                └──────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Worker T01  │    │  Worker T02  │    │  Worker T03  │
│   (GPT-4)    │    │   (GPT-4)    │    │  (Gemini)    │
│              │    │              │    │              │
│ Code changes │    │ Code changes │    │ Docs/simple  │
│ Track T01    │    │ Track T02    │    │ Track T03    │
│ Context <3KB │    │ Context <3KB │    │ Context <3KB │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Mapping Table

| OpenCode Conductor Component | Multi-Agent Equivalent | Status |
|------------------------------|------------------------|--------|
| `@conductor` Agent | `Conductor` | ✅ Exists (needs enhancement) |
| `conductor_setup` | `Project Initialization` | ✅ Exists (can reuse) |
| `conductor_new_track` | `Planning Phase` | ⚠️ Exists but sequential (needs parallel) |
| `conductor_implement` | `Implementation Phase` | ✅ Exists (needs context hygiene) |
| `conductor_status` | `Status Tracking` | ✅ Exists (can reuse) |
| `conductor_revert` | `Rebase Agent` | ✅ Exists (can enhance) |
| `spec.md` | `Specification Document` | ✅ Exists (planning output) |
| `plan.md` | `Backlog System` | ⚠️ Exists but checkbox-based (needs YAML) |
| `tracks/` directory | `Task Graph Store` | ✅ Exists (needs backlog schema) |
| **Missing** | **Planning Subagents** | ❌ Need to add |
| **Missing** | **Context Compressor** | ❌ Need to add |
| **Missing** | **Model Routing** | ❌ Need to add |

---

## Current State Analysis

### What OpenCode Conductor Already Provides

#### ✅ Structured Workflow
- **Setup Phase**: Project initialization with product vision, tech stack, workflow rules
- **Track Planning**: Interactive spec generation (Q&A), plan generation
- **Implementation**: Task-by-task execution following workflow.md
- **Status Tracking**: Track status in tracks.md

**Relevance**: Excellent foundation for structured workflow. Matches our "Context → Spec → Plan → Implement" pattern.

#### ✅ Spec-Driven Development
- **spec.md**: Detailed specification per track
- **plan.md**: Hierarchical plan (Phases → Tasks → Sub-tasks)
- **workflow.md**: Task lifecycle rules (TDD, commits, checkpoints)

**Relevance**: Already implements "specs as primary artifacts" philosophy.

#### ✅ Track Management
- **Tracks Directory**: `conductor/tracks/<track_id>/`
- **Metadata**: Track type, status, timestamps
- **Tracks File**: Central tracking (`conductor/tracks.md`)

**Relevance**: Foundation for backlog system.

#### ✅ OpenCode SDK Integration
- **Plugin System**: Native OpenCode plugin
- **Tool Definitions**: Clean tool API
- **Session Management**: Uses OpenCode SDK

**Relevance**: Perfect! Already on OpenCode SDK (unlike Claude Army).

#### ✅ Quality Gates
- **TDD Workflow**: Red-Green-Refactor enforced
- **Test Coverage**: >80% requirement
- **Checkpoints**: Phase completion verification
- **Git Notes**: Audit trail for tasks/phases

**Relevance**: Excellent quality control already in place.

### What's Missing

#### ❌ Parallel Planning Subagents
**Current**: Single `@conductor` agent does sequential Q&A (3-5 questions)  
**Needed**: 3 parallel planning agents (Spec, Arch, QA) that explore independently

**Gap**: No parallel planning, no context garbage collection for planning.

#### ❌ Backlog System
**Current**: `plan.md` with checkboxes (`[ ]`, `[~]`, `[x]`)  
**Needed**: `BACKLOG.yaml` with atomic tasks, dependencies, status tracking

**Gap**: No dependency tracking, no atomic task decomposition, no machine-readable format.

#### ❌ Context Engineering
**Current**: Relies on OpenCode's session management  
**Needed**: Explicit context hygiene (delete planning sessions, compress contexts, clear between phases)

**Gap**: No explicit context management, no compression, no rebasing.

#### ❌ Model Routing
**Current**: Single model per agent (configurable but static)  
**Needed**: Dynamic model routing (Gemini for planning, GPT-4 for implementation)

**Gap**: No cost optimization via model routing.

---

## Gap Analysis

### Critical Gaps

#### 1. Planning Phase (High Priority)

**Current State**:
- `conductor_new_track` does sequential Q&A (3-5 questions)
- Single agent (`@conductor`) handles everything
- Planning happens in same session as implementation
- No parallel exploration

**Required State**:
- Stage 1: Spawn 3 planning agents in parallel
- Each agent explores independently (grep, read, search)
- Produce clean output documents (SPEC.md, ARCH.md, QA.md)
- Delete all planning sessions (context garbage collection)
- Merge outputs into unified PLAN.md

**Implementation Effort**: Medium (2-3 days)

#### 2. Backlog System (High Priority)

**Current State**:
- `plan.md` with checkboxes (`[ ]`, `[~]`, `[x]`)
- Hierarchical structure (Phases → Tasks → Sub-tasks)
- Manual status updates
- No dependency tracking

**Required State**:
- Generate `BACKLOG.yaml` from `plan.md`
- Atomic tasks with dependencies
- Machine-readable status tracking
- Dependency resolution

**Implementation Effort**: Medium (2-3 days)

#### 3. Context Engineering (High Priority)

**Current State**:
- Relies on OpenCode's session management
- No explicit context deletion
- No context compression
- Planning context may leak into implementation

**Required State**:
- Delete planning sessions after merge
- Compress task contexts (<3KB)
- Clear context between phases
- Rebase agent for failed tasks

**Implementation Effort**: Medium (2-3 days)

#### 4. Model Routing (Medium Priority)

**Current State**:
- Single model per agent (configurable)
- No dynamic routing
- No cost optimization

**Required State**:
- Gemini for planning agents (free tier)
- GPT-4 for implementation (critical path)
- Dynamic model selection based on task type

**Implementation Effort**: Low-Medium (1-2 days)

### Nice-to-Have Gaps

#### 5. Parallel Implementation (Low Priority)
- Currently sequential task execution
- Could add parallel workers for independent tasks
- Can be added incrementally

#### 6. Metrics & Analytics (Low Priority)
- No cost tracking
- No success rate metrics
- No context size monitoring
- Can be added in Phase 3

---

## Implementation Plan

### Phase 1: Add Planning Subagents (Week 1)

#### Step 1.1: Create Planning Agent Tools

**File**: `src/commands/planning.ts`

```typescript
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool";
import { createOpencode } from "@opencode-ai/sdk";
import { join } from "path";

export const planningSpecCommand = (ctx: any): ToolDefinition =>
  tool({
    description: "Spawns Spec planning agent (parallel planning subagent).",
    args: {
      context_file: tool.schema.string().describe("Path to context file (repo map + feature request)"),
      output_dir: tool.schema.string().describe("Output directory for SPEC.md"),
    },
    async execute(args: { context_file: string; output_dir: string }) {
      const opencode = await createOpencode({
        config: {
          model: "google/gemini-2.0-flash-exp", // Free tier
        },
      });

      // Create new session for planning agent
      const session = await opencode.client.session.create({
        body: {
          title: `Planning: Spec Agent - ${Date.now()}`,
          agent: "planner-spec", // New agent type
        },
      });

      // Send planning prompt
      const prompt = await buildSpecPlanningPrompt(args.context_file);
      await opencode.client.session.prompt({
        path: { id: session.id },
        body: {
          parts: [{ type: "text", text: prompt }],
        },
      });

      // Monitor for completion and collect SPEC.md
      const outputPath = await collectPlanningOutput(
        opencode,
        session.id,
        join(args.output_dir, "SPEC.md")
      );

      // CRITICAL: Delete planning session (context garbage collection)
      await opencode.client.session.delete({
        path: { id: session.id },
      });

      return `Spec planning complete. Output: ${outputPath}`;
    },
  });

export const planningArchCommand = (ctx: any): ToolDefinition =>
  tool({
    description: "Spawns Architecture planning agent (parallel planning subagent).",
    // Similar implementation...
  });

export const planningQACommand = (ctx: any): ToolDefinition =>
  tool({
    description: "Spawns QA/Risk planning agent (parallel planning subagent).",
    // Similar implementation...
  });

async function buildSpecPlanningPrompt(contextFile: string): Promise<string> {
  // Read context file
  const context = await readFile(contextFile, "utf-8");
  
  return `You are the Spec planning agent.

Read the context file: ${contextFile}

Your role:
- Define requirements from product perspective
- Create acceptance criteria (testable)
- Identify edge cases
- Explicit non-goals

Process:
1. Explore the codebase (grep, read, search) - be messy, explore freely
2. Produce a clean markdown document: SPEC.md
3. Include only the final analysis, not your exploration process

Output format: See docs/AGENT_ROLES.md for spec agent specification.

Context:
${context}
`;
}

async function collectPlanningOutput(
  opencode: any,
  sessionId: string,
  outputPath: string
): Promise<string> {
  // Monitor session events until completion
  // Extract markdown output
  // Save to outputPath
  // Return path
  // Implementation details...
}
```

#### Step 1.2: Create Planning Coordinator Command

**File**: `src/commands/planningPhase.ts`

```typescript
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool";
import { planningSpecCommand, planningArchCommand, planningQACommand } from "./planning.js";

export const planningPhaseCommand = (ctx: any): ToolDefinition =>
  tool({
    description: "Runs parallel planning phase with 3 subagents.",
    args: {
      context_file: tool.schema.string().describe("Path to context file"),
      output_dir: tool.schema.string().describe("Output directory for planning outputs"),
    },
    async execute(args: { context_file: string; output_dir: string }) {
      // Run all three planning agents in parallel
      const [specResult, archResult, qaResult] = await Promise.all([
        planningSpecCommand(ctx).execute({ 
          context_file: args.context_file, 
          output_dir: args.output_dir 
        }),
        planningArchCommand(ctx).execute({ 
          context_file: args.context_file, 
          output_dir: args.output_dir 
        }),
        planningQACommand(ctx).execute({ 
          context_file: args.context_file, 
          output_dir: args.output_dir 
        }),
      ]);

      // Merge planning outputs
      const planFile = await mergePlanningOutputs(
        join(args.output_dir, "SPEC.md"),
        join(args.output_dir, "ARCH.md"),
        join(args.output_dir, "QA.md"),
        join(args.output_dir, "PLAN.md")
      );

      return `Planning phase complete. Unified plan: ${planFile}`;
    },
  });
```

#### Step 1.3: Modify `conductor_new_track` Command

**File**: `src/commands/newTrack.ts` (Modified)

```typescript
export const newTrackCommand = (ctx: any): ToolDefinition =>
  tool({
    description: "Creates a new track with parallel planning phase.",
    args: {
      description: tool.schema.string().optional().describe("Brief description of the track."),
      use_parallel_planning: tool.schema.boolean().optional().describe("Use parallel planning subagents (default: true)"),
    },
    async execute(args: { description?: string; use_parallel_planning?: boolean }) {
      const conductorDir = join(ctx.directory, "conductor");
      
      // Setup check (existing)
      if (!existsSync(join(conductorDir, "product.md"))) {
        return "Conductor is not set up. Please run `conductor_setup`.";
      }

      // NEW: Parallel planning phase
      if (args.use_parallel_planning !== false) {
        // Generate context file
        const contextFile = await generateContextFile(
          conductorDir,
          args.description || ""
        );

        // Run parallel planning
        const planningPhase = planningPhaseCommand(ctx);
        const planFile = await planningPhase.execute({
          context_file: contextFile,
          output_dir: conductorDir,
        });

        // Use PLAN.md instead of interactive Q&A
        return await loadPrompt("newTrackFromPlan.toml", { 
          plan_file: planFile,
          args: args.description || "" 
        });
      } else {
        // Fallback to original sequential Q&A
        return await loadPrompt("newTrack.toml", { args: args.description || "" });
      }
    },
  });
```

#### Step 1.4: Add Planning Agent Prompts

**File**: `src/prompts/agent/planner-spec.md`

```markdown
---
description: Product/Spec planning agent. Explores codebase and produces SPEC.md.
mode: subagent
tools:
  read: true
  grep: true
  find: true
---

# Spec Planning Agent

You are the **Spec Planning Agent**, a specialized subagent for product specification.

## Your Role

Explore the codebase messily, then produce a clean SPEC.md document.

## Process

1. **Explore** (messy OK):
   - Grep for related code
   - Read relevant files
   - Search for patterns
   - Ask questions (if needed)

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
```

**Similar files**: `planner-arch.md`, `planner-qa.md`

**Success Criteria**:
- [ ] 3 planning agents spawn in parallel
- [ ] Each produces clean output document
- [ ] Planning sessions are deleted after merge
- [ ] Planning context never enters implementation

### Phase 2: Add Backlog System (Week 2)

#### Step 2.1: Create Backlog Generator

**File**: `src/utils/backlogGenerator.ts`

```typescript
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
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

#### Step 2.2: Create Backlog Manager

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

#### Step 2.3: Integrate Backlog with Implementation

**File**: `src/commands/implement.ts` (Modified)

```typescript
import { BacklogManager } from "../utils/backlogManager.js";
import { BacklogGenerator } from "../utils/backlogGenerator.js";

export const implementCommand = (ctx: any): ToolDefinition =>
  tool({
    description: "Implements tasks from backlog (or plan.md if no backlog).",
    args: {
      track_name: tool.schema.string().optional().describe("Specific track to implement."),
      use_backlog: tool.schema.boolean().optional().describe("Use BACKLOG.yaml instead of plan.md (default: true)"),
    },
    async execute(args: { track_name?: string; use_backlog?: boolean }) {
      const conductorDir = join(ctx.directory, "conductor");
      
      // Setup check (existing)
      if (!existsSync(join(conductorDir, "product.md"))) {
        return "Conductor is not set up. Please run `conductor_setup`.";
      }

      // NEW: Check for BACKLOG.yaml
      const backlogFile = join(conductorDir, "tracks", trackId, "BACKLOG.yaml");
      const planFile = join(conductorDir, "tracks", trackId, "plan.md");
      
      if (args.use_backlog !== false && existsSync(backlogFile)) {
        // Use backlog system
        const backlog = new BacklogManager(backlogFile);
        await backlog.load();
        
        const readyTasks = backlog.getReadyTasks();
        
        if (readyTasks.length === 0) {
          return "No ready tasks. All tasks completed or waiting on dependencies.";
        }
        
        // Spawn workers for ready tasks (up to max_workers)
        const maxWorkers = 3;
        for (const task of readyTasks.slice(0, maxWorkers)) {
          await spawnWorkerFromBacklogTask(ctx, task, backlog);
        }
        
        return await loadPrompt("implementFromBacklog.toml", {
          track_id: trackId,
          ready_tasks: readyTasks.map(t => t.id).join(", "),
        });
      } else {
        // Fallback to plan.md (existing behavior)
        return await loadPrompt("implement.toml");
      }
    },
  });

async function spawnWorkerFromBacklogTask(
  ctx: any,
  task: BacklogTask,
  backlog: BacklogManager
): Promise<void> {
  // Build minimal task context (<3KB)
  const context = buildTaskContext(task);
  
  // Spawn worker agent (fresh session)
  const opencode = await createOpencode({
    config: {
      model: task.scope.estimated_hours > 4 ? "openai/gpt-4" : "google/gemini-2.0-flash-exp",
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
}
```

**Success Criteria**:
- [ ] Backlog generated from PLAN.md
- [ ] Tasks are atomic with dependencies
- [ ] Ready tasks identified automatically
- [ ] Workers spawned from backlog (not plan.md checkboxes)

### Phase 3: Add Context Engineering (Week 3)

#### Step 3.1: Context Compression

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

#### Step 3.3: Rebase Agent

**File**: `src/commands/rebase.ts`

```typescript
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool";
import { BacklogManager } from "../utils/backlogManager.js";
import { createOpencode } from "@opencode-ai/sdk";

export const rebaseCommand = (ctx: any): ToolDefinition =>
  tool({
    description: "Rebases failed task spec based on failure analysis.",
    args: {
      task_id: tool.schema.string().describe("Task ID to rebase"),
      failure_details: tool.schema.string().describe("Failure details (test output, errors, etc.)"),
    },
    async execute(args: { task_id: string; failure_details: string }) {
      const conductorDir = join(ctx.directory, "conductor");
      const backlogFile = join(conductorDir, "tracks", trackId, "BACKLOG.yaml");
      
      const backlog = new BacklogManager(backlogFile);
      await backlog.load();
      
      const task = backlog.getTask(args.task_id);
      if (!task) {
        return `Task ${args.task_id} not found in backlog`;
      }
      
      // Spawn rebase agent
      const opencode = await createOpencode({
        config: {
          model: "openai/gpt-4",
        },
      });
      
      const session = await opencode.client.session.create({
        body: {
          title: `Rebase Task ${args.task_id}`,
          agent: "rebase",
        },
      });
      
      const prompt = `Analyze this failed implementation and improve the task spec.

Original spec:
${JSON.stringify(task, null, 2)}

Failure details:
${args.failure_details}

Output improved task spec following BACKLOG_SCHEMA.md format.
`;
      
      await opencode.client.session.prompt({
        path: { id: session.id },
        body: {
          parts: [{ type: "text", text: prompt }],
        },
      });
      
      const improvedSpec = await collectImprovedSpec(opencode, session.id);
      
      // Update task spec
      Object.assign(task, improvedSpec);
      backlog.updateTaskStatus(args.task_id, "ready");
      await backlog.save();
      
      // Delete rebase session
      await opencode.client.session.delete({
        path: { id: session.id },
      });
      
      return `Task ${args.task_id} rebased. Updated spec ready for retry.`;
    },
  });
```

**Success Criteria**:
- [ ] Task contexts compressed to <3KB
- [ ] Planning sessions deleted after merge
- [ ] Context cleared between phases
- [ ] Rebase agent improves failed task specs

### Phase 4: Model Routing (Week 4)

#### Step 4.1: Model Router Utility

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

  async createSessionWithRouting(
    opencode: any,
    taskType: TaskType,
    title: string,
    agent?: string
  ): Promise<any> {
    const config = this.getModel(taskType);
    
    const client = await createOpencode({
      config: {
        model: config.model,
      },
    });
    
    return await client.client.session.create({
      body: {
        title,
        agent,
      },
    });
  }
}
```

#### Step 4.2: Integrate Model Routing

**Modify**: All command files to use `ModelRouter`

```typescript
import { ModelRouter } from "../utils/modelRouter.js";

const router = new ModelRouter();

// In planning commands
const session = await router.createSessionWithRouting(
  opencode,
  "planning",
  `Planning: Spec Agent`,
  "planner-spec"
);

// In implementation commands
const session = await router.createSessionWithRouting(
  opencode,
  task.scope.estimated_hours > 4 ? "code_implementation" : "simple_change",
  `Task ${task.id}`,
  "implementer"
);
```

**Success Criteria**:
- [ ] Planning uses Gemini (free)
- [ ] Implementation uses GPT-4 (critical path)
- [ ] Documentation uses Gemini (free)
- [ ] Cost optimization achieved

---

## Code Changes Required

### New Files

1. **`src/commands/planning.ts`** (400 lines)
   - `planningSpecCommand`
   - `planningArchCommand`
   - `planningQACommand`
   - Planning output collection

2. **`src/commands/planningPhase.ts`** (200 lines)
   - `planningPhaseCommand`
   - Parallel planning orchestration
   - Planning output merging

3. **`src/utils/backlogGenerator.ts`** (300 lines)
   - `BacklogGenerator` class
   - Backlog validation
   - Dependency checking

4. **`src/utils/backlogManager.ts`** (200 lines)
   - `BacklogManager` class
   - Task status tracking
   - Dependency resolution

5. **`src/utils/contextCompressor.ts`** (250 lines)
   - `ContextCompressor` class
   - Task context builders
   - Compression logic

6. **`src/utils/sessionLifecycle.ts`** (150 lines)
   - `SessionLifecycleManager` class
   - Session tracking
   - Cleanup methods

7. **`src/utils/modelRouter.ts`** (100 lines)
   - `ModelRouter` class
   - Model selection logic
   - Cost tracking

8. **`src/prompts/agent/planner-spec.md`** (50 lines)
9. **`src/prompts/agent/planner-arch.md`** (50 lines)
10. **`src/prompts/agent/planner-qa.md`** (50 lines)
11. **`src/prompts/newTrackFromPlan.toml`** (100 lines)
12. **`src/prompts/implementFromBacklog.toml`** (100 lines)

**Total New Code**: ~1,950 lines

### Modified Files

1. **`src/commands/newTrack.ts`**
   - Add parallel planning option
   - Integrate with planning phase command
   - Fallback to sequential Q&A

2. **`src/commands/implement.ts`**
   - Add backlog support
   - Integrate with backlog manager
   - Spawn workers from backlog

3. **`src/index.ts`**
   - Register new planning commands
   - Register rebase command

4. **`src/prompts/agent/conductor.md`**
   - Update to mention planning subagents
   - Add context hygiene rules

**Total Modified Code**: ~300 lines

### Configuration Changes

**`~/.config/opencode/opencode.json`**:
```json
{
  "agent": {
    "conductor": {
      "model": "openai/gpt-4"
    },
    "planner-spec": {
      "model": "google/gemini-2.0-flash-exp",
      "description": "Product/spec planning agent"
    },
    "planner-arch": {
      "model": "google/gemini-2.0-flash-exp",
      "description": "Architecture planning agent"
    },
    "planner-qa": {
      "model": "google/gemini-2.0-flash-exp",
      "description": "Risk/QA planning agent"
    },
    "implementer": {
      "model": "openai/gpt-4",
      "description": "Code implementation agent"
    },
    "compressor": {
      "model": "google/gemini-2.0-flash-exp",
      "description": "Context compression agent"
    },
    "rebase": {
      "model": "openai/gpt-4",
      "description": "Task spec rebasing agent"
    }
  },
  "plugin": [
    "opencode-conductor-plugin"
  ]
}
```

---

## Migration Strategy

### Phase 1: Add Planning (Non-Breaking)

**Approach**: Add parallel planning as optional enhancement

1. **Keep existing `conductor_new_track`** (backward compatible)
2. **Add `use_parallel_planning` flag** (default: true for new tracks)
3. **Add planning commands** (parallel to existing code)
4. **Test planning phase** independently

**Risk**: Low (doesn't break existing functionality)

### Phase 2: Add Backlog (Non-Breaking)

**Approach**: Add backlog as optional enhancement

1. **Keep plan.md** (backward compatible)
2. **Add BACKLOG.yaml generation** (optional)
3. **Add `use_backlog` flag** (default: true for new tracks)
4. **Test backlog system** independently

**Risk**: Low (doesn't break existing functionality)

### Phase 3: Add Context Engineering (Non-Breaking)

**Approach**: Make context engineering opt-in

1. **Add context compression** (optional per task)
2. **Add session deletion** (configurable)
3. **Add rebase agent** (optional)
4. **Test context hygiene** independently

**Risk**: Low (optional features)

### Phase 4: Model Routing (Non-Breaking)

**Approach**: Add routing with fallback

1. **Add ModelRouter** (new utility)
2. **Use routing by default** (can override)
3. **Fallback to configured model** (if routing fails)
4. **Test model selection** independently

**Risk**: Low (backward compatible)

---

## Testing Strategy

### Unit Tests

**File**: `tests/planning.test.ts`

```typescript
import { planningSpecCommand } from "../src/commands/planning.js";

describe("Planning Agents", () => {
  it("should spawn spec agent and produce SPEC.md", async () => {
    const result = await planningSpecCommand(mockCtx).execute({
      context_file: "test-context.md",
      output_dir: "/tmp/test-output",
    });
    
    expect(result).toContain("SPEC.md");
    // Verify session was deleted
  });
  
  it("should run planning agents in parallel", async () => {
    const startTime = Date.now();
    await planningPhaseCommand(mockCtx).execute({
      context_file: "test-context.md",
      output_dir: "/tmp/test-output",
    });
    const duration = Date.now() - startTime;
    
    // Should complete in <15 minutes (parallel)
    expect(duration).toBeLessThan(15 * 60 * 1000);
  });
});
```

**File**: `tests/backlog.test.ts`

```typescript
import { BacklogGenerator, BacklogManager } from "../src/utils/backlogGenerator.js";

describe("Backlog System", () => {
  it("should generate backlog from plan", async () => {
    const generator = new BacklogGenerator();
    const backlogFile = await generator.generateFromPlan(
      "test-plan.md",
      "/tmp/BACKLOG.yaml",
      "test-track"
    );
    
    expect(existsSync(backlogFile)).toBe(true);
    
    const manager = new BacklogManager(backlogFile);
    await manager.load();
    
    const readyTasks = manager.getReadyTasks();
    expect(readyTasks.length).toBeGreaterThan(0);
  });
  
  it("should detect circular dependencies", async () => {
    const generator = new BacklogGenerator();
    
    await expect(
      generator.generateFromPlan("circular-plan.md", "/tmp/BACKLOG.yaml", "test")
    ).rejects.toThrow("Circular dependency");
  });
});
```

**File**: `tests/contextCompression.test.ts`

```typescript
import { ContextCompressor } from "../src/utils/contextCompressor.js";

describe("Context Compression", () => {
  it("should compress large contexts to <3KB", async () => {
    const compressor = new ContextCompressor();
    const largeTask = createLargeTask(); // >10KB context
    
    const compressed = await compressor.compressTaskContext(largeTask);
    
    expect(compressed.length).toBeLessThan(3000);
    expect(compressed).toContain("Specification");
    expect(compressed).toContain("Acceptance Criteria");
    expect(compressed).not.toContain("We explored three approaches");
  });
});
```

### Integration Tests

**File**: `tests/integration/workflow.test.ts`

```typescript
describe("Full Workflow", () => {
  it("should complete planning → backlog → implementation", async () => {
    // Stage 1: Planning
    const planningResult = await planningPhaseCommand(mockCtx).execute({
      context_file: "test-context.md",
      output_dir: "/tmp/test",
    });
    
    expect(planningResult).toContain("PLAN.md");
    
    // Verify planning sessions deleted
    // (Implementation depends on session tracking)
    
    // Stage 2: Backlog
    const generator = new BacklogGenerator();
    const backlogFile = await generator.generateFromPlan(
      "/tmp/test/PLAN.md",
      "/tmp/test/BACKLOG.yaml",
      "test-track"
    );
    
    // Verify backlog generation session deleted
    
    // Stage 3: Implementation
    const backlog = new BacklogManager(backlogFile);
    await backlog.load();
    const readyTasks = backlog.getReadyTasks();
    
    // Spawn workers
    for (const task of readyTasks.slice(0, 3)) {
      await spawnWorkerFromBacklogTask(mockCtx, task, backlog);
    }
    
    // Verify workers have clean contexts
    for (const task of readyTasks.slice(0, 3)) {
      const context = getTaskContext(task.id);
      expect(context.length).toBeLessThan(3000);
      expect(context.toLowerCase()).not.toContain("planning");
    }
  });
});
```

### Manual Testing Checklist

- [ ] Planning phase runs 3 agents in parallel
- [ ] Planning outputs are clean (no exploration debris)
- [ ] Planning sessions deleted after merge
- [ ] Backlog generated with atomic tasks
- [ ] Dependencies tracked correctly
- [ ] Ready tasks identified automatically
- [ ] Workers spawned from backlog
- [ ] Task contexts <3KB
- [ ] No planning context in implementation
- [ ] Rebase agent improves failed specs
- [ ] Context compression works
- [ ] Model routing selects correct models
- [ ] Cost optimization achieved

---

## Success Metrics

### Context Quality

- **Planning context in implementation**: 0% ✓
- **Task context size**: <3KB ✓
- **Session reuse**: 0 ✓

### Workflow

- **Planning phase**: 3 agents parallel, 10-15 min ✓
- **Backlog generation**: <5 min ✓
- **Task spawning**: From backlog, not plan.md checkboxes ✓

### Code Quality

- **New code**: ~1,950 lines
- **Modified code**: ~300 lines
- **Test coverage**: >80%
- **Backward compatibility**: Maintained ✓

### Cost Optimization

- **Planning cost**: $0 (Gemini free tier) ✓
- **Implementation cost**: GPT-4 only for critical paths ✓
- **Total cost reduction**: ~64% vs all GPT-4 ✓

---

## Next Steps

### Immediate (This Week)

1. **Review this draft** with team
2. **Prioritize phases** (planning vs backlog vs context)
3. **Set up development environment**
4. **Create feature branch**: `feature/multi-agent-system`

### Short-term (Next 2 Weeks)

1. **Implement Phase 1** (Planning subagents)
2. **Test planning phase** end-to-end
3. **Document learnings** in `docs/MVP_RESULTS.md`

### Medium-term (Next Month)

1. **Implement Phase 2** (Backlog system)
2. **Implement Phase 3** (Context engineering)
3. **Implement Phase 4** (Model routing)
4. **Integration testing**
5. **Performance optimization**

### Long-term (Next Quarter)

1. **Metrics & analytics**
2. **Production deployment**
3. **User documentation**
4. **Community feedback**

---

## Conclusion

OpenCode Conductor provides an excellent foundation for implementing the multi-agent coding system. The key additions are:

1. **Planning subagents** - Parallel planning with context garbage collection
2. **Backlog system** - Structured task decomposition and dependency tracking
3. **Context engineering** - Explicit context hygiene and compression
4. **Model routing** - Cost optimization via free tier for planning

The implementation can be done incrementally, maintaining backward compatibility while adding new capabilities.

**Estimated Effort**: 3-4 weeks for MVP (Phases 1-4), all phases are non-breaking.

**Risk Level**: Low (incremental, backward compatible, well-tested)

**Recommendation**: Start with Phase 1 (Planning), validate the pattern, then proceed to Phases 2-4.

---

## References

- **[COMPREHENSIVE_GUIDE.md](./COMPREHENSIVE_GUIDE.md)** - Complete system design
- **[SYSTEM_SPEC.md](./SYSTEM_SPEC.md)** - System specification
- **[AGENT_ROLES.md](./AGENT_ROLES.md)** - Agent specifications
- **[BACKLOG_SCHEMA.md](./BACKLOG_SCHEMA.md)** - Task format
- **[OpenCode Conductor README](../../lookout-projects/opencode-conductor/README.md)** - Current architecture

