# Code Crew - OpenCode Plugin

> Your multi-agent coding crew with context engineering and verified feedback loops

[![OpenCode Plugin](https://img.shields.io/badge/OpenCode-Plugin-blue)](https://opencode.ai)
[![Version](https://img.shields.io/badge/version-1.0.0-green)](https://github.com/yourusername/opencode-code-crew)

## 🎯 Overview

**Code Crew** is a production-ready OpenCode plugin that assembles a team of specialized AI agents to build your features. Built on the principles of **context quality = output quality**, your coding crew uses parallel planning, atomic task decomposition, and strict context verification to deliver reliable code generation.

Think of it as hiring a team of expert developers who work in parallel, verify each other's work, and never pollute their context.

## ✨ Key Features

- **✅ Parallel Planning** - 3 agents (Spec, Arch, QA) run in parallel using Gemini free tier
- **✅ Structured Merge** - Deterministic planning output merge ($0 cost, no LLM)
- **✅ Context Verification Gates** - Enforced checks at every phase transition
- **✅ Health Checks** - Verify test runner, linter, type checker before feedback loops
- **✅ Proactive Rebasing** - Detect messy runs and recommend prompt improvements
- **✅ Git Worktree Isolation** - Parallel task execution without file conflicts
- **✅ Context Compression** - Strict <3KB limit with validation
- **✅ Model Routing** - Smart model selection based on task characteristics
- **✅ Drift Detection** - Real-time context pollution monitoring
- **✅ Graceful Shutdown** - Clean resource cleanup on exit

## 📦 Installation

```bash
# Install dependencies
pnpm install

# Build the plugin
pnpm build

# The plugin is now ready in ./dist
```

## 🚀 Usage

### 1. Planning Phase

Generate a comprehensive implementation plan using 3 parallel agents:

```bash
opencode run plan --context_file=feature-request.md --output_dir=tasks
```

**Output:**
- `tasks/SPEC.md` - Requirements and acceptance criteria
- `tasks/ARCH.md` - Architecture and API design
- `tasks/QA.md` - Test plan and risks
- `tasks/PLAN.md` - Unified plan (structured merge)

**Cost:** ~$0 (uses Gemini free tier)  
**Time:** ~5-10 minutes

### 2. Backlog Generation

Break down the plan into atomic, independent tasks:

```bash
opencode run backlog --plan_file=tasks/PLAN.md --track_id=my-feature
```

**Output:**
- `tasks/BACKLOG.yaml` - Structured task backlog with dependencies

**Format:**
```yaml
version: "1.0"
track_id: "my-feature"
tasks:
  - id: "T01"
    title: "Setup database schema"
    description: "Create tables for user management"
    status: "pending"
    depends_on: []
    acceptance:
      - "Tables created with correct schema"
      - "Migrations run successfully"
    attempts: 0
    scope:
      files_hint:
        - "src/db/schema.ts"
      estimated_hours: 2
```

### 3. Implementation

Execute tasks in parallel with verification:

```bash
opencode run implement --backlog_file=tasks/BACKLOG.yaml
```

**Features:**
- Health checks before starting
- Parallel execution (up to 3 workers)
- Git worktree isolation
- Context verification at each step
- Automatic drift detection
- Rebase recommendations for messy runs

**Output:**
```
🏥 Running instrumentation health checks...
✓ All instrumentation healthy

📋 Processing 3 tasks in parallel...

🚀 Starting task T01: Setup database schema
✓ Task T01 completed in 45.2s

🚀 Starting task T02: Implement user service
✓ Task T02 completed in 67.8s

🚀 Starting task T03: Add authentication
✓ Task T03 completed in 89.1s

=== Implementation Summary ===
Total: 10
Completed: 3
In Progress: 0
Failed: 0
Pending: 7
```

### 4. Rebase (Optional)

Analyze and improve failed or messy tasks:

```bash
opencode run rebase --backlog_file=tasks/BACKLOG.yaml --task_id=T05
```

### 5. Spec History

View version history for a task:

```bash
opencode run spec-history --task_id=T01
```

## 🏗️ Architecture

```
src/
├── core/                   # Core utilities
│   ├── retry.ts           # Exponential backoff
│   ├── rateLimit.ts       # Concurrency control
│   ├── shell.ts           # Shell command wrapper
│   └── gracefulShutdown.ts # Cleanup handlers
├── verification/          # Verification layer
│   ├── contextVerifier.ts # Context hygiene checks
│   └── instrumentationChecker.ts # Health checks
├── planning/              # Planning phase
│   ├── planningAgents.ts  # Agent spawning
│   ├── structuredMerge.ts # Deterministic merge
│   └── planningPhase.ts   # Orchestration
├── backlog/               # Backlog management
│   ├── backlogGenerator.ts # LLM-based generation
│   ├── backlogManager.ts  # State management
│   └── contextCompressor.ts # <3KB compression
├── implementation/        # Implementation phase
│   ├── modelRouter.ts     # Model selection
│   ├── worktreeManager.ts # Git worktrees
│   └── implementCommand.ts # Orchestration
├── monitoring/            # Monitoring
│   └── contextDriftDetector.ts # Drift detection
├── rebasing/              # Rebasing
│   └── rebaseEngine.ts    # Rebase analysis
├── factory/               # Spec repository
│   └── specRepository.ts  # Version control
└── index.ts               # Plugin entry point
```

## 🔧 Configuration

Edit `src/config.ts` to customize:

```typescript
export const CONFIG = {
  // Context limits
  maxContextSize: 3000,           // 3KB hard limit
  maxPlanningKeywords: 0,         // Zero tolerance
  
  // Timeouts
  planningTimeoutMs: 10 * 60 * 1000,  // 10 minutes
  implementationTimeoutMs: 30 * 60 * 1000, // 30 minutes
  
  // Concurrency
  maxPlanningAgents: 3,           // Always 3
  maxWorkers: 3,                  // Parallel workers
  
  // Models
  models: {
    planning: {
      provider: "google",
      model: "gemini-2.0-flash-exp",
      costPerToken: 0,  // Free tier
    },
    implementation: {
      provider: "openai",
      model: "gpt-4",
      costPerToken: 0.00003,
    },
    // ... more models
  },
};
```

## 📊 Cost Optimization

| Phase | Model | Cost | Notes |
|-------|-------|------|-------|
| **Planning** | Gemini 2.0 Flash | $0 | Free tier, 3 agents parallel |
| **Backlog** | GPT-4 | ~$0.10 | One-time per feature |
| **Simple Tasks** | Gemini 2.0 Flash | $0 | Auto-routed |
| **Complex Tasks** | GPT-4 | ~$0.50 | Per task |
| **Documentation** | Gemini 2.0 Flash | $0 | Auto-routed |

**Typical Feature Cost:** $2-5 (vs $20-50 without optimization)

## 🛡️ Verification Gates

Every phase transition includes:

1. **Size Check** - Context must be <3KB
2. **Planning Debris** - Zero tolerance for exploration keywords
3. **Cross-Task Contamination** - Each session = 1 task only
4. **Full File Contents** - Only paths and line ranges allowed

**If any check fails:** Process stops immediately with clear error message.

## 🔄 Workflow Example

```bash
# 1. Create feature request
cat > feature.md << 'EOF'
# User Authentication Feature

Add JWT-based authentication to the API.

Requirements:
- User registration with email/password
- Login with JWT token generation
- Protected routes with middleware
- Password hashing with bcrypt
EOF

# 2. Run planning
opencode run plan --context_file=feature.md

# 3. Generate backlog
opencode run backlog --plan_file=tasks/PLAN.md --track_id=auth-feature

# 4. Implement
opencode run implement --backlog_file=tasks/BACKLOG.yaml

# 5. Check results
git log --oneline -10
```

## 🧪 Development

```bash
# Watch mode
pnpm dev

# Type check
pnpm typecheck

# Format code
pnpm format

# Clean build
pnpm clean && pnpm build
```

## 📚 Documentation

### Getting Started
- **[OpenCode Usage Guide](docs/OPENCODE_USAGE_GUIDE.md)** - Complete guide to using the plugin ⭐
- [Quick Start](docs/GETTING_STARTED.md) - Get up and running quickly
- [Quick Reference](docs/QUICK_REFERENCE.md) - Command cheat sheet

### Technical Documentation
- [V3 Implementation Plan](docs/IMPLEMENTATION_PLAN_FINAL_V3.md) - Complete technical spec
- [V3 Review](docs/V3_FINAL_REVIEW.md) - All fixes and improvements
- [Build Plan](docs/BUILD_PLAN.md) - Step-by-step build guide
- [Comprehensive Guide](docs/COMPREHENSIVE_GUIDE.md) - Context engineering principles

## 🎓 Key Concepts

### Context Engineering

> **Context Quality = Output Quality**

- Keep context minimal and focused
- Delete planning debris immediately
- Verify cleanup at every transition
- Compress task context to <3KB
- Monitor for drift in real-time

### Proactive Rebasing

Instead of patching messy implementations, detect "messy runs" and regenerate from scratch with improved prompts.

**Indicators:**
- High attempt count (≥3)
- Large context (>2.5KB)
- Long duration (>20 min)
- Many commits (>10)
- Error patterns in logs

### Parallel Planning

3 specialized agents explore independently:
- **Spec Agent** - Requirements and acceptance
- **Arch Agent** - Design and API
- **QA Agent** - Tests and risks

Their outputs are merged deterministically (no LLM overhead).

## 🚨 Troubleshooting

### Build Errors

```bash
# Clean and rebuild
rm -rf dist node_modules
pnpm install
pnpm build
```

### Context Too Large

Edit task in `BACKLOG.yaml` to reduce:
- Description length
- Number of acceptance criteria
- Pattern examples

### Session Not Deleted

Check logs for verification errors. The system enforces deletion with 404 checks.

### Worktree Conflicts

```bash
# Clean up manually
git worktree list
git worktree remove worktrees/T01 --force
```

## 📝 License

MIT

## 🤝 Contributing

This is a workshop project demonstrating advanced multi-agent patterns. Feel free to fork and adapt!

## 🙏 Credits

Built following the "Hill Climbing Context" philosophy from the Fucory Guidelines.

---

**Ready to build?** Start with `opencode run plan --context_file=your-feature.md` 🚀

