# Implementation Plans Review: Alignment with Context Engineering Principles

> **Analysis of IMPLEMENTATION_PLAN.md and IMPLEMENTATION_PLAN_FINAL.md against fucory-guidelines.txt**

---

## Executive Summary

Both plans have **strong alignment** with the core context engineering principles, but there are **critical gaps and implementation issues** that could undermine the entire approach.

**Overall Assessment:**
- ✅ **Philosophy**: Both plans understand context quality = output quality
- ⚠️ **Planning Phase**: Strong concept, but execution details are incomplete
- ❌ **Context Verification**: No mechanism to verify context hygiene is actually working
- ⚠️ **Prompt Rebasing**: Concept is there, but not deeply integrated
- ✅ **Factory Pattern**: Well-aligned (IMPLEMENTATION_PLAN.md Phase 4)
- ❌ **Feedback Loops**: Weak - no protection against broken instrumentation

**Critical Issues Found:** 7 major problems that need addressing

---

## Core Principles Alignment

### ✅ Principle 1: Context Quality = Output Quality

**Both plans understand this:**

```typescript
// IMPLEMENTATION_PLAN_FINAL.md
"For a fixed model, performance is a function of context quality—
because context is the only thing the agent can actually control 
at inference time."
```

**Evidence in plans:**
- Planning subagents explicitly designed as "context garbage collectors"
- Context compression (<3KB target)
- Session deletion after planning
- Fresh contexts per task

**Rating: STRONG ALIGNMENT** ✅

---

## Critical Issues

### ❌ Issue 1: No Context Verification Mechanism

**Problem:** Both plans delete planning sessions and compress contexts, but **never verify it actually happened**.

**From fucory-guidelines:**
> "Incorrect context is the worst kind... it actively pulls the model off-course."

**Missing from both plans:**
```typescript
// NEEDED: Context hygiene verification
async function verifyContextHygiene(sessionId: string, phase: SessionPhase) {
  const context = await getSessionContext(sessionId);
  
  // Critical checks:
  if (phase === "implementation") {
    // 1. Check size
    if (context.length > 3000) {
      throw new Error(`Context too large: ${context.length} bytes`);
    }
    
    // 2. Scan for planning debris
    const planningKeywords = ["We explored", "Alternative approach", 
                              "After much discussion", "Three options"];
    for (const keyword of planningKeywords) {
      if (context.toLowerCase().includes(keyword.toLowerCase())) {
        throw new Error(`Planning debris detected: "${keyword}"`);
      }
    }
    
    // 3. Verify no cross-task contamination
    const taskIds = extractTaskIds(context);
    if (taskIds.size > 1) {
      throw new Error(`Multiple task contexts detected: ${[...taskIds]}`);
    }
  }
}
```

**Impact:** HIGH - Without verification, context pollution will happen silently.

**Fix Required:** Add explicit verification gates at phase transitions.

---

### ❌ Issue 2: Session Deletion is Async Without Confirmation

**Problem:** Both plans use `session.delete()` but don't verify deletion succeeded.

**IMPLEMENTATION_PLAN_FINAL.md:**
```typescript
// CRITICAL: Delete planning sessions (context garbage collection)
await Promise.all([
  opencode.client.session.delete({ path: { id: specSession.id } }),
  opencode.client.session.delete({ path: { id: archSession.id } }),
  opencode.client.session.delete({ path: { id: qaSession.id } }),
]);
```

**Issue:** What if delete fails? What if it's rate-limited? What if sessions persist?

**From fucory-guidelines:**
> "If you can /clear, you should /clear."

**Fix Required:**
```typescript
// Verify deletion
async function verifySessionDeleted(sessionId: string): Promise<void> {
  try {
    await opencode.client.session.get({ path: { id: sessionId } });
    throw new Error(`Session ${sessionId} still exists after deletion!`);
  } catch (error) {
    if (error.status === 404) {
      // Good - session is gone
      return;
    }
    throw error; // Other error
  }
}

// After deletion
await verifySessionDeleted(specSession.id);
```

**Impact:** HIGH - Silently carrying forward planning contexts defeats the entire system.

---

### ⚠️ Issue 3: Planning Output Merge is Underspecified

**Problem:** Both plans say "merge planning outputs" but don't specify HOW.

