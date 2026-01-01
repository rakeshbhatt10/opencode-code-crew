# Task Backlog Schema

## Overview

The backlog is the single source of truth for work items. It uses a structured YAML format for machine readability and includes markdown companions for human context.

## Core Principles

1. **Atomic tasks** - Each task should be completable by one agent in one session
2. **Dependency-tagged** - Explicit dependencies enable parallel execution
3. **Acceptance-testable** - If it can't be tested, it's not ready
4. **Context-minimal** - Only include what's needed for this specific task

## File Structure

```
tasks/
├── BACKLOG.yaml              # Master task list
├── T01.yaml                  # Individual task definition
├── T01.status.json           # Machine-readable status
├── T01.notes.md              # Human-readable progress notes
├── T01.context.md            # Compressed context for this task
└── T01.result.md             # Final output/summary
```

## BACKLOG.yaml Schema

```yaml
# Master backlog file
version: "1.0"
project: "feature-name"
created: "2024-01-15T10:00:00Z"
updated: "2024-01-15T14:30:00Z"

# Metadata
metadata:
  repo: "/path/to/repo"
  feature_request: "docs/feature-request.md"
  plan: "docs/PLAN.md"
  conductor_session: "session-abc123"

# Task list
tasks:
  - id: T01
    title: "Add vault allocation calculator"
    status: "completed"
    priority: "high"
    created: "2024-01-15T10:00:00Z"
    started: "2024-01-15T10:15:00Z"
    completed: "2024-01-15T11:30:00Z"
    
  - id: T02
    title: "Implement risk assessment module"
    status: "in_progress"
    priority: "high"
    created: "2024-01-15T10:00:00Z"
    started: "2024-01-15T11:45:00Z"
    
  - id: T03
    title: "Add integration tests for allocation"
    status: "ready"
    priority: "medium"
    created: "2024-01-15T10:00:00Z"
    
  - id: T04
    title: "Update API documentation"
    status: "blocked"
    priority: "low"
    created: "2024-01-15T10:00:00Z"

# Dependency graph
dependencies:
  T03: [T01, T02]  # T03 depends on T01 and T02
  T04: [T01, T02, T03]  # T04 depends on all others
```

## Individual Task Schema (T01.yaml)

```yaml
# Task definition
id: T01
title: "Add vault allocation calculator"
description: |
  Implement a calculator that determines optimal vault allocation
  based on risk parameters and volatility shifts.

# Ownership
owner: "agent_alloc"  # Agent assigned to this task
assignee_type: "implementer"  # Agent role type
model: "openai/gpt-4"  # Model to use for this task

# Scope
scope:
  # Files that will likely be modified
  files_hint:
    - "src/alloc/**"
    - "src/types/**"
    - "src/utils/calculator.ts"
  
  # Files that should NOT be modified
  files_exclude:
    - "src/legacy/**"
    - "src/deprecated/**"
  
  # Estimated complexity
  complexity: "medium"
  estimated_tokens: 5000

# Dependencies
depends_on: []  # No dependencies
blocks: ["T03"]  # This task blocks T03

# Requirements
requirements:
  functional:
    - "Calculate allocation based on volatility parameters"
    - "Respect min/max basis point constraints"
    - "Handle edge cases (zero volatility, extreme values)"
  
  non_functional:
    - "Performance: O(1) calculation time"
    - "Type-safe: Full TypeScript types"
    - "Tested: >90% coverage"

# Acceptance criteria (testable)
acceptance:
  - "Unit tests cover high/low volatility shifts"
  - "Constraints respected (min/max bps)"
  - "Edge cases handled without errors"
  - "TypeScript compiles without errors"
  - "All existing tests still pass"

# Context (minimal, compressed)
context:
  # Key constraints
  constraints:
    - "Use existing VaultConfig type"
    - "Follow functional programming style"
    - "No external dependencies"
  
  # Relevant patterns from codebase
  patterns:
    - "See src/utils/risk.ts for similar calculation pattern"
    - "Use Zod for runtime validation"
  
  # Known gotchas
  gotchas:
    - "Volatility can be zero - handle division by zero"
    - "BPS values are integers, not floats"

# Commands
commands:
  # Commands the agent is allowed to run
  allowed:
    - "pnpm test"
    - "pnpm lint"
    - "pnpm typecheck"
  
  # Commands to run for verification
  verify:
    - "pnpm test src/alloc"
    - "pnpm typecheck"

# Risk assessment
risk:
  level: "medium"
  factors:
    - "Core business logic"
    - "Financial calculations"
  mitigation:
    - "Extensive unit tests required"
    - "Manual review of calculation logic"

# Status tracking
status: "completed"
attempts: 1
last_attempt: "2024-01-15T10:15:00Z"

# Results
result:
  success: true
  tests_passed: true
  files_modified:
    - "src/alloc/calculator.ts"
    - "src/alloc/calculator.test.ts"
    - "src/types/allocation.ts"
  session_id: "session-xyz789"
  duration_minutes: 75
  token_count: 4823
```

