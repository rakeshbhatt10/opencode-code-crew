# Multi-Agent Coding System Specification

## Overview

A local-first, cost-optimized multi-agent system built on OpenCode that implements Fucory's context engineering principles for reliable, scalable code generation.

## Core Philosophy

### Context Engineering First
- **Context quality determines output quality** - For a fixed model, the only control surface is the context window
- **Context is stateless** - Each agent call starts fresh; context must be explicitly manufactured
- **Wrong context is toxic** - Incorrect information actively degrades performance, not just fails to help
- **Clear between tasks** - Cross-task residue behaves like adversarial noise

### The Three Context Moves
1. **Delete incorrect context** - Remove false information and failed attempts
2. **Add missing context** - Use tools to turn unknowns into tokens
3. **Remove useless context** - Eliminate noise and cross-task pollution
4. **Compress** - Distill information to minimal correct representation

## Architecture

### Components

#### 1. Conductor (Orchestrator)
**Role**: Master coordinator that owns the "big picture"

**Responsibilities**:
- Receives feature requests and repo context
- Spawns planning subagents in parallel
- Consolidates plans into unified spec
- Generates Level-2 task backlog
- Spawns worker agents with clean contexts
- Collects results and runs integration gates

**Model**: ChatGPT-4 (primary) - needs strong reasoning for orchestration

**Context Management**:
- Maintains minimal state: current backlog + task status
- Clears context between major phases (planning → implementation)
- Never carries planning debris into implementation phase

#### 2. Planning Subagents (3 Specialists)
**Critical Pattern**: These are **context garbage collectors**

**Roles**:
- **Product/Spec Agent**: Requirements, acceptance tests, edge cases
- **Architecture Agent**: Module boundaries, APIs, data flows, migration plan
- **Risk/QA Agent**: Test plan, failure modes, rollout safety

**Model**: Gemini (free tier) - sufficient for read-heavy analysis

**Context Lifecycle**:
```
1. Receive: Repo map + feature request + constraints
2. Explore: Grep, read, search (messy, exploratory)
3. Distill: Produce clean markdown document
4. Discard: All exploration context is thrown away
5. Handoff: Only the final document goes to Conductor
```

**Why This Works**: Planning is allowed to be chaotic because the implementation context never sees it.

#### 3. Worker Agents (Implementers)
**Role**: Execute atomic tasks from backlog

**Model Routing**:
- **ChatGPT-4**: Code edits, refactors, debugging
- **Gemini**: Documentation, comments, simple changes

**Context Requirements**:
- Start with **clean context**: task spec + minimal constraints only
- No planning debris, no other task residue
- Include only: task definition, relevant file snippets, acceptance criteria

**Workspace Isolation**:
- Each worker gets a git worktree
- Prevents file conflicts
- Enables true parallelism

#### 4. Task Graph Store
**Format**: YAML (machine-readable) + Markdown (human-readable)

**Schema**: See BACKLOG_SCHEMA.md

**Purpose**:
- Single source of truth for work items
- Dependency tracking
- Status updates without agent-to-agent chatter

#### 5. Repo Manager
**Responsibilities**:
- Creates isolated worktrees per agent
- Manages branch lifecycle
- Handles merge operations

**Tools**: Git worktree + OpenCode workspace management

### Communication Layer

**Pattern**: File-based structured updates (not chatty messaging)

**Why**: Auditable, replayable, merge-friendly, no context pollution

**Structure**:
```
tasks/
  T01.yaml          # Task definition
  T01.status.json   # Machine-readable status
  T01.notes.md      # Human-readable progress
  T01.context.md    # Minimal context for this task (compressed)
```

## Workflow

### Stage 0: Intake
**Input**:
- Repo path
- Feature/problem statement  
- Constraints (deadline, risk, style, exclusions)

**Output**:
- `context.md` - Repo summary (cached, reusable)
- `feature-request.md` - Structured problem statement

**Context Rule**: Generate repo map once, cache it, don't regenerate per agent

