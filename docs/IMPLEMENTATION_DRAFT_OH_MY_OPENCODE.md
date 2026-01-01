# Implementation Draft: Multi-Agent System Based on Oh My OpenCode

> **Adapting Oh My OpenCode Plugin to Implement Context-Engineered Multi-Agent Coding System**

---

## Executive Summary

This document provides a concrete implementation plan for adapting the existing **Oh My OpenCode** plugin to implement the **Multi-Agent Coding System** described in [COMPREHENSIVE_GUIDE.md](./COMPREHENSIVE_GUIDE.md).

**Key Insight**: Oh My OpenCode already implements many foundational patterns (multi-agent orchestration, background tasks, model routing, specialized agents). We need to add:
1. **Planning subagents** (currently ad-hoc delegation)
2. **Structured planning phase** (currently Sisyphus does everything)
3. **Backlog system** (currently todos-based)
4. **Context engineering** (explicit context hygiene and compression)
5. **Integration** with existing agent system

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

### Current Oh My OpenCode Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenCode Plugin System                    │
├─────────────────────────────────────────────────────────────┤
│  User ↔ Sisyphus (Primary Orchestrator)                     │
│  Slash Commands, Background Tasks                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌──────────────┐            ┌──────────────────┐
│   Sisyphus   │            │ Background Tasks   │
│ (Opus 4.5)   │            │ Manager            │
│              │            │                    │
│ Orchestrates │            │ Parallel execution │
│ Delegates    │            │ Task tracking      │
└──────┬───────┘            └──────────────────┘
       │
       ├─→ oracle (GPT-5.2) - Strategy/Review
       ├─→ librarian (Sonnet 4.5) - External docs
       ├─→ explore (Grok Code) - Codebase grep
       ├─→ frontend-ui-ux-engineer (Gemini 3 Pro) - UI
       ├─→ document-writer (Gemini 3 Pro) - Docs
       └─→ multimodal-looker (Gemini 3 Flash) - PDF/Image

