# Getting Started with Code Crew

> Quick start guide to get up and running with Code Crew - your multi-agent coding crew for OpenCode

---

## 🎯 Quick Start (5 minutes)

### 1. Prerequisites

Ensure you have:
- ✅ Node.js v18+ (`node --version`)
- ✅ pnpm v8+ (`pnpm --version`)
- ✅ Git (`git --version`)
- ✅ Bun (`bun --version`)

### 2. Install OpenCode CLI

```bash
npm install -g @opencode-ai/cli
opencode --version
```

### 3. Configure OpenCode Plugins

Add the required authentication plugins to your OpenCode configuration:

**Add plugins to `~/.config/opencode/opencode.json`:**

```json
{
  "plugin": [
    "opencode-antigravity-auth@1.1.2",
    "opencode-openai-codex-auth@4.1.1"
  ]
}
```

**Add dependencies to your project's `package.json`:**

```json
{
  "dependencies": {
    "opencode-openai-codex-auth": "code-yeongyu/opencode-openai-codex-auth#fix/orphaned-function-call-output-with-tools"
  }
}
```

**Authenticate with OpenCode:**

```bash
# Login for both Codex and Antigravity using Chrome auth
opencode auth login

# Follow the prompts to authenticate via Chrome browser
# You'll be asked to paste the authentication key
```

**To clear authentication (if needed):**

```bash
opencode auth clear
```

### 4. Set Up API Keys

```bash
# Required: Google AI (for free-tier planning)
export GOOGLE_API_KEY="your-gemini-api-key"

# Required: OpenAI (for implementation)
export OPENAI_API_KEY="your-openai-api-key"
```

> **Note:** You should have already authenticated with OpenCode in step 3. If you haven't, run `opencode auth login` before proceeding.

### 5. Build the Plugin

```bash
# Navigate to the project
cd /path/to/code-agents-workshop

# Install dependencies
pnpm install

# Build the plugin
pnpm build
```

### 6. Install as OpenCode Plugin

```bash
# Link for development
opencode plugin link .

# Verify installation
opencode plugin list
```

You should see:
```
✓ code-crew v1.0.0 (installed)
```

---

## 🚀 Your First Feature

Let's build a simple feature to see the plugin in action!

### Step 1: Create a Feature Request

```bash
cat > feature.md << 'EOF'
# Add Health Check Endpoint

Add a simple health check endpoint to the API.

## Requirements
- GET /health endpoint
- Returns JSON: { "status": "ok", "timestamp": "..." }
- No authentication required
- Returns 200 status code

## Constraints
- Use existing Express router
- Follow REST conventions

## Success Criteria
- Endpoint responds with correct JSON
- Tests pass
- Returns 200 status
EOF
```

### Step 2: Generate Implementation Plan

```bash
opencode run plan --context_file=feature.md --output_dir=tasks
```

**What happens:**
- 3 agents run in parallel (Spec, Arch, QA)
- Uses Gemini free tier ($0 cost)
- Takes ~5-10 minutes
- Generates 4 files in `tasks/`:
  - `SPEC.md` - Requirements
  - `ARCH.md` - Architecture
  - `QA.md` - Test plan
  - `PLAN.md` - Unified plan

**Output:**
```
📋 Spawning 3 planning agents (parallel, Gemini free tier)...
⏳ Waiting for planning agents to complete...
🔀 Merging planning outputs (structured, no LLM)...
🗑️  Deleting planning sessions...
✅ Verifying sessions were deleted...
✓ Planning phase complete in 8.3s (verified cleanup)
```

### Step 3: Generate Task Backlog

```bash
opencode run backlog --plan_file=tasks/PLAN.md --track_id=health-check
```

**What happens:**
- Breaks plan into atomic tasks
- Creates dependency graph
- Validates YAML structure
- Takes ~1-2 minutes

**Output:**
```
✓ Backlog generated: tasks/BACKLOG.yaml
- 3 tasks created
- Dependencies mapped
```

### Step 4: Review the Backlog (Optional)

