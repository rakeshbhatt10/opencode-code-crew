# Quick Reference Guide

## System at a Glance

### Core Principle
> **Context quality determines output quality.**  
> For a fixed model, the only control surface is the context window.

### Three Context Moves
1. **Delete incorrect context** (toxic, not just unhelpful)
2. **Add missing context** (via tools with real feedback)
3. **Remove useless context** (noise and cross-task pollution)

### Key Pattern: Subagents as Garbage Collectors
```
Subagent: Explore (messy) → Produce (clean) → Delete (context discarded)
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CONDUCTOR (GPT-4)                        │
│  • Orchestrates all phases                                  │
│  • Enforces context hygiene                                 │
│  • Never carries planning debris into implementation        │
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
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                    ┌──────────────┐
                    │ REVIEW AGENT │
                    │   (GPT-4)    │
                    │              │
                    │ Diff + Acc.  │
                    │ Criteria ONLY│
                    └──────────────┘
                            │
                    ┌───────┴───────┐
                    ▼               ▼
            ┌──────────┐    ┌──────────┐
            │ APPROVE  │    │  REBASE  │
            │  Merge   │    │  Improve │
            │          │    │  Spec &  │
            │          │    │  Retry   │
            └──────────┘    └──────────┘
```

---

## Workflow Summary

### Stage 0: Intake (5 min)
```bash
# Generate repo map (cached)
./scripts/generate-repo-map.sh

# Create feature request
cat > feature-request.md << 'EOF'
# Feature: [Name]
## Requirements: ...
## Constraints: ...
EOF
```

### Stage 1: Planning (10-15 min)
```bash
# Spawn 3 agents in parallel (Gemini - FREE)
opencode run --agent planner-spec --input context.md --output SPEC.md &
opencode run --agent planner-arch --input context.md --output ARCH.md &
opencode run --agent planner-qa --input context.md --output QA.md &
wait

# Merge into PLAN.md
# DELETE planning sessions ← CRITICAL
```

### Stage 2: Backlog (5 min)
```bash
# Fresh session (GPT-4)
opencode run --agent conductor << 'EOF'
Read PLAN.md and generate BACKLOG.yaml with atomic tasks.
EOF

# Validate
python scripts/validate-backlog.py tasks/BACKLOG.yaml
```

### Stage 3: Implementation (20-40 min)
```bash
# Spawn workers for ready tasks (parallel)
for task_id in $(python scripts/get-ready-tasks.py); do
    scripts/spawn-worker.sh $task_id
done

# Monitor
scripts/monitor-tasks.sh
```

### Stage 4: Integration (5-10 min)
```bash
# For each completed task
scripts/handle-completion.sh T01

# Review (GPT-4, clean context)
opencode run --agent reviewer [diff + acceptance]

# Merge or rebase
```

**Total Time**: ~45-70 minutes per feature  
**Total Cost**: ~$0.60-1.15 per feature

---

## Model Routing Cheat Sheet

| Task | Model | Cost | Why |
|------|-------|------|-----|
| **Planning** | Gemini | FREE | Read-heavy, high volume |
| **Exploration** | Gemini | FREE | Grepping, searching |
| **Documentation** | Gemini | FREE | Writing, formatting |
| **Simple changes** | Gemini | FREE | Low-risk edits |
| **Code implementation** | GPT-4 | $$$ | Critical quality path |
| **Code review** | GPT-4 | $$ | Quality gate |
| **Orchestration** | GPT-4 | $ | Strong reasoning |
| **Rebase analysis** | GPT-4 | $ | Improve specs |

**Rule of thumb**: If it doesn't change production code, use Gemini.

---

## Context Management Checklist

### ✅ Always Do
- [ ] Fresh session per task
- [ ] Delete planning sessions after merge
- [ ] Clear context between phases
- [ ] Compress to <3KB per task
- [ ] Use file paths (not full contents)
- [ ] Distill failures to negative evidence

### ❌ Never Do
- [ ] ~~Reuse sessions across tasks~~
- [ ] ~~Carry planning debris into implementation~~
- [ ] ~~Include full file contents~~
- [ ] ~~Accumulate tool outputs~~
- [ ] ~~Patch messy implementations~~
- [ ] ~~Mix contexts from different tasks~~

---

## File Structure