## Status Schema (T01.status.json)

```json
{
  "id": "T01",
  "status": "completed",
  "timestamp": "2024-01-15T11:30:00Z",
  
  "progress": {
    "phase": "verification",
    "percent": 100,
    "current_step": "All tests passed"
  },
  
  "session": {
    "id": "session-xyz789",
    "agent": "implementer",
    "model": "openai/gpt-4",
    "started": "2024-01-15T10:15:00Z",
    "ended": "2024-01-15T11:30:00Z"
  },
  
  "verification": {
    "tests_run": 12,
    "tests_passed": 12,
    "tests_failed": 0,
    "coverage_percent": 94.5,
    "lint_errors": 0,
    "type_errors": 0
  },
  
  "files": {
    "modified": [
      "src/alloc/calculator.ts",
      "src/alloc/calculator.test.ts",
      "src/types/allocation.ts"
    ],
    "added": [
      "src/alloc/calculator.test.ts"
    ],
    "deleted": []
  },
  
  "metrics": {
    "token_count": 4823,
    "api_calls": 8,
    "duration_minutes": 75,
    "cost_usd": 0.24
  },
  
  "errors": [],
  
  "next_action": null
}
```

## Notes Schema (T01.notes.md)

```markdown
# Task T01: Add vault allocation calculator

## Status: ✅ Completed

**Started**: 2024-01-15 10:15:00  
**Completed**: 2024-01-15 11:30:00  
**Duration**: 75 minutes

## Approach

1. Created `src/alloc/calculator.ts` with main calculation logic
2. Implemented `calculateAllocation()` function using functional style
3. Added Zod schema for input validation
4. Handled edge cases (zero volatility, extreme values)
5. Created comprehensive test suite (12 tests)

## Key Decisions

- Used `Decimal.js` for precise BPS calculations (avoids floating point errors)
- Implemented early returns for edge cases (cleaner than nested conditionals)
- Followed existing pattern from `src/utils/risk.ts`

## Challenges & Solutions

**Challenge**: Division by zero when volatility is zero  
**Solution**: Added explicit check and return default allocation

**Challenge**: BPS values as integers vs floats  
**Solution**: Used `Math.round()` consistently throughout

## Test Results

```
✓ 12 tests passed
✓ 94.5% coverage
✓ 0 lint errors
✓ 0 type errors
```

## Files Modified

- `src/alloc/calculator.ts` (new, 156 lines)
- `src/alloc/calculator.test.ts` (new, 234 lines)
- `src/types/allocation.ts` (modified, +12 lines)

## Context for Next Tasks

- T03 can now proceed (integration tests)
- Calculation pattern can be reused for other risk modules
- Consider extracting BPS utilities to shared module
```

## Context Schema (T01.context.md)

```markdown
# Context for Task T01

## Task Summary
Implement vault allocation calculator with volatility-based logic.

## Minimal Required Context

### Type Definitions
```typescript
// From src/types/vault.ts
interface VaultConfig {
  minBps: number
  maxBps: number
  baseAllocation: number
}
```

### Existing Patterns
- Risk calculation pattern: `src/utils/risk.ts:45-78`
- Validation pattern: `src/utils/validator.ts:12-34`

### Constraints
1. Use functional programming style (no classes)
2. No external dependencies beyond existing ones
3. BPS values are integers (0-10000 range)

### Edge Cases to Handle
- Volatility = 0 → return base allocation
- Volatility > threshold → cap at maxBps
- Negative values → throw validation error

### Test Requirements
- Unit tests for all edge cases
- Property-based tests for constraint satisfaction
- Coverage >90%

## What NOT to Include
❌ Full file contents (use file hints instead)  
❌ Planning discussion/exploration  
❌ Alternative approaches considered  
❌ Other task contexts
```

