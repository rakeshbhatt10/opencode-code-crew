# Implementation Plan V2 - What Was Fixed

> **A comprehensive breakdown of the 7 critical issues addressed in V2**

---

## Overview

Implementation Plan V2 addresses all 7 critical issues identified in the [Implementation Plan Review](IMPLEMENTATION_PLAN_REVIEW.md), transforming the plan from "suggested best practices" to **enforced, verified guarantees**.

---

## Critical Issues Fixed

### ❌ Issue 1: No Context Verification After Planning
**Original Problem:**
- Planning sessions were deleted but never verified
- No scanning for planning debris in implementation context
- No size checks before phase transitions

**✅ V2 Solution:**
```typescript
// ContextVerifier.verifyClean() - enforced at every phase transition
async verifyClean(sessionId: string, phase: "implementation" | "review"): Promise<ContextMetrics> {
  const context = await this.getSessionContext(sessionId);
  
  // Throws if:
  // 1. Context > 3KB
  // 2. Planning keywords detected (e.g., "we explored", "three options")
  // 3. Multiple task IDs found (cross-contamination)
  // 4. Full file contents detected (should be paths only)
}

// ContextVerifier.verifyDeleted() - confirms session is gone
await verifier.verifyDeleted(sessionId);  // Throws if session still exists
```

**Impact:** Zero planning debris in implementation phase (verified, not assumed).

---

### ❌ Issue 2: No Protection Against Broken Feedback Loops
**Original Problem:**
- Could start verification loops with broken instrumentation
- No health checks on test runner, linter, or type checker
- Would waste time and cost on broken tooling

**✅ V2 Solution:**
```typescript
// InstrumentationChecker.verifyHealthy() - BEFORE any feedback loop
const healthChecker = new InstrumentationChecker();
await healthChecker.verifyHealthy(args.work_dir);

// Checks:
// 1. Test runner responds and passes smoke test
// 2. Linter installed and works on known-clean file
// 3. Type checker installed and works on known-valid file
```

**Impact:** Never waste LLM tokens on broken instrumentation.

---

### ❌ Issue 3: Planning Output Merge Uses LLM
**Original Problem:**
- Used LLM to merge 3 planning docs (adds cost, latency, variability)
- Introduced more context than necessary
- Non-deterministic output

**✅ V2 Solution:**
```typescript
// Structured merge - NO LLM overhead
async function structuredMerge(spec: string, arch: string, qa: string, outputFile: string): Promise<string> {
  const merged = `# Unified Plan

## 1. Product Specification
${extractSection(spec, "## Requirements", "## ")}

## 2. Acceptance Criteria
${extractSection(spec, "## Acceptance", "## ")}

// ... deterministic extraction and combination
`;
  
  return merged;
}
```

**Impact:** 
- Zero LLM calls for merge (instant, deterministic)
- Cleaner output (only relevant sections)
- No merge-related context pollution

---

### ❌ Issue 4: Prompt Rebasing Not Deeply Integrated
**Original Problem:**
- Only mentioned in one workflow diagram
- No automatic detection of "messy runs"
- Reactive (only on failure), not proactive

**✅ V2 Solution:**
```typescript
// RebaseEngine.shouldRebase() - proactive detection
async shouldRebase(task: BacklogTask, result: TaskResult): Promise<boolean> {
  const messyIndicators = [
    { check: result.attempts > 1, reason: "Multiple attempts" },
    { check: result.contextSize > 5000, reason: "Bloated context" },
    { check: result.duration > task.scope.estimated_hours * 60 * 2, reason: "Took too long" },
    { check: result.logs.includes("retrying"), reason: "Self-debugging detected" },
    { check: result.commits > 3, reason: "Too many commits" },
    { check: !result.success, reason: "Task failed" },
  ];
  
  // Rebase even on success if run was messy!
}

// RebaseEngine.improveSpec() - generates improved spec from execution learnings
const improved = await rebaseEngine.improveSpec(task, result);
```

**Impact:** Proactive quality improvement - specs get better over time.

---

### ❌ Issue 5: Context Compression Rules Not Enforced
**Original Problem:**
- Compression guidelines were "suggested" not enforced
- No hard size limits
- No format validation for patterns/constraints

**✅ V2 Solution:**
```typescript
// ContextCompressor with STRICT enforcement
export class ContextCompressor {
  private readonly budget = {
    spec: 600,       // chars for description
    acceptance: 400, // chars for all acceptance criteria
    constraints: 250, // chars for all constraints (max 5)
    patterns: 500,   // chars for all patterns (format: "file:lines - desc")
    gotchas: 250,    // chars for all gotchas (max 3)
  };
  
  private readonly maxSize = 3000; // 3KB HARD LIMIT
  
  buildTaskContext(task: BacklogTask): string {
    const context = /* ... build compressed context ... */;
    
    // ENFORCE hard limit
    if (context.length > this.maxSize) {
      throw new Error(`Task context too large: ${context.length} bytes (max: ${this.maxSize})`);
    }
    
    return context;
  }
}

// Pattern format validation
if (!pattern.match(/^[\w\/\.\-]+:\d+-\d+\s*-\s*.+$/)) {
  throw new Error(`Invalid pattern format: "${pattern}". Expected: "file.ts:45-78 - description"`);
}
```