Tools:
- LSP (11 tools)
- AST-Grep
- Grep, Glob
- Background tasks
- MCPs (context7, websearch_exa, grep_app)
```

### Target Multi-Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SISYPHUS (Enhanced)                       │
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
│        │ │        │ │        │      │
│Background│Background│Background│      │
│ Tasks  │ │ Tasks  │ │ Tasks  │      │
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
│   (Opus)     │    │   (Opus)     │    │  (Gemini)    │
│              │    │              │    │              │
│ Code changes │    │ Code changes │    │ Docs/simple  │
│ Background   │    │ Background   │    │ Background   │
│ Context <3KB │    │ Context <3KB │    │ Context <3KB │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Mapping Table

| Oh My OpenCode Component | Multi-Agent Equivalent | Status |
|--------------------------|------------------------|--------|
| `Sisyphus` Agent | `Conductor` | ✅ Exists (needs enhancement) |
| `BackgroundManager` | `Task Orchestration` | ✅ Exists (can reuse) |
| `oracle` Agent | `Reviewer Agent` | ✅ Exists (can reuse) |
| `librarian` Agent | `Research Agent` | ✅ Exists (can reuse) |
| `explore` Agent | `Codebase Explorer` | ✅ Exists (can reuse) |
| `frontend-ui-ux-engineer` | `Worker Agent (Frontend)` | ✅ Exists (can reuse) |
| `document-writer` | `Documenter Agent` | ✅ Exists (can reuse) |
| `Todo System` | `Task Tracking` | ✅ Exists (needs backlog schema) |
| `Model Routing` | `Model Selection` | ✅ Exists (already optimized) |
| **Missing** | **Planning Subagents** | ❌ Need to add |
| **Missing** | **Structured Planning Phase** | ❌ Need to add |
| **Missing** | **Backlog System** | ❌ Need to add |
| **Missing** | **Context Engineering** | ❌ Need to add |

---

## Current State Analysis

### What Oh My OpenCode Already Provides

#### ✅ Multi-Agent Orchestration
- **Sisyphus**: Primary orchestrator with delegation logic
- **Background Tasks**: Parallel execution via BackgroundManager
- **Specialized Agents**: Oracle, Librarian, Explore, Frontend, etc.
- **Model Routing**: Different models per agent (already optimized)

**Relevance**: Excellent foundation! Already has multi-agent orchestration.

#### ✅ Background Task System
- **BackgroundManager**: Manages parallel background tasks
- **Task Tracking**: Status, progress, notifications
- **Session Management**: Parent-child session relationships

**Relevance**: Perfect for parallel planning subagents!

#### ✅ Model Routing
- **Different models per agent**: Already optimized
- **Fallback logic**: Handles rate limits gracefully
- **Cost awareness**: Free models for exploration (Grok Code)

**Relevance**: Already implements cost optimization!

#### ✅ Tool Ecosystem
- **LSP Tools**: 11 language server tools
- **AST-Grep**: Structural code search
- **Grep/Glob**: Pattern matching
- **MCPs**: External integrations (context7, websearch_exa, grep_app)

**Relevance**: Rich tool ecosystem for planning agents.

#### ✅ Todo System
- **Todo Continuation Enforcer**: Keeps agents working
- **Todo Tracking**: Status, priority, progress
- **Todo Integration**: Built into workflow

**Relevance**: Foundation for backlog system.

### What's Missing

#### ❌ Planning Subagents
**Current**: Sisyphus does planning ad-hoc (delegates to oracle/librarian when needed)  
**Needed**: 3 dedicated planning agents (Spec, Arch, QA) that run in parallel

**Gap**: No structured planning phase, no context garbage collection for planning.

#### ❌ Structured Planning Phase
**Current**: Planning happens inline during implementation  
**Needed**: Dedicated planning phase before implementation starts

**Gap**: Planning context may leak into implementation.

#### ❌ Backlog System
**Current**: Todos-based task tracking  
**Needed**: Structured backlog (YAML) with dependencies, atomic tasks

**Gap**: No dependency tracking, no atomic task decomposition.

#### ❌ Context Engineering
**Current**: Relies on OpenCode's session management  
**Needed**: Explicit context hygiene (delete planning sessions, compress contexts)

**Gap**: No explicit context management, no compression.

---

## Gap Analysis

### Critical Gaps

#### 1. Planning Phase (High Priority)

**Current State**:
- Sisyphus does planning inline during implementation
- Delegates to oracle/librarian when needed
- No dedicated planning phase
- Planning context may leak into implementation

**Required State**:
- Stage 1: Spawn 3 planning agents as background tasks (parallel)
- Each agent explores independently
- Produce clean output documents (SPEC.md, ARCH.md, QA.md)
- Delete all planning sessions (context garbage collection)
- Merge outputs into unified PLAN.md

**Implementation Effort**: Medium (2-3 days)

**Advantage**: Can leverage existing BackgroundManager!

#### 2. Backlog System (High Priority)

**Current State**:
- Todos-based task tracking
- No dependency tracking
- No atomic task decomposition
- No machine-readable format

**Required State**:
- Generate BACKLOG.yaml from PLAN.md
- Atomic tasks with dependencies
- Machine-readable status tracking
- Dependency resolution

**Implementation Effort**: Medium (2-3 days)

**Advantage**: Can integrate with existing todo system!

#### 3. Context Engineering (High Priority)

**Current State**:
- Relies on OpenCode's session management
- Background tasks create child sessions
- No explicit context deletion
- No context compression

**Required State**:
- Delete planning sessions after merge
- Compress task contexts (<3KB)
- Clear context between phases
- Track session lifecycle

**Implementation Effort**: Medium (2-3 days)

**Advantage**: Can leverage existing session management!

#### 4. Integration with Existing Agents (Medium Priority)

**Current State**:
- Sisyphus orchestrates agents
- Background tasks for parallel work
- Model routing already optimized

**Required State**:
- Integrate planning phase with Sisyphus workflow
- Use existing agents for implementation
- Leverage BackgroundManager for parallel planning

**Implementation Effort**: Low-Medium (1-2 days)

**Advantage**: Most infrastructure already exists!

### Nice-to-Have Gaps

#### 5. Enhanced Context Compression (Low Priority)
- Currently relies on OpenCode compaction
- Could add explicit compression agent
- Can be added incrementally

#### 6. Metrics & Analytics (Low Priority)
- No cost tracking per phase
- No success rate metrics
- Can be added in Phase 3

---

## Implementation Plan

### Phase 1: Add Planning Subagents (Week 1)

#### Step 1.1: Create Planning Agents

**File**: `src/agents/planner-spec.ts`

```typescript
import type { AgentConfig } from "@opencode-ai/sdk"
import { isGptModel } from "./types"

const DEFAULT_MODEL = "google/gemini-3-flash" // Free tier

const PLANNER_SPEC_SYSTEM_PROMPT = `You are the Spec Planning Agent, a specialized subagent for product specification.

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

## Tools Available

- read, grep, glob, lsp_*, ast_grep (codebase exploration)
- explore (contextual grep)
- librarian (external docs if needed)

## Constraints

- NO implementation code
- NO planning discussion in output
- ONLY final specification document
`

