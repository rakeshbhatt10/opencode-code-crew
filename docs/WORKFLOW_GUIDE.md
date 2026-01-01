# Workflow Guide: Step-by-Step Operations

## Overview

This guide provides concrete, step-by-step instructions for operating the multi-agent coding system.

## Prerequisites

### Required Tools
- **OpenCode CLI**: `npm install -g @opencode-ai/cli`
- **Git**: Version 2.25+
- **Node.js**: Version 18+
- **pnpm**: `npm install -g pnpm`

### Required Credentials
- **OpenAI API Key**: For ChatGPT-4 (conductor, implementer)
- **Google AI API Key**: For Gemini (planners, documenter)

### Configuration

```bash
# Set up OpenCode config
mkdir -p ~/.config/opencode
```

Create `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "openai/gpt-4",
  "provider": {
    "openai": {
      "options": {
        "apiKey": "{env:OPENAI_API_KEY}"
      }
    },
    "google": {
      "options": {
        "apiKey": "{env:GOOGLE_AI_API_KEY}"
      }
    }
  },
  "agent": {
    "conductor": {
      "model": "openai/gpt-4",
      "description": "Master orchestrator"
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
    "documenter": {
      "model": "google/gemini-2.0-flash-exp",
      "description": "Documentation agent"
    },
    "reviewer": {
      "model": "openai/gpt-4",
      "description": "Code review agent"
    }
  }
}
```

Set environment variables:

```bash
export OPENAI_API_KEY="your-openai-key"
export GOOGLE_AI_API_KEY="your-google-key"
```

---

## Complete Workflow: Feature Request to Deployment

### Stage 0: Intake & Preparation

#### Step 0.1: Create Feature Request

Create `feature-request.md`:

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

---

### Stage 1: Parallel Planning

#### Step 1.1: Set Up Planning Environment

```bash
# Create planning workspace
mkdir -p planning/
cd planning/

# Copy context
cp ../context.md .
```

#### Step 1.2: Spawn Planning Agents (Parallel)

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

#### Step 1.3: Review Planning Outputs

```bash
# Check outputs
ls -lh SPEC.md ARCH.md QA.md

# Quick review
head -20 SPEC.md
head -20 ARCH.md
head -20 QA.md
```

**Human checkpoint**: Skim the outputs. Are they reasonable? If any agent went off-track, regenerate that one.

#### Step 1.4: Merge into Unified Plan

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

#### Step 1.5: Context Cleanup

```bash
# CRITICAL: Delete planning sessions
# (If using SDK, this is done programmatically)
# For CLI, planning contexts are automatically isolated per run

# Move outputs to project docs
cp PLAN.md ../docs/
cd ..
```

---

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

Create `scripts/validate-backlog.py`:

```python
#!/usr/bin/env python3
import yaml
import sys

def has_cycle(graph, start, visited, rec_stack):
    visited.add(start)
    rec_stack.add(start)
    
    for neighbor in graph.get(start, []):
        if neighbor not in visited:
            if has_cycle(graph, neighbor, visited, rec_stack):
                return True
        elif neighbor in rec_stack:
            return True
    
    rec_stack.remove(start)
    return False

def validate_backlog(backlog_file):
    with open(backlog_file) as f:
        backlog = yaml.safe_load(f)
    
    # Build dependency graph
    graph = {}
    for task in backlog['tasks']:
        task_id = task['id']
        deps = task.get('depends_on', [])
        graph[task_id] = deps
    
    # Check for cycles
    visited = set()
    rec_stack = set()
    
    for task_id in graph:
        if task_id not in visited:
            if has_cycle(graph, task_id, visited, rec_stack):
                print(f"ERROR: Circular dependency detected involving {task_id}")
                sys.exit(1)
    
    print("✓ No circular dependencies")
    print(f"✓ {len(backlog['tasks'])} tasks validated")

if __name__ == '__main__':
    validate_backlog(sys.argv[1])
```