**Impact:** All task contexts guaranteed <3KB, no exceptions.

---

### ❌ Issue 6: No Instrumentation Health Checks Before Verification
**Original Problem:**
- Could start "test → fix → test" loops with broken tests
- Would blame code when tests were misconfigured
- Wasted LLM cycles on tooling issues

**✅ V2 Solution:**
```typescript
// Health check FIRST, before any verification loop
console.log("🏥 Running instrumentation health checks...");
const healthChecker = new InstrumentationChecker();
await healthChecker.verifyHealthy(args.work_dir);  // Throws if broken
console.log("✓ All instrumentation healthy");

// THEN start implementation
```

**Impact:** Catch tooling issues before they poison the feedback loop.

---

### ❌ Issue 7: No Context Drift Detection
**Original Problem:**
- No monitoring of context growth during execution
- No alerts when context gets polluted
- Could accumulate garbage undetected

**✅ V2 Solution:**
```typescript
// ContextDriftDetector - continuous monitoring
export class ContextDriftDetector {
  private baselines: Map<string, ContextMetrics> = new Map();
  private readonly maxGrowth = 0.5; // 50% growth triggers alert
  
  async checkDrift(taskId: string, phase: string, metrics: ContextMetrics): Promise<void> {
    const baseline = this.baselines.get(phase)!;
    const growth = (metrics.size - baseline.size) / baseline.size;
    
    // Throw if drift exceeds threshold
    if (growth > this.maxGrowth) {
      throw new Error(`Context drift detected: ${(growth * 100).toFixed(1)}% growth`);
    }
    
    // Throw on cross-task contamination
    if (metrics.taskIds.size > 1) {
      throw new Error(`Cross-task contamination: ${[...metrics.taskIds].join(", ")}`);
    }
  }
}

// Used during implementation
await driftDetector.checkDrift(task.id, "implementation", metrics);
```

**Impact:** Detect and stop context pollution in real-time.

---

## Key Philosophy Shifts

### From "Suggested" to "Enforced"

| V1 Approach | V2 Approach |
|-------------|-------------|
| "Should compress context" | **Throws if context > 3KB** |
| "Try to delete sessions" | **Verifies deletion succeeded** |
| "Avoid planning debris" | **Scans and blocks if found** |
| "Rebase on failure" | **Rebases on messy runs (even success)** |
| "Check instrumentation" | **Health checks BEFORE any loop** |

### From "Reactive" to "Proactive"

| V1 Timing | V2 Timing |
|-----------|-----------|
| Rebase after failure | **Rebase on messy run (proactive)** |
| Fix broken tests when found | **Health check BEFORE starting** |
| Notice drift eventually | **Monitor and alert in real-time** |

### From "Assumed" to "Verified"

| V1 Assumption | V2 Verification |
|---------------|----------------|
| "Session deleted" | **Confirms session gone (404 check)** |
| "Context is clean" | **Scans for debris and blocks** |
| "Instrumentation works" | **Smoke tests on known-good inputs** |

---

## Success Metrics Comparison

### V1 Metrics (Aspirational)
- Planning context in implementation: **"should be 0%"**
- Task context size: **"<3KB suggested"**
- Session reuse: **"avoid"**

### V2 Metrics (Guaranteed)
- Planning context in implementation: **0% (verified by scanning)**
- Task context size: **<3KB (enforced, throws if exceeded)**
- Session reuse: **0 (verified deletion with 404 check)**
- Planning debris: **0 (scanned and blocked)**
- Cross-task contamination: **0 (detected and blocked)**
- Instrumentation health: **100% (checked before every loop)**

---

## Timeline Improvement

**V1:** 8 weeks (4 phases × 2 weeks)  
**V2:** 6 weeks (faster due to structured merge and better verification)

**Breakdown:**
- Phase 1: Foundation + Verification (2 weeks)
- Phase 2: Backlog + Health Checks (1 week)
- Phase 3: Context Engineering + Monitoring (1 week)
- Phase 4: Proactive Rebasing + Factory (2 weeks)

**Why faster:**
- Structured merge eliminates LLM call (saves time in every planning run)
- Early health checks prevent wasted debugging time
- Context verification catches issues sooner

---

## Cost Improvement