**IMPLEMENTATION_PLAN_FINAL.md:**
```typescript
// Merge planning outputs
const planFile = await mergePlanningOutputs(
  join(args.output_dir, "SPEC.md"),
  join(args.output_dir, "ARCH.md"),
  join(args.output_dir, "QA.md"),
  join(args.output_dir, "PLAN.md")
);
// Implementation details...  ← PROBLEM: No details!
```

**Issue:** Merging is NOT trivial. Options:

1. **Manual human merge** (slow, defeats automation)
2. **Simple concatenation** (may have conflicts/duplicates)
3. **LLM merge with fresh session** (adds cost, may introduce noise)

**From fucory-guidelines:**
> "Compression is how the first three moves scale."

**Better Approach:**
```typescript
async function mergePlanningOutputs(
  specFile: string,
  archFile: string,
  qaFile: string,
  outputFile: string
): Promise<string> {
  // Option A: Structured merge (no LLM)
  const spec = await readFile(specFile, "utf-8");
  const arch = await readFile(archFile, "utf-8");
  const qa = await readFile(qaFile, "utf-8");
  
  const merged = `# Unified Plan

## 1. Specification
${extractSection(spec, "Requirements")}

## 2. Architecture
${extractSection(arch, "Design")}

## 3. Quality Assurance
${extractSection(qa, "Test Plan")}

## 4. Implementation Steps
${synthesizeSteps(spec, arch, qa)}
`;

  await writeFile(outputFile, merged);
  return outputFile;
}
```

**Impact:** MEDIUM - Unclear merge strategy could produce bloated or inconsistent plans.

---

### ❌ Issue 4: No Protection Against Broken Feedback Loops

**Problem:** Neither plan addresses the "EVM tracer story" - broken instrumentation.

**From fucory-guidelines:**
> "A broken feedback channel doesn't just fail to help—it becomes a false anchor."

**IMPLEMENTATION_PLAN.md has this:**
```typescript
try {
  await $`cd ${worktreePath} && pnpm test`
  results.tests = true
} catch (e) {
  console.error(`Tests failed for ${taskId}`)
}
```

**Issue:** What if:
- Test runner is broken?
- Tests pass but code is wrong?
- Environment is misconfigured?

**Missing: Instrumentation Health Checks**

**Fix Required:**
```typescript
// Before running any verification loop
async function verifyInstrumentation(worktreePath: string): Promise<void> {
  // 1. Smoke test: run a known-passing test
  try {
    await $`cd ${worktreePath} && pnpm test -- smoke.test.ts`;
  } catch (e) {
    throw new Error("Test runner broken - smoke test failed");
  }
  
  // 2. Verify test output format
  const output = await $`cd ${worktreePath} && pnpm test -- --version`;
  if (!output.stdout.includes("jest") && !output.stdout.includes("vitest")) {
    throw new Error("Test runner output format unexpected");
  }
  
  // 3. Verify linter works
  await $`cd ${worktreePath} && pnpm lint -- --version`;
}

// Call BEFORE starting implementation loop
await verifyInstrumentation(worktreePath);
```

**Impact:** CRITICAL - Broken feedback = toxic incorrect context that poisons entire loop.

---

### ⚠️ Issue 5: Prompt Rebasing is Not Deeply Integrated

**Problem:** Both plans mention rebase agents, but it's treated as optional/late-phase.

**IMPLEMENTATION_PLAN.md:** Rebase engine is Phase 3 (Optimization)  
**IMPLEMENTATION_PLAN_FINAL.md:** Rebase agent exists but not in core workflow

**From fucory-guidelines:**
> "Throw the code away. Update the original plan/prompt based on hindsight. 
> Rerun from scratch. The durable artifact is the prompt-plan-spec."

**Current approach:**
```typescript
// IMPLEMENTATION_PLAN_FINAL.md
export const rebaseCommand = (ctx: PluginInput): ToolDefinition =>
  tool({
    description: "Rebases failed task spec based on failure analysis.",
    // ...
  });
```

**Issue:** Rebasing is **reactive** (only on failure), should be **proactive**.

**Better approach:**
```typescript
// After ANY task completion (not just failure)
async function shouldRebase(task: BacklogTask, result: TaskResult): Promise<boolean> {
  // Rebase if:
  const messyIndicators = [
    result.attempts > 1,                    // Took multiple tries
    result.contextSize > 5000,              // Bloated context
    result.duration > task.estimatedHours * 2, // Took too long
    result.logs.includes("retrying"),       // Self-debugging
    result.commits.length > 3,              // Too many commits
  ];
  
  return messyIndicators.some(x => x);
}

// If messy, rebase even if it "worked"
if (await shouldRebase(task, result)) {
  console.log(`Task ${task.id} succeeded but was messy - rebasing spec`);
  const improvedSpec = await rebaseAgent.improve(task, result);
  await backlog.updateTask(task.id, improvedSpec);
  
  // Mark for clean re-run in next iteration
  await backlog.updateTaskStatus(task.id, "rebase_recommended");
}
```

