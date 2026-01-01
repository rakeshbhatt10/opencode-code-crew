# Implementation Plan: Building the Multi-Agent System

## Overview

This document outlines a phased approach to implementing the multi-agent coding system, from MVP to production-ready factory pattern.

## Philosophy

**Start simple, validate patterns, scale incrementally.**

Each phase builds on the previous one, with clear success criteria before advancing.

---

## Phase 1: MVP (Week 1-2)

### Goal
Prove the core pattern works with minimal tooling.

### Scope

#### 1.1 Manual Conductor (TypeScript Script)
**File**: `conductor/src/mvp-conductor.ts`

**Functionality**:
- Read feature request
- Spawn 3 planning agents (manual OpenCode CLI calls)
- Collect outputs
- Generate simple backlog (manual YAML writing)
- Spawn 1 worker agent
- Monitor completion (manual check)

**Implementation**:
```typescript
import { createOpencode } from "@opencode-ai/sdk"
import { readFile, writeFile } from "fs/promises"
import yaml from "yaml"

async function mvpConductor() {
  const { client } = await createOpencode()
  
  // Stage 1: Planning
  console.log("Stage 1: Spawning planning agents...")
  const planners = await spawnPlanners(client)
  const specs = await collectSpecs(planners)
  await cleanupPlanners(planners)  // Context garbage collection
  
  // Stage 2: Backlog
  console.log("Stage 2: Generating backlog...")
  const backlog = await generateBacklog(client, specs)
  await writeFile('tasks/BACKLOG.yaml', yaml.stringify(backlog))
  
  // Stage 3: Implementation (1 task)
  console.log("Stage 3: Implementing first task...")
  const firstTask = backlog.tasks[0]
  await implementTask(client, firstTask)
  
  console.log("✓ MVP workflow complete")
}
```

#### 1.2 Agent Prompts (Markdown Files)
Create in `.opencode/agent/`:
- `planner-spec.md`
- `planner-arch.md`
- `planner-qa.md`
- `implementer.md`

Use the templates from `docs/AGENT_ROLES.md`.

#### 1.3 Manual Worktree Management
```bash
# Create worktree manually
git worktree add worktrees/T01 -b task/T01

# Work in worktree
cd worktrees/T01
# ... agent implements ...

# Merge manually
cd ../..
git merge --no-ff task/T01
```

#### 1.4 Simple Task Schema
Minimal YAML:
```yaml
tasks:
  - id: T01
    title: "Task title"
    description: "What to do"
    acceptance:
      - "Criterion 1"
      - "Criterion 2"
    depends_on: []
```

### Success Criteria
- [ ] Complete one feature end-to-end
- [ ] Planning agents run in parallel
- [ ] Planning context is discarded (verified via logs)
- [ ] Implementation starts with clean context (<5KB)
- [ ] Task completes with passing tests
- [ ] Total time: <2 hours for simple feature

### Deliverables
- `conductor/src/mvp-conductor.ts`
- `.opencode/agent/*.md` (4 agent prompts)
- `tasks/BACKLOG.yaml` (from real run)
- `docs/MVP_RESULTS.md` (learnings, metrics)

### Estimated Effort
- Setup: 2 hours
- Implementation: 8 hours
- Testing: 4 hours
- Documentation: 2 hours
**Total: 16 hours (2 days)**

---

## Phase 2: Automation (Week 3-4)

### Goal
Remove human bottlenecks, enable parallel execution.

### Scope

#### 2.1 Automated Worktree Management
**File**: `conductor/src/worktree-manager.ts`

```typescript
export class WorktreeManager {
  async create(taskId: string): Promise<string> {
    const worktreePath = `worktrees/${taskId}`
    await $`git worktree add ${worktreePath} -b task/${taskId}`
    return worktreePath
  }
  
  async cleanup(taskId: string): Promise<void> {
    await $`git worktree remove worktrees/${taskId}`
    await $`git branch -d task/${taskId}`
  }
  
  async merge(taskId: string): Promise<void> {
    await $`git merge --no-ff task/${taskId}`
  }
}
```