## Status Values

### Primary States
- `pending` - Task created, not yet started
- `ready` - Dependencies met, ready to assign
- `in_progress` - Agent actively working
- `blocked` - Waiting on dependencies or external factors
- `review` - Implementation complete, awaiting review
- `completed` - Fully done, tests passing, merged
- `failed` - Attempted but failed, needs rebasing
- `cancelled` - No longer needed

### State Transitions
```
pending → ready → in_progress → review → completed
                      ↓
                   failed → pending (after rebase)
                      ↓
                  cancelled
```

## Task Sizing Guidelines

### Small Task (1-2 hours, <3000 tokens)
- Single function implementation
- Simple test addition
- Documentation update
- Bug fix

**Example**: "Add email validation to signup form"

### Medium Task (2-4 hours, 3000-6000 tokens)
- Module implementation
- Feature with 2-3 functions
- Integration test suite
- Refactoring with tests

**Example**: "Implement vault allocation calculator"

### Large Task (4-8 hours, 6000-10000 tokens)
- Multi-file feature
- Complex business logic
- Full test coverage
- API endpoint + tests

**Example**: "Add user authentication system"

### Too Large (>8 hours)
**Action**: Decompose into smaller tasks

**Example**: "Build admin dashboard" → Break into:
- T01: Create dashboard layout component
- T02: Add user management table
- T03: Implement role permissions
- T04: Add analytics widgets

## Dependency Management

### Dependency Types

**Hard Dependencies** (must complete first)
```yaml
dependencies:
  T03: [T01, T02]  # T03 cannot start until T01 and T02 complete
```

**Soft Dependencies** (preferred order, not required)
```yaml
soft_dependencies:
  T04: [T03]  # T04 should ideally wait for T03, but can proceed if needed
```

**Conflicts** (cannot run simultaneously)
```yaml
conflicts:
  T05: [T06]  # T05 and T06 modify same files, must run sequentially
```

### Dependency Resolution Algorithm

```typescript
function getReadyTasks(backlog: Backlog): Task[] {
  return backlog.tasks.filter(task => {
    // Must be in pending status
    if (task.status !== 'pending') return false
    
    // All hard dependencies must be completed
    const depsCompleted = task.depends_on.every(depId => 
      backlog.tasks.find(t => t.id === depId)?.status === 'completed'
    )
    if (!depsCompleted) return false
    
    // No conflicting tasks in progress
    const hasConflict = task.conflicts?.some(conflictId =>
      backlog.tasks.find(t => t.id === conflictId)?.status === 'in_progress'
    )
    if (hasConflict) return false
    
    return true
  })
}
```

## Context Compression Rules

### What to Keep
✅ Task-specific requirements  
✅ Acceptance criteria  
✅ Minimal code patterns (snippets, not full files)  
✅ Explicit constraints  
✅ Edge cases to handle  
✅ Negative evidence ("don't do X because Y")

### What to Discard
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

## Validation Rules

### Task Definition Validation
```typescript
interface TaskValidation {
  // Required fields
  id: string                    // Must match /^T\d+$/
  title: string                 // Max 100 chars
  description: string           // Max 500 chars
  acceptance: string[]          // Min 1 criterion
  
  // Constraints
  depends_on: string[]          // Must reference existing task IDs
  scope: {
    files_hint: string[]        // At least 1 file hint
    complexity: 'low' | 'medium' | 'high'
  }
  
  // Testability
  commands: {
    verify: string[]            // At least 1 verification command
  }
}
```

### Status Update Validation
```typescript
interface StatusValidation {
  // State machine enforcement
  validTransitions: {
    'pending': ['ready', 'cancelled'],
    'ready': ['in_progress', 'cancelled'],
    'in_progress': ['review', 'failed', 'cancelled'],
    'review': ['completed', 'in_progress'],
    'failed': ['pending', 'cancelled'],
    'completed': [],  // Terminal state
    'cancelled': []   // Terminal state
  }
  
  // Required fields per status
  requiredFields: {
    'in_progress': ['session.id', 'session.started'],
    'completed': ['verification', 'files.modified', 'metrics'],
    'failed': ['errors']
  }
}
```

