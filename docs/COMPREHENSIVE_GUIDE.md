# Comprehensive Guide: Multi-Agent Coding System

> **The Complete Reference for Building, Operating, and Scaling a Context-Engineered Multi-Agent System**

---

## Table of Contents

1. [Core Philosophy & Principles](#core-philosophy--principles)
2. [System Architecture](#system-architecture)
3. [Context Engineering Framework](#context-engineering-framework)
4. [Complete Workflow](#complete-workflow)
5. [Agent Specifications](#agent-specifications)
6. [Implementation Approaches](#implementation-approaches)
7. [Best Practices & Patterns](#best-practices--patterns)
8. [Cost Optimization Strategies](#cost-optimization-strategies)
9. [Scaling & Advanced Patterns](#scaling--advanced-patterns)
10. [Troubleshooting & Debugging](#troubleshooting--debugging)
11. [Reference Quick Links](#reference-quick-links)

---

## Core Philosophy & Principles

### The Fundamental Insight

> **For a fixed model, performance is a function of context quality—because context is the only thing the agent can actually control at inference time.**

This is not a philosophical statement. It's a mechanical reality:

- **LLM calls are stateless** - Each call sees only what you send
- **Context window = input tokens** - Instructions, plans, tool outputs, file snippets, diffs, logs
- **Everything else is downstream** - Tools, planning, subagents are all about producing better context windows

### The Three Context Moves

For systematic improvement, there are only three operations (plus compression):

#### 1. Delete Incorrect Context
**Why**: Wrong context is toxic, not just unhelpful. It creates tunnel vision where the model tries to move toward correct answers but keeps snapping back to false anchors.

**How**:
- Remove false information immediately
- Distill failures to negative evidence: "Tried X, failed because Y, don't do X again"
- Don't carry forward dead-end reasoning as if it were useful memory

**Example**:
```markdown
❌ Bad: Include full transcript of failed attempt
✅ Good: "Don't use class-based design - tried in T05, failed due to circular dependencies"
```

#### 2. Add Missing Context
**Why**: Tool use is fundamentally about turning unknowns into tokens.

**How**:
- Run tests and capture failures
- Inspect files
- Search the repo
- Produce diffs
- Gather trace output
- Validate claims

**Critical**: Tool outputs are only valuable if they are **real**. Broken feedback channels become incorrect context.

#### 3. Remove Useless Context
**Why**: Useless context burns tokens and degrades performance. Cross-task residue behaves like adversarial noise.

**How**:
- Clear context when task changes
- Never reuse sessions across unrelated tasks
- Compress aggressively: distill to minimal correct representation

**Rule**: If you can `/clear`, you should `/clear`. Forever-context is convenient but a quiet performance killer.

#### 4. Compress (The Scaling Technique)
**How**:
- Distill failures into a few lines
- Convert bloated artifacts into compact representations
- Keep the smallest set of constraints that preserves correctness

**Warning**: Compression can go too far. That's not philosophical—it's a stop condition. Hill climbing can go downhill.

### Key Principles

1. **Context Quality = Output Quality** - The only control surface
2. **Wrong Context is Toxic** - Actively degrades performance
3. **Clear Between Tasks** - Cross-task residue is adversarial noise
4. **Prompt Rebasing > Patching** - The spec is durable, code is disposable
5. **Subagents = Garbage Collectors** - Keep exploration separate from execution
6. **Real Feedback Loops** - Broken instrumentation creates false anchors

---

## System Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CONDUCTOR (GPT-4)                         │
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
│ FREE   │ │ FREE   │ │ FREE   │      │
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
│ Worktree T01 │    │ Worktree T02 │    │ Worktree T03 │
│ Context <3KB │    │ Context <3KB │    │ Context <3KB │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Component Details

#### 1. Conductor (Orchestrator)
**Role**: Master coordinator

**Responsibilities**:
- Intake: Parse feature requests, generate repo context
- Planning Coordination: Spawn planning subagents, collect outputs
- Backlog Generation: Convert plans into atomic tasks
- Work Distribution: Assign tasks to worker agents
- Integration: Merge results, run verification gates
- Context Hygiene: Enforce clean context handoffs

**Model**: ChatGPT-4 (strong reasoning needed)

**Context Lifecycle**:
```
Phase 1: Planning
├─ Input: Repo map + feature request
├─ Output: Spawn planning agents
└─ Clear: Discard planning coordination context

Phase 2: Backlog Generation  
├─ Input: PLAN.md (merged from subagents)
├─ Output: BACKLOG.yaml
└─ Clear: Discard planning artifacts

Phase 3: Implementation
├─ Input: BACKLOG.yaml + task status
├─ Output: Worker assignments
└─ Maintain: Minimal state (task status only)

Phase 4: Integration
├─ Input: Completed tasks + test results
├─ Output: Merge decisions
└─ Clear: Discard per-task contexts
```

**Critical Rules**:
1. Never carry planning debris into implementation
2. Clear context between major phases
3. Maintain only: backlog state + task status
4. Discard: all subagent exploration contexts

#### 2. Planning Subagents (Context Garbage Collectors)
**Pattern**: Explore messily → Produce cleanly → Delete context

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

---

## Context Engineering Framework

### The Context Transformation Model

Each agent is a **context transformation function**:

```
Agent = (Input Context) → (Output Artifact) + (Discarded Context)
```

**Key insight**: What you discard is as important as what you produce.

### Context Quality Metrics

#### Target Sizes
- **Repo map**: <50KB (cached, reusable)
- **Feature request**: <5KB
- **Task context**: <3KB per task
- **Planning context in implementation**: 0%

#### Quality Indicators
- **Session reuse count**: Should be 0 (always fresh sessions)
- **Context size at implementation start**: Should be minimal (<5KB)
- **Planning debris in implementation**: Should be 0%

### Context Compression Rules

#### What to Keep
✅ Task-specific requirements  
✅ Acceptance criteria  
✅ Minimal code patterns (snippets, not full files)  
✅ Explicit constraints  
✅ Edge cases to handle  
✅ Negative evidence ("don't do X because Y")

#### What to Discard
❌ Planning discussion  
❌ Alternative approaches explored  
❌ Full file contents (use file paths instead)  
❌ Other task contexts  
❌ Conductor's reasoning  
❌ Failed attempt histories (unless distilled to negative evidence)

### Compression Example

**Before (bloated context)**:
```
We explored three approaches:
1. Using a class-based design with inheritance...
2. A functional approach with currying...
3. A hybrid approach...

After much discussion, we decided on approach 2 because...

Here's the full content of src/utils/risk.ts (200 lines)...
And here's src/types/vault.ts (150 lines)...
```

**After (compressed context)**:
```
Use functional programming style (see pattern at src/utils/risk.ts:45-78).
Key type: VaultConfig from src/types/vault.ts.
Don't use classes - functional style is project standard.
```

### Context Hygiene Checklist

- [ ] Fresh session per task
- [ ] Delete planning sessions after merge
- [ ] Clear context between phases
- [ ] Compress to <3KB per task
- [ ] Use file paths (not full contents)
- [ ] Distill failures to negative evidence
- [ ] Never reuse sessions across tasks
- [ ] Never carry planning debris into implementation
- [ ] Never include full file contents
- [ ] Never accumulate tool outputs indefinitely
- [ ] Never patch messy implementations (rebase instead)
- [ ] Never mix contexts from different tasks

---

## Complete Workflow

### Stage 0: Intake & Preparation

#### Step 0.1: Create Feature Request

```markdown
# Feature Request: [Feature Name]

## User Story
As a [user type], I want [goal] so that [benefit].

## Problem Statement
[2-3 sentences describing the problem this solves]

## Requirements
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

## Constraints
- Deadline: [date]
- Risk level: [low/medium/high]
- Don't touch: [files/modules to avoid]
- Style: [coding conventions]

## Success Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Context
- Related issues: [links]
- Previous attempts: [if any]
- Dependencies: [external systems]
```

#### Step 0.2: Generate Repo Map (One-Time)

```bash
# Create repo map script
cat > scripts/generate-repo-map.sh << 'EOF'
#!/bin/bash

echo "# Repository Map" > docs/repo-map.md
echo "" >> docs/repo-map.md

echo "## Directory Structure" >> docs/repo-map.md
tree -L 3 -I 'node_modules|dist|.git' >> docs/repo-map.md

echo "" >> docs/repo-map.md
echo "## Key Modules" >> docs/repo-map.md
find src -name "*.ts" -type f | head -20 >> docs/repo-map.md

echo "" >> docs/repo-map.md
echo "## Build Commands" >> docs/repo-map.md
echo '```bash' >> docs/repo-map.md
grep -A 10 '"scripts"' package.json >> docs/repo-map.md
echo '```' >> docs/repo-map.md

echo "" >> docs/repo-map.md
echo "## Coding Conventions" >> docs/repo-map.md
cat docs/CONTRIBUTING.md >> docs/repo-map.md 2>/dev/null || echo "See CONTRIBUTING.md" >> docs/repo-map.md
EOF

chmod +x scripts/generate-repo-map.sh
./scripts/generate-repo-map.sh
```

**Cache this**: Repo map is reusable across features, regenerate only when structure changes significantly.

#### Step 0.3: Create Context Document

```bash
# Combine repo map + feature request
cat docs/repo-map.md feature-request.md > context.md
```

### Stage 1: Parallel Planning

#### Step 1.1: Spawn Planning Agents (Parallel)

**Terminal 1: Spec Agent**
```bash
opencode run --agent planner-spec --input context.md --output SPEC.md
```

**Terminal 2: Arch Agent**
```bash
opencode run --agent planner-arch --input context.md --output ARCH.md
```

**Terminal 3: QA Agent**
```bash
opencode run --agent planner-qa --input context.md --output QA.md
```

**Wait for all three to complete** (typically 5-10 minutes each).

#### Step 1.2: Review Planning Outputs

```bash
# Check outputs
ls -lh SPEC.md ARCH.md QA.md

# Quick review
head -20 SPEC.md
head -20 ARCH.md
head -20 QA.md
```

**Human checkpoint**: Skim the outputs. Are they reasonable? If any agent went off-track, regenerate that one.

#### Step 1.3: Merge into Unified Plan

```bash
# Manual merge or use conductor
opencode run --agent conductor << 'EOF'
Merge these three planning documents into a unified PLAN.md:

1. Read SPEC.md, ARCH.md, QA.md
2. Resolve any conflicts
3. Create unified PLAN.md with sections:
   - Problem Statement (from SPEC)
   - Requirements (from SPEC)
   - Architecture (from ARCH)
   - Test Plan (from QA)
   - Risks & Mitigations (from QA)
   - Implementation Steps (synthesized)
EOF
```

**Output**: `PLAN.md`

#### Step 1.4: Context Cleanup

```bash
# CRITICAL: Delete planning sessions
# (If using SDK, this is done programmatically)
# For CLI, planning contexts are automatically isolated per run

# Move outputs to project docs
cp PLAN.md ../docs/
cd ..
```

**Critical**: All planning exploration context is discarded. Only final documents survive.

### Stage 2: Backlog Generation

#### Step 2.1: Generate Task Backlog

**Start fresh session** (critical: no planning debris):

```bash
opencode run --agent conductor << 'EOF'
Read docs/PLAN.md and generate a task backlog (BACKLOG.yaml) with atomic tasks.

Requirements for each task:
1. Small enough for one agent (2-4 hours)
2. Clear "definition of done"
3. Explicit dependencies
4. Testable acceptance criteria

Output format: See docs/BACKLOG_SCHEMA.md
EOF
```

**Output**: `tasks/BACKLOG.yaml`

#### Step 2.2: Validate Backlog

```bash
# Check for common issues
cat tasks/BACKLOG.yaml | yq '.tasks[] | select(.acceptance == null)' 
# Should return nothing (all tasks must have acceptance criteria)

cat tasks/BACKLOG.yaml | yq '.tasks[] | select(.scope.files_hint == null)'
# Should return nothing (all tasks must have file hints)

# Check dependency graph for cycles
python scripts/validate-backlog.py tasks/BACKLOG.yaml
```

#### Step 2.3: Human Review

**Review the backlog**:
- Are tasks atomic enough?
- Are dependencies correct?
- Are acceptance criteria testable?

**Adjust if needed**, then commit:

```bash
git add tasks/BACKLOG.yaml docs/PLAN.md
git commit -m "Add backlog for [feature name]"
```

### Stage 3: Parallel Implementation

#### Step 3.1: Identify Ready Tasks

```bash
# Get tasks with no dependencies or all dependencies met
cat tasks/BACKLOG.yaml | yq '.tasks[] | select(.status == "pending" or .status == "ready") | select(.depends_on == [] or .depends_on == null) | .id'
```

#### Step 3.2: Spawn Worker for Each Ready Task

For each ready task, create a worker:

**Worker Script Template** (`scripts/spawn-worker.sh`):

```bash
#!/bin/bash
set -e

TASK_ID=$1
TASK_FILE="tasks/${TASK_ID}.yaml"

if [ ! -f "$TASK_FILE" ]; then
    echo "Error: Task file $TASK_FILE not found"
    exit 1
fi

# Create git worktree
WORKTREE_PATH="worktrees/${TASK_ID}"
git worktree add "$WORKTREE_PATH" -b "task/${TASK_ID}"

# Build task context (MINIMAL, COMPRESSED)
TASK_CONTEXT=$(cat "$TASK_FILE" | yq -r '.context | to_yaml')
TASK_SPEC=$(cat "$TASK_FILE" | yq -r '.description')
ACCEPTANCE=$(cat "$TASK_FILE" | yq -r '.acceptance | join("\n- ")')

# Create context file (<3KB target)
cat > "${WORKTREE_PATH}/TASK_CONTEXT.md" << EOF
# Task ${TASK_ID}

## Specification
${TASK_SPEC}

## Acceptance Criteria
- ${ACCEPTANCE}

## Context (Compressed)
${TASK_CONTEXT}
EOF

# Update task status to in_progress
cat > "tasks/${TASK_ID}.status.json" << EOF
{
  "id": "${TASK_ID}",
  "status": "in_progress",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "session": {
    "started": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  }
}
EOF

# Spawn implementer agent (FRESH SESSION)
cd "$WORKTREE_PATH"
opencode run --agent implementer --input TASK_CONTEXT.md > ../logs/${TASK_ID}.log 2>&1 &
AGENT_PID=$!

echo "$AGENT_PID" > "../pids/${TASK_ID}.pid"
echo "✓ Spawned worker for ${TASK_ID} (PID: $AGENT_PID)"
```

```bash
chmod +x scripts/spawn-worker.sh

# Create log and pid directories
mkdir -p logs/ pids/

# Spawn workers for ready tasks (3-8 concurrent)
for task_id in T01 T02 T05; do
    scripts/spawn-worker.sh $task_id
    sleep 2  # Stagger starts slightly
done
```

#### Step 3.3: Monitor Progress

**Status Monitor Script** (`scripts/monitor-tasks.sh`):

```bash
#!/bin/bash

watch -n 10 '
echo "=== Task Status ==="
for status_file in tasks/*.status.json; do
    task_id=$(basename $status_file .status.json)
    status=$(cat $status_file | jq -r ".status")
    phase=$(cat $status_file | jq -r ".progress.phase // \"unknown\"")
    echo "$task_id: $status ($phase)"
done

echo ""
echo "=== Worker Processes ==="
for pid_file in pids/*.pid; do
    task_id=$(basename $pid_file .pid)
    pid=$(cat $pid_file)
    if ps -p $pid > /dev/null; then
        echo "$task_id: Running (PID $pid)"
    else
        echo "$task_id: Completed/Failed"
    fi
done
'
```

#### Step 3.4: Handle Task Completion

**Completion Handler** (`scripts/handle-completion.sh`):

```bash
#!/bin/bash
set -e

TASK_ID=$1
WORKTREE_PATH="worktrees/${TASK_ID}"

cd "$WORKTREE_PATH"

# Run verification
echo "Running tests..."
pnpm test 2>&1 | tee test-output.txt
TEST_EXIT=${PIPESTATUS[0]}

echo "Running lint..."
pnpm lint 2>&1 | tee lint-output.txt
LINT_EXIT=${PIPESTATUS[0]}

echo "Running typecheck..."
pnpm typecheck 2>&1 | tee typecheck-output.txt
TYPE_EXIT=${PIPESTATUS[0]}

# Collect metrics
FILES_MODIFIED=$(git diff --name-only HEAD)
TOKEN_COUNT=$(cat ../logs/${TASK_ID}.log | grep -o "tokens: [0-9]*" | tail -1 | cut -d' ' -f2)

cd ../..

# Update status
if [ $TEST_EXIT -eq 0 ] && [ $LINT_EXIT -eq 0 ] && [ $TYPE_EXIT -eq 0 ]; then
    STATUS="review"
    SUCCESS=true
else
    STATUS="failed"
    SUCCESS=false
fi

cat > "tasks/${TASK_ID}.status.json" << EOF
{
  "id": "${TASK_ID}",
  "status": "${STATUS}",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "session": {
    "started": "$(cat tasks/${TASK_ID}.status.json | jq -r '.session.started')",
    "ended": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  },
  "verification": {
    "tests_passed": $([ $TEST_EXIT -eq 0 ] && echo "true" || echo "false"),
    "lint_passed": $([ $LINT_EXIT -eq 0 ] && echo "true" || echo "false"),
    "type_check_passed": $([ $TYPE_EXIT -eq 0 ] && echo "true" || echo "false")
  },
  "files": {
    "modified": $(echo "$FILES_MODIFIED" | jq -R . | jq -s .)
  },
  "metrics": {
    "token_count": ${TOKEN_COUNT:-0}
  }
}
EOF

if [ "$SUCCESS" = true ]; then
    echo "✓ Task ${TASK_ID} completed successfully, ready for review"
else
    echo "✗ Task ${TASK_ID} failed verification"
fi
```

### Stage 4: Integration & Review

#### Step 4.1: Review Completed Tasks

For each task in "review" status:

```bash
TASK_ID=T01
WORKTREE_PATH="worktrees/${TASK_ID}"

# View diff
cd "$WORKTREE_PATH"
git diff HEAD

# Spawn reviewer agent (CLEAN CONTEXT: diff + acceptance criteria ONLY)
opencode run --agent reviewer << EOF
Review the following changes for task ${TASK_ID}.

Acceptance criteria:
$(cat ../tasks/${TASK_ID}.yaml | yq -r '.acceptance | join("\n- ")')

Diff:
$(git diff HEAD)

Test results:
$(cat test-output.txt)

Provide review following the format in docs/AGENT_ROLES.md (Reviewer Agent section).
EOF
```

#### Step 4.2: Handle Review Outcomes

**If Approved**:

```bash
# Merge to main
cd worktrees/${TASK_ID}
git add .
git commit -m "Implement task ${TASK_ID}: $(cat ../tasks/${TASK_ID}.yaml | yq -r '.title')"

cd ../..
git checkout main
git merge --no-ff task/${TASK_ID}

# Update status
cat > tasks/${TASK_ID}.status.json << EOF
{
  "id": "${TASK_ID}",
  "status": "completed",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

# Update backlog
yq -i ".tasks[] |= (select(.id == \"${TASK_ID}\") | .status = \"completed\")" tasks/BACKLOG.yaml

# Cleanup worktree
git worktree remove worktrees/${TASK_ID}
```

**If Changes Requested**:

```bash
# Create notes file with review feedback
cat > tasks/${TASK_ID}.review-notes.md << EOF
# Review Notes: ${TASK_ID}

## Issues
[Paste reviewer feedback]

## Required Changes
- [Change 1]
- [Change 2]
EOF

# Update status
yq -i ".tasks[] |= (select(.id == \"${TASK_ID}\") | .status = \"in_progress\")" tasks/BACKLOG.yaml

# Agent can continue in same worktree
cd worktrees/${TASK_ID}
opencode run --agent implementer --input ../tasks/${TASK_ID}.review-notes.md
```

**If Rebase Recommended**:

```bash
# Spawn rebase agent
opencode run --agent rebase << EOF
Analyze this failed implementation and improve the task spec.

Original spec:
$(cat tasks/${TASK_ID}.yaml)

Implementation attempt:
$(cd worktrees/${TASK_ID} && git log -1 --stat)

Test failures:
$(cat worktrees/${TASK_ID}/test-output.txt)

Review feedback:
$(cat tasks/${TASK_ID}.review-notes.md)

Output improved task spec following BACKLOG_SCHEMA.md format.
EOF

# Update task spec with improvements
# (Manual step: incorporate rebase agent's suggestions)

# Clear context and retry
git worktree remove worktrees/${TASK_ID} --force
git branch -D task/${TASK_ID}
yq -i ".tasks[] |= (select(.id == \"${TASK_ID}\") | .status = \"ready\" | .attempts += 1)" tasks/BACKLOG.yaml

# Respawn worker with improved spec
scripts/spawn-worker.sh ${TASK_ID}
```

---

## Agent Specifications

### Conductor (Orchestrator)

**Role**: Master coordinator

**Model**: ChatGPT-4

**Key Responsibilities**:
1. Intake: Parse feature requests, generate repo context
2. Planning Coordination: Spawn planning subagents, collect outputs
3. Backlog Generation: Convert plans into atomic tasks
4. Work Distribution: Assign tasks to worker agents
5. Integration: Merge results, run verification gates
6. Context Hygiene: Enforce clean context handoffs

**Critical Rules**:
- Never carry planning debris into implementation
- Clear context between major phases
- Maintain only: backlog state + task status
- Discard: all subagent exploration contexts

### Planning Subagents

**Pattern**: Context Garbage Collectors

**Model**: Gemini (free tier)

**Roles**:
1. **Product/Spec Agent**: Requirements, acceptance tests, edge cases
2. **Architecture Agent**: Module boundaries, APIs, data flows, migration plan
3. **Risk/QA Agent**: Test plan, failure modes, rollout safety

**Context Lifecycle**:
```
1. Receive: Repo map + feature request
2. Explore: Grep, read, search (messy OK)
3. Distill: Produce clean markdown document
4. Discard: ALL exploration context (session deleted)
5. Handoff: Only final document survives
```

**Why This Works**: Planning is allowed to be chaotic because implementation context never sees it.

### Worker Agents

**Pattern**: Clean Context Execution

**Model Routing**:
- **ChatGPT-4**: Code edits, refactors, debugging
- **Gemini**: Documentation, comments, simple changes

**Context Requirements**:
- Start with minimal, clean context (<3KB)
- Task spec + acceptance criteria + minimal constraints only
- No planning debris, no other task residue
- File hints (paths + line ranges), not full files

**Workspace Isolation**:
- Each worker gets a git worktree
- Prevents file conflicts
- Enables true parallelism

### Utility Agents

**Rebase Agent**:
- Analyzes failed/messy implementations
- Improves prompt/spec with hindsight
- Recommends regeneration (not patching)

**Context Compressor Agent**:
- Compresses large contexts while preserving critical info
- Target: 80-90% reduction
- Keeps: Requirements, constraints, patterns
- Discards: Planning discussion, full files, noise

---

## Implementation Approaches

### Phase 1: MVP (Week 1-2)

**Goal**: Prove the pattern works

**Scope**:
- Manual conductor script (TypeScript)
- 3 planning agents (Gemini)
- 1 worker agent (ChatGPT-4)
- File-based task tracking
- Manual integration

**Success Criteria**:
- [ ] Complete one feature end-to-end
- [ ] Planning agents run in parallel
- [ ] Planning context is discarded (verified via logs)
- [ ] Implementation starts with clean context (<5KB)
- [ ] Task completes with passing tests
- [ ] Total time: <2 hours for simple feature

**Deliverables**:
- `conductor/src/mvp-conductor.ts`
- `.opencode/agent/*.md` (4 agent prompts)
- `tasks/BACKLOG.yaml` (from real run)
- `docs/MVP_RESULTS.md` (learnings, metrics)

### Phase 2: Automation (Week 3-4)

**Goal**: Remove human bottlenecks

**Scope**:
- Automated worktree management
- Worker pool (3-8 parallel)
- Automated test gates
- Status monitoring dashboard

**Success Criteria**:
- [ ] Run 3 tasks in parallel without intervention
- [ ] Automatic worktree creation/cleanup
- [ ] Automated test gates (pass/fail detection)
- [ ] Status monitoring dashboard (CLI output)
- [ ] Complete feature in <1 hour (vs 2 hours manual)

**Deliverables**:
- `conductor/src/` (5 new modules)
- `conductor/package.json`
- `conductor/tsconfig.json`
- CLI tool: `conductor run feature-request.md`

### Phase 3: Optimization (Week 5-6)

**Goal**: Improve cost, quality, and reliability

**Scope**:
- Prompt rebasing automation
- Context compression plugins
- Model routing refinement
- Prompt library
- Metrics & analytics

**Success Criteria**:
- [ ] 50% cost reduction (via model routing)
- [ ] 2x throughput (via optimization)
- [ ] >70% first-attempt success rate
- [ ] Automatic rebase on >2 failures
- [ ] Context sizes: planning <10KB, implementation <3KB

**Deliverables**:
- Rebase engine
- Context compression plugin
- Model router
- Prompt library (5 templates)
- Metrics dashboard

### Phase 4: Factory Pattern (Week 7-8)

**Goal**: Specs become primary artifacts, code is disposable output

**Scope**:
- Spec repository
- Spec versioning
- Spec-driven regeneration
- Template system
- Multi-project orchestration

**Success Criteria**:
- [ ] Rebuild entire codebase from specs in <1 hour
- [ ] Spec versioning tracks changes
- [ ] Template library with 5+ templates
- [ ] Multi-project orchestration (2+ projects in parallel)
- [ ] Spec-driven regeneration produces identical output

**Deliverables**:
- Spec repository structure
- Regenerator
- Template engine (5 templates)
- Multi-project orchestrator
- Documentation: "Factory Pattern Guide"

---

## Best Practices & Patterns

### Pattern 1: Parallel Planning (Subagents)

```
Conductor
├─ Spawn: planner-spec ─────┐
├─ Spawn: planner-arch ─────┤ (Parallel)
└─ Spawn: planner-qa ───────┘
         │
         ├─ Explore (messy, isolated)
         ├─ Produce (clean output)
         └─ Delete (context discarded)
                  │
                  ▼
         Conductor merges outputs
```

**Key**: Subagents never see each other's contexts. Conductor only sees final outputs.

### Pattern 2: Sequential Task Execution

```
Conductor
└─ Task T01 ready
   ├─ Create worktree
   ├─ Build minimal context
   ├─ Spawn implementer (fresh session)
   │  ├─ Implement
   │  ├─ Test
   │  └─ Update status
   └─ Delete session (context discarded)
```

**Key**: Each task gets a fresh session. No context carried forward.

### Pattern 3: Review Gate

```
Task completed
├─ Conductor reads diff
├─ Spawn reviewer (fresh session, minimal context)
│  ├─ Input: diff + acceptance criteria ONLY
│  ├─ Review
│  └─ Approve/Reject
└─ Delete reviewer session
```

**Key**: Reviewer sees only the diff, not the implementation history.

### Pattern 4: Rebase on Failure

```
Task failed
├─ Conductor analyzes failure
├─ Spawn rebase agent
│  ├─ Input: original spec + failure details
│  ├─ Output: improved spec
│  └─ Delete session
├─ Update task spec
├─ Clear all context
└─ Retry with fresh implementer
```

**Key**: Don't patch the code, improve the spec and regenerate.

### Context Management Rules

1. **Session = Task Scope**: One session per task. Never reuse sessions across tasks.
2. **Subagent Disposal**: Planning subagents are deleted after producing output. Their exploration context is garbage.
3. **Clean Handoffs**: Each phase starts with minimal, clean context. No debris from previous phases.
4. **Explicit Negative Evidence**: Failed attempts are distilled to single-line "don't do X because Y" statements, not full transcripts.
5. **Compression Over Accumulation**: When context grows, compress it. Don't just accumulate.
6. **File Paths Over File Contents**: Reference files by path + line range, not full contents.
7. **Clear Between Phases**: Conductor clears context between planning, backlog generation, and implementation.

### Prompt Rebasing Strategy

**When to Rebase**:
- Implementation was messy (lots of backtracking)
- Agent got stuck and self-debugged out
- Output feels fragile
- Used way more context than expected

**How to Rebase**:
1. **Don't patch the code** - throw it away
2. **Update the prompt/spec** with hindsight:
   - Add missing constraints
   - Clarify ambiguous requirements
   - Include discovered edge cases
3. **Clear context completely**
4. **Rerun from scratch** with improved prompt

**Why This Works**:
- The prompt/spec is the durable artifact
- Code becomes rebuildable output
- Cheaper than human review + patch cycle
- Produces cleaner, more maintainable results

---

## Cost Optimization Strategies

### Model Routing Policy

| Task Type | Model | Cost | Rationale |
|-----------|-------|------|-----------|
| Repo exploration | Gemini (free) | $0 | Read-heavy, high token volume |
| Spec writing | Gemini (free) | $0 | Documentation, summarization |
| Plan drafting | Gemini (free) | $0 | Analysis, synthesis |
| Backlog generation | ChatGPT-4 | $$$ | Needs strong decomposition |
| Code edits | ChatGPT-4 | $$$ | Critical quality path |
| Refactoring | ChatGPT-4 | $$$ | Complex reasoning |
| Debugging | ChatGPT-4 | $$$ | Needs strong problem-solving |
| Documentation | Gemini (free) | $0 | Writing, formatting |
| Simple changes | Gemini (free) | $0 | Low-risk modifications |
| Code review | ChatGPT-4 | $$ | Quality gate |

### Cost Breakdown (Per Feature)

| Phase | Agent | Model | Tokens | Cost |
|-------|-------|-------|--------|------|
| Planning (3 agents) | Spec, Arch, QA | Gemini | ~30K | $0 (free) |
| Backlog Generation | Conductor | GPT-4 | ~2K | $0.06 |
| Implementation (3 tasks) | Workers | GPT-4 | ~15K | $0.45 |
| Documentation | Documenter | Gemini | ~5K | $0 (free) |
| Review | Reviewer | GPT-4 | ~3K | $0.09 |
| **Total** | | | **~55K** | **~$0.60** |

**Without model routing**: ~$1.65 (all GPT-4)  
**Savings**: 64% cost reduction

### Cost Control Strategy

**Use a simple router policy**:

**Gemini CLI (free/cheap)**:
- Repo exploration
- Summarization
- Spec + plan drafts
- Writing docs

**ChatGPT-4 (spend here)**:
- Actual code edits
- Refactors
- Debugging failing tests

**This alone usually cuts costs hard**, because "thinking/planning" dominates tokens if you let expensive models do everything.

---

## Scaling & Advanced Patterns

### Vertical Scaling (Better Context)

1. **Improve repo map generation** (more accurate, more compressed)
2. **Refine task decomposition** (smaller, clearer tasks)
3. **Better constraint specification** (fewer ambiguities)
4. **Prompt library** (reusable, proven prompts)

### Horizontal Scaling (More Agents)

1. **Increase concurrent workers** (3 → 8 → 16)
2. **More specialized subagents** (e.g., separate DB migration agent)
3. **Hierarchical task decomposition** (Level-3, Level-4 tasks)

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

### Multi-Project Orchestration

**Pattern**: Prioritize and allocate workers across multiple projects

**Implementation**:
```typescript
export class MultiProjectOrchestrator {
  async orchestrate(projects: Project[]) {
    // Prioritize projects
    const prioritized = this.prioritize(projects)
    
    // Allocate workers across projects
    const allocation = this.allocateWorkers(prioritized)
    
    // Run projects in parallel (with worker limits)
    await Promise.all(
      prioritized.map(project => 
        this.runProject(project, allocation[project.id])
      )
    )
  }
}
```

---

## Troubleshooting & Debugging

### Common Issues

#### Task Stuck in "in_progress"

**Diagnosis**:
```bash
TASK_ID=T01
tail -f logs/${TASK_ID}.log
```

**Solutions**:

1. **Agent hung**: Kill and restart
```bash
kill $(cat pids/${TASK_ID}.pid)
yq -i ".tasks[] |= (select(.id == \"$TASK_ID\") | .status = \"ready\")" tasks/BACKLOG.yaml
scripts/spawn-worker.sh $TASK_ID
```

2. **Waiting for user input**: Check if agent is asking questions
```bash
# If agent needs clarification, update task spec and restart
```

#### Tests Failing Repeatedly

**Diagnosis**:
```bash
cat worktrees/${TASK_ID}/test-output.txt
```

**Solutions**:

1. **Incorrect context**: Trigger rebase
```bash
opencode run --agent rebase [provide context]
# Update task spec
# Restart with improved spec
```

2. **Test is wrong**: Fix test, not implementation
```bash
# Manually fix test
cd worktrees/${TASK_ID}
# Edit test file
git add .
git commit -m "Fix test for ${TASK_ID}"
```

#### Context Too Large

**Diagnosis**:
```bash
# Check task context size
cat tasks/${TASK_ID}.yaml | yq -r '.context | to_yaml' | wc -c
```

**Solution**: Compress context
```bash
opencode run --agent compressor << EOF
Compress this task context following rules in docs/AGENT_ROLES.md:

$(cat tasks/${TASK_ID}.yaml | yq -r '.context | to_yaml')
EOF

# Update task with compressed context
```

#### Circular Dependencies

**Diagnosis**:
```bash
python scripts/validate-backlog.py tasks/BACKLOG.yaml
```

**Solution**: Break the cycle
```bash
# Manually edit BACKLOG.yaml to remove circular dependency
# Or split tasks differently
```

### Failure Modes & Mitigations

#### 1. Broken Feedback Loop
**Problem**: Tool outputs are incorrect (e.g., broken test runner)

**Impact**: Agent optimizes around phantom signals (toxic incorrect context)

**Mitigation**:
- Validate tool outputs before feeding to agent
- Include tool health checks in conductor
- Surface tool failures explicitly to human

#### 2. Context Pollution
**Problem**: Planning debris enters implementation context

**Impact**: Agent pattern-matches against wrong story

**Mitigation**:
- Enforce session deletion after planning
- Never reuse sessions across phases
- Audit context size before implementation starts

#### 3. Cross-Task Residue
**Problem**: Forever-context carries unrelated task history

**Impact**: Performance degradation, wrong assumptions

**Mitigation**:
- Create new session per task (enforced by conductor)
- Never use `/clear` - always new session
- Worktree isolation prevents file-level pollution

#### 4. Incorrect Context Accumulation
**Problem**: Failed attempts stay in context as if useful

**Impact**: Agent keeps trying wrong approaches

**Mitigation**:
- Prompt rebasing: throw away messy runs
- Explicit negative evidence: "Tried X, failed because Y, don't retry"
- Session restart threshold: >N failures → rebase

---

## Reference Quick Links

### Core Documentation
- **[System Specification](./SYSTEM_SPEC.md)** - Complete system design
- **[Agent Roles](./AGENT_ROLES.md)** - Detailed agent specifications
- **[Backlog Schema](./BACKLOG_SCHEMA.md)** - Task format and schema
- **[Workflow Guide](./WORKFLOW_GUIDE.md)** - Step-by-step operations
- **[Implementation Plan](./IMPLEMENTATION_PLAN.md)** - Phased build plan
- **[Final Implementation Plan](./IMPLEMENTATION_PLAN_FINAL.md)** - Unified implementation plan for OpenCode plugin
- **[Implementation Plan Summary](./IMPLEMENTATION_PLAN_SUMMARY.md)** - Quick reference for implementation approach

### Implementation Drafts
- **[Claude Army Adaptation](./IMPLEMENTATION_DRAFT_CLAUDE_ARMY.md)** - Concrete implementation plan based on existing Claude Army codebase
- **[OpenCode Conductor Adaptation](./IMPLEMENTATION_DRAFT_OPENCODE_CONDUCTOR.md)** - Concrete implementation plan based on existing OpenCode Conductor plugin
- **[Oh My OpenCode Adaptation](./IMPLEMENTATION_DRAFT_OH_MY_OPENCODE.md)** - Concrete implementation plan based on existing Oh My OpenCode plugin

### Quick References
- **[Quick Reference](./QUICK_REFERENCE.md)** - Cheat sheet
- **[Summary](./SUMMARY.md)** - High-level overview
- **[Getting Started](./GETTING_STARTED.md)** - Quick start guide

### Key Concepts
- **Context Engineering**: The foundation - context quality determines output quality
- **Prompt Rebasing**: Improve specs, regenerate code (don't patch)
- **Subagents as Garbage Collectors**: Explore messily, discard context, handoff cleanly
- **Model Routing**: Free tier for planning, expensive models for code
- **Factory Pattern**: Specs as primary artifacts, code as disposable output

---

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

---

## Conclusion

This comprehensive guide covers all approaches, principles, workflows, and best practices for building and operating a context-engineered multi-agent coding system.

**Key Takeaways**:

1. **Context quality determines output quality** - This is the fundamental principle
2. **What you discard is as important as what you produce** - Context hygiene is critical
3. **Prompt rebasing > patching** - The spec is durable, code is disposable
4. **Subagents are garbage collectors** - Keep exploration separate from execution
5. **Model routing saves costs** - 64% reduction via free tier for planning
6. **Factory pattern scales** - Specs become primary artifacts

**Next Steps**:

1. **Start with Phase 1 (MVP)** - Prove the pattern works
2. **Iterate on prompts** - Improve based on results
3. **Scale incrementally** - Add automation, optimization, factory pattern
4. **Track metrics** - Context sizes, success rates, costs
5. **Build prompt library** - Reusable, proven patterns

**Remember**: The prompt/spec is the durable artifact. Code is rebuildable output. When something goes wrong, improve the prompt and regenerate—don't patch the mess.

Good luck! 🚀