```
code-agents-workshop/
├── docs/                           # ← You are here
│   ├── README.md                   # Start here
│   ├── SYSTEM_SPEC.md              # Complete design
│   ├── AGENT_ROLES.md              # Agent specs
│   ├── BACKLOG_SCHEMA.md           # Task format
│   ├── WORKFLOW_GUIDE.md           # Operations
│   ├── IMPLEMENTATION_PLAN.md      # Build plan
│   ├── SUMMARY.md                  # Overview
│   └── QUICK_REFERENCE.md          # This file
│
├── .opencode/                      # OpenCode config
│   ├── opencode.json               # Model routing
│   ├── agent/                      # Agent prompts
│   │   ├── conductor.md
│   │   ├── planner-spec.md
│   │   ├── planner-arch.md
│   │   ├── planner-qa.md
│   │   ├── implementer.md
│   │   ├── documenter.md
│   │   └── reviewer.md
│   └── plugin/                     # Plugins
│       └── context-compressor.ts
│
├── conductor/                      # Orchestrator (to build)
│   ├── src/
│   │   ├── mvp-conductor.ts        # Phase 1: MVP
│   │   ├── orchestrator.ts         # Phase 2: Automation
│   │   ├── worker-pool.ts
│   │   ├── rebase-engine.ts        # Phase 3: Optimization
│   │   └── regenerator.ts          # Phase 4: Factory
│   └── package.json
│
├── tasks/                          # Generated per-project
│   ├── BACKLOG.yaml                # Master task list
│   ├── T01.yaml                    # Task definition
│   ├── T01.status.json             # Status (machine)
│   └── T01.notes.md                # Notes (human)
│
├── worktrees/                      # Generated per-project
│   ├── T01/                        # Isolated workspace
│   └── T02/
│
└── scripts/                        # Utilities
    ├── generate-repo-map.sh
    ├── spawn-worker.sh
    ├── monitor-tasks.sh
    ├── handle-completion.sh
    ├── validate-backlog.py
    └── get-ready-tasks.py
```

---

## Commands Cheat Sheet

### Setup
```bash
# Install
npm install -g @opencode-ai/cli

# Configure
export OPENAI_API_KEY="sk-..."
export GOOGLE_AI_API_KEY="..."
```

### Generate Repo Map (One-Time)
```bash
./scripts/generate-repo-map.sh
```

### Run Feature (MVP)
```bash
cd conductor
pnpm run mvp feature-request.md
```

### Monitor Tasks
```bash
./scripts/monitor-tasks.sh
```

### Spawn Worker
```bash
./scripts/spawn-worker.sh T01
```

### Validate Backlog
```bash
python scripts/validate-backlog.py tasks/BACKLOG.yaml
```

### Check Context Sizes
```bash
# Task context
cat tasks/T01.yaml | yq -r '.context | to_yaml' | wc -c

# Should be <3KB (3000 bytes)
```

### Emergency Stop
```bash
# Kill all workers
for pid_file in pids/*.pid; do
    kill $(cat $pid_file) 2>/dev/null || true
done
```

---

## Troubleshooting Quick Fixes

### Task Stuck
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
opencode run --agent compressor < tasks/T01.yaml
```

### Tests Failing Repeatedly
```bash
# Don't patch - rebase!
opencode run --agent rebase [provide context]
# Update spec, retry fresh
```

### Circular Dependencies
```bash
# Validate
python scripts/validate-backlog.py tasks/BACKLOG.yaml

# Fix manually in BACKLOG.yaml
```

---

## Cost Calculator

### Per Feature
- Planning (3 agents, Gemini): **$0** (free tier)
- Backlog (GPT-4): **~$0.05**
- Implementation (3 tasks, GPT-4): **~$0.50**
- Review (GPT-4): **~$0.10**
- **Total: ~$0.65 per feature**

### Monthly (40 features)
- **~$26/month**

### Without Model Routing
- **~$72/month** (all GPT-4)
- **Savings: 64%**

---

## Success Metrics

### Context Quality (Primary)
- Implementation context: **<3KB** ✓
- Planning in implementation: **0%** ✓
- Session reuse: **0** ✓

### Performance
- First-attempt success: **>70%** ✓
- Parallel tasks: **3-8** ✓
- Feature time: **<1 hour** ✓

### Cost
- Per-feature: **~$0.65** ✓
- Planning: **$0** (free) ✓
- Rework: **<10%** ✓

---

## Key Patterns

### Pattern 1: Parallel Planning
```typescript
// Spawn in parallel
const planners = await Promise.all([
  spawnAgent('planner-spec'),
  spawnAgent('planner-arch'),
  spawnAgent('planner-qa')
])

