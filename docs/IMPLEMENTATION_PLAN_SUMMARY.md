# Implementation Plan Summary

> **Quick Reference: Key Decisions & Approach**

---

## 🎯 Core Approach

**Create a new OpenCode plugin** (`multi-agent-coder`) that combines:
- ✅ **OpenCode Conductor's** plugin architecture & structured workflow
- ✅ **Oh My OpenCode's** background task system & model routing
- ✅ **Claude Army's** worktree isolation concepts
- ✅ **Comprehensive Guide's** context engineering principles

---

## 🏗️ Architecture Decisions

### Plugin Structure
- **Type**: OpenCode Plugin (like `opencode-conductor-plugin`)
- **Entry Point**: `src/index.ts` exports plugin with tools
- **Commands**: `/ma-planning-phase`, `/ma-backlog`, `/ma-implement`, `/ma-status`
- **Agents**: Conductor, Planner-Spec, Planner-Arch, Planner-QA, Implementer, Rebase

### Model Routing Strategy

| Phase | Model | Why |
|-------|-------|-----|
| Planning (3 agents) | Gemini Flash | Free tier, read-heavy |
| Backlog Generation | GPT-4 | Strong decomposition needed |
| Implementation (>4h) | GPT-4 | Critical quality path |
| Implementation (<4h) | Gemini Flash | Simple changes |
| Documentation | Gemini Flash | Free tier |

**Cost Savings**: ~64% vs all GPT-4

### Context Engineering

**Key Rules**:
1. **Planning sessions are disposable** - Delete after merge
2. **Task contexts <3KB** - Compress aggressively
3. **Fresh session per task** - Never reuse sessions
4. **No planning debris** - Implementation starts clean

---

## 📋 Implementation Phases

### Phase 1: Foundation & Planning (Week 1-2)
- ✅ Plugin scaffolding
- ✅ Planning agents (Spec, Arch, QA)
- ✅ Planning phase tool (parallel execution)
- ✅ Session lifecycle tracking

**Deliverable**: Working planning phase with 3 parallel agents

### Phase 2: Backlog System (Week 2-3)
- ✅ Backlog generator (from PLAN.md)
- ✅ Backlog manager (state management)
- ✅ Dependency resolution
- ✅ Task status tracking

**Deliverable**: YAML-based backlog with atomic tasks

### Phase 3: Context Engineering (Week 3-4)
- ✅ Context compressor (<3KB target)
- ✅ Session lifecycle manager
- ✅ Context hygiene enforcement
- ✅ Rebase agent

**Deliverable**: Clean context handoffs between phases

### Phase 4: Implementation Orchestration (Week 4-5)
- ✅ Implementation command
- ✅ Worker spawning from backlog
- ✅ Model routing integration
- ✅ Parallel execution

**Deliverable**: End-to-end workflow (planning → backlog → implementation)

---

## 🔑 Key Features

### 1. Parallel Planning Subagents
- **3 agents run simultaneously** (Spec, Arch, QA)
- **Gemini Flash** (free tier)
- **Context garbage collection** (sessions deleted after merge)
- **Clean outputs only** (no exploration debris)

### 2. Backlog System
- **YAML format** (machine-readable)
- **Atomic tasks** (2-4 hours each)
- **Dependency tracking** (prevents circular deps)
- **Status management** (pending → ready → in_progress → completed)

### 3. Context Engineering
- **Compression** (<3KB per task)
- **Session lifecycle** (planning sessions deleted)
- **Clean handoffs** (no cross-phase pollution)
- **Negative evidence** (distilled failures)

### 4. Model Routing
- **Cost optimization** (free tier for planning)
- **Quality gates** (GPT-4 for critical paths)
- **Automatic selection** (based on task type/complexity)

---

## 📊 Success Metrics

### Context Quality
- Planning context in implementation: **0%** ✓
- Task context size: **<3KB** ✓
- Session reuse: **0** ✓

### Workflow
- Planning phase: **3 agents parallel, 10-15 min** ✓
- Backlog generation: **<5 min** ✓
- Task spawning: **From backlog** ✓

### Cost
- Planning cost: **$0** (Gemini free tier) ✓
- Total cost reduction: **~64%** vs all GPT-4 ✓

---

## 🚀 Quick Start

### Installation

```json
// ~/.config/opencode/opencode.json
{
  "plugin": ["multi-agent-coder"],
  "agent": {
    "conductor": { "model": "openai/gpt-4" },
    "planner-spec": { "model": "google/gemini-2.0-flash-exp" },
    "planner-arch": { "model": "google/gemini-2.0-flash-exp" },
    "planner-qa": { "model": "google/gemini-2.0-flash-exp" }
  }
}
```

### Usage

```bash
# 1. Planning phase
/ma-planning-phase context_file=feature-request.md output_dir=.planning

# 2. Generate backlog
/ma-backlog plan_file=.planning/PLAN.md output_file=backlog.yaml track_id=feature-001

# 3. Implement tasks
/ma-implement backlog_file=backlog.yaml max_workers=3

# 4. Check status
/ma-status backlog_file=backlog.yaml
```

---

## 📁 File Structure

```
multi-agent-coder/
├── src/
│   ├── index.ts              # Plugin entry
│   ├── commands/             # Tool commands
│   ├── agents/               # Agent definitions
│   ├── utils/                # Utilities (backlog, context, routing)
│   ├── tools/                # Tool implementations
│   └── prompts/              # Agent prompts & templates
└── tests/                    # Test suite
```

---

## 🔄 Workflow

```
1. Planning Phase (Parallel)
   ├─ Spec Agent → SPEC.md
   ├─ Arch Agent → ARCH.md
   └─ QA Agent → QA.md
   └─ Merge → PLAN.md
   └─ Delete planning sessions ✗

2. Backlog Generation
   ├─ Read PLAN.md
   ├─ Generate BACKLOG.yaml
   └─ Delete backlog session ✗

3. Implementation
   ├─ Get ready tasks
   ├─ Compress contexts (<3KB)
   ├─ Spawn workers (parallel)
   └─ Update backlog status

4. Integration
   ├─ Review completed tasks
   ├─ Merge to main
   └─ Cleanup worktrees
```

---

## ⚠️ Critical Rules

1. **Never carry planning debris into implementation**
2. **Delete planning sessions after merge**
3. **Compress contexts to <3KB**
4. **Fresh session per task**
5. **Use model routing for cost optimization**

---

## 📚 References

- **[Full Implementation Plan](./IMPLEMENTATION_PLAN_FINAL.md)** - Complete details
- **[Comprehensive Guide](./COMPREHENSIVE_GUIDE.md)** - System design principles
- **[OpenCode Conductor](../../lookout-projects/opencode-conductor/)** - Plugin reference
- **[Oh My OpenCode](../../lookout-projects/oh-my-opencode/)** - Background tasks reference

---

## 🎯 Next Steps

1. **Week 1**: Set up plugin structure, implement planning agents
2. **Week 2**: Add backlog system
3. **Week 3**: Implement context engineering
4. **Week 4**: Build implementation orchestration
5. **Week 5**: Testing & optimization

**Estimated Total**: 4-5 weeks for MVP

