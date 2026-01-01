---
layout: home

hero:
  name: Multi-Agent Coding System
  text: Context Engineering for AI Agents
  tagline: Cost-optimized, local-first multi-agent system built on OpenCode implementing Fucory's context engineering principles
  image:
    src: /hero-image.svg
    alt: Multi-Agent System
  actions:
    - theme: brand
      text: 📘 Comprehensive Guide
      link: /COMPREHENSIVE_GUIDE
    - theme: alt
      text: Get Started
      link: /GETTING_STARTED
    - theme: alt
      text: Quick Reference
      link: /QUICK_REFERENCE

features:
  - icon: 🎯
    title: Context Quality First
    details: Performance is a function of context quality. The only control surface we have at inference time.
  
  - icon: 🗑️
    title: Aggressive Context Disposal
    details: Planning contexts are deleted, not accumulated. Subagents are garbage collectors that keep exploration separate.
  
  - icon: 🔄
    title: Prompt Rebasing Over Patching
    details: When things go wrong, improve the spec and regenerate—don't patch the mess. The spec is durable, code is disposable.
  
  - icon: 💰
    title: Cost-Optimized by Design
    details: 80% of tokens through free Gemini tier, expensive ChatGPT-4 only for critical code paths. ~$0.65 per feature.
  
  - icon: ⚡
    title: Parallel Execution
    details: 3 planning agents + 3-8 worker agents running in parallel. Complete features in <1 hour.
  
  - icon: 🎨
    title: Clean Architecture
    details: Conductor orchestrates planning subagents, worker agents, and utility agents with clear separation of concerns.
  
  - icon: 📊
    title: Real Feedback Loops
    details: Tests, lint, type check—not phantom signals. Broken feedback creates false anchors.
  
  - icon: 🔍
    title: Context Hygiene
    details: Fresh session per task, clear between phases, <3KB contexts. Cross-task residue degrades performance.
  
  - icon: 🏭
    title: Factory Pattern
    details: Specs become primary artifacts. Code is regenerated from specs. Rebuild entire codebase in <1 hour.
---

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

## Quick Start

```bash
# View documentation
cd docs
npm install
npm run dev

# Or use Python
python3 -m http.server 3000
```

## Architecture

```
Conductor (ChatGPT-4)
├── Planning Subagents (Parallel, Disposable)
│   ├── Product/Spec Agent (Gemini - FREE)
│   ├── Architecture Agent (Gemini - FREE)
│   └── Risk/QA Agent (Gemini - FREE)
├── Worker Agents (Parallel, Task-Scoped)
│   ├── Implementer Agent (ChatGPT-4)
│   ├── Documenter Agent (Gemini - FREE)
│   └── Reviewer Agent (ChatGPT-4)
└── Utility Agents (On-Demand)
    ├── Rebase Agent (ChatGPT-4)
    └── Context Compressor Agent (Gemini - FREE)
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

**Result**: ~$0.65 per feature (vs $1.65 without routing) = **64% savings**

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

## Documentation Structure

- **[Getting Started](./GETTING_STARTED.md)** - Quick start guide
- **[System Spec](./SYSTEM_SPEC.md)** - Complete system design
- **[Agent Roles](./AGENT_ROLES.md)** - Detailed agent specifications
- **[Backlog Schema](./BACKLOG_SCHEMA.md)** - Task format and schema
- **[Workflow Guide](./WORKFLOW_GUIDE.md)** - Step-by-step operations
- **[Implementation Plan](./IMPLEMENTATION_PLAN.md)** - Phased build plan
- **[Quick Reference](./QUICK_REFERENCE.md)** - Cheat sheet

## Implementation Timeline

- **Phase 1 (Week 1-2):** MVP - Prove the pattern
- **Phase 2 (Week 3-4):** Automation - Remove bottlenecks
- **Phase 3 (Week 5-6):** Optimization - Cost & quality
- **Phase 4 (Week 7-8):** Factory Pattern - Specs as artifacts

**Total: 8 weeks to production-ready system**

## Next Steps

1. **Read [Getting Started](./GETTING_STARTED.md)** - 30-second setup
2. **Read [System Spec](./SYSTEM_SPEC.md)** - Understand the design
3. **Read [Implementation Plan](./IMPLEMENTATION_PLAN.md)** - Build the system
4. **Start with Phase 1** - Prove the pattern works

---

**Remember**: The prompt/spec is the durable artifact. Code is rebuildable output. When something goes wrong, improve the prompt and regenerate—don't patch the mess.