```bash
cat tasks/BACKLOG.yaml
```

You'll see something like:
```yaml
version: "1.0"
track_id: "health-check"
tasks:
  - id: "T01"
    title: "Create health check route"
    status: "pending"
    depends_on: []
    acceptance:
      - "Route responds to GET /health"
      - "Returns correct JSON format"
    scope:
      files_hint:
        - "src/routes/health.ts"
      estimated_hours: 1
```

### Step 5: Implement the Tasks

```bash
opencode run implement --backlog_file=tasks/BACKLOG.yaml
```

**What happens:**
- Runs health checks first
- Processes tasks in parallel (up to 3)
- Creates isolated git worktrees
- Verifies context at each step
- Takes ~10-20 minutes per batch

**Output:**
```
🏥 Running instrumentation health checks...
✓ Test runner: healthy
✓ Linter: healthy
✓ Type checker: healthy

📋 Processing 3 tasks in parallel...

🚀 Starting task T01: Create health check route
📊 Baseline for T01/implementation-start: 2847 bytes
✓ Drift check passed: T01/implementation-start
✓ Task T01 completed in 45.2s

=== Implementation Summary ===
Total: 3
Completed: 3
In Progress: 0
Failed: 0
Pending: 0
```

### Step 6: Check the Results

```bash
# See what was created
git log --oneline -5

# Review the changes
git diff HEAD~3..HEAD

# Run tests
npm test
```

---

## 📚 Next Steps

### Learn the Commands

1. **[OpenCode Usage Guide](OPENCODE_USAGE_GUIDE.md)** - Complete command reference
2. **[Quick Reference](QUICK_REFERENCE.md)** - Command cheat sheet
3. **[Workflow Guide](WORKFLOW_GUIDE.md)** - Detailed workflows

### Explore Advanced Features

- **Model Routing** - Automatic model selection based on task type
- **Context Compression** - Strict <3KB limits with validation
- **Drift Detection** - Real-time context monitoring
- **Proactive Rebasing** - Detect and fix messy runs
- **Spec Versioning** - Track prompt evolution

### Try More Examples

#### REST API Endpoint
```bash
# Create feature request for user profile endpoint
cat > profile-endpoint.md << 'EOF'
# Add User Profile Endpoint

Add GET /api/users/:id endpoint.

## Requirements
- Return user data (id, name, email)
- Exclude password_hash
- Return 404 if not found
- Require authentication
EOF

# Run the workflow
opencode run plan --context_file=profile-endpoint.md
opencode run backlog --plan_file=tasks/PLAN.md --track_id=profile
opencode run implement --backlog_file=tasks/BACKLOG.yaml
```

#### Database Migration
```bash
# Create feature request for email verification
cat > email-verification.md << 'EOF'
# Add Email Verification

Add email verification to user registration.

## Requirements
- Add verified_at column to users
- Add verification_token column
- Create email_verifications table
- Add migration script
EOF

# Run the workflow
opencode run plan --context_file=email-verification.md
opencode run backlog --plan_file=tasks/PLAN.md --track_id=email-verify
opencode run implement --backlog_file=tasks/BACKLOG.yaml
```

---

## 🛠️ Configuration

### Customize Models

Edit `src/config.ts`:

```typescript
export const CONFIG = {
  models: {
    // Use Claude for complex tasks
    implementation: {
      provider: "anthropic",
      model: "claude-3-opus-20240229",
      costPerToken: 0.000015,
    },
  },
};
```

Then rebuild:
```bash
pnpm build
```

### Adjust Concurrency

```typescript
// For powerful machines
maxWorkers: 5,  // Run 5 tasks in parallel

// For limited resources
maxWorkers: 1,  // Sequential execution
```

### Change Context Limits

```typescript
// Stricter for faster execution
maxContextSize: 2000,  // 2KB

// More lenient for complex tasks
maxContextSize: 4000,  // 4KB
```

---

## 🐛 Troubleshooting

### Issue: "Session creation failed"