export function createPlannerSpecAgent(model: string = DEFAULT_MODEL): AgentConfig {
  const base = {
    description: "Product/spec planning agent. Explores codebase and produces SPEC.md.",
    mode: "subagent" as const,
    model,
    temperature: 0.1,
    tools: {
      include: ["read", "grep", "glob", "lsp_*", "ast_grep", "explore"],
      exclude: ["write", "edit", "bash", "task", "background_task"],
    },
    prompt: PLANNER_SPEC_SYSTEM_PROMPT,
  }

  if (isGptModel(model)) {
    return { ...base, reasoningEffort: "medium" }
  }

  return base
}

export const plannerSpecAgent = createPlannerSpecAgent()
```

**Similar files**: `planner-arch.ts`, `planner-qa.ts`

#### Step 1.2: Create Planning Phase Tool

**File**: `src/tools/planning-phase/index.ts`

```typescript
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import type { PluginInput } from "@opencode-ai/plugin"
import { BackgroundManager } from "../../features/background-agent"
import { readFile, writeFile } from "fs/promises"
import { join } from "path"

export const planningPhaseTool = (ctx: PluginInput): ToolDefinition =>
  tool({
    description: "Runs parallel planning phase with 3 subagents (Spec, Arch, QA).",
    args: {
      context_file: tool.schema.string().describe("Path to context file (repo map + feature request)"),
      output_dir: tool.schema.string().describe("Output directory for planning outputs"),
    },
    async execute(args: { context_file: string; output_dir: string }) {
      const backgroundManager = new BackgroundManager(ctx)
      
      // Read context file
      const context = await readFile(args.context_file, "utf-8")
      
      // Spawn 3 planning agents as background tasks (parallel)
      const specTask = await backgroundManager.launch({
        parentSessionID: ctx.sessionID,
        parentMessageID: ctx.messageID,
        agent: "planner-spec",
        description: "Spec planning agent",
        prompt: buildSpecPrompt(context, args.output_dir),
        parentModel: ctx.model,
      })
      
      const archTask = await backgroundManager.launch({
        parentSessionID: ctx.sessionID,
        parentMessageID: ctx.messageID,
        agent: "planner-arch",
        description: "Architecture planning agent",
        prompt: buildArchPrompt(context, args.output_dir),
        parentModel: ctx.model,
      })
      
      const qaTask = await backgroundManager.launch({
        parentSessionID: ctx.sessionID,
        parentMessageID: ctx.messageID,
        agent: "planner-qa",
        description: "QA/Risk planning agent",
        prompt: buildQAPrompt(context, args.output_dir),
        parentModel: ctx.model,
      })
      
      // Wait for all tasks to complete
      const [specResult, archResult, qaResult] = await Promise.all([
        waitForTaskCompletion(backgroundManager, specTask.id),
        waitForTaskCompletion(backgroundManager, archTask.id),
        waitForTaskCompletion(backgroundManager, qaTask.id),
      ])
      
      // Collect outputs
      const specFile = join(args.output_dir, "SPEC.md")
      const archFile = join(args.output_dir, "ARCH.md")
      const qaFile = join(args.output_dir, "QA.md")
      
      await writeFile(specFile, specResult.output)
      await writeFile(archFile, archResult.output)
      await writeFile(qaFile, qaResult.output)
      
      // Merge planning outputs
      const planFile = await mergePlanningOutputs(specFile, archFile, qaFile, args.output_dir)
      
      // CRITICAL: Delete planning sessions (context garbage collection)
      await deletePlanningSessions(backgroundManager, [specTask, archTask, qaTask])
      
      return `Planning phase complete. Unified plan: ${planFile}`
    },
  })

function buildSpecPrompt(context: string, outputDir: string): string {
  return `You are the Spec Planning Agent.

Read the context file and explore the codebase to produce SPEC.md.

Context:
${context}

Output file: ${outputDir}/SPEC.md

Follow the process in your system prompt. Explore messily, produce cleanly.
`
}

