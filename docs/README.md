# Multi-Agent Coding System Documentation

## 🏆 **V3 FINAL: Production-Ready Implementation**

> **Complete, production-ready implementation with 19 total fixes across V1→V2→V3**

### What's New in V3 (12 additional fixes over V2):
- ✅ **Complete Implementation** - All missing classes now implemented
- ✅ **Error Handling** - Try/finally with proper cleanup
- ✅ **Rate Limiting** - Concurrency control with p-limit
- ✅ **Retry Logic** - Exponential backoff with p-retry
- ✅ **Timeouts** - Configurable timeouts on all async operations
- ✅ **Worktree Management** - Git isolation per task
- ✅ **Graceful Shutdown** - Signal handlers for clean exit
- ✅ **Model Configuration** - Planning uses Gemini free tier explicitly
- ✅ **Shell Wrapper** - Proper Bun shell integration
- ✅ **Missing Classes** - BacklogManager, ModelRouter, WorktreeManager

### V2 Fixes (still included):
- Context Verification Gates, Health Checks, Structured Merge ($0), Proactive Rebasing, Compression Enforced, Session Deletion Verified, Drift Detection

**Timeline:** 6 weeks | **Status:** Production Ready ✅

**👉 Start Here:**
- [🏆 V3 Final Implementation](IMPLEMENTATION_PLAN_FINAL_V3.md) - Complete code, ready to deploy
- [📋 V3 Review](V3_FINAL_REVIEW.md) - Summary of all 19 fixes
- [📊 Comparison Guide](V1_VS_V2_COMPARISON.md) - Understand the evolution

---

## 🚀 Quick Start - View Documentation

**View the documentation in your browser with VitePress:**

```bash
cd docs
npm install  # First time only
npm run dev
```

Then open: **http://localhost:5173**

Or use the startup script:
```bash
cd docs
./start-viewer.sh
```

Features:
- ✨ Beautiful, modern UI with dark mode
- 🔍 Powerful local search
- 📱 Mobile-responsive
- ⚡ Hot module reload
- 🎨 Syntax highlighting

See [GETTING_STARTED.md](./GETTING_STARTED.md) for more options.

---

## Overview

This documentation describes a **cost-optimized, local-first multi-agent coding system** built on OpenCode that implements Fucory's context engineering principles for reliable, scalable code generation.

## Core Philosophy

> **For a fixed model, performance is a function of context quality—because context is the only thing the agent can actually control at inference time.**

This system treats agents as **context transformation functions**, where what you discard is as important as what you produce.

## Key Principles

1. **Context is Everything** - The only control surface we have
2. **Delete Incorrect Context** - Wrong information is toxic, not just unhelpful
3. **Clear Between Tasks** - Cross-task residue degrades performance
4. **Prompt Rebasing > Patching** - The spec is durable, code is disposable
5. **Subagents = Garbage Collectors** - Keep exploration separate from execution
6. **Real Feedback Loops** - Broken instrumentation creates false anchors

## Architecture

```
Conductor (Orchestrator)
├── Planning Subagents (Parallel, Disposable)
│   ├── Product/Spec Agent (Gemini)
│   ├── Architecture Agent (Gemini)
│   └── Risk/QA Agent (Gemini)
├── Worker Agents (Parallel, Task-Scoped)
│   ├── Implementer Agent (ChatGPT-4)
│   ├── Documenter Agent (Gemini)
│   └── Reviewer Agent (ChatGPT-4)
└── Utility Agents (On-Demand)
    ├── Rebase Agent (ChatGPT-4)
    └── Context Compressor Agent (Gemini)
```

## Model Routing Strategy

| Task Type | Model | Cost | Rationale |
|-----------|-------|------|-----------|
| Planning | Gemini (free) | $0 | Read-heavy analysis |
| Documentation | Gemini (free) | $0 | Writing/formatting |
| Code Implementation | ChatGPT-4 | $$$ | Critical quality path |
| Code Review | ChatGPT-4 | $$ | Quality gate |
| Orchestration | ChatGPT-4 | $ | Strong reasoning needed |

**Cost Optimization**: ~80% of token volume goes through free Gemini tier, expensive ChatGPT-4 only for critical code paths.

## Workflow