```bash
chmod +x scripts/validate-backlog.py
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

---

### Stage 3: Parallel Implementation

#### Step 3.1: Set Up Worker Pool

```bash
# Create worktree directory
mkdir -p worktrees/

# Set max concurrent workers
export MAX_WORKERS=3
```

#### Step 3.2: Identify Ready Tasks

```bash
# Get tasks with no dependencies or all dependencies met
cat tasks/BACKLOG.yaml | yq '.tasks[] | select(.status == "pending" or .status == "ready") | select(.depends_on == [] or .depends_on == null) | .id'
```

**Example output**:
```
T01
T02
T05
```

#### Step 3.3: Spawn Worker for Each Ready Task

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

# Build task context
TASK_CONTEXT=$(cat "$TASK_FILE" | yq -r '.context | to_yaml')
TASK_SPEC=$(cat "$TASK_FILE" | yq -r '.description')
ACCEPTANCE=$(cat "$TASK_FILE" | yq -r '.acceptance | join("\n- ")')

# Create context file
cat > "${WORKTREE_PATH}/TASK_CONTEXT.md" << EOF
# Task ${TASK_ID}

## Specification
${TASK_SPEC}

## Acceptance Criteria
- ${ACCEPTANCE}

## Context
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

# Spawn implementer agent
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

# Spawn workers for ready tasks
for task_id in T01 T02 T05; do
    scripts/spawn-worker.sh $task_id
    sleep 2  # Stagger starts slightly
done
```

#### Step 3.4: Monitor Progress

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

```bash
chmod +x scripts/monitor-tasks.sh
scripts/monitor-tasks.sh
```

#### Step 3.5: Handle Task Completion

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

```bash
chmod +x scripts/handle-completion.sh

# Run for completed tasks
scripts/handle-completion.sh T01
```

---

### Stage 4: Integration & Review

#### Step 4.1: Review Completed Tasks

For each task in "review" status:

```bash
TASK_ID=T01
WORKTREE_PATH="worktrees/${TASK_ID}"

# View diff
cd "$WORKTREE_PATH"
git diff HEAD

# Spawn reviewer agent
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

#### Step 4.3: Update Backlog and Continue

```bash
# Check for newly ready tasks (dependencies now met)
python scripts/get-ready-tasks.py tasks/BACKLOG.yaml

# Spawn workers for new ready tasks
for task_id in $(python scripts/get-ready-tasks.py tasks/BACKLOG.yaml); do
    scripts/spawn-worker.sh $task_id
done
```

Create `scripts/get-ready-tasks.py`:

```python
#!/usr/bin/env python3
import yaml
import sys

def get_ready_tasks(backlog_file):
    with open(backlog_file) as f:
        backlog = yaml.safe_load(f)
    
    completed = {t['id'] for t in backlog['tasks'] if t['status'] == 'completed'}
    
    for task in backlog['tasks']:
        if task['status'] not in ['pending', 'ready']:
            continue
        
        deps = set(task.get('depends_on', []))
        if deps.issubset(completed):
            print(task['id'])

if __name__ == '__main__':
    get_ready_tasks(sys.argv[1])
```

```bash
chmod +x scripts/get-ready-tasks.py
```

---

## Operational Patterns

### Pattern 1: Daily Standup (Check Status)

```bash
# Quick status check
echo "=== Completed Tasks ==="
yq '.tasks[] | select(.status == "completed") | .id + ": " + .title' tasks/BACKLOG.yaml

echo ""
echo "=== In Progress ==="
yq '.tasks[] | select(.status == "in_progress") | .id + ": " + .title' tasks/BACKLOG.yaml

echo ""
echo "=== Ready to Start ==="
python scripts/get-ready-tasks.py tasks/BACKLOG.yaml | while read task_id; do
    title=$(yq ".tasks[] | select(.id == \"$task_id\") | .title" tasks/BACKLOG.yaml)
    echo "$task_id: $title"
done