### V1 Estimated Costs
- Planning: $0 (Gemini free tier)
- **Planning merge: ~$0.20/run (GPT-4 to merge 3 docs)** ❌
- Implementation: ~$2-5/task
- **Broken feedback loops: unknown (could be high)** ⚠️

### V2 Guaranteed Costs
- Planning: $0 (Gemini free tier) ✅
- **Planning merge: $0 (structured, no LLM)** ✅
- Implementation: ~$2-5/task ✅
- **Broken feedback loops: $0 (health checks prevent)** ✅

**Estimated savings:** ~$0.20/run + prevention of broken loop costs

---

## Code Quality Improvements

### Verification Gate Example

**Before (V1):**
```typescript
// Delete planning sessions
await Promise.all([
  opencode.client.session.delete({ path: { id: specSession.id } }),
  opencode.client.session.delete({ path: { id: archSession.id } }),
  opencode.client.session.delete({ path: { id: qaSession.id } }),
]);
// Hope it worked! 🤞
```

**After (V2):**
```typescript
// Delete planning sessions
await Promise.all([
  opencode.client.session.delete({ path: { id: specSession.id } }),
  opencode.client.session.delete({ path: { id: archSession.id } }),
  opencode.client.session.delete({ path: { id: qaSession.id } }),
]);

// VERIFY deletion succeeded
await Promise.all([
  verifier.verifyDeleted(specSession.id),  // Throws if still exists
  verifier.verifyDeleted(archSession.id),
  verifier.verifyDeleted(qaSession.id),
]);
// Guaranteed clean! ✓
```

### Context Compression Example

**Before (V1):**
```typescript
// "Try to keep context small"
const context = buildTaskContext(task);
// Size: ??? (could be 10KB)
```

**After (V2):**
```typescript
// Enforced <3KB limit
const compressor = new ContextCompressor();
const context = compressor.buildTaskContext(task);  // Throws if > 3KB
// Size: Guaranteed <3KB ✓
```

---

## Testing Improvements

### V1 Testing Approach
```typescript
it("should delete planning sessions", async () => {
  // Just check the function was called
  expect(deleteSpy).toHaveBeenCalledTimes(3);
});
```

### V2 Testing Approach
```typescript
it("should delete and VERIFY planning sessions", async () => {
  await planningPhaseCommand(ctx).execute(args);
  
  // Verify sessions are actually gone (404 check)
  await expect(
    verifier.verifyDeleted("spec-session-id")
  ).resolves.not.toThrow();
  
  // Verify no planning debris
  await expect(
    verifier.verifyClean("worker-session-id", "implementation")
  ).resolves.not.toThrow();
});
```

---

## Migration Path

### For Existing V1 Deployments

**Phase 1: Add verification (non-breaking)**
- Deploy `ContextVerifier` in warning mode
- Log violations without throwing
- Measure baseline

**Phase 2: Enable enforcement (breaking)**
- Switch to throwing on violations
- Fix any caught issues
- Monitor alerts

**Phase 3: Add proactive features**
- Enable drift detection
- Enable proactive rebasing
- Deploy factory pattern

### For New Deployments

Start directly with V2 - all improvements are enabled from day one.

---

## Alignment with Fucory Guidelines

| Guideline | V1 Alignment | V2 Alignment |
|-----------|--------------|--------------|
| **Context Quality = Output Quality** | Mentioned | **Enforced with verification gates** ✅ |
| **Verify, Don't Assume** | Partial | **Complete (deletion, health, drift)** ✅ |
| **Feedback Loops Must Be Real** | Suggested | **Health checks before every loop** ✅ |
| **Proactive Over Reactive** | Missing | **Messy run detection & rebasing** ✅ |
| **Compression Rules** | Suggested | **Enforced with hard limits** ✅ |
| **Session Hygiene** | Attempted | **Verified with 404 checks** ✅ |

---

## Conclusion

Implementation Plan V2 transforms the multi-agent system from a collection of **best practices** into a **verified, enforced system** with strong guarantees.

**Key Takeaway:**  
Instead of *hoping* context stays clean and instrumentation works, V2 **verifies and enforces** at every step.

**Next Steps:**
1. Begin Phase 1 implementation (Foundation + Verification)
2. Deploy verification gates in warning mode first
3. Measure baselines and violations
4. Enable enforcement
5. Add monitoring and alerting

---

## Related Documents

- **[Implementation Plan V2](IMPLEMENTATION_PLAN_V2.md)** - Full implementation details
- **[Implementation Plan Review](IMPLEMENTATION_PLAN_REVIEW.md)** - Detailed issue analysis
- **[Comprehensive Guide](COMPREHENSIVE_GUIDE.md)** - System design principles
- **[Fucory Guidelines](../llm-txt/guidelines/fucory-guidelines.txt)** - Context engineering philosophy