**Solution:**
```bash
# Authenticate with OpenCode
opencode auth login

# Or set API key
export OPENCODE_API_KEY="your-key"
```

### Issue: "Health check failed"

**Solution:**
```bash
# Install test framework
bun add -d bun-types

# Verify it works
bun test
```

### Issue: "Context too large"

**Solution:**
1. Edit `tasks/BACKLOG.yaml`
2. Reduce task description
3. Remove unnecessary details
4. Or increase limit in `src/config.ts`

### Issue: "Worktree already exists"

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

## 💡 Best Practices

### 1. Write Clear Feature Requests

**Good:**
```markdown
# Feature Name

Clear description.

## Requirements
- Specific requirement 1
- Specific requirement 2

## Constraints
- Technical constraint 1

## Success Criteria
- Measurable criterion 1
```

**Bad:**
```markdown
# Feature

Add some stuff to make it better.
```

### 2. Keep Tasks Small

- ✅ 1-4 hours estimated
- ✅ 1-3 files to modify
- ✅ Clear acceptance criteria
- ❌ 8+ hours estimated
- ❌ 10+ files to modify

### 3. Use Iterative Development

```bash
# Start with MVP
opencode run plan --context_file=mvp.md

# Implement core
opencode run backlog --plan_file=tasks/PLAN.md --track_id=mvp
opencode run implement --backlog_file=tasks/BACKLOG.yaml

# Test and validate
npm test

# Add more features
opencode run plan --context_file=v2-features.md
```

---

## 📊 Cost Optimization

| Phase | Model | Cost | Notes |
|-------|-------|------|-------|
| Planning | Gemini | $0 | Free tier |
| Backlog | GPT-4 | ~$0.10 | One-time |
| Simple Tasks | Gemini | $0 | Auto-routed |
| Complex Tasks | GPT-4 | ~$0.50 | Per task |

**Typical feature:** $2-5 (vs $20-50 without optimization)

---

## 🎓 Key Concepts

### Context Engineering

> **Context Quality = Output Quality**

- Keep context minimal (<3KB)
- Delete planning debris immediately
- Verify cleanup at every transition
- Monitor for drift in real-time

### Parallel Planning

3 specialized agents explore independently:
- **Spec Agent** - Requirements and acceptance
- **Arch Agent** - Design and API
- **QA Agent** - Tests and risks

Their outputs are merged deterministically (no LLM overhead).

### Proactive Rebasing

Instead of patching messy implementations, detect "messy runs" and regenerate from scratch with improved prompts.

**Indicators:**
- High attempt count (≥3)
- Large context (>2.5KB)
- Long duration (>20 min)
- Error patterns in logs

---

## 📖 Documentation

- **[OpenCode Usage Guide](OPENCODE_USAGE_GUIDE.md)** - Complete reference ⭐
- [Quick Reference](QUICK_REFERENCE.md) - Command cheat sheet
- [Workflow Guide](WORKFLOW_GUIDE.md) - Detailed workflows
- [System Spec](SYSTEM_SPEC.md) - Architecture details
- [V3 Implementation Plan](IMPLEMENTATION_PLAN_FINAL_V3.md) - Technical spec

---

## 🎉 You're Ready!

You now have everything you need to start using Code Crew. Here's your workflow:

```bash
# 1. Create feature request
vim feature.md

# 2. Plan (once per feature)
opencode run plan --context_file=feature.md

# 3. Backlog (once per feature)
opencode run backlog --plan_file=tasks/PLAN.md --track_id=my-feature

# 4. Implement (repeat until done)
opencode run implement --backlog_file=tasks/BACKLOG.yaml

# 5. Rebase if needed
opencode run rebase --backlog_file=tasks/BACKLOG.yaml --task_id=T05
```

**Happy coding!** 🚀

---

## 📺 View Documentation

To view this documentation in a beautiful web interface:

```bash
cd docs
pnpm install  # First time only
pnpm dev
```

Then open http://localhost:5173/

---

*Need help? Check the [OpenCode Usage Guide](OPENCODE_USAGE_GUIDE.md) for detailed information.*