### Stage 0: Intake
- Generate repo map (cached, reusable)
- Parse feature request
- Create context document

### Stage 1: Parallel Planning
- Spawn 3 planning agents (spec, arch, qa)
- Each explores independently (messy OK)
- Produce clean output documents
- **CRITICAL**: Delete all planning sessions (context garbage collection)
- Merge into unified PLAN.md

### Stage 2: Backlog Generation
- **Start fresh session** (no planning debris)
- Convert PLAN.md → BACKLOG.yaml
- Atomic tasks with clear acceptance criteria
- Explicit dependencies

### Stage 3: Parallel Implementation
- Identify ready tasks (dependencies met)
- Create git worktree per task
- Build minimal task context (<3KB)
- Spawn worker agents (3-8 concurrent)
- Monitor via file-based status updates

### Stage 4: Integration & Review
- Run verification gates (tests, lint, type check)
- Spawn reviewer agent (clean context: diff + acceptance criteria only)
- Merge successful tasks
- For failures: trigger prompt rebase, not patch

## Documentation Structure

### ⭐ [IMPLEMENTATION_PLAN_V2.md](./IMPLEMENTATION_PLAN_V2.md) 🆕 **RECOMMENDED IMPLEMENTATION**
**The fixed, production-ready implementation plan**. Addresses all 7 critical issues from the review.

**Contents**:
- Context verification gates at every transition
- Instrumentation health checks before feedback loops
- Structured planning merge (no LLM overhead)
- Proactive rebasing on messy runs
- Enforced compression rules (<3KB hard limits)
- Session deletion verification (404 checks)
- Context drift detection and monitoring
- Complete code examples with verification
- 6-week timeline (faster than V1)
- Cost analysis and savings

**Read if**: You're building a production system (99% of use cases).

**Supporting Documents**:
- [What Was Fixed in V2](./IMPLEMENTATION_V2_FIXES.md) - Detailed breakdown of all fixes
- [V1 vs V2 Comparison](./V1_VS_V2_COMPARISON.md) - Side-by-side comparison
- [Implementation Review](./IMPLEMENTATION_PLAN_REVIEW.md) - Original issue analysis

---

### 📘 [COMPREHENSIVE_GUIDE.md](./COMPREHENSIVE_GUIDE.md) ⭐ **DESIGN PRINCIPLES**
**The complete master document**. Covers all approaches, principles, workflows, and best practices in one place.

**Contents**:
- Core philosophy & principles
- Complete system architecture
- Context engineering framework
- Full workflow (all stages)
- Agent specifications
- Implementation approaches (all phases)
- Best practices & patterns
- Cost optimization strategies
- Scaling & advanced patterns
- Troubleshooting & debugging

**Read if**: You want everything in one comprehensive document.

---

### 📘 [SYSTEM_SPEC.md](./SYSTEM_SPEC.md)
**The master specification**. Read this first for complete system design, architecture, and philosophy.

**Contents**:
- Core philosophy and context engineering principles
- Component architecture (Conductor, Planning Agents, Workers)
- Workflow stages (Intake → Planning → Backlog → Implementation → Integration)
- OpenCode integration patterns
- Failure modes and mitigations
- Success metrics
- Scaling strategy

**Read if**: You want to understand the complete system design.

---

### 📗 [AGENT_ROLES.md](./AGENT_ROLES.md)
**Detailed agent specifications**. Defines each agent's role, responsibilities, and context requirements.

**Contents**:
- Agent hierarchy and interaction patterns
- Detailed specs for each agent type:
  - Conductor (orchestrator)
  - Planning subagents (spec, arch, qa)
  - Worker agents (implementer, documenter, reviewer)
  - Utility agents (rebase, compressor)
- OpenCode configuration (markdown prompts)
- Context management rules
- Model routing decision tree

**Read if**: You're implementing agent prompts or understanding agent interactions.

---

### 📙 [BACKLOG_SCHEMA.md](./BACKLOG_SCHEMA.md)
**Task definition format**. Complete schema for task backlog and status tracking.

**Contents**:
- File structure (BACKLOG.yaml, task status, notes)
- YAML schemas with examples
- Task sizing guidelines
- Dependency management
- Context compression rules
- Validation rules
- Usage examples