async function waitForTaskCompletion(
  manager: BackgroundManager,
  taskId: string
): Promise<{ output: string }> {
  // Poll until task completes
  while (true) {
    const task = manager.getTask(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }
    
    if (task.status === "completed") {
      // Collect output from session
      const output = await collectTaskOutput(task.sessionID)
      return { output }
    }
    
    if (task.status === "error") {
      throw new Error(`Task ${taskId} failed: ${task.error}`)
    }
    
    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

async function deletePlanningSessions(
  manager: BackgroundManager,
  tasks: Array<{ sessionID: string }>
): Promise<void> {
  // Delete all planning sessions (context garbage collection)
  for (const task of tasks) {
    await ctx.client.session.delete({
      path: { id: task.sessionID },
    })
  }
}
```

#### Step 1.3: Integrate with Sisyphus

**Modify**: `src/agents/sisyphus.ts`

Add to Phase 0 - Intent Gate:

```typescript
### Planning Phase Trigger

When user requests a new feature or significant change:

1. **Check if planning phase needed**:
   - Feature request with unclear scope → Planning phase
   - Multiple modules involved → Planning phase
   - Architecture changes → Planning phase

2. **If planning needed**:
   - Generate context file (repo map + feature request)
   - Call \`planning_phase\` tool
   - Wait for PLAN.md
   - Proceed to implementation with PLAN.md

3. **CRITICAL**: Never carry planning exploration context into implementation.
```

**Success Criteria**:
- [ ] 3 planning agents spawn as background tasks (parallel)
- [ ] Each produces clean output document
- [ ] Planning sessions are deleted after merge
- [ ] Planning context never enters implementation

### Phase 2: Add Backlog System (Week 2)

#### Step 2.1: Create Backlog Generator

**File**: `src/tools/backlog-generator/index.ts`

```typescript
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import type { PluginInput } from "@opencode-ai/plugin"
import { readFile, writeFile } from "fs/promises"
import yaml from "js-yaml"
import { BackgroundManager } from "../../features/background-agent"

export interface BacklogTask {
  id: string
  title: string
  description: string
  status: "pending" | "ready" | "in_progress" | "review" | "completed" | "failed"
  depends_on: string[]
  acceptance: string[]
  scope: {
    files_hint: string[]
    estimated_hours: number
  }
  context?: {
    constraints?: string[]
    patterns?: string[]
    gotchas?: string[]
  }
}

export interface Backlog {
  version: string
  track_id: string
  created_at: string
  tasks: BacklogTask[]
}

export const backlogGeneratorTool = (ctx: PluginInput): ToolDefinition =>
  tool({
    description: "Generates task backlog from PLAN.md.",
    args: {
      plan_file: tool.schema.string().describe("Path to PLAN.md"),
      output_file: tool.schema.string().describe("Output path for BACKLOG.yaml"),
      track_id: tool.schema.string().describe("Track identifier"),
    },
    async execute(args: { plan_file: string; output_file: string; track_id: string }) {
      // Read plan.md
      const planContent = await readFile(args.plan_file, "utf-8")
      
      // Spawn conductor agent (fresh session, no planning debris)
      const backgroundManager = new BackgroundManager(ctx)
      
      const task = await backgroundManager.launch({
        parentSessionID: ctx.sessionID,
        parentMessageID: ctx.messageID,
        agent: "Sisyphus", // Use Sisyphus for backlog generation
        description: "Backlog generation",
        prompt: buildBacklogPrompt(planContent, args.track_id),
        parentModel: ctx.model,
      })
      
      // Wait for completion
      const result = await waitForTaskCompletion(backgroundManager, task.id)
      
      // Parse YAML output
      const backlog = yaml.load(result.output) as Backlog
      
      // Validate backlog
      validateBacklog(backlog)
      
      // Write to file
      await writeFile(args.output_file, yaml.dump(backlog, { indent: 2 }), "utf-8")
      
      // Delete backlog generation session
      await ctx.client.session.delete({
        path: { id: task.sessionID },
      })
      
      return `Backlog generated: ${args.output_file}`
    },
  })

function buildBacklogPrompt(planContent: string, trackId: string): string {
  return `You are generating a task backlog from PLAN.md.

Read the plan and generate BACKLOG.yaml with atomic tasks following docs/BACKLOG_SCHEMA.md.

Requirements:
- Each task: 2-4 hours, atomic, testable
- Explicit dependencies
- Clear acceptance criteria
- File hints (not full files)

Output: BACKLOG.yaml only. No planning discussion.

Plan content:
${planContent}
`
}

function validateBacklog(backlog: Backlog): void {
  // Check all tasks have acceptance criteria
  for (const task of backlog.tasks) {
    if (!task.acceptance || task.acceptance.length === 0) {
      throw new Error(`Task ${task.id} missing acceptance criteria`)
    }
    
    if (!task.scope.files_hint || task.scope.files_hint.length === 0) {
      throw new Error(`Task ${task.id} missing file hints`)
    }
  }
  
  // Check for circular dependencies
  checkDependencies(backlog)
}

function checkDependencies(backlog: Backlog): void {
  // DFS to detect cycles
  const visited = new Set<string>()
  const recStack = new Set<string>()
  
  const hasCycle = (taskId: string): boolean => {
    if (recStack.has(taskId)) return true
    if (visited.has(taskId)) return false
    
    visited.add(taskId)
    recStack.add(taskId)
    
    const task = backlog.tasks.find(t => t.id === taskId)
    if (task) {
      for (const dep of task.depends_on) {
        if (hasCycle(dep)) return true
      }
    }
    
    recStack.delete(taskId)
    return false
  }
  
  for (const task of backlog.tasks) {
    if (hasCycle(task.id)) {
      throw new Error(`Circular dependency detected involving task ${task.id}`)
    }
  }
}
```

#### Step 2.2: Create Backlog Manager

**File**: `src/utils/backlogManager.ts`

```typescript
import { readFile, writeFile } from "fs/promises"
import yaml from "js-yaml"
import { Backlog, BacklogTask } from "../tools/backlog-generator"

export class BacklogManager {
  private backlogFile: string
  private backlog: Backlog

  constructor(backlogFile: string) {
    this.backlogFile = backlogFile
  }

  async load(): Promise<void> {
    const content = await readFile(this.backlogFile, "utf-8")
    this.backlog = yaml.load(content) as Backlog
  }

  async save(): Promise<void> {
    const content = yaml.dump(this.backlog, { indent: 2 })
    await writeFile(this.backlogFile, content, "utf-8")
  }

  getReadyTasks(): BacklogTask[] {
    const completed = new Set(
      this.backlog.tasks
        .filter(t => t.status === "completed")
        .map(t => t.id)
    )

    return this.backlog.tasks.filter(task => {
      if (task.status !== "pending" && task.status !== "ready") {
        return false
      }
      
      const deps = new Set(task.depends_on)
      return deps.size === 0 || [...deps].every(dep => completed.has(dep))
    })
  }

  updateTaskStatus(taskId: string, status: BacklogTask["status"]): void {
    const task = this.backlog.tasks.find(t => t.id === taskId)
    if (task) {
      task.status = status
    }
  }

  getTask(taskId: string): BacklogTask | undefined {
    return this.backlog.tasks.find(t => t.id === taskId)
  }
}
```

#### Step 2.3: Integrate with Todo System

**Modify**: `src/hooks/todo-continuation-enforcer.ts`

Add backlog integration:

```typescript
// When todos are created from backlog, sync with backlog status
async function syncTodosWithBacklog(todos: Todo[], backlogFile?: string) {
  if (!backlogFile) return
  
  const backlog = new BacklogManager(backlogFile)
  await backlog.load()
  
  for (const todo of todos) {
    // Match todo to backlog task
    const task = backlog.tasks.find(t => t.id === todo.id || t.title === todo.content)
    if (task) {
      // Sync status
      if (todo.status === "completed") {
        backlog.updateTaskStatus(task.id, "completed")
      } else if (todo.status === "in_progress") {
        backlog.updateTaskStatus(task.id, "in_progress")
      }
      
      await backlog.save()
    }
  }
}
```

**Success Criteria**:
- [ ] Backlog generated from PLAN.md
- [ ] Tasks are atomic with dependencies
- [ ] Ready tasks identified automatically
- [ ] Todos sync with backlog status

### Phase 3: Add Context Engineering (Week 3)

#### Step 3.1: Context Compression Tool

**File**: `src/tools/context-compressor/index.ts`

```typescript
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import type { PluginInput } from "@opencode-ai/plugin"
import { BackgroundManager } from "../../features/background-agent"
import { BacklogTask } from "../backlog-generator"

export const contextCompressorTool = (ctx: PluginInput): ToolDefinition =>
  tool({
    description: "Compresses task context to <3KB while preserving critical info.",
    args: {
      task: tool.schema.object({
        id: tool.schema.string(),
        title: tool.schema.string(),
        description: tool.schema.string(),
        acceptance: tool.schema.array(tool.schema.string()),
        context: tool.schema.object({
          constraints: tool.schema.array(tool.schema.string()).optional(),
          patterns: tool.schema.array(tool.schema.string()).optional(),
          gotchas: tool.schema.array(tool.schema.string()).optional(),
        }).optional(),
      }).describe("Task to compress context for"),
    },
    async execute(args: { task: BacklogTask }) {
      // Build full context
      const fullContext = buildFullContext(args.task)
      
      // Check size
      if (fullContext.length < 3000) {
        return fullContext
      }
      
      // Spawn compressor agent (Gemini)
      const backgroundManager = new BackgroundManager(ctx)
      
      const task = await backgroundManager.launch({
        parentSessionID: ctx.sessionID,
        parentMessageID: ctx.messageID,
        agent: "planner-spec", // Use Gemini agent
        description: "Context compression",
        prompt: buildCompressionPrompt(fullContext),
        parentModel: ctx.model,
      })
      
      const result = await waitForTaskCompletion(backgroundManager, task.id)
      
      // Delete compressor session
      await ctx.client.session.delete({
        path: { id: task.sessionID },
      })
      
      return result.output
    },
  })

function buildFullContext(task: BacklogTask): string {
  const lines = [
    `# Task ${task.id}: ${task.title}`,
    "",
    "## Specification",
    task.description,
    "",
    "## Acceptance Criteria",
  ]
  
  for (const criterion of task.acceptance) {
    lines.push(`- ${criterion}`)
  }
  
  lines.push("")
  lines.push("## Context")
  
  if (task.context?.constraints) {
    lines.push("### Constraints")
    for (const constraint of task.context.constraints) {
      lines.push(`- ${constraint}`)
    }
  }
  
  if (task.context?.patterns) {
    lines.push("### Code Patterns")
    for (const pattern of task.context.patterns) {
      lines.push(`- ${pattern}`)
    }
  }
  
  if (task.context?.gotchas) {
    lines.push("### Gotchas")
    for (const gotcha of task.context.gotchas) {
      lines.push(`- ${gotcha}`)
    }
  }
  
  return lines.join("\n")
}