### Stage 1: Parallel Planning
**Process**:
1. Conductor spawns 3 planning agents in parallel
2. Each agent explores repo (grep, read, search) in isolation
3. Each produces clean output document:
   - `SPEC.md` - Product/Spec Agent
   - `ARCH.md` - Architecture Agent  
   - `QA.md` - Risk/QA Agent
4. **Critical**: All exploration context is discarded
5. Conductor merges into `PLAN.md`

**Context Rule**: Planning debris never enters implementation phase

**Model**: Gemini (free) - read-heavy, exploratory

### Stage 2: Backlog Generation
**Process**:
1. Conductor reads `PLAN.md`
2. Generates `BACKLOG.yaml` with atomic tasks
3. Each task includes:
   - Clear "definition of done"
   - Explicit dependencies
   - Minimal context requirements
   - Acceptance criteria

**Context Rule**: Each task spec is self-contained and minimal

**Model**: ChatGPT-4 - needs strong decomposition reasoning

### Stage 3: Parallel Implementation
**Process**:
1. Conductor identifies tasks with no blockers
2. For each ready task:
   ```
   a. Create git worktree → worktrees/T01
   b. Build clean context: task spec + minimal constraints
   c. Spawn worker agent in worktree
   d. Agent implements, tests, updates status
   ```
3. Workers run in parallel (3-8 concurrent)
4. Status updates via `tasks/T01.status.json`

**Context Rule**: Each worker starts with clean, task-specific context only

**Model Routing**:
- Code changes: ChatGPT-4
- Docs/comments: Gemini

### Stage 4: Integration + Gates
**Process**:
1. Conductor monitors task completion
2. For each completed task:
   - Run tests in worktree
   - Check formatting/lint
   - Optional: Spawn reviewer agent (clean context)
3. Merge or request fixes
4. Update backlog status

**Context Rule**: Reviewer agent gets only: diff + acceptance criteria (no implementation history)

**Model**: ChatGPT-4 for review, Gemini for simple checks

## Prompt Rebasing Strategy

### When to Rebase
- Implementation was messy (lots of backtracking)
- Agent got stuck and self-debugged out
- Output feels fragile
- Used way more context than expected

### How to Rebase
1. **Don't patch the code** - throw it away
2. **Update the prompt/spec** with hindsight:
   - Add missing constraints
   - Clarify ambiguous requirements
   - Include discovered edge cases
3. **Clear context completely**
4. **Rerun from scratch** with improved prompt

### Why This Works
- The prompt/spec is the durable artifact
- Code becomes rebuildable output
- Cheaper than human review + patch cycle
- Produces cleaner, more maintainable results

## Model Routing Policy

### Cost Optimization Strategy

| Task Type | Model | Rationale |
|-----------|-------|-----------|
| Repo exploration | Gemini (free) | Read-heavy, high token volume |
| Spec writing | Gemini (free) | Documentation, summarization |
| Plan drafting | Gemini (free) | Analysis, synthesis |
| Backlog generation | ChatGPT-4 | Needs strong decomposition |
| Code edits | ChatGPT-4 | Critical quality path |
| Refactoring | ChatGPT-4 | Complex reasoning |
| Debugging | ChatGPT-4 | Needs strong problem-solving |
| Documentation | Gemini (free) | Writing, formatting |
| Simple changes | Gemini (free) | Low-risk modifications |
| Code review | ChatGPT-4 | Quality gate |

### Implementation via OpenCode Config
```json
{
  "agent": {
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
    "conductor": {
      "model": "openai/gpt-4",
      "description": "Master orchestrator"
    },
    "implementer": {
      "model": "openai/gpt-4",
      "description": "Code implementation agent"
    },
    "documenter": {
      "model": "google/gemini-2.0-flash-exp",
      "description": "Documentation agent"
    }
  }
}
```

## OpenCode Integration