#### 2.2 Worker Pool
**File**: `conductor/src/worker-pool.ts`

```typescript
export class WorkerPool {
  private maxWorkers = 3
  private activeWorkers = new Map<string, Worker>()
  
  async spawn(task: Task): Promise<Worker> {
    if (this.activeWorkers.size >= this.maxWorkers) {
      throw new Error("Worker pool full")
    }
    
    const worker = new Worker(task)
    this.activeWorkers.set(task.id, worker)
    
    worker.on('complete', () => {
      this.activeWorkers.delete(task.id)
      this.checkForReadyTasks()
    })
    
    await worker.start()
    return worker
  }
  
  private async checkForReadyTasks() {
    const ready = await getReadyTasks()
    for (const task of ready) {
      if (this.activeWorkers.size < this.maxWorkers) {
        await this.spawn(task)
      }
    }
  }
}
```

#### 2.3 Automated Test Gates
**File**: `conductor/src/verification.ts`

```typescript
export async function verifyTask(taskId: string, worktreePath: string) {
  const results = {
    tests: false,
    lint: false,
    typecheck: false
  }
  
  try {
    await $`cd ${worktreePath} && pnpm test`
    results.tests = true
  } catch (e) {
    console.error(`Tests failed for ${taskId}`)
  }
  
  try {
    await $`cd ${worktreePath} && pnpm lint`
    results.lint = true
  } catch (e) {
    console.error(`Lint failed for ${taskId}`)
  }
  
  try {
    await $`cd ${worktreePath} && pnpm typecheck`
    results.typecheck = true
  } catch (e) {
    console.error(`Typecheck failed for ${taskId}`)
  }
  
  return results
}
```

#### 2.4 Status Monitoring
**File**: `conductor/src/monitor.ts`

```typescript
export class TaskMonitor {
  async watch() {
    const events = await client.event.subscribe()
    
    for await (const event of events.stream) {
      if (event.type === 'session.idle') {
        await this.handleTaskComplete(event.properties.sessionId)
      }
      
      if (event.type === 'session.error') {
        await this.handleTaskError(event.properties.sessionId, event.properties.error)
      }
    }
  }
  
  private async handleTaskComplete(sessionId: string) {
    const taskId = this.sessionToTask.get(sessionId)
    if (!taskId) return
    
    await updateTaskStatus(taskId, 'review')
    await this.runVerification(taskId)
  }
}
```

#### 2.5 Full Conductor Orchestration
**File**: `conductor/src/orchestrator.ts`

Combines all components:
```typescript
export class Orchestrator {
  async run(featureRequest: string) {
    // Stage 0: Intake
    const context = await this.generateContext(featureRequest)
    
    // Stage 1: Planning (parallel)
    const plan = await this.runPlanning(context)
    
    // Stage 2: Backlog
    const backlog = await this.generateBacklog(plan)
    
    // Stage 3: Implementation (parallel workers)
    await this.runImplementation(backlog)
    
    // Stage 4: Integration
    await this.integrate()
  }
}
```

### Success Criteria
- [ ] Run 3 tasks in parallel without intervention
- [ ] Automatic worktree creation/cleanup
- [ ] Automated test gates (pass/fail detection)
- [ ] Status monitoring dashboard (CLI output)
- [ ] Complete feature in <1 hour (vs 2 hours manual)

### Deliverables
- `conductor/src/` (5 new modules)
- `conductor/package.json`
- `conductor/tsconfig.json`
- CLI tool: `conductor run feature-request.md`

### Estimated Effort
- Worktree manager: 4 hours
- Worker pool: 6 hours
- Verification: 4 hours
- Monitoring: 6 hours
- Integration: 8 hours
- Testing: 8 hours
**Total: 36 hours (5 days)**

---

## Phase 3: Optimization (Week 5-6)