function buildCompressionPrompt(fullContext: string): string {
  return `Compress this task context following rules in docs/AGENT_ROLES.md:

${fullContext}

Target: <3KB
Keep: Requirements, constraints, patterns, gotchas
Discard: Planning discussion, full files, noise
`
}
```

#### Step 3.2: Session Lifecycle Tracking

**Modify**: `src/features/background-agent/manager.ts`

Add session lifecycle tracking:

```typescript
export type SessionPhase = "planning" | "backlog" | "implementation" | "review"

export interface SessionLifecycle {
  phase: SessionPhase
  created: Date
  context_size: number
  will_delete: boolean // Planning sessions are disposable
}

export class BackgroundManager {
  private lifecycle: Map<string, SessionLifecycle> = new Map()
  
  async launch(input: LaunchInput): Promise<BackgroundTask> {
    // ... existing code ...
    
    // Track lifecycle
    const phase = detectPhase(input.agent, input.description)
    this.lifecycle.set(sessionID, {
      phase,
      created: new Date(),
      context_size: 0,
      will_delete: phase === "planning", // Planning sessions are disposable
    })
    
    // ... rest of existing code ...
  }
  
  async cleanupPlanningSessions(): Promise<void> {
    // Delete all planning sessions (context garbage collection)
    for (const [sessionID, lifecycle] of this.lifecycle.entries()) {
      if (lifecycle.phase === "planning" && lifecycle.will_delete) {
        await this.client.session.delete({
          path: { id: sessionID },
        })
        this.lifecycle.delete(sessionID)
      }
    }
  }
  