echo ""
echo "=== Blocked ==="
yq '.tasks[] | select(.status == "blocked") | .id + ": " + .title' tasks/BACKLOG.yaml
```

### Pattern 2: Emergency Stop

```bash
# Stop all workers
for pid_file in pids/*.pid; do
    pid=$(cat $pid_file)
    kill $pid 2>/dev/null || true
done

# Update all in_progress tasks to ready
for status_file in tasks/*.status.json; do
    status=$(cat $status_file | jq -r '.status')
    if [ "$status" = "in_progress" ]; then
        task_id=$(basename $status_file .status.json)
        yq -i ".tasks[] |= (select(.id == \"$task_id\") | .status = \"ready\")" tasks/BACKLOG.yaml
    fi
done
```

### Pattern 3: Context Audit

```bash
# Check context sizes at each phase
echo "=== Context Size Audit ==="

echo "Repo map: $(wc -c < docs/repo-map.md) bytes"
echo "Feature request: $(wc -c < feature-request.md) bytes"
echo "Combined context: $(wc -c < context.md) bytes"

echo ""
echo "Planning outputs:"
ls -lh planning/*.md

echo ""
echo "Task contexts:"
for task_file in tasks/T*.yaml; do
    task_id=$(basename $task_file .yaml)
    context_size=$(cat $task_file | yq -r '.context | to_yaml' | wc -c)
    echo "$task_id: $context_size bytes"
done
```

**Target sizes**:
- Repo map: <50KB
- Feature request: <5KB
- Task context: <3KB

### Pattern 4: Cost Tracking

```bash
# Aggregate costs
echo "=== Cost Summary ==="

total_tokens=0
for status_file in tasks/*.status.json; do
    tokens=$(cat $status_file | jq -r '.metrics.token_count // 0')
    total_tokens=$((total_tokens + tokens))
done

# Rough cost estimates (adjust for current pricing)
gpt4_cost=$(echo "scale=2; $total_tokens * 0.00003" | bc)  # $0.03 per 1K tokens
echo "Total tokens: $total_tokens"
echo "Estimated cost (GPT-4): \$$gpt4_cost"

# Breakdown by agent type
echo ""
echo "By agent:"
grep -h "agent.*implementer" logs/*.log | wc -l | xargs echo "Implementer calls:"
grep -h "agent.*planner" logs/*.log | wc -l | xargs echo "Planner calls:"
```

---

## Troubleshooting

### Problem: Task Stuck in "in_progress"

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

### Problem: Tests Failing Repeatedly

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

### Problem: Context Too Large

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

### Problem: Circular Dependencies

**Diagnosis**:
```bash
python scripts/validate-backlog.py tasks/BACKLOG.yaml
```

**Solution**: Break the cycle
```bash
# Manually edit BACKLOG.yaml to remove circular dependency
# Or split tasks differently
```

---

## Best Practices

### 1. Clear Context Religiously
- New session per task
- Delete planning sessions after merging
- Clear between major phases

### 2. Monitor Context Sizes
- Audit regularly
- Compress when >3KB per task
- Keep repo map <50KB

### 3. Validate Early
- Check backlog for cycles before starting
- Review planning outputs before backlog generation
- Test verification commands before spawning workers

### 4. Use Prompt Rebasing
- Don't patch messy implementations
- Improve spec and regenerate
- Track rebase frequency (higher is better)

### 5. Parallelize Aggressively
- Run 3-8 workers concurrently
- Planning agents always in parallel
- Only serialize when dependencies require it

### 6. Track Metrics
- Token usage per task
- First-attempt success rate
- Rebase frequency
- Context sizes

---

## Next Steps

1. **Set up infrastructure**: Install tools, configure OpenCode
2. **Test with single task**: Validate the pattern works
3. **Run full feature**: Complete workflow end-to-end
4. **Iterate on prompts**: Improve agent prompts based on results
5. **Automate further**: Build conductor script to orchestrate everything