### SDK Usage for Conductor
```typescript
import { createOpencode } from "@opencode-ai/sdk"

const { client } = await createOpencode({
  config: {
    model: "openai/gpt-4"
  }
})

// Create planning sessions (parallel)
const plannerSessions = await Promise.all([
  client.session.create({ body: { title: "Spec Planning", agent: "planner-spec" }}),
  client.session.create({ body: { title: "Arch Planning", agent: "planner-arch" }}),
  client.session.create({ body: { title: "QA Planning", agent: "planner-qa" }})
])

// Spawn each with repo context
for (const session of plannerSessions) {
  await client.session.prompt({
    path: { id: session.id },
    body: {
      parts: [{ 
        type: "text", 
        text: repoContext + featureRequest 
      }]
    }
  })
}

// Collect results, discard contexts
const specs = await Promise.all(
  plannerSessions.map(s => client.session.messages({ path: { id: s.id }}))
)

// Delete planning sessions (context garbage collection)
await Promise.all(
  plannerSessions.map(s => client.session.delete({ path: { id: s.id }}))
)
```

### Worker Agent Pattern
```typescript
// Create fresh session for each task
const workerSession = await client.session.create({
  body: { 
    title: `Task ${taskId}`,
    agent: "implementer"
  }
})

// Inject ONLY task context (clean start)
await client.session.prompt({
  path: { id: workerSession.id },
  body: {
    noReply: true, // Context injection only
    parts: [{
      type: "text",
      text: taskSpec + minimalConstraints
    }]
  }
})

// Execute task
await client.session.prompt({
  path: { id: workerSession.id },
  body: {
    parts: [{ 
      type: "text",
      text: "Implement this task following the spec above."
    }]
  }
})
```

### Plugins for Context Management
```typescript
// .opencode/plugin/context-guard.ts
import type { Plugin } from "@opencode-ai/plugin"

export const ContextGuard: Plugin = async (ctx) => {
  return {
    "experimental.session.compacting": async (input, output) => {
      // Inject task-specific context preservation rules
      output.context.push(`
## Context Preservation Rules
- Keep: Task spec, acceptance criteria, current file state
- Discard: Exploration attempts, failed approaches, tool outputs from wrong paths
- Compress: Error messages to single-line summaries
      `)
    }
  }
}
```

## Failure Modes & Mitigations

### 1. Broken Feedback Loop
**Problem**: Tool outputs are incorrect (e.g., broken test runner)

**Impact**: Agent optimizes around phantom signals (toxic incorrect context)

**Mitigation**:
- Validate tool outputs before feeding to agent
- Include tool health checks in conductor
- Surface tool failures explicitly to human

### 2. Context Pollution
**Problem**: Planning debris enters implementation context

**Impact**: Agent pattern-matches against wrong story

**Mitigation**:
- Enforce session deletion after planning
- Never reuse sessions across phases
- Audit context size before implementation starts

### 3. Cross-Task Residue
**Problem**: Forever-context carries unrelated task history

**Impact**: Performance degradation, wrong assumptions

**Mitigation**:
- Create new session per task (enforced by conductor)
- Never use `/clear` - always new session
- Worktree isolation prevents file-level pollution

### 4. Incorrect Context Accumulation
**Problem**: Failed attempts stay in context as if useful

**Impact**: Agent keeps trying wrong approaches

**Mitigation**:
- Prompt rebasing: throw away messy runs
- Explicit negative evidence: "Tried X, failed because Y, don't retry"
- Session restart threshold: >N failures → rebase

## Success Metrics

### Context Quality Indicators
- **Context size at implementation start**: Should be minimal (task spec + constraints only)
- **Session reuse count**: Should be 0 (always fresh sessions)
- **Planning context in implementation**: Should be 0% (complete isolation)

### Performance Indicators
- **First-attempt success rate**: % of tasks that pass tests without iteration
- **Rebase frequency**: Higher is better (indicates quality control)
- **Token efficiency**: Tokens per successful task completion

### Cost Indicators
- **Planning cost**: Should be ~10% of total (Gemini free tier)
- **Implementation cost**: Should be ~80% of total (ChatGPT-4)
- **Rework cost**: Should be <10% (prompt rebasing prevents this)

## Scaling Strategy