## Usage Examples

### Creating a New Task

```typescript
import { createTask } from './backlog'

const task = createTask({
  title: "Add email validation",
  description: "Implement email validation for signup form",
  scope: {
    files_hint: ["src/auth/signup.ts", "src/utils/validation.ts"],
    complexity: "low"
  },
  acceptance: [
    "Email regex validates common formats",
    "Invalid emails show error message",
    "Tests cover edge cases"
  ],
  commands: {
    allowed: ["pnpm test", "pnpm lint"],
    verify: ["pnpm test src/auth/signup.test.ts"]
  }
})
```

### Updating Task Status

```typescript
import { updateTaskStatus } from './backlog'

await updateTaskStatus('T01', {
  status: 'in_progress',
  session: {
    id: 'session-abc123',
    agent: 'implementer',
    model: 'openai/gpt-4',
    started: new Date().toISOString()
  }
})
```

### Querying Ready Tasks

```typescript
import { getReadyTasks } from './backlog'

const readyTasks = await getReadyTasks()
console.log(`${readyTasks.length} tasks ready for assignment`)

// Assign to workers
for (const task of readyTasks.slice(0, MAX_CONCURRENT)) {
  await spawnWorker(task)
}
```

## Integration with OpenCode

### Task Context Injection

```typescript
// Build minimal context for agent
const context = buildTaskContext(task)

// Create fresh session
const session = await client.session.create({
  body: {
    title: task.title,
    agent: task.assignee_type
  }
})

// Inject context (no reply)
await client.session.prompt({
  path: { id: session.id },
  body: {
    noReply: true,
    parts: [{ type: "text", text: context }]
  }
})

// Start implementation
await client.session.prompt({
  path: { id: session.id },
  body: {
    parts: [{ 
      type: "text", 
      text: "Implement this task following the spec above." 
    }]
  }
})
```

### Status Monitoring

```typescript
// Subscribe to session events
const events = await client.event.subscribe()

for await (const event of events.stream) {
  if (event.type === 'session.idle') {
    // Task completed, update status
    await updateTaskStatus(taskId, {
      status: 'review',
      session: { ended: new Date().toISOString() }
    })
  }
  
  if (event.type === 'session.error') {
    // Task failed, record error
    await updateTaskStatus(taskId, {
      status: 'failed',
      errors: [event.properties.message]
    })
  }
}
```

## Best Practices

### 1. Keep Tasks Atomic
❌ Bad: "Implement user authentication and authorization system"  
✅ Good: "Implement JWT token generation" (separate from "Add role-based access control")

### 2. Make Acceptance Criteria Testable
❌ Bad: "Code should be clean and maintainable"  
✅ Good: "All functions have unit tests with >90% coverage"

### 3. Compress Context Aggressively
❌ Bad: Include full file contents  
✅ Good: "See pattern at src/utils/risk.ts:45-78"

### 4. Explicit Negative Evidence
❌ Bad: Carry forward failed attempt transcripts  
✅ Good: "Don't use class-based design - tried in T05, failed due to circular dependencies"

### 5. Clear Dependencies
❌ Bad: Implicit dependencies via comments  
✅ Good: Explicit `depends_on: [T01, T02]` in YAML

### 6. Minimal File Hints
❌ Bad: List every file in the repo  
✅ Good: List 2-5 files most likely to change

### 7. Model Selection
❌ Bad: Always use most expensive model  
✅ Good: Route by task type (code=GPT-4, docs=Gemini)

## Troubleshooting

### Task Stuck in "in_progress"
**Cause**: Agent session crashed or hung  
**Fix**: Check session status, abort if needed, reset to "ready"

### Dependencies Never Resolve
**Cause**: Circular dependency  
**Fix**: Validate dependency graph, break cycle

### Context Too Large
**Cause**: Not compressing context  
**Fix**: Apply compression rules, remove full file contents

### Tasks Fail Repeatedly
**Cause**: Incorrect context or unclear requirements  
**Fix**: Prompt rebasing - update task spec with hindsight, clear context, retry

### Cross-Task Interference
**Cause**: Tasks modifying same files simultaneously  
**Fix**: Add conflict declarations, enforce sequential execution