### Goal
Improve cost, quality, and reliability.

### Scope

#### 3.1 Prompt Rebasing Automation
**File**: `conductor/src/rebase-engine.ts`

```typescript
export class RebaseEngine {
  async analyzeFailure(taskId: string): Promise<RebaseRecommendation> {
    const task = await loadTask(taskId)
    const failure = await loadFailureDetails(taskId)
    
    // Spawn rebase agent
    const analysis = await this.rebaseAgent.analyze({
      originalSpec: task,
      failure: failure
    })
    
    return {
      shouldRebase: analysis.confidence > 0.7,
      improvedSpec: analysis.improvedSpec,
      reasoning: analysis.reasoning
    }
  }
  
  async rebase(taskId: string, improvedSpec: TaskSpec) {
    // Update task spec
    await updateTask(taskId, improvedSpec)
    
    // Clear all context
    await this.worktreeManager.cleanup(taskId)
    
    // Reset status
    await updateTaskStatus(taskId, 'ready', { attempts: task.attempts + 1 })
    
    // Will be picked up by worker pool automatically
  }
}
```

#### 3.2 Context Compression Plugin
**File**: `.opencode/plugin/context-compressor.ts`

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const ContextCompressor: Plugin = async (ctx) => {
  return {
    "experimental.session.compacting": async (input, output) => {
      // Inject compression rules
      output.context.push(`
## Context Compression Rules

Keep ONLY:
- Task spec and acceptance criteria
- Explicit constraints
- Code pattern snippets (max 10 lines)
- Negative evidence (single-line)

Discard:
- Planning discussion
- Full file contents (use paths)
- Tool outputs (unless critical)
- Failed attempt histories
      `)
    }
  }
}
```

#### 3.3 Model Routing Optimization
**File**: `conductor/src/model-router.ts`

```typescript
export class ModelRouter {
  route(task: Task): ModelConfig {
    // Code changes: GPT-4
    if (task.type === 'implementation' && task.complexity !== 'low') {
      return { provider: 'openai', model: 'gpt-4' }
    }
    
    // Documentation: Gemini
    if (task.type === 'documentation') {
      return { provider: 'google', model: 'gemini-2.0-flash-exp' }
    }
    
    // Simple changes: Gemini
    if (task.complexity === 'low') {
      return { provider: 'google', model: 'gemini-2.0-flash-exp' }
    }
    
    // Default: GPT-4
    return { provider: 'openai', model: 'gpt-4' }
  }
}
```

#### 3.4 Prompt Library
**Directory**: `prompts/`

Create reusable prompt templates:
- `prompts/planning-spec.md`
- `prompts/planning-arch.md`
- `prompts/implementation-feature.md`
- `prompts/implementation-bugfix.md`
- `prompts/review-code.md`

With variable substitution:
```markdown
# Implement Feature: {{FEATURE_NAME}}

## Task Specification
{{TASK_SPEC}}

## Acceptance Criteria
{{ACCEPTANCE_CRITERIA}}

## Code Patterns
{{CODE_PATTERNS}}
```

#### 3.5 Metrics & Analytics
**File**: `conductor/src/metrics.ts`

```typescript
export class MetricsCollector {
  async collect() {
    const metrics = {
      totalTasks: 0,
      completed: 0,
      failed: 0,
      firstAttemptSuccess: 0,
      totalTokens: 0,
      totalCost: 0,
      averageTaskTime: 0,
      contextSizes: {
        planning: [],
        implementation: []
      }
    }
    
    // Aggregate from task status files
    for (const statusFile of await glob('tasks/*.status.json')) {
      const status = await loadJson(statusFile)
      // ... aggregate ...
    }
    
    return metrics
  }
  