**Impact:** MEDIUM - Missing the "factory pattern" optimization opportunity.

---

### ⚠️ Issue 6: Worker Context Building is Underspecified

**Problem:** Both plans compress context to <3KB but don't specify WHAT to include/exclude.

**IMPLEMENTATION_PLAN_FINAL.md:**
```typescript
buildTaskContext(task: BacklogTask): string {
  const lines = [
    `# Task ${task.id}: ${task.title}`,
    "",
    "## Specification",
    task.description,  // ← How long is this?
    "",
    "## Acceptance Criteria",
    // ...
  ];
  
  // Patterns (snippets only)
  if (task.context?.patterns) {
    lines.push("### Code Patterns");
    for (const pattern of task.context.patterns) {
      lines.push(`- ${pattern}`); // ← What if this is 50 lines?
    }
  }
}
```

**From fucory-guidelines:**
> "Keep the smallest set of constraints that preserves correctness."

**Missing: Explicit compression rules**

**Better approach:**
```typescript
buildTaskContext(task: BacklogTask): string {
  const budget = {
    spec: 500,      // chars
    acceptance: 300,
    constraints: 200,
    patterns: 500,  // File path + line range ONLY
    gotchas: 200,
  };
  
  const spec = truncateToFit(task.description, budget.spec);
  const acceptance = task.acceptance
    .map(a => `- ${truncateToFit(a, 50)}`)
    .join("\n");
  
  // Patterns: FILE PATH + LINE RANGE ONLY
  const patterns = task.context?.patterns
    ?.map(p => {
      // Enforce format: "src/file.ts:45-78 - brief description"
      if (p.length > 80) {
        throw new Error(`Pattern too long: ${p.substring(0, 50)}...`);
      }
      return `- ${p}`;
    })
    .join("\n") || "";
  
  return `# Task ${task.id}

${spec}

## Acceptance
${acceptance}

## Patterns
${patterns}
`.substring(0, 3000); // Hard limit
}
```

**Impact:** MEDIUM - Without strict compression, contexts will bloat over time.

---

### ❌ Issue 7: No Mechanism to Detect Context Drift

**Problem:** Both plans assume context stays clean. No monitoring for gradual degradation.

**From fucory-guidelines:**
> "Cross-task residue behaves like adversarial noise."

**Missing: Context drift detection**

**Fix Required:**
```typescript
// Track context quality over time
class ContextDriftDetector {
  private baseline: Map<string, number> = new Map();
  