  private detectPhase(agent: string, description: string): SessionPhase {
    if (agent.includes("planner-")) return "planning"
    if (description.includes("backlog")) return "backlog"
    if (description.includes("review")) return "review"
    return "implementation"
  }
}
```

#### Step 3.3: Integrate with Sisyphus Workflow

**Modify**: `src/agents/sisyphus.ts`

Add context hygiene rules:

```typescript
## Context Hygiene (CRITICAL)

### Planning Phase
- After planning phase completes, delete all planning sessions
- Never carry planning exploration context into implementation
- Use compressed PLAN.md only

### Implementation Phase
- Each task gets fresh context (<3KB)
- Compress contexts before spawning workers
- Never reuse sessions across tasks

### Verification
- Before starting implementation, verify planning sessions deleted
- Check context size before spawning workers
- Monitor session lifecycle
```

**Success Criteria**:
- [ ] Task contexts compressed to <3KB
- [ ] Planning sessions deleted after merge
- [ ] Context cleared between phases
- [ ] Session lifecycle tracked correctly

### Phase 4: Integration & Enhancement (Week 4)

#### Step 4.1: Add Planning Phase Command

**File**: `src/features/builtin-commands/commands.ts` (Modified)

```typescript
export const builtinCommands = {
  // ... existing commands ...
  
  "/plan": {
    description: "Start planning phase for a feature request",
    handler: async (ctx, args) => {
      // Generate context file
      const contextFile = await generateContextFile(ctx.directory, args)
      
      // Run planning phase
      const planningTool = planningPhaseTool(ctx)
      const result = await planningTool.execute({
        context_file: contextFile,
        output_dir: join(ctx.directory, ".planning"),
      })
      
      return result
    },
  },
  
  "/backlog": {
    description: "Generate backlog from PLAN.md",
    handler: async (ctx, args) => {
      const backlogTool = backlogGeneratorTool(ctx)
      const result = await backlogTool.execute({
        plan_file: args.plan_file,
        output_file: args.output_file,
        track_id: args.track_id,
      })
      
      return result
    },
  },
}
```

#### Step 4.2: Enhance Sisyphus Workflow

**Modify**: `src/agents/sisyphus.ts`

Add planning phase integration:

```typescript
## Phase 0 - Intent Gate (EVERY message)

### Planning Phase Detection

When user requests a new feature or significant change:

1. **Detect Planning Need**:
   - Feature request with unclear scope → Planning phase
   - Multiple modules involved → Planning phase
   - Architecture changes → Planning phase
   - User explicitly requests planning → Planning phase