  async report() {
    const metrics = await this.collect()
    
    console.log(`
=== Metrics Report ===

Tasks:
  Total: ${metrics.totalTasks}
  Completed: ${metrics.completed}
  Failed: ${metrics.failed}
  First-attempt success: ${metrics.firstAttemptSuccess}/${metrics.completed} (${(metrics.firstAttemptSuccess/metrics.completed*100).toFixed(1)}%)

Cost:
  Total tokens: ${metrics.totalTokens}
  Estimated cost: $${metrics.totalCost.toFixed(2)}
  
Performance:
  Average task time: ${metrics.averageTaskTime.toFixed(1)} minutes
  
Context Quality:
  Avg planning context: ${avg(metrics.contextSizes.planning)}KB
  Avg implementation context: ${avg(metrics.contextSizes.implementation)}KB
    `)
  }
}
```

### Success Criteria
- [ ] 50% cost reduction (via model routing)
- [ ] 2x throughput (via optimization)
- [ ] >70% first-attempt success rate
- [ ] Automatic rebase on >2 failures
- [ ] Context sizes: planning <10KB, implementation <3KB

### Deliverables
- Rebase engine
- Context compression plugin
- Model router
- Prompt library (5 templates)
- Metrics dashboard

### Estimated Effort
- Rebase engine: 8 hours
- Compression plugin: 4 hours
- Model router: 4 hours
- Prompt library: 6 hours
- Metrics: 6 hours
- Testing & tuning: 12 hours
**Total: 40 hours (5 days)**

---

## Phase 4: Factory Pattern (Week 7-8)

### Goal
Specs become primary artifacts, code is disposable output.

### Scope

#### 4.1 Spec Repository
**Directory**: `specs/`

Structure:
```
specs/
├── feature-001-user-auth/
│   ├── PLAN.md
│   ├── BACKLOG.yaml
│   ├── context.md
│   └── .metadata.json
├── feature-002-payment/
│   ├── PLAN.md
│   ├── BACKLOG.yaml
│   ├── context.md
│   └── .metadata.json
└── templates/
    ├── crud-feature.yaml
    ├── api-endpoint.yaml
    └── ui-component.yaml
```

#### 4.2 Spec Versioning
**File**: `specs/.metadata.json`

```json
{
  "version": "1.2.0",
  "features": [
    {
      "id": "feature-001",
      "name": "User Authentication",
      "version": "2.0",
      "status": "deployed",
      "lastGenerated": "2024-01-15T10:00:00Z",
      "attempts": 1,
      "cost": 2.45
    }
  ]
}
```

#### 4.3 Spec-Driven Regeneration
**File**: `conductor/src/regenerator.ts`

```typescript
export class Regenerator {
  async regenerate(featureId: string) {
    const spec = await loadSpec(featureId)
    
    // Clear existing implementation
    await this.clearFeature(featureId)
    
    // Regenerate from spec
    const orchestrator = new Orchestrator()
    await orchestrator.run(spec.plan)
    
    // Compare with previous version
    await this.compareVersions(featureId)
  }
  
  async regenerateAll() {
    const specs = await loadAllSpecs()
    
    for (const spec of specs) {
      console.log(`Regenerating ${spec.id}...`)
      await this.regenerate(spec.id)
    }
  }
}
```

#### 4.4 Template System
**File**: `conductor/src/template-engine.ts`

```typescript
export class TemplateEngine {
  async instantiate(templateName: string, variables: Record<string, string>) {
    const template = await loadTemplate(templateName)
    
    // Replace variables
    let spec = template
    for (const [key, value] of Object.entries(variables)) {
      spec = spec.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }
    
    return spec
  }
  
  async createFromTemplate(templateName: string, featureName: string) {
    const variables = {
      FEATURE_NAME: featureName,
      CREATED_DATE: new Date().toISOString(),
      // ... prompt for other variables
    }
    
    const spec = await this.instantiate(templateName, variables)
    await writeSpec(featureName, spec)
    
    return spec
  }
}
```

#### 4.5 Multi-Project Orchestration
**File**: `conductor/src/multi-project.ts`

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
  
  private prioritize(projects: Project[]): Project[] {
    // Sort by: deadline, dependencies, impact
    return projects.sort((a, b) => {
      if (a.deadline < b.deadline) return -1
      if (a.impact > b.impact) return -1
      return 0
    })
  }
}
```