**Read if**: You're creating tasks, managing backlog, or building conductor logic.

---

### 📕 [WORKFLOW_GUIDE.md](./WORKFLOW_GUIDE.md)
**Step-by-step operations**. Concrete instructions for running the system.

**Contents**:
- Prerequisites and setup
- Complete workflow (feature request → deployment)
- Stage-by-stage instructions with commands
- Operational patterns (daily standup, emergency stop, context audit)
- Troubleshooting guide
- Best practices

**Read if**: You're actually running the system or need operational procedures.

---

### 📔 [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
**Phased build plan**. How to build the system from MVP to production.

**Contents**:
- Phase 1: MVP (manual conductor, prove pattern)
- Phase 2: Automation (worker pool, parallel execution)
- Phase 3: Optimization (prompt rebasing, cost reduction)
- Phase 4: Factory Pattern (specs as primary artifacts)
- Timeline (8 weeks total)
- Resource requirements
- Risk mitigation
- Success metrics per phase

**Read if**: You're building the system or planning implementation.

---

### 📔 [IMPLEMENTATION_DRAFT_CLAUDE_ARMY.md](./IMPLEMENTATION_DRAFT_CLAUDE_ARMY.md)
**Concrete implementation plan** based on existing Claude Army codebase.

**Contents**:
- Architecture mapping (Claude Army → Multi-Agent System)
- Current state analysis (what exists, what's missing)
- Gap analysis (critical gaps and nice-to-haves)
- Implementation plan (4 phases with code examples)
- Code changes required (new files, modified files)
- Migration strategy (non-breaking, incremental)
- Testing strategy (unit, integration, manual)

**Read if**: You're adapting Claude Army or have an existing multi-instance system.

---

### 📔 [IMPLEMENTATION_DRAFT_OPENCODE_CONDUCTOR.md](./IMPLEMENTATION_DRAFT_OPENCODE_CONDUCTOR.md)
**Concrete implementation plan** based on existing OpenCode Conductor plugin.

**Contents**:
- Architecture mapping (OpenCode Conductor → Multi-Agent System)
- Current state analysis (what exists, what's missing)
- Gap analysis (critical gaps and nice-to-haves)
- Implementation plan (4 phases with TypeScript code examples)
- Code changes required (new files, modified files)
- Migration strategy (non-breaking, incremental)
- Testing strategy (unit, integration, manual)

**Read if**: You're adapting OpenCode Conductor or building an OpenCode plugin.

---

### 📔 [IMPLEMENTATION_DRAFT_OH_MY_OPENCODE.md](./IMPLEMENTATION_DRAFT_OH_MY_OPENCODE.md)
**Concrete implementation plan** based on existing Oh My OpenCode plugin.

**Contents**:
- Architecture mapping (Oh My OpenCode → Multi-Agent System)
- Current state analysis (what exists, what's missing)
- Gap analysis (critical gaps and nice-to-haves)
- Implementation plan (4 phases with TypeScript code examples)
- Code changes required (new files, modified files)
- Migration strategy (non-breaking, incremental)
- Testing strategy (unit, integration, manual)

**Read if**: You're adapting Oh My OpenCode or have an existing multi-agent plugin.

**Key Advantage**: Oh My OpenCode already has BackgroundManager, model routing, and agent system - we're adding structure, not building from scratch!

---

## Quick Start

### 1. Prerequisites

```bash
# Install OpenCode
npm install -g @opencode-ai/cli

# Set up API keys
export OPENAI_API_KEY="your-openai-key"
export GOOGLE_AI_API_KEY="your-google-key"

# Configure OpenCode
mkdir -p ~/.config/opencode
cp docs/opencode.example.json ~/.config/opencode/opencode.json
```

### 2. Create Agent Prompts

```bash
# Copy agent prompt templates
mkdir -p .opencode/agent
cp docs/agent-prompts/* .opencode/agent/
```

### 3. Run MVP

```bash
# Generate repo map (one-time)
./scripts/generate-repo-map.sh

# Create feature request
cat > feature-request.md << 'EOF'
# Feature: Add User Authentication

## Requirements
- JWT-based authentication
- Login/logout endpoints
- Protected routes

## Constraints
- Use existing user model
- Follow REST conventions
EOF

# Run conductor (MVP)
cd conductor
pnpm install
pnpm run mvp feature-request.md
```

### 4. Monitor Progress

```bash
# Watch task status
./scripts/monitor-tasks.sh

# Check logs
tail -f logs/T01.log
```

## Key Files

### Configuration
- `.opencode/opencode.json` - OpenCode configuration
- `.opencode/agent/*.md` - Agent prompts

### Generated (Per-Project)
- `tasks/BACKLOG.yaml` - Master task list
- `tasks/T01.yaml` - Individual task definitions
- `tasks/T01.status.json` - Task status (machine-readable)
- `tasks/T01.notes.md` - Task notes (human-readable)
- `worktrees/T01/` - Isolated workspace per task

### Scripts
- `scripts/generate-repo-map.sh` - Generate repo context
- `scripts/spawn-worker.sh` - Spawn worker for task
- `scripts/monitor-tasks.sh` - Monitor task progress
- `scripts/validate-backlog.py` - Validate task dependencies

## Context Management Rules

### ✅ Always Do
- Create fresh session per task
- Delete planning sessions after merging outputs
- Clear context between major phases
- Compress context aggressively (<3KB per task)
- Use file paths + line ranges (not full files)
- Distill failures to negative evidence

### ❌ Never Do
- Reuse sessions across tasks
- Carry planning debris into implementation
- Include full file contents in context
- Accumulate tool outputs indefinitely
- Patch messy implementations (rebase instead)
- Mix contexts from different tasks

## Success Metrics

### Context Quality
- Implementation context size: <3KB ✓
- Planning context in implementation: 0% ✓
- Session reuse count: 0 ✓

### Performance
- First-attempt success rate: >70% ✓
- Tasks running in parallel: 3-8 ✓
- Time to complete feature: <1 hour ✓

### Cost
- Planning cost: ~10% (Gemini free tier) ✓
- Implementation cost: ~80% (ChatGPT-4) ✓
- Rework cost: <10% (prompt rebasing) ✓

## Common Patterns

### Pattern 1: Parallel Planning
```typescript
// Spawn 3 planning agents in parallel
const planners = await Promise.all([
  spawnAgent('planner-spec'),
  spawnAgent('planner-arch'),
  spawnAgent('planner-qa')
])

// Collect outputs
const specs = await collectOutputs(planners)

// CRITICAL: Delete sessions (context garbage collection)
await Promise.all(planners.map(deleteSession))
```

### Pattern 2: Clean Task Context
```typescript
// Build minimal context for task
const context = {
  spec: task.description,
  acceptance: task.acceptance,
  patterns: extractPatterns(task.scope.files_hint),  // Snippets only
  constraints: task.context.constraints
}

// Inject into fresh session
await session.prompt({
  noReply: true,  // Context only
  parts: [{ type: 'text', text: buildContext(context) }]
})
```

### Pattern 3: Prompt Rebasing
```typescript
// Task failed multiple times
if (task.attempts > 2) {
  // Analyze failure
  const analysis = await rebaseAgent.analyze(task, failures)
  
  // Update spec with learnings
  await updateTaskSpec(task.id, analysis.improvedSpec)
  
  // Clear all context
  await cleanupWorktree(task.id)
  
  // Retry with fresh agent + improved spec
  await spawnWorker(task.id)
}
```

## Troubleshooting

### Task Stuck in "in_progress"
```bash
# Check logs
tail -f logs/T01.log

# Kill and restart
kill $(cat pids/T01.pid)
./scripts/spawn-worker.sh T01
```

### Context Too Large
```bash
# Check size
cat tasks/T01.yaml | yq -r '.context | to_yaml' | wc -c

# Compress
opencode run --agent compressor < tasks/T01.yaml > tasks/T01.compressed.yaml
```

### Tests Failing Repeatedly
```bash
# Trigger rebase (don't patch)
opencode run --agent rebase << EOF
Task: $(cat tasks/T01.yaml)
Failures: $(cat worktrees/T01/test-output.txt)
EOF

# Update spec and retry
```

## Cost Estimates

### Development (per feature)
- Planning (3 agents, Gemini): $0 (free tier)
- Backlog generation (GPT-4): ~$0.05
- Implementation (3-5 tasks, GPT-4): ~$0.50-1.00
- Review (GPT-4): ~$0.10
**Total: ~$0.65-1.15 per feature**

### Production (at scale)
- 10 features/week: ~$6.50-11.50/week
- 40 features/month: ~$26-46/month

**Cost optimization**: 80% of tokens through free Gemini tier.

## Next Steps

### For Production Implementation (Recommended)

1. **Read [IMPLEMENTATION_PLAN_V2.md](./IMPLEMENTATION_PLAN_V2.md)** - The fixed, verified plan
2. **Read [WHAT WAS FIXED](./IMPLEMENTATION_V2_FIXES.md)** - Understand the improvements
3. **Read [V1 vs V2 Comparison](./V1_VS_V2_COMPARISON.md)** - See why V2 is better
4. **Build Phase 1** - Foundation with verification gates (Week 1-2)
5. **Build Phase 2** - Backlog with health checks (Week 2-3)
6. **Build Phase 3** - Context engineering with monitoring (Week 3-4)
7. **Build Phase 4** - Proactive rebasing & factory pattern (Week 4-6)

### For Learning & Understanding

1. **Read [COMPREHENSIVE_GUIDE.md](./COMPREHENSIVE_GUIDE.md)** - Core principles and design
2. **Read [SYSTEM_SPEC.md](./SYSTEM_SPEC.md)** - Complete system architecture
3. **Read [WORKFLOW_GUIDE.md](./WORKFLOW_GUIDE.md)** - Operational procedures
4. **Read [IMPLEMENTATION_PLAN_REVIEW.md](./IMPLEMENTATION_PLAN_REVIEW.md)** - Learn from issues

## References

### Internal Documentation

**Implementation (V2 - Recommended)**
- [IMPLEMENTATION_PLAN_V2.md](./IMPLEMENTATION_PLAN_V2.md) - ⭐ Fixed, verified plan
- [IMPLEMENTATION_V2_FIXES.md](./IMPLEMENTATION_V2_FIXES.md) - What was fixed
- [V1_VS_V2_COMPARISON.md](./V1_VS_V2_COMPARISON.md) - Side-by-side comparison
- [IMPLEMENTATION_PLAN_REVIEW.md](./IMPLEMENTATION_PLAN_REVIEW.md) - Issue analysis

**Core Documentation**
- [COMPREHENSIVE_GUIDE.md](./COMPREHENSIVE_GUIDE.md) - Complete principles and design
- [SYSTEM_SPEC.md](./SYSTEM_SPEC.md) - System architecture
- [AGENT_ROLES.md](./AGENT_ROLES.md) - Agent specifications
- [BACKLOG_SCHEMA.md](./BACKLOG_SCHEMA.md) - Task format
- [WORKFLOW_GUIDE.md](./WORKFLOW_GUIDE.md) - Operations guide

**Legacy Implementation (V1 - Reference Only)**
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Original plan
- [IMPLEMENTATION_PLAN_FINAL.md](./IMPLEMENTATION_PLAN_FINAL.md) - V1 synthesis
- [IMPLEMENTATION_PLAN_SUMMARY.md](./IMPLEMENTATION_PLAN_SUMMARY.md) - V1 summary

### External Resources
- [OpenCode Documentation](https://opencode.ai/docs)
- [OpenCode SDK](https://opencode.ai/docs/sdk)
- [OpenCode Plugins](https://opencode.ai/docs/plugins)
- [Fucory Guidelines](../llm-txt/guidelines/fucory-guidelines.txt) - Context engineering principles

## Contributing

This is a living system. As you use it:

1. **Track what works** - Document successful patterns
2. **Track what fails** - Understand failure modes
3. **Improve prompts** - Iterate based on results
4. **Share learnings** - Update documentation

The goal: build a **prompt library** of proven patterns that reliably produce high-quality code.

## License

[Your license here]

## Support

- **Issues**: [GitHub Issues]
- **Discussions**: [GitHub Discussions]
- **Discord**: [Your Discord]

---

**Remember**: The prompt/spec is the durable artifact. Code is rebuildable output. When something goes wrong, improve the prompt and regenerate—don't patch the mess.

Good luck! 🚀