### Vertical Scaling (Better Context)
1. Improve repo map generation (more accurate, more compressed)
2. Refine task decomposition (smaller, clearer tasks)
3. Better constraint specification (fewer ambiguities)
4. Prompt library (reusable, proven prompts)

### Horizontal Scaling (More Agents)
1. Increase concurrent workers (3 → 8 → 16)
2. More specialized subagents (e.g., separate DB migration agent)
3. Hierarchical task decomposition (Level-3, Level-4 tasks)

### Factory Pattern (Advanced)
**Concept**: The prompt/spec repository becomes the durable system

**Implementation**:
```
specs/
  feature-001/
    PLAN.md
    BACKLOG.yaml
    context.md
  feature-002/
    PLAN.md
    BACKLOG.yaml
    context.md
```

**Workflow**:
- Specs are versioned and refined
- Code is generated from specs (disposable)
- Failed features are reverted at spec level
- Successful patterns become templates

**Why**: Agent rerun is cheaper than human patch review

## Implementation Phases

### Phase 1: MVP (Minimal Viable Product)
**Goal**: Prove the pattern works

**Scope**:
- Single conductor script (TypeScript)
- 3 planning agents (Gemini)
- 1 worker agent (ChatGPT-4)
- File-based task tracking
- Manual integration

**Success**: Complete one feature end-to-end with clean contexts

### Phase 2: Automation
**Goal**: Remove human bottlenecks

**Scope**:
- Automated worktree management
- Parallel worker spawning
- Automated test gates
- Status monitoring dashboard

**Success**: Run 3 tasks in parallel without intervention

### Phase 3: Optimization
**Goal**: Cost and quality improvements

**Scope**:
- Prompt rebasing automation
- Context compression plugins
- Model routing refinement
- Prompt library

**Success**: 50% cost reduction, 2x throughput

### Phase 4: Factory Pattern
**Goal**: Specs as primary artifacts

**Scope**:
- Spec versioning system
- Template library
- Multi-project orchestration
- Spec-driven regeneration

**Success**: Rebuild entire codebase from specs in <1 hour

## File Structure

```
code-agents-workshop/
├── docs/
│   ├── SYSTEM_SPEC.md          # This file
│   ├── BACKLOG_SCHEMA.md       # Task definition format
│   ├── AGENT_ROLES.md          # Detailed agent specifications
│   ├── WORKFLOW_GUIDE.md       # Step-by-step operational guide
│   └── PROMPT_LIBRARY.md       # Reusable prompt templates
├── conductor/
│   ├── src/
│   │   ├── orchestrator.ts     # Main conductor logic
│   │   ├── planner.ts          # Planning phase coordinator
│   │   ├── backlog.ts          # Backlog generation
│   │   ├── worker-pool.ts      # Worker agent management
│   │   └── integrator.ts       # Merge and test gates
│   ├── package.json
│   └── tsconfig.json
├── .opencode/
│   ├── opencode.json           # OpenCode configuration
│   ├── agent/
│   │   ├── planner-spec.md
│   │   ├── planner-arch.md
│   │   ├── planner-qa.md
│   │   ├── implementer.md
│   │   └── reviewer.md
│   └── plugin/
│       ├── context-guard.ts    # Context management plugin
│       └── task-tracker.ts     # Task status tracking
├── tasks/                      # Generated per-project
│   ├── T01.yaml
│   ├── T01.status.json
│   └── T01.notes.md
└── worktrees/                  # Generated per-project
    ├── T01/
    └── T02/
```

## Next Steps

1. **Create detailed specifications** (Phase 1 docs)
2. **Build MVP conductor** (TypeScript + OpenCode SDK)
3. **Define agent prompts** (Markdown files in `.opencode/agent/`)
4. **Test with single feature** (Validate context isolation)
5. **Iterate on prompt quality** (Rebase until clean)
6. **Scale to parallel workers** (Phase 2)

## References

- **Fucory Guidelines**: Context engineering principles
- **OpenCode SDK**: Type-safe client for agent orchestration
- **OpenCode Plugins**: Custom tools and hooks
- **Git Worktree**: Workspace isolation mechanism

