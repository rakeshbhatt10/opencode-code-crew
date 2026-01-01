# OpenCode Usage Guide: Code Crew Plugin

> Complete guide to using Code Crew - your multi-agent coding crew for OpenCode

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Basic Workflow](#basic-workflow)
5. [Command Reference](#command-reference)
6. [Advanced Usage](#advanced-usage)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)
9. [Examples](#examples)

---

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be v18+
   ```

2. **pnpm** (v8 or higher)
   ```bash
   pnpm --version  # Should be v8+
   ```

3. **OpenCode CLI**
   ```bash
   # Install OpenCode CLI
   npm install -g @opencode-ai/cli
   
   # Verify installation
   opencode --version
   ```

4. **Git** (for worktree support)
   ```bash
   git --version
   ```

5. **Bun** (for shell commands)
   ```bash
   # Install Bun
   curl -fsSL https://bun.sh/install | bash
   
   # Verify
   bun --version
   ```

### API Keys

You'll need API keys for the models you want to use:

1. **Google AI (Gemini)** - For free-tier planning
   - Get key: https://makersuite.google.com/app/apikey
   - Set environment variable:
     ```bash
     export GOOGLE_API_KEY="your-key-here"
     ```

2. **OpenAI (GPT-4)** - For implementation tasks
   - Get key: https://platform.openai.com/api-keys
   - Set environment variable:
     ```bash
     export OPENAI_API_KEY="your-key-here"
     ```

3. **OpenCode Account**
   - Sign up: https://opencode.ai
   - Login via CLI:
     ```bash
     opencode login
     ```

---

## Installation

### Step 1: Clone or Download the Plugin

```bash
# Navigate to your workspace
cd /path/to/your/workspace

# If you have the code-agents-workshop
cd code-agents-workshop
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Build the Plugin

```bash
pnpm build
```

You should see:
```
✓ TypeScript compilation successful
✓ 21 files compiled to dist/
```

### Step 4: Install as OpenCode Plugin

#### Option A: Local Development Mode

```bash
# Link the plugin for development
opencode plugin link .

# Verify it's installed
opencode plugin list
```

#### Option B: Install from Build

```bash
# Install the built plugin
opencode plugin install ./dist

# Verify
opencode plugin list
```

You should see:
```
✓ multi-agent-coder v1.0.0 (installed)
```

---

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```bash
# .env
GOOGLE_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key  # Optional
```

### Plugin Configuration

Edit `src/config.ts` to customize behavior:

```typescript
export const CONFIG = {
  // Context limits
  maxContextSize: 3000,           // Adjust if needed
  maxPlanningKeywords: 0,         // Zero tolerance
  
  // Timeouts (in milliseconds)
  planningTimeoutMs: 10 * 60 * 1000,      // 10 minutes
  implementationTimeoutMs: 30 * 60 * 1000, // 30 minutes
  
  // Concurrency
  maxPlanningAgents: 3,           // Don't change
  maxWorkers: 3,                  // Adjust based on your machine
  
  // Models - customize based on your API keys
  models: {
    planning: {
      provider: "google",
      model: "gemini-2.0-flash-exp",
      costPerToken: 0,
    },
    implementation: {
      provider: "openai",
      model: "gpt-4",
      costPerToken: 0.00003,
    },
    // ... more models
  },
  
  // Paths
  outputDir: "tasks",             // Where outputs go
  worktreeDir: "worktrees",       // Git worktrees
  specsDir: "specs",              // Spec versions
};
```

After changing config:
```bash
pnpm build  # Rebuild
```

### OpenCode Configuration

Configure OpenCode defaults:

```bash
# Set default model
opencode config set model google/gemini-2.0-flash-exp

# Set workspace
opencode config set workspace /path/to/your/project
```

---

## Basic Workflow

### Complete Feature Development Flow

```bash
# 1. Create feature request
cat > feature-request.md << 'EOF'
# User Authentication Feature

Add JWT-based authentication to the REST API.

## Requirements
- User registration with email/password
- Login endpoint that returns JWT token
- Protected routes with JWT middleware
- Password hashing with bcrypt
- Token expiration (24 hours)

## Constraints
- Must be backward compatible
- Use existing database schema
- Follow REST conventions

## Success Criteria
- All tests pass
- API documentation updated
- Security audit passed
EOF

# 2. Run planning phase (3 parallel agents, ~5-10 min)
opencode run plan --context_file=feature-request.md --output_dir=tasks

# Output:
# ✓ Planning phase complete
# - tasks/SPEC.md (requirements)
# - tasks/ARCH.md (architecture)
# - tasks/QA.md (test plan)
# - tasks/PLAN.md (unified plan)

# 3. Generate task backlog (~1-2 min)
opencode run backlog --plan_file=tasks/PLAN.md --track_id=auth-feature

# Output:
# ✓ Backlog generated: tasks/BACKLOG.yaml
# - 8 tasks created
# - Dependencies mapped

# 4. Review the backlog (optional)
cat tasks/BACKLOG.yaml

# 5. Implement tasks (parallel, ~10-30 min per batch)
opencode run implement --backlog_file=tasks/BACKLOG.yaml

# Output:
# 🏥 Running health checks...
# ✓ All instrumentation healthy
# 
# 📋 Processing 3 tasks in parallel...
# 🚀 Starting task T01: Setup database schema
# 🚀 Starting task T02: Implement user model
# 🚀 Starting task T03: Add password hashing
# ✓ Task T01 completed in 45.2s
# ✓ Task T02 completed in 67.8s
# ✓ Task T03 completed in 89.1s
#
# === Implementation Summary ===
# Total: 8
# Completed: 3
# In Progress: 0
# Failed: 0
# Pending: 5

# 6. Run again for next batch
opencode run implement --backlog_file=tasks/BACKLOG.yaml

# 7. Check results
git log --oneline -10
git diff HEAD~3..HEAD

# 8. If any tasks failed, analyze and rebase
opencode run rebase --backlog_file=tasks/BACKLOG.yaml --task_id=T05
```

---

## Command Reference

### 1. `opencode run plan`

**Purpose:** Generate implementation plan using 3 parallel agents

**Syntax:**
```bash
opencode run plan --context_file=<file> [--output_dir=<dir>]
```

**Arguments:**
- `--context_file` (required) - Path to feature request/context file
- `--output_dir` (optional) - Output directory (default: `tasks`)

**Example:**
```bash
opencode run plan --context_file=feature.md --output_dir=my-feature
```

**Output Files:**
- `SPEC.md` - Requirements and acceptance criteria
- `ARCH.md` - Architecture and API design
- `QA.md` - Test plan and risks
- `PLAN.md` - Unified plan (structured merge)

**Duration:** 5-10 minutes  
**Cost:** ~$0 (uses Gemini free tier)

**What Happens:**
1. Reads context file
2. Spawns 3 agents in parallel (Spec, Arch, QA)
3. Each agent explores independently
4. Outputs are merged deterministically
5. Planning sessions are deleted
6. Deletion is verified (404 check)

---

### 2. `opencode run backlog`

**Purpose:** Break down plan into atomic tasks

**Syntax:**
```bash
opencode run backlog --plan_file=<file> --track_id=<id>
```

**Arguments:**
- `--plan_file` (required) - Path to PLAN.md
- `--track_id` (required) - Unique identifier for this feature

**Example:**
```bash
opencode run backlog --plan_file=tasks/PLAN.md --track_id=auth-v2
```

**Output:**
- `tasks/BACKLOG.yaml` - Structured task list

**Duration:** 1-2 minutes  
**Cost:** ~$0.10 (uses GPT-4)

**Backlog Format:**
```yaml
version: "1.0"
track_id: "auth-v2"
created_at: "2026-01-01T12:00:00Z"
updated_at: "2026-01-01T12:00:00Z"
tasks:
  - id: "T01"
    title: "Setup database schema"
    description: "Create users table with email, password_hash, created_at"
    status: "pending"
    depends_on: []
    acceptance:
      - "Table created with correct columns"
      - "Migrations run successfully"
      - "Indexes created for email lookup"
    attempts: 0
    scope:
      files_hint:
        - "src/db/schema.ts"
        - "migrations/001_users.sql"
      estimated_hours: 2
    context:
      constraints:
        - "Use existing migration framework"
        - "Follow naming conventions"
      patterns:
        - "See src/db/schema.ts for examples"
      gotchas:
        - "Remember to add indexes"
```

---

### 3. `opencode run implement`

**Purpose:** Execute tasks from backlog with verification

**Syntax:**
```bash
opencode run implement --backlog_file=<file>
```

**Arguments:**
- `--backlog_file` (required) - Path to BACKLOG.yaml

**Example:**
```bash
opencode run implement --backlog_file=tasks/BACKLOG.yaml
```

**Duration:** 10-30 minutes per batch  
**Cost:** $0.50-2.00 per task (varies by complexity)

**What Happens:**

1. **Health Checks** (30 seconds)
   - Verify test runner works
   - Verify linter works
   - Verify type checker works
   - If any fail, process stops

2. **Task Selection** (instant)
   - Find tasks with status "pending" or "ready"
   - Check dependencies are met
   - Select up to 3 tasks (parallel limit)

3. **For Each Task:**
   
   a. **Setup** (5-10 seconds)
      - Update task status to "in_progress"
      - Create isolated git worktree
      - Increment attempt counter
   
   b. **Context Preparation** (instant)
      - Compress task context to <3KB
      - Verify no planning debris
      - Verify single task only
   
   c. **Model Selection** (instant)
      - Classify task (simple, complex, docs, etc.)
      - Route to appropriate model
      - Create OpenCode session
   
   d. **Implementation** (5-20 minutes)
      - Send compressed context
      - Agent implements task
      - Monitor for context drift
      - Wait for completion (with timeout)
   
   e. **Verification** (10 seconds)
      - Verify final context is clean
      - Check for drift
      - Delete session
      - Verify deletion (404 check)
   
   f. **Merge** (5 seconds)
      - Merge worktree to main branch
      - Clean up worktree
      - Update task status to "completed"

4. **Summary**
   - Print statistics
   - Show rebase recommendations
   - Update BACKLOG.yaml

**Output Example:**
```
🏥 Running instrumentation health checks...
✓ Test runner: healthy
✓ Linter: healthy
✓ Type checker: healthy

📋 Processing 3 tasks in parallel...

🚀 Starting task T01: Setup database schema
📊 Baseline for T01/implementation-start: 2847 bytes
✓ Drift check passed: T01/implementation-start
✓ Task T01 completed in 45.2s

🚀 Starting task T02: Implement user model
📊 Baseline for T02/implementation-start: 2654 bytes
✓ Drift check passed: T02/implementation-start
✓ Task T02 completed in 67.8s

🚀 Starting task T03: Add password hashing
📊 Baseline for T03/implementation-start: 2123 bytes
✓ Drift check passed: T03/implementation-start
✓ Task T03 completed in 89.1s

=== Implementation Summary ===
Total: 8
Completed: 3
In Progress: 0
Failed: 0
Pending: 5
```

---

### 4. `opencode run rebase`

**Purpose:** Analyze failed/messy tasks and recommend improvements

**Syntax:**
```bash
opencode run rebase --backlog_file=<file> --task_id=<id>
```

**Arguments:**
- `--backlog_file` (required) - Path to BACKLOG.yaml
- `--task_id` (required) - Task ID to analyze

**Example:**
```bash
opencode run rebase --backlog_file=tasks/BACKLOG.yaml --task_id=T05
```

**Output:**
```
Analyzing task T05...

Messy Run Indicators:
✓ High attempts: 3 (threshold: 3)
✓ Large context: 2847 bytes (threshold: 2500)
✗ Long duration: 15.2 min (threshold: 20)
✓ Error patterns: Found 2 error patterns
✗ Many commits: 5 (threshold: 10)
✓ Low success rate: Failed

Recommendation: REBASE
Reason: Messy run detected: highAttempts, largeContext, errorPatterns, lowSuccessRate

Suggested Actions:
1. Review task description - may be too vague
2. Reduce context size - remove unnecessary patterns
3. Simplify acceptance criteria
4. Break into smaller subtasks
5. Check for conflicting constraints
```

---

### 5. `opencode run spec-history`

**Purpose:** View spec version history for a task

**Syntax:**
```bash
opencode run spec-history --task_id=<id>
```

**Arguments:**
- `--task_id` (required) - Task ID

**Example:**
```bash
opencode run spec-history --task_id=T01
```

**Output:**
```
Spec history for T01:

v1 (2026-01-01T10:00:00Z): Initial spec
v2 (2026-01-01T11:30:00Z): Reduced context size
v3 (2026-01-01T12:45:00Z): Simplified acceptance criteria
v4 (2026-01-01T14:20:00Z): Added constraint about migration framework
```

---

## Advanced Usage

### Custom Model Configuration

Override default models for specific tasks:

```typescript
// src/config.ts
export const CONFIG = {
  models: {
    // Use Claude for complex tasks
    implementation: {
      provider: "anthropic",
      model: "claude-3-opus-20240229",
      costPerToken: 0.000015,
    },
    
    // Use GPT-4 Turbo for reviews
    review: {
      provider: "openai",
      model: "gpt-4-turbo-preview",
      costPerToken: 0.00001,
    },
  },
};
```

### Parallel Worker Configuration

Adjust based on your machine:

```typescript
// For powerful machines
maxWorkers: 5,  // Run 5 tasks in parallel

// For limited resources
maxWorkers: 1,  // Sequential execution
```

### Custom Context Limits

```typescript
// Stricter limit for faster execution
maxContextSize: 2000,  // 2KB

// More lenient for complex tasks
maxContextSize: 4000,  // 4KB
```

### Timeout Configuration

```typescript
// Faster timeout for simple tasks
implementationTimeoutMs: 15 * 60 * 1000,  // 15 minutes

// Longer timeout for complex tasks
implementationTimeoutMs: 60 * 60 * 1000,  // 60 minutes
```

---

## Troubleshooting

### Issue: "Session creation failed"

**Cause:** OpenCode API key not configured

**Solution:**
```bash
# Login to OpenCode
opencode login

# Or set API key
export OPENCODE_API_KEY="your-key"
```

---

### Issue: "Health check failed: Test runner not working"

**Cause:** Test framework not set up

**Solution:**
```bash
# Install test framework (e.g., Bun)
bun add -d bun-types

# Or skip health checks (not recommended)
# Edit src/verification/instrumentationChecker.ts
```

---

### Issue: "Context too large: 3500 bytes"

**Cause:** Task description or context is too verbose

**Solution:**
1. Edit `tasks/BACKLOG.yaml`
2. Reduce task description length
3. Remove unnecessary acceptance criteria
4. Simplify patterns/constraints
5. Or increase limit in `src/config.ts`

---

### Issue: "Worktree already exists"

**Cause:** Previous run didn't clean up

**Solution:**
```bash
# List worktrees
git worktree list

# Remove manually
git worktree remove worktrees/T01 --force

# Clean up all
rm -rf worktrees/
git worktree prune
```

---

### Issue: "Planning timeout after 10 minutes"

**Cause:** Gemini API slow or context too large

**Solution:**
1. Reduce context file size
2. Increase timeout in config
3. Try again (may be temporary API issue)

---

### Issue: "Model not found: google/gemini-2.0-flash-exp"

**Cause:** Model name changed or not available

**Solution:**
```bash
# Check available models
opencode models list

# Update config with correct model name
# Edit src/config.ts
```

---

## Best Practices

### 1. Feature Request Format

**Good:**
```markdown
# Feature Name

Clear, concise description.

## Requirements
- Specific, testable requirement 1
- Specific, testable requirement 2

## Constraints
- Technical constraint 1
- Business constraint 2

## Success Criteria
- Measurable criterion 1
- Measurable criterion 2
```

**Bad:**
```markdown
# Feature

Add some stuff to make it better.

Make sure it works well and is fast.
```

---

### 2. Task Sizing

**Good Task:**
- 1-4 hours estimated
- 1-3 files to modify
- Clear acceptance criteria
- Minimal dependencies

**Bad Task:**
- 8+ hours estimated
- 10+ files to modify
- Vague acceptance criteria
- Many dependencies

**Solution:** Break large tasks into smaller ones

---

### 3. Context Management

**Do:**
- Keep descriptions concise
- Use bullet points
- Reference existing patterns by file path
- Limit to 2-3 constraints
- Limit to 2-3 patterns

**Don't:**
- Include full file contents
- Write paragraphs
- Add planning keywords (TODO, FIXME, etc.)
- Mix multiple task contexts

---

### 4. Dependency Management

**Good:**
```yaml
tasks:
  - id: "T01"
    title: "Setup database"
    depends_on: []
  
  - id: "T02"
    title: "Create user model"
    depends_on: ["T01"]  # Waits for T01
  
  - id: "T03"
    title: "Add authentication"
    depends_on: ["T02"]  # Waits for T02
```

**Bad:**
```yaml
tasks:
  - id: "T01"
    depends_on: ["T02"]  # Circular!
  
  - id: "T02"
    depends_on: ["T01"]  # Circular!
```

---

### 5. Iterative Development

**Workflow:**
```bash
# 1. Start small
opencode run plan --context_file=mvp.md

# 2. Implement core features
opencode run backlog --plan_file=tasks/PLAN.md --track_id=mvp
opencode run implement --backlog_file=tasks/BACKLOG.yaml

# 3. Test and validate
npm test

# 4. Add more features
opencode run plan --context_file=v2-features.md

# 5. Repeat
```

---

## Examples

### Example 1: REST API Endpoint

**feature.md:**
```markdown
# Add User Profile Endpoint

Add GET /api/users/:id endpoint to retrieve user profile.

## Requirements
- Return user data (id, name, email, created_at)
- Exclude password_hash from response
- Return 404 if user not found
- Return 401 if not authenticated

## Constraints
- Use existing auth middleware
- Follow REST conventions
- Use existing error handling

## Success Criteria
- Endpoint returns correct data
- Tests pass
- API docs updated
```

**Commands:**
```bash
opencode run plan --context_file=feature.md
opencode run backlog --plan_file=tasks/PLAN.md --track_id=profile-endpoint
opencode run implement --backlog_file=tasks/BACKLOG.yaml
```

---

### Example 2: Database Migration

**feature.md:**
```markdown
# Add Email Verification

Add email verification to user registration.

## Requirements
- Add verified_at column to users table
- Add verification_token column
- Create email_verifications table
- Add migration script

## Constraints
- Must be backward compatible
- Use existing migration framework
- No data loss

## Success Criteria
- Migration runs successfully
- Existing data preserved
- Tests pass
```

**Commands:**
```bash
opencode run plan --context_file=feature.md
opencode run backlog --plan_file=tasks/PLAN.md --track_id=email-verification
opencode run implement --backlog_file=tasks/BACKLOG.yaml
```

---

### Example 3: Bug Fix

**feature.md:**
```markdown
# Fix: Race Condition in Auth Token

Fix race condition where multiple requests create duplicate tokens.

## Problem
When user logs in from multiple devices simultaneously, duplicate
tokens are created in the database.

## Requirements
- Use database transaction
- Add unique constraint on user_id + device_id
- Handle constraint violation gracefully

## Constraints
- Must not break existing tokens
- Must work with PostgreSQL and MySQL

## Success Criteria
- No duplicate tokens created
- Concurrent login tests pass
- Existing tokens still work
```

**Commands:**
```bash
opencode run plan --context_file=feature.md
opencode run backlog --plan_file=tasks/PLAN.md --track_id=fix-race-condition
opencode run implement --backlog_file=tasks/BACKLOG.yaml
```

---

## Summary

### Quick Reference

| Command | Purpose | Duration | Cost |
|---------|---------|----------|------|
| `plan` | Generate implementation plan | 5-10 min | $0 |
| `backlog` | Break down into tasks | 1-2 min | $0.10 |
| `implement` | Execute tasks | 10-30 min/batch | $0.50-2/task |
| `rebase` | Analyze failed tasks | 1 min | $0 |
| `spec-history` | View spec versions | instant | $0 |

### Typical Workflow

```bash
# 1. Plan (once per feature)
opencode run plan --context_file=feature.md

# 2. Backlog (once per feature)
opencode run backlog --plan_file=tasks/PLAN.md --track_id=my-feature

# 3. Implement (repeat until done)
opencode run implement --backlog_file=tasks/BACKLOG.yaml

# 4. Rebase if needed
opencode run rebase --backlog_file=tasks/BACKLOG.yaml --task_id=T05
```

### Key Principles

1. **Context Quality = Output Quality**
2. **Keep context minimal (<3KB)**
3. **Verify cleanup at every transition**
4. **Use parallel planning for speed**
5. **Rebase on messy runs (don't patch)**

---

**Need Help?**

- Check [README.md](../README.md) for overview
- Check [IMPLEMENTATION_PLAN_FINAL_V3.md](IMPLEMENTATION_PLAN_FINAL_V3.md) for technical details
- Check [COMPREHENSIVE_GUIDE.md](COMPREHENSIVE_GUIDE.md) for context engineering principles

---

*Happy coding with Multi-Agent Coder! 🚀*

