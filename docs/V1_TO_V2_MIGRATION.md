# Migration Guide: V1 → V2

> **How to upgrade from Implementation Plan V1 to V2**

---

## Overview

This guide helps you migrate from Implementation Plan V1 to V2. The migration is **additive** - V2 includes all V1 features plus verification, so you can adopt it incrementally.

**Migration Timeline:** 2-4 weeks depending on approach

---

## Should You Migrate?

### ✅ Migrate if:
- [x] Building a production system
- [x] Need reliability guarantees
- [x] Want to reduce costs (structured merge)
- [x] Want to prevent broken feedback loops
- [x] Need proactive quality improvement
- [x] Want faster timeline (6 weeks vs 8)

### ⚠️ Stay on V1 if:
- [ ] Still in early R&D phase
- [ ] Just learning the concepts
- [ ] Not ready for stricter enforcement
- [ ] Content with current reliability

**Recommendation:** Migrate for any production deployment.

---

## Migration Strategies

### Option 1: Gradual Migration (Recommended)

**Best for:** Existing V1 deployments with active development

**Timeline:** 4 weeks

**Approach:** Add verification layers one at a time in warning mode, then enable enforcement.

---

### Option 2: Clean Slate

**Best for:** New projects or complete rewrites

**Timeline:** 2 weeks

**Approach:** Deploy V2 from scratch, run in parallel with V1 temporarily.

---

### Option 3: Hybrid

**Best for:** Large teams with multiple workstreams

**Timeline:** 3 weeks

**Approach:** V2 for new features, gradually migrate existing V1 features.

---

## Gradual Migration Plan (Option 1)

### Week 1: Add Verification Infrastructure