### Success Criteria
- [ ] Rebuild entire codebase from specs in <1 hour
- [ ] Spec versioning tracks changes
- [ ] Template library with 5+ templates
- [ ] Multi-project orchestration (2+ projects in parallel)
- [ ] Spec-driven regeneration produces identical output

### Deliverables
- Spec repository structure
- Regenerator
- Template engine (5 templates)
- Multi-project orchestrator
- Documentation: "Factory Pattern Guide"

### Estimated Effort
- Spec repository: 4 hours
- Versioning: 6 hours
- Regenerator: 8 hours
- Template engine: 8 hours
- Multi-project: 10 hours
- Testing: 12 hours
**Total: 48 hours (6 days)**

---

## Implementation Timeline

### Week 1-2: MVP
- Days 1-2: Setup, agent prompts
- Days 3-4: MVP conductor
- Days 5-6: Testing, documentation

### Week 3-4: Automation
- Days 1-2: Worktree manager, worker pool
- Days 3-4: Verification, monitoring
- Days 5-6: Integration, testing

### Week 5-6: Optimization
- Days 1-2: Rebase engine, compression
- Days 3-4: Model router, prompt library
- Days 5-6: Metrics, tuning

### Week 7-8: Factory Pattern
- Days 1-2: Spec repository, versioning
- Days 3-4: Regenerator, templates
- Days 5-6: Multi-project, testing

**Total: 8 weeks (40 days)**

---

## Resource Requirements

### Development
- **1 developer** (full-time)
- **TypeScript/Node.js** expertise
- **Git** advanced knowledge
- **OpenCode SDK** familiarity

### Infrastructure
- **OpenAI API**: ~$50-100/month (development)
- **Google AI API**: Free tier (sufficient for development)
- **Git repository**: Existing
- **CI/CD**: Optional (Phase 4)

### Compute
- **Local machine**: Sufficient for MVP-Phase 3
- **Cloud VM**: Optional for Phase 4 (multi-project)

---

## Risk Mitigation

### Risk 1: OpenCode API Changes
**Probability**: Medium  
**Impact**: High  
**Mitigation**: 
- Pin SDK version
- Abstract OpenCode calls behind interface
- Monitor OpenCode releases

### Risk 2: Model Quality Degradation
**Probability**: Low  
**Impact**: High  
**Mitigation**:
- Track first-attempt success rate
- A/B test model versions
- Maintain prompt library for quick updates

### Risk 3: Context Pollution
**Probability**: High (if not careful)  
**Impact**: High  
**Mitigation**:
- Automated context audits
- Enforce session deletion
- Monitor context sizes

### Risk 4: Cost Overruns
**Probability**: Medium  
**Impact**: Medium  
**Mitigation**:
- Model routing (cheap for planning)
- Token budgets per task
- Cost alerts

### Risk 5: Prompt Drift
**Probability**: Medium  
**Impact**: Medium  
**Mitigation**:
- Version control prompts
- A/B test changes
- Track metrics before/after

---

## Success Metrics by Phase

### Phase 1 (MVP)
- ✓ Complete 1 feature end-to-end
- ✓ Planning context discarded
- ✓ Implementation context <5KB
- ✓ Time: <2 hours

### Phase 2 (Automation)
- ✓ 3 parallel tasks
- ✓ Automated gates
- ✓ Time: <1 hour
- ✓ Zero manual intervention

### Phase 3 (Optimization)
- ✓ 50% cost reduction
- ✓ 2x throughput
- ✓ >70% first-attempt success
- ✓ Context: <3KB

### Phase 4 (Factory)
- ✓ Rebuild codebase <1 hour
- ✓ 5+ templates
- ✓ Multi-project support
- ✓ Spec-driven regeneration

---

## Next Steps