// Collect outputs
const specs = await collectOutputs(planners)

// CRITICAL: Delete sessions
await Promise.all(planners.map(deleteSession))
```

### Pattern 2: Clean Task Context
```typescript
// Minimal context only
const context = {
  spec: task.description,
  acceptance: task.acceptance,
  patterns: extractSnippets(task.files_hint),  // 5-10 lines
  constraints: task.constraints
}

// Fresh session
await session.prompt({
  noReply: true,
  parts: [{ type: 'text', text: buildContext(context) }]
})
```

### Pattern 3: Prompt Rebasing
```typescript
// Task failed multiple times
if (task.attempts > 2) {
  // Analyze and improve spec
  const improved = await rebaseAgent.analyze(task)
  
  // Update spec
  await updateTaskSpec(task.id, improved)
  
  // Clear context, retry fresh
  await cleanupWorktree(task.id)
  await spawnWorker(task.id)
}
```

---

## Documentation Map

| When You Need... | Read This |
|------------------|-----------|
| **Overview** | [README.md](./README.md) |
| **Complete design** | [SYSTEM_SPEC.md](./SYSTEM_SPEC.md) |
| **Agent details** | [AGENT_ROLES.md](./AGENT_ROLES.md) |
| **Task format** | [BACKLOG_SCHEMA.md](./BACKLOG_SCHEMA.md) |
| **How to operate** | [WORKFLOW_GUIDE.md](./WORKFLOW_GUIDE.md) |
| **How to build** | [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) |
| **High-level summary** | [SUMMARY.md](./SUMMARY.md) |
| **Quick reference** | [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) (this file) |

---

## Implementation Phases

### Phase 1: MVP (Week 1-2)
**Goal**: Prove pattern works  
**Deliverable**: Complete 1 feature end-to-end  
**Effort**: 16 hours

### Phase 2: Automation (Week 3-4)
**Goal**: Remove human bottlenecks  
**Deliverable**: 3 parallel tasks, <1 hour  
**Effort**: 36 hours

### Phase 3: Optimization (Week 5-6)
**Goal**: Cost and quality improvements  
**Deliverable**: 50% cost reduction, >70% success  
**Effort**: 40 hours

### Phase 4: Factory Pattern (Week 7-8)
**Goal**: Specs as primary artifacts  
**Deliverable**: Rebuild codebase in <1 hour  
**Effort**: 48 hours

**Total: 8 weeks (140 hours)**

---

## Next Steps

### This Week
1. ✅ Read [SYSTEM_SPEC.md](./SYSTEM_SPEC.md)
2. ✅ Set up environment (OpenCode, API keys)
3. ✅ Create agent prompts (copy from [AGENT_ROLES.md](./AGENT_ROLES.md))
4. ⏳ Build MVP conductor

### Next Week
1. ⏳ Test with simple feature
2. ⏳ Measure context sizes
3. ⏳ Iterate on prompts
4. ⏳ Document learnings

### Month 2
1. ⏳ Build Phase 2 (Automation)
2. ⏳ Scale to 3 parallel tasks
3. ⏳ Add metrics tracking

---

## Remember

> **The prompt/spec is the durable artifact. Code is rebuildable output.**

When something goes wrong:
1. Don't patch the code
2. Improve the prompt/spec
3. Clear all context
4. Regenerate cleanly

This is **cheaper** and produces **better results** than incremental patching.

---

## Support

- **Documentation**: `/docs` (you are here)
- **Issues**: Track in GitHub Issues
- **Questions**: Check [WORKFLOW_GUIDE.md](./WORKFLOW_GUIDE.md) troubleshooting section

---

**Ready to start?** → Read [README.md](./README.md) then [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)

**Need details?** → Read [SYSTEM_SPEC.md](./SYSTEM_SPEC.md) then [AGENT_ROLES.md](./AGENT_ROLES.md)

**Ready to operate?** → Read [WORKFLOW_GUIDE.md](./WORKFLOW_GUIDE.md)

Good luck! 🚀