**Goal:** Deploy verification components in warning mode (log, don't throw)

#### Step 1.1: Add ContextVerifier

**File:** `src/verification/contextVerifier.ts`

Copy the complete `ContextVerifier` class from [IMPLEMENTATION_PLAN_V2.md](./IMPLEMENTATION_PLAN_V2.md#step-12-context-verification-system).

**Modify for warning mode:**

```typescript
async verifyClean(sessionId: string, phase: string): Promise<ContextMetrics> {
  const metrics = this.analyzeContext(context);
  
  // V1 → V2 MIGRATION: Log warnings instead of throwing
  if (metrics.size > this.maxContextSize) {
    console.warn(`⚠️  Context size: ${metrics.size} (max: ${this.maxContextSize})`);
  }
  
  if (metrics.planningKeywords > 0) {
    console.warn(`⚠️  Planning debris detected: ${metrics.planningKeywords} keywords`);
  }
  
  // ... etc (log all violations)
  
  return metrics;
}
```

#### Step 1.2: Integrate into Planning Phase

**File:** `src/commands/planning.ts`

```typescript
// Add at end of planning phase
const verifier = new ContextVerifier();

// Log metrics (don't throw yet)
for (const sessionId of [specSession.id, archSession.id, qaSession.id]) {
  try {
    await verifier.verifyDeleted(sessionId);
    console.log(`✓ Session ${sessionId} deleted successfully`);
  } catch (error) {
    console.warn(`⚠️  Session ${sessionId} still exists!`, error);
  }
}
```

#### Step 1.3: Measure Baseline

Run your existing V1 system for 1 week with verification in warning mode.

**Collect metrics:**
```bash
# Extract warnings from logs
grep "⚠️" logs/*.log | sort | uniq -c > baseline-violations.txt

# Analyze
cat baseline-violations.txt
```

**Example output:**
```
23 ⚠️  Context size: 4521 (max: 3000)
12 ⚠️  Planning debris detected: 2 keywords
5  ⚠️  Session still exists after deletion
```

#### Step 1.4: Fix Critical Issues

Before enabling enforcement, fix issues that appear frequently:

**High context sizes:**
- Review task specs - are they too verbose?
- Check if full files are being included
- Apply compression rules manually

**Planning debris:**
- Ensure planning sessions are being deleted
- Check merge implementation
- Verify no planning context in task contexts

**Session leaks:**
- Check session.delete() calls
- Verify no errors during deletion
- Add proper error handling

### Week 2: Enable Context Enforcement

**Goal:** Enable throwing on context violations

#### Step 2.1: Switch to Enforcement Mode

**File:** `src/verification/contextVerifier.ts`

```typescript
async verifyClean(sessionId: string, phase: string): Promise<ContextMetrics> {
  const metrics = this.analyzeContext(context);
  
  // V2 MODE: Throw on violations (was: warn only)
  if (metrics.size > this.maxContextSize) {
    throw new Error(
      `Context too large: ${metrics.size} bytes (max: ${this.maxContextSize})`
    );
  }
  
  // ... etc (throw on all violations)
}
```

#### Step 2.2: Add Graceful Degradation

Handle verification failures gracefully during transition:

```typescript
try {
  await verifier.verifyClean(sessionId, "implementation");
} catch (error) {
  console.error("Context verification failed:", error);
  
  // V1 → V2 MIGRATION: Log and alert, but continue
  await sendAlert("Context verification failed", error);
  
  // Track failures for review
  await logVerificationFailure(sessionId, error);
  
  // Continue with implementation (V1 behavior)
  // TODO: Make this throw after 2-week transition period
}
```

#### Step 2.3: Monitor & Fix

Run for 1 week with enforcement enabled but graceful degradation.

**Daily review:**
```bash
# Check verification failures
grep "Context verification failed" logs/*.log | wc -l

# Review specific failures
tail -f logs/verification-failures.log
```

**Fix issues as they arise:**
- Update task specs to be more concise
- Improve compression rules
- Fix session cleanup

### Week 3: Add Health Checks & Drift Detection

**Goal:** Add instrumentation validation and context monitoring

#### Step 3.1: Deploy InstrumentationChecker

**File:** `src/verification/instrumentationChecker.ts`

Copy the complete `InstrumentationChecker` class from [IMPLEMENTATION_PLAN_V2.md](./IMPLEMENTATION_PLAN_V2.md#step-13-instrumentation-health-checks).

**Integrate into implementation phase:**

```typescript
// Before starting any worker
console.log("🏥 Running instrumentation health checks...");
const healthChecker = new InstrumentationChecker();

try {
  await healthChecker.verifyHealthy(args.work_dir);
  console.log("✓ All instrumentation healthy");
} catch (error) {
  console.error("❌ Instrumentation health check failed:", error);
  
  // Block implementation if instrumentation is broken
  throw new Error(
    "Cannot start implementation with broken instrumentation. " +
    "Fix the following issues:\n" + error.message
  );
}
```

#### Step 3.2: Deploy ContextDriftDetector

**File:** `src/monitoring/contextDriftDetector.ts`

Copy the complete `ContextDriftDetector` class from [IMPLEMENTATION_PLAN_V2.md](./IMPLEMENTATION_PLAN_V2.md#step-31-context-drift-detector).

**Integrate into worker lifecycle:**

```typescript
const driftDetector = new ContextDriftDetector();

// After each worker iteration
const metrics = await verifier.verifyClean(sessionId, "implementation");
await driftDetector.checkDrift(task.id, "implementation", metrics);
```

#### Step 3.3: Add Monitoring Dashboard

```typescript
// Periodic drift report
setInterval(() => {
  console.log(driftDetector.getReport());
}, 60000); // Every minute
```

### Week 4: Add Proactive Rebasing

**Goal:** Enable automatic detection of messy runs and proactive rebasing

#### Step 4.1: Deploy RebaseEngine

**File:** `src/rebasing/rebaseEngine.ts`

Copy the complete `RebaseEngine` class from [IMPLEMENTATION_PLAN_V2.md](./IMPLEMENTATION_PLAN_V2.md#step-41-proactive-rebase-engine).

#### Step 4.2: Integrate into Task Completion

```typescript
// After task completion (success or failure)
const rebaseEngine = new RebaseEngine();

const result: TaskResult = {
  attempts: task.attempts,
  contextSize: finalContextSize,
  duration: elapsedMinutes,
  commits: commitCount,
  logs: taskLogs,
  success: task.status === "completed",
};

// Check if rebase recommended (even on success!)
const shouldRebase = await rebaseEngine.shouldRebase(task, result);

if (shouldRebase) {
  console.log(`🔄 Rebase recommended for ${task.id}`);
  
  // Improve spec based on execution
  const improvedSpec = await rebaseEngine.improveSpec(task, result);
  
  // Update backlog with improved spec
  await backlog.updateTask(task.id, improvedSpec);
  
  // Clear implementation
  await cleanupWorktree(task.id);
  
  // Restart with fresh context and improved spec
  console.log(`♻️  Regenerating ${task.id} with improved spec...`);
  await spawnWorker(task.id);
}
```

#### Step 4.3: Track Rebase Effectiveness

```typescript
// Log rebase metrics
interface RebaseMetrics {
  totalRebases: number;
  successAfterRebase: number;
  failureAfterRebase: number;
  avgImprovementTime: number;
}

const metrics = trackRebaseMetrics();
console.log("Rebase effectiveness:", metrics);
```

---

## Clean Slate Migration (Option 2)

### Week 1: Deploy V2 in Parallel

**Goal:** Run V2 alongside V1 for comparison

#### Step 1: Set Up V2 Environment

```bash
# Clone or create new directory
mkdir -p multi-agent-v2
cd multi-agent-v2

# Copy V2 code from IMPLEMENTATION_PLAN_V2.md
# ... (follow Phase 1 implementation)
```

#### Step 2: Mirror V1 Configuration

```typescript
// Use same model configs, API keys, work directories
// Point at same codebase but different output directories

const v1OutputDir = "tasks/v1";
const v2OutputDir = "tasks/v2";
```

#### Step 3: Run Both in Parallel

```bash
# Terminal 1: V1 system
cd multi-agent-v1
npm run conductor

# Terminal 2: V2 system
cd multi-agent-v2
npm run conductor

# Compare outputs
diff -r tasks/v1 tasks/v2
```

### Week 2: Compare & Switch

**Metrics to compare:**

| Metric | V1 | V2 | Winner |
|--------|----|----|--------|
| Planning time | ? | ? | ? |
| Merge cost | $0.20 | $0 | V2 |
| Context size | ? | <3KB (enforced) | V2 |
| Broken loops | ? | 0 (prevented) | V2 |
| Success rate | ? | ? | ? |

**Switch criteria:**
- V2 success rate ≥ V1 success rate
- No critical bugs in V2
- Team comfortable with V2

**Switch over:**
```bash
# Archive V1
mv multi-agent-v1 multi-agent-v1-archive

# Promote V2
mv multi-agent-v2 multi-agent

# Update all references
```

---

## Hybrid Migration (Option 3)

### Week 1: New Features on V2

**Goal:** All new feature development uses V2

```typescript
// Routing logic
function getConductor(feature: Feature) {
  if (feature.createdAt > migrationCutoffDate) {
    return v2Conductor;  // V2 for new features
  } else {
    return v1Conductor;  // V1 for existing
  }
}
```

### Week 2-3: Migrate Existing Features

**Priority order:**
1. Features with context issues (migrate first)
2. Features with high rebase rate
3. Features with broken feedback loops
4. Stable features (migrate last)

**Migration process per feature:**
```typescript
async function migrateFeature(featureId: string) {
  // 1. Export V1 state
  const v1State = await v1Conductor.exportFeature(featureId);
  
  // 2. Transform to V2 format (add verification metadata)
  const v2State = transformToV2(v1State);
  
  // 3. Import into V2
  await v2Conductor.importFeature(featureId, v2State);
  
  // 4. Verify
  await v2Conductor.verifyFeature(featureId);
  
  // 5. Run parallel for 1 day
  await runParallel(featureId, v1Conductor, v2Conductor);
  
  // 6. Compare outputs
  const comparison = compareOutputs(featureId);
  
  // 7. Switch if successful
  if (comparison.v2Success >= comparison.v1Success) {
    await switchToV2(featureId);
  }
}
```

---

## Migration Checklist

### Pre-Migration
- [ ] Read [IMPLEMENTATION_PLAN_V2.md](./IMPLEMENTATION_PLAN_V2.md)
- [ ] Read [IMPLEMENTATION_V2_FIXES.md](./IMPLEMENTATION_V2_FIXES.md)
- [ ] Understand what changed
- [ ] Choose migration strategy (Gradual, Clean Slate, or Hybrid)
- [ ] Set migration timeline
- [ ] Communicate to team

### Week 1 (Gradual) or Week 1 (Clean Slate)
- [ ] Deploy `ContextVerifier` in warning mode
- [ ] Measure baseline violations
- [ ] Fix critical issues
- [ ] Monitor metrics daily

### Week 2
- [ ] Enable context enforcement
- [ ] Add graceful degradation
- [ ] Monitor failures
- [ ] Fix issues as they arise

### Week 3
- [ ] Deploy `InstrumentationChecker`
- [ ] Deploy `ContextDriftDetector`
- [ ] Add monitoring dashboard
- [ ] Review drift reports

### Week 4
- [ ] Deploy `RebaseEngine`
- [ ] Enable proactive rebasing
- [ ] Track rebase effectiveness
- [ ] Measure quality improvement

### Post-Migration
- [ ] Remove V1 code (archive first)
- [ ] Update documentation
- [ ] Train team on V2 features
- [ ] Monitor long-term metrics
- [ ] Share learnings

---

## Breaking Changes

### None (Additive Migration)

V2 is **100% backwards compatible** with V1. All changes are additive:

| V1 Feature | V2 Status | Notes |
|------------|-----------|-------|
| Planning agents | ✅ Same | Plus verification |
| Backlog generation | ✅ Same | Plus validation |
| Worker spawning | ✅ Same | Plus health checks |
| Model routing | ✅ Same | No changes |
| Context building | ✅ Same | Plus enforcement |

**Migration is safe** - you can roll back at any point.

---

## Rollback Plan

If you need to rollback from V2 to V1:

### Step 1: Disable Enforcement

```typescript
// In contextVerifier.ts
const MIGRATION_MODE = true;  // Enable this flag

async verifyClean(...) {
  if (MIGRATION_MODE) {
    // Just warn, don't throw
    console.warn("Verification failed (migration mode - continuing)");
    return metrics;
  }
  // Normal V2 behavior
}
```

### Step 2: Restore V1 Code

```bash
# Restore from archive
cp -r multi-agent-v1-archive/* ./
```

### Step 3: Resume V1 Operations

```bash
# Start V1 conductor
npm run conductor
```

---

## Testing During Migration

### Unit Tests

```typescript
describe("V1 → V2 Migration", () => {
  it("should maintain V1 behavior in warning mode", async () => {
    const verifier = new ContextVerifier({ warningMode: true });
    
    // Should not throw (V1 behavior)
    await expect(
      verifier.verifyClean(largeContext, "implementation")
    ).resolves.not.toThrow();
  });
  
  it("should enforce V2 behavior in enforcement mode", async () => {
    const verifier = new ContextVerifier({ warningMode: false });
    
    // Should throw (V2 behavior)
    await expect(
      verifier.verifyClean(largeContext, "implementation")
    ).rejects.toThrow("Context too large");
  });
});
```

### Integration Tests

```typescript
describe("Parallel V1/V2 Execution", () => {
  it("should produce equivalent outputs", async () => {
    const feature = createTestFeature();
    
    // Run both
    const v1Output = await v1Conductor.process(feature);
    const v2Output = await v2Conductor.process(feature);
    
    // Compare (ignore verification metadata)
    expect(normalizeOutput(v1Output)).toEqual(normalizeOutput(v2Output));
  });
});
```

---

## Common Migration Issues

### Issue 1: Context Size Violations

**Symptom:** Many tasks fail with "Context too large"

**Solution:**
```typescript
// Temporarily increase limit during migration
const contextVerifier = new ContextVerifier({
  maxSize: 5000,  // Temporarily higher (was 3000)
});

// Gradually reduce over 2 weeks
setTimeout(() => contextVerifier.maxSize = 4000, WEEK);
setTimeout(() => contextVerifier.maxSize = 3000, WEEK * 2);
```

### Issue 2: Health Checks Fail on Existing Projects

**Symptom:** Health checks fail because tests/linter not set up

**Solution:**
```typescript
// Make health checks optional during migration
const healthChecker = new InstrumentationChecker({
  optional: ["linter", "typeChecker"],  // Only require test runner
});
```

### Issue 3: Session Deletion Fails

**Symptom:** Session deletion verification throws errors

**Solution:**
```typescript
// Add retry logic
async function deleteAndVerify(sessionId: string, retries = 3): Promise<void> {
  await opencode.client.session.delete({ path: { id: sessionId } });
  
  for (let i = 0; i < retries; i++) {
    try {
      await verifier.verifyDeleted(sessionId);
      return;  // Success
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(1000);  // Wait and retry
    }
  }
}
```

---

## Success Metrics

Track these metrics during and after migration:

### Context Quality (Should Improve)
- Average context size: `______` → `<3KB`
- Planning debris incidents: `______` → `0`
- Cross-task contamination: `______` → `0`

### Reliability (Should Improve)
- Broken feedback loop rate: `______` → `0%`
- First-attempt success rate: `______` → `>70%`
- Context drift incidents: `______` → `0`

### Cost (Should Improve)
- Planning merge cost: `$0.20/run` → `$0`
- Broken loop waste: `$______` → `$0`
- Total cost per feature: `$______` → `(lower)`

### Timeline (Should Improve)
- Average feature completion: `______` → `(faster)`
- Time in broken loops: `______` → `0 min`

---

## Post-Migration

### Week 1 After Complete Migration

**Monitor closely:**
- Check verification logs daily
- Review drift reports
- Track rebase effectiveness
- Compare to baseline metrics

### Week 2-4 After Migration

**Optimize:**
- Tune context compression rules
- Refine health check thresholds
- Adjust rebase triggers
- Improve task specs based on learnings

### Long-term

**Continuous improvement:**
- Track metrics monthly
- Update verification rules as needed
- Share learnings with team
- Contribute improvements back

---

## Support

### During Migration

**Questions:** Check the comparison guide
- [V1 vs V2 Comparison](./V1_VS_V2_COMPARISON.md)
- [What Was Fixed](./IMPLEMENTATION_V2_FIXES.md)

**Issues:** Review the troubleshooting section
- [IMPLEMENTATION_PLAN_V2.md - Testing](./IMPLEMENTATION_PLAN_V2.md#testing--verification)

**Help:** Reach out
- GitHub Issues
- Discord
- Discussions

---

## Conclusion

The V1 → V2 migration is **safe, additive, and reversible**. You can:

1. **Start slow** - Warning mode first
2. **Monitor carefully** - Track all metrics
3. **Rollback easily** - No breaking changes
4. **Improve gradually** - One feature at a time

**Recommended approach:** Gradual migration over 4 weeks with warning mode → enforcement → health checks → proactive rebasing.

**Good luck with your migration!** 🚀

---

**Related Documents:**
- [Implementation Plan V2](./IMPLEMENTATION_PLAN_V2.md)
- [What Was Fixed](./IMPLEMENTATION_V2_FIXES.md)
- [V1 vs V2 Comparison](./V1_VS_V2_COMPARISON.md)
- [Implementation Review](./IMPLEMENTATION_PLAN_REVIEW.md)