### Immediate (This Week)
1. **Set up development environment**
   - Install OpenCode CLI
   - Configure API keys
   - Create project structure

2. **Create agent prompts**
   - Copy templates from `docs/AGENT_ROLES.md`
   - Customize for your project
   - Test with manual OpenCode runs

3. **Build MVP conductor**
   - Start with `mvp-conductor.ts`
   - Test with simple feature
   - Document learnings

### Short-term (Next 2 Weeks)
1. **Complete Phase 1 (MVP)**
2. **Start Phase 2 (Automation)**
3. **Iterate on agent prompts** based on results

### Long-term (Next 2 Months)
1. **Complete all 4 phases**
2. **Build prompt library** from successful patterns
3. **Scale to multiple projects**
4. **Open source learnings** (optional)

---

## Appendix: File Structure

```
code-agents-workshop/
├── docs/                           # Documentation (current)
│   ├── SYSTEM_SPEC.md
│   ├── AGENT_ROLES.md
│   ├── BACKLOG_SCHEMA.md
│   ├── WORKFLOW_GUIDE.md
│   └── IMPLEMENTATION_PLAN.md      # This file
├── conductor/                      # Orchestrator (to build)
│   ├── src/
│   │   ├── mvp-conductor.ts        # Phase 1
│   │   ├── orchestrator.ts         # Phase 2
│   │   ├── worktree-manager.ts     # Phase 2
│   │   ├── worker-pool.ts          # Phase 2
│   │   ├── verification.ts         # Phase 2
│   │   ├── monitor.ts              # Phase 2
│   │   ├── rebase-engine.ts        # Phase 3
│   │   ├── model-router.ts         # Phase 3
│   │   ├── metrics.ts              # Phase 3
│   │   ├── regenerator.ts          # Phase 4
│   │   ├── template-engine.ts      # Phase 4
│   │   └── multi-project.ts        # Phase 4
│   ├── package.json
│   └── tsconfig.json
├── .opencode/                      # OpenCode config
│   ├── opencode.json
│   ├── agent/                      # Agent prompts
│   │   ├── conductor.md
│   │   ├── planner-spec.md
│   │   ├── planner-arch.md
│   │   ├── planner-qa.md
│   │   ├── implementer.md
│   │   ├── documenter.md
│   │   ├── reviewer.md
│   │   └── rebase.md
│   └── plugin/                     # Plugins
│       ├── context-compressor.ts
│       └── task-tracker.ts
├── prompts/                        # Prompt library (Phase 3)
│   ├── planning-spec.md
│   ├── planning-arch.md
│   ├── implementation-feature.md
│   └── review-code.md
├── specs/                          # Spec repository (Phase 4)
│   ├── feature-001/
│   │   ├── PLAN.md
│   │   ├── BACKLOG.yaml
│   │   └── context.md
│   └── templates/
│       ├── crud-feature.yaml
│       └── api-endpoint.yaml
├── tasks/                          # Generated per-project
│   ├── BACKLOG.yaml
│   ├── T01.yaml
│   ├── T01.status.json
│   └── T01.notes.md
├── worktrees/                      # Generated per-project
│   ├── T01/
│   └── T02/
└── scripts/                        # Utility scripts
    ├── generate-repo-map.sh
    ├── spawn-worker.sh
    ├── monitor-tasks.sh
    ├── handle-completion.sh
    ├── validate-backlog.py
    └── get-ready-tasks.py
```

---

## Conclusion

This implementation plan provides a clear path from MVP to production-ready factory pattern, with:

- **Incremental delivery**: Each phase delivers value
- **Clear success criteria**: Know when to advance
- **Risk mitigation**: Address known failure modes
- **Realistic timeline**: 8 weeks to full system
- **Cost-effective**: Leverage free tiers where possible

**Start with Phase 1 this week**. Validate the core pattern works, then build from there.

The key insight: **context quality determines output quality**. Every phase reinforces this by improving context management, compression, and isolation.

Good luck! 🚀