  async checkDrift(sessionId: string, phase: SessionPhase): Promise<void> {
    const context = await getSessionContext(sessionId);
    const metrics = {
      size: context.length,
      uniqueFiles: countUniqueFiles(context),
      taskIds: extractTaskIds(context).size,
      planningKeywords: countPlanningKeywords(context),
    };
    
    // Store baseline on first task
    if (!this.baseline.has(phase)) {
      this.baseline.set(phase, metrics.size);
      return;
    }
    
    // Alert on drift
    const baselineSize = this.baseline.get(phase)!;
    const growth = (metrics.size - baselineSize) / baselineSize;
    
    if (growth > 0.5) {
      throw new Error(
        `Context drift detected in ${phase}: grew ${(growth * 100).toFixed(1)}% from baseline`
      );
    }
    
    if (metrics.taskIds > 1) {
      throw new Error(`Cross-task contamination: ${metrics.taskIds} task IDs found`);
    }
  }
}
```

**Impact:** HIGH - Context drift will happen silently and degrade all output quality.

---

## Comparison: IMPLEMENTATION_PLAN.md vs IMPLEMENTATION_PLAN_FINAL.md

### Structure

**IMPLEMENTATION_PLAN.md (Phased approach):**
- ✅ Clear progression: MVP → Automation → Optimization → Factory
- ✅ Phase 4 (Factory Pattern) is most aligned with fucory-guidelines
- ⚠️ Rebase engine comes late (Phase 3)
- ⚠️ Context engineering comes late (Phase 3)

**IMPLEMENTATION_PLAN_FINAL.md (Plugin approach):**
- ✅ Context engineering is Phase 3 (earlier)
- ✅ Planning subagents are Phase 1 (core from start)
- ❌ No factory pattern phase
- ⚠️ More code-centric, less spec-centric

**Winner:** IMPLEMENTATION_PLAN.md has better long-term vision (factory pattern)

### Context Hygiene

**IMPLEMENTATION_PLAN.md:**
```typescript
// Phase 3: Context Compression Plugin
export const ContextCompressor: Plugin = async (ctx) => {
  return {
    "experimental.session.compacting": async (input, output) => {
      // Inject compression rules
      output.context.push(`
## Context Compression Rules
Keep ONLY: ...
Discard: ...
      `)
    }
  }
}
```
✅ Uses OpenCode's native compaction hooks

**IMPLEMENTATION_PLAN_FINAL.md:**
```typescript
// Manual compression via agent
const session = await opencode.client.session.create({
  body: { title: `Compress Context - ${task.id}`, agent: "compressor" }
});
```
⚠️ Adds extra LLM call (cost + latency)

**Winner:** IMPLEMENTATION_PLAN.md is more efficient

### Prompt Rebasing

**IMPLEMENTATION_PLAN.md:**
- Phase 3 has full `RebaseEngine` class
- Analyzes failures and improves specs
- Tracks "messy run" indicators

**IMPLEMENTATION_PLAN_FINAL.md:**
- Has `rebaseCommand` tool
- Only triggered on failure
- Less integrated into workflow

**Winner:** IMPLEMENTATION_PLAN.md is more comprehensive

### Factory Pattern

**IMPLEMENTATION_PLAN.md:**
- Phase 4 explicitly builds "Factory Pattern"
- Specs are versioned
- Regenerator can rebuild entire codebase
- Multi-project orchestration

**IMPLEMENTATION_PLAN_FINAL.md:**
- No factory pattern phase
- Focuses on single-project workflow
- Specs are not treated as primary artifacts

**Winner:** IMPLEMENTATION_PLAN.md strongly aligned with fucory-guidelines endgame

---

## Alignment with fucory-guidelines Principles

### 1. Delete Incorrect Context

**IMPLEMENTATION_PLAN.md:** ⚠️ Mentions but no verification  
**IMPLEMENTATION_PLAN_FINAL.md:** ⚠️ Deletes sessions but no confirmation

**Fucory-guidelines compliance:** 60% - Concept is there, execution is weak

### 2. Add Missing Context

**IMPLEMENTATION_PLAN.md:** ✅ Verification gates (tests, lint, typecheck)  
**IMPLEMENTATION_PLAN_FINAL.md:** ✅ Tool outputs feed back into context

**Fucory-guidelines compliance:** 80% - Good, but missing instrumentation health checks

### 3. Remove Useless Context

**IMPLEMENTATION_PLAN.md:** ✅ Fresh sessions per task, compression plugin  
**IMPLEMENTATION_PLAN_FINAL.md:** ✅ Session deletion, compression

**Fucory-guidelines compliance:** 70% - Good concept, weak verification

### 4. Compress

**IMPLEMENTATION_PLAN.md:** ✅ Native compaction hooks, <3KB target  
**IMPLEMENTATION_PLAN_FINAL.md:** ⚠️ LLM-based compression (adds overhead)

**Fucory-guidelines compliance:** 75% - Compression exists, but underspecified rules

### 5. Prompt Rebasing

**IMPLEMENTATION_PLAN.md:** ✅ RebaseEngine, messy-run detection  
**IMPLEMENTATION_PLAN_FINAL.md:** ⚠️ Rebase agent, reactive only

**Fucory-guidelines compliance:** 60% - Needs to be more proactive and central

### 6. Subagents as Garbage Collectors

**IMPLEMENTATION_PLAN.md:** ✅ Planning agents discard context  
**IMPLEMENTATION_PLAN_FINAL.md:** ✅ Planning subagents with session deletion

**Fucory-guidelines compliance:** 85% - STRONG, this is well-designed

### 7. Factory Pattern

**IMPLEMENTATION_PLAN.md:** ✅ Phase 4 explicitly builds this  
**IMPLEMENTATION_PLAN_FINAL.md:** ❌ No factory pattern

**Fucory-guidelines compliance:** 
- IMPLEMENTATION_PLAN.md: 90% ✅
- IMPLEMENTATION_PLAN_FINAL.md: 20% ❌

### 8. Real Feedback Loops

**IMPLEMENTATION_PLAN.md:** ⚠️ Tests/lint/typecheck, but no health checks  
**IMPLEMENTATION_PLAN_FINAL.md:** ⚠️ Verification exists, but no broken-instrumentation protection

**Fucory-guidelines compliance:** 50% - CRITICAL GAP

---

## Recommendations

### Critical (Must Fix)

1. **Add Context Verification Gates**
   - Verify sessions are actually deleted
   - Scan for planning debris before implementation
   - Check context size at phase transitions

2. **Add Instrumentation Health Checks**
   - Verify test runner works before starting
   - Validate linter/typecheck output format
   - Run smoke tests to confirm feedback is real

3. **Specify Compression Rules Explicitly**
   - Document exact format for patterns (file:lines only)
   - Set hard character limits per section
   - Enforce at build-time, not just compress-time

### High Priority

4. **Make Prompt Rebasing Proactive**
   - Detect "messy runs" even when successful
   - Recommend rebase based on metrics (context size, attempts, duration)
   - Track specs as versioned artifacts

5. **Add Context Drift Detection**
   - Monitor context growth over time
   - Alert on cross-task contamination
   - Track baseline metrics per phase

### Medium Priority

6. **Merge Strategy for Planning Outputs**
   - Use structured merge (no LLM) for speed
   - Define section extraction rules
   - Validate merged output format

7. **Use Native Compaction Hooks**
   - Prefer OpenCode's built-in compaction over LLM-based
   - Inject compression rules at session level
   - Reduce cost and latency

---

## Recommended Unified Approach

**Combine the best of both:**

### Phase 1: Foundation (Week 1-2)
- Use **IMPLEMENTATION_PLAN_FINAL.md** plugin structure ✅
- Use **IMPLEMENTATION_PLAN.md** native compaction hooks ✅
- Add **context verification gates** ⭐ NEW

### Phase 2: Core Workflow (Week 2-3)
- Planning subagents (both plans have this) ✅
- Backlog system (both plans have this) ✅
- Add **instrumentation health checks** ⭐ NEW

### Phase 3: Context Engineering (Week 3-4)
- Use **IMPLEMENTATION_PLAN.md** compression plugin ✅
- Add **context drift detection** ⭐ NEW
- Add **explicit compression rules** ⭐ NEW

### Phase 4: Quality & Scale (Week 4-6)
- Use **IMPLEMENTATION_PLAN.md** RebaseEngine ✅
- Use **IMPLEMENTATION_PLAN.md** Factory Pattern ✅
- Make rebasing proactive ⭐ NEW
- Multi-project orchestration ✅

---

## Final Verdict

**Overall Alignment with fucory-guidelines:**

| Plan | Alignment Score | Strengths | Weaknesses |
|------|----------------|-----------|------------|
| IMPLEMENTATION_PLAN.md | 75% | Factory pattern, Rebase engine, Long-term vision | Late context engineering, Weak verification |
| IMPLEMENTATION_PLAN_FINAL.md | 65% | Early context engineering, Clean plugin structure | No factory pattern, Reactive rebasing |

**Critical Gaps in Both Plans:**
1. ❌ No context verification (HIGH IMPACT)
2. ❌ No instrumentation health checks (CRITICAL)
3. ⚠️ Weak prompt rebasing integration (MEDIUM)
4. ⚠️ Underspecified compression rules (MEDIUM)
5. ❌ No context drift detection (HIGH)

**Recommended Approach:**
- Start with **IMPLEMENTATION_PLAN_FINAL.md** structure (plugin-based)
- Adopt **IMPLEMENTATION_PLAN.md** Phase 4 (Factory Pattern)
- Add **7 critical fixes** listed above
- Prioritize verification and health checks from Day 1

**Key Insight from fucory-guidelines:**
> "In practice, the best practitioners are not prompt writers; 
> they are feedback loop engineers."

Both plans focus heavily on agents and workflows. They need more focus on **verification that the context engineering is actually working** - measuring, monitoring, and protecting the feedback loops.

---

## Next Steps

1. **Immediate:** Add context verification to Phase 1
2. **Week 1:** Implement instrumentation health checks
3. **Week 2:** Define explicit compression rules with tests
4. **Week 3:** Add context drift monitoring
5. **Week 4:** Integrate proactive prompt rebasing
6. **Week 5-6:** Build factory pattern (specs as primary artifacts)

The philosophy is sound. The execution needs tightening.