2. **If Planning Needed**:
   - Generate context file (repo map + feature request)
   - Call \`planning_phase\` tool
   - Wait for PLAN.md
   - Optionally generate BACKLOG.yaml
   - Proceed to implementation with PLAN.md/BACKLOG.yaml

3. **CRITICAL**: Never carry planning exploration context into implementation.
   - Planning sessions are deleted after merge
   - Only PLAN.md survives
   - Implementation starts with clean context
```

**Success Criteria**:
- [ ] Planning phase integrated with Sisyphus workflow
- [ ] Commands work correctly
- [ ] End-to-end workflow tested

---

## Code Changes Required

### New Files

1. **`src/agents/planner-spec.ts`** (100 lines)
2. **`src/agents/planner-arch.ts`** (100 lines)
3. **`src/agents/planner-qa.ts`** (100 lines)
4. **`src/tools/planning-phase/index.ts`** (300 lines)
5. **`src/tools/backlog-generator/index.ts`** (400 lines)
6. **`src/utils/backlogManager.ts`** (200 lines)
7. **`src/tools/context-compressor/index.ts`** (250 lines)

**Total New Code**: ~1,450 lines

### Modified Files

1. **`src/agents/sisyphus.ts`**
   - Add planning phase detection
   - Add context hygiene rules
   - Integrate with planning tools

2. **`src/features/background-agent/manager.ts`**
   - Add session lifecycle tracking
   - Add cleanup methods

3. **`src/hooks/todo-continuation-enforcer.ts`**
   - Add backlog sync integration

4. **`src/features/builtin-commands/commands.ts`**
   - Add `/plan` and `/backlog` commands

5. **`src/index.ts`**
   - Register new planning agents
   - Register new tools

**Total Modified Code**: ~400 lines

### Configuration Changes

**`~/.config/opencode/oh-my-opencode.json`**:
```json
{
  "agents": {
    "Sisyphus": {
      "model": "anthropic/claude-opus-4-5"
    },
    "planner-spec": {
      "model": "google/gemini-3-flash",
      "description": "Product/spec planning agent"
    },
    "planner-arch": {
      "model": "google/gemini-3-flash",
      "description": "Architecture planning agent"
    },
    "planner-qa": {
      "model": "google/gemini-3-flash",
      "description": "Risk/QA planning agent"
    }
  }
}
```

---

## Migration Strategy

### Phase 1: Add Planning (Non-Breaking)

**Approach**: Add planning phase as optional enhancement

1. **Keep existing Sisyphus workflow** (backward compatible)
2. **Add planning phase detection** (opt-in)
3. **Add planning agents** (parallel to existing code)
4. **Test planning phase** independently

**Risk**: Low (doesn't break existing functionality)

### Phase 2: Add Backlog (Non-Breaking)

**Approach**: Add backlog as optional enhancement

1. **Keep todo system** (backward compatible)
2. **Add backlog generation** (optional)
3. **Sync todos with backlog** (optional)
4. **Test backlog system** independently

**Risk**: Low (doesn't break existing functionality)

### Phase 3: Add Context Engineering (Non-Breaking)

**Approach**: Make context engineering opt-in

1. **Add context compression** (optional per task)
2. **Add session deletion** (configurable)
3. **Add lifecycle tracking** (monitoring only)
4. **Test context hygiene** independently

**Risk**: Low (optional features)

### Phase 4: Integration (Non-Breaking)

**Approach**: Integrate with existing workflow

1. **Add commands** (new commands, don't modify existing)
2. **Enhance Sisyphus** (add detection, don't change behavior)
3. **Test integration** end-to-end

**Risk**: Low (additive changes only)

---

## Testing Strategy

### Unit Tests

**File**: `src/tools/planning-phase/index.test.ts`

```typescript
import { test, expect } from "bun/test"
import { planningPhaseTool } from "./index"

test("planning phase spawns 3 agents in parallel", async () => {
  const tool = planningPhaseTool(mockCtx)
  const result = await tool.execute({
    context_file: "test-context.md",
    output_dir: "/tmp/test-output",
  })
  
  expect(result).toContain("PLAN.md")
  // Verify planning sessions deleted
})

test("planning phase deletes sessions after merge", async () => {
  // Test session deletion
})
```

**File**: `src/utils/backlogManager.test.ts`

```typescript
test("backlog manager identifies ready tasks", async () => {
  const manager = new BacklogManager("test-backlog.yaml")
  await manager.load()
  
  const ready = manager.getReadyTasks()
  expect(ready.length).toBeGreaterThan(0)
  expect(ready.every(t => t.depends_on.length === 0 || depsMet(t))).toBe(true)
})
```

### Integration Tests

**File**: `src/integration/workflow.test.ts`

```typescript
test("full workflow: planning → backlog → implementation", async () => {
  // Stage 1: Planning
  const planningResult = await planningPhaseTool(mockCtx).execute({...})
  expect(planningResult).toContain("PLAN.md")
  
  // Verify planning sessions deleted
  
  // Stage 2: Backlog
  const backlogResult = await backlogGeneratorTool(mockCtx).execute({...})
  expect(backlogResult).toContain("BACKLOG.yaml")
  
  // Stage 3: Implementation
  const backlog = new BacklogManager(backlogFile)
  await backlog.load()
  const readyTasks = backlog.getReadyTasks()
  
  // Spawn workers
  for (const task of readyTasks.slice(0, 3)) {
    await spawnWorkerFromBacklogTask(mockCtx, task, backlog)
  }
  
  // Verify workers have clean contexts
})
```

### Manual Testing Checklist

- [ ] Planning phase runs 3 agents as background tasks (parallel)
- [ ] Planning outputs are clean (no exploration debris)
- [ ] Planning sessions deleted after merge
- [ ] Backlog generated with atomic tasks
- [ ] Dependencies tracked correctly
- [ ] Ready tasks identified automatically
- [ ] Todos sync with backlog status
- [ ] Workers spawned from backlog
- [ ] Task contexts <3KB
- [ ] No planning context in implementation
- [ ] Context compression works
- [ ] Session lifecycle tracked correctly
- [ ] Commands work correctly
- [ ] End-to-end workflow tested

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

### Code Quality

- **New code**: ~1,450 lines
- **Modified code**: ~400 lines
- **Test coverage**: >80%
- **Backward compatibility**: Maintained ✓

### Cost Optimization

- **Planning cost**: $0 (Gemini free tier) ✓
- **Implementation cost**: Opus only for critical paths ✓
- **Total cost reduction**: ~64% vs all Opus ✓

---

## Advantages of Oh My OpenCode

### What Makes This Easier

1. **BackgroundManager Already Exists**: Perfect for parallel planning!
2. **Model Routing Already Optimized**: Different models per agent
3. **Agent System Already Rich**: Can reuse existing agents
4. **Tool Ecosystem**: LSP, AST-Grep, MCPs already integrated
5. **Todo System**: Foundation for backlog integration

### What Needs Careful Integration

1. **Sisyphus Workflow**: Need to integrate planning phase without breaking existing behavior
2. **Session Management**: Need to track lifecycle for context hygiene
3. **Todo Sync**: Need to sync todos with backlog without conflicts

---

## Next Steps

### Immediate (This Week)

1. **Review this draft** with team
2. **Prioritize phases** (planning vs backlog vs context)
3. **Set up development environment**
4. **Create feature branch**: `feature/multi-agent-planning`

### Short-term (Next 2 Weeks)

1. **Implement Phase 1** (Planning subagents)
2. **Test planning phase** end-to-end
3. **Document learnings** in `docs/MVP_RESULTS.md`

### Medium-term (Next Month)

1. **Implement Phase 2** (Backlog system)
2. **Implement Phase 3** (Context engineering)
3. **Integration testing**
4. **Performance optimization**

### Long-term (Next Quarter)

1. **Metrics & analytics**
2. **Production deployment**
3. **User documentation**
4. **Community feedback**

---

## Conclusion

Oh My OpenCode provides an excellent foundation for implementing the multi-agent coding system. The key additions are:

1. **Planning subagents** - Parallel planning with context garbage collection
2. **Backlog system** - Structured task decomposition and dependency tracking
3. **Context engineering** - Explicit context hygiene and compression
4. **Integration** - Seamless integration with existing Sisyphus workflow

The implementation can be done incrementally, maintaining backward compatibility while adding new capabilities.

**Estimated Effort**: 3-4 weeks for MVP (all phases), all phases are non-breaking.

**Risk Level**: Low (incremental, backward compatible, leverages existing infrastructure)

**Recommendation**: Start with Phase 1 (Planning), validate the pattern, then proceed to Phases 2-4.

**Key Advantage**: Oh My OpenCode already has BackgroundManager, model routing, and agent system - we're adding structure, not building from scratch!

---

## References

- **[COMPREHENSIVE_GUIDE.md](./COMPREHENSIVE_GUIDE.md)** - Complete system design
- **[SYSTEM_SPEC.md](./SYSTEM_SPEC.md)** - System specification
- **[AGENT_ROLES.md](./AGENT_ROLES.md)** - Agent specifications
- **[BACKLOG_SCHEMA.md](./BACKLOG_SCHEMA.md)** - Task format
- **[Oh My OpenCode README](../../lookout-projects/oh-my-opencode/README.md)** - Current architecture
- **[Oh My OpenCode AGENTS.md](../../lookout-projects/oh-my-opencode/src/agents/AGENTS.md)** - Agent system


