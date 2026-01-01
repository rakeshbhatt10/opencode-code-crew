# Build Plan: Multi-Agent Coder OpenCode Plugin

> **Practical implementation plan for building the plugin in the root directory**

---

## Project Structure

```
code-agents-workshop/
├── src/                          # Plugin source code
│   ├── index.ts                  # Plugin entry point
│   ├── types.ts                  # Shared types
│   ├── config.ts                 # Configuration
│   ├── core/                     # Core utilities
│   ├── verification/             # Verification layer
│   ├── planning/                 # Planning phase
│   ├── backlog/                  # Backlog management
│   ├── implementation/           # Implementation phase
│   ├── monitoring/               # Monitoring
│   ├── rebasing/                 # Rebasing engine
│   └── factory/                  # Spec repository
├── tests/                        # Test files
├── dist/                         # Compiled output (gitignored)
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── .gitignore                    # Git ignore
├── README.md                     # Plugin README
└── docs/                         # Documentation (keep existing)
```

---

## Phase 1: Project Setup (Week 1, Days 1-2)

### Step 1.1: Initialize Project Structure

**Goal:** Set up the basic project structure and dependencies

**Tasks:**
1. Create `src/` directory structure
2. Set up `package.json` with dependencies
3. Configure TypeScript
4. Set up `.gitignore`

**Commands:**
```bash
# Create directory structure
mkdir -p src/{core,verification,planning,backlog,implementation,monitoring,rebasing,factory}
mkdir -p tests/{unit,integration}

# Initialize package.json (if not exists)
pnpm init

# Install dependencies
pnpm add @opencode-ai/plugin @opencode-ai/sdk js-yaml p-limit p-retry

# Install dev dependencies
pnpm add -D typescript @types/node @types/js-yaml bun-types eslint prettier
```

**Files to Create:**

1. **`package.json`** (update existing):
```json
{
  "name": "@code-agents/multi-agent-coder",
  "version": "1.0.0",
  "description": "Context-engineered multi-agent coding system for OpenCode",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "bun test",
    "lint": "eslint src/",
    "format": "prettier --write src/",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@opencode-ai/plugin": "^1.0.0",
    "@opencode-ai/sdk": "^1.0.0",
    "js-yaml": "^4.1.0",
    "p-limit": "^5.0.0",
    "p-retry": "^6.2.0"
  },
  "devDependencies": {
    "@types/bun": "^1.0.0",
    "@types/js-yaml": "^4.0.9",
    "@types/node": "^20.0.0",
    "bun-types": "^1.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.3.0"
  },
  "keywords": [
    "opencode",
    "plugin",
    "multi-agent",
    "ai",
    "coding"
  ]
}
```

2. **`tsconfig.json`**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "types": ["bun-types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

3. **`.gitignore`** (update existing):
```
# Dependencies
node_modules/

# Build output
dist/
*.tsbuildinfo

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Test output
coverage/
.nyc_output/

# Temporary files
*.log
*.tmp
tmp/

# Generated files
tasks/
worktrees/
specs/
__health_check__/
```

**Success Criteria:**
- [ ] Directory structure created
- [ ] Dependencies installed
- [ ] TypeScript compiles without errors
- [ ] Git ignores build artifacts

---

## Phase 2: Core Infrastructure (Week 1, Days 3-5)

### Step 2.1: Core Types and Config

**Goal:** Define shared types and configuration

**Files to Create:**

1. **`src/types.ts`** - Copy from V3 plan
2. **`src/config.ts`** - Copy from V3 plan

**Commands:**
```bash
# Create files
touch src/types.ts src/config.ts

# Verify compilation
pnpm typecheck
```

### Step 2.2: Core Utilities

**Goal:** Implement retry, rate limiting, shell wrapper, graceful shutdown

**Files to Create:**

1. **`src/core/retry.ts`** - Copy from V3 plan
2. **`src/core/rateLimit.ts`** - Copy from V3 plan
3. **`src/core/shell.ts`** - Copy from V3 plan
4. **`src/core/gracefulShutdown.ts`** - Copy from V3 plan

**Commands:**
```bash
# Create files
touch src/core/{retry,rateLimit,shell,gracefulShutdown}.ts

# Test compilation
pnpm build
```

**Testing:**
```bash
# Create test file
cat > tests/unit/retry.test.ts << 'EOF'
import { describe, it, expect } from "bun:test";
import { withRetry } from "../../src/core/retry";

describe("withRetry", () => {
  it("should retry on failure", async () => {
    let attempts = 0;
    const result = await withRetry(async () => {
      attempts++;
      if (attempts < 3) throw new Error("Fail");
      return "success";
    }, { maxRetries: 3 });
    
    expect(result).toBe("success");
    expect(attempts).toBe(3);
  });
});
EOF

# Run test
pnpm test
```

**Success Criteria:**
- [ ] All core utilities compile
- [ ] Unit tests pass
- [ ] No TypeScript errors

---

## Phase 3: Verification Layer (Week 2, Days 1-2)

### Step 3.1: Context Verifier

**Goal:** Implement context verification with all checks

**Files to Create:**

1. **`src/verification/contextVerifier.ts`** - Copy from V3 plan

**Commands:**
```bash
touch src/verification/contextVerifier.ts
pnpm build
```

**Testing:**
```bash
# Create test
cat > tests/unit/contextVerifier.test.ts << 'EOF'
import { describe, it, expect } from "bun:test";
import { ContextVerifier } from "../../src/verification/contextVerifier";

describe("ContextVerifier", () => {
  it("should detect planning keywords", () => {
    // Test implementation
  });
});
EOF
```

### Step 3.2: Instrumentation Checker

**Goal:** Implement health checks for test runner, linter, type checker

**Files to Create:**

1. **`src/verification/instrumentationChecker.ts`** - Copy from V3 plan

**Commands:**
```bash
touch src/verification/instrumentationChecker.ts
pnpm build
```

**Success Criteria:**
- [ ] Context verifier compiles
- [ ] Instrumentation checker compiles
- [ ] Tests pass

---

## Phase 4: Planning Phase (Week 2, Days 3-5)

### Step 4.1: Structured Merge

**Goal:** Implement deterministic planning output merge

**Files to Create:**

1. **`src/planning/structuredMerge.ts`** - Copy from V3 plan

**Commands:**
```bash
touch src/planning/structuredMerge.ts
pnpm build
```

### Step 4.2: Planning Agents

**Goal:** Implement agent spawning with Gemini configuration

**Files to Create:**

1. **`src/planning/planningAgents.ts`** - Copy from V3 plan

### Step 4.3: Planning Orchestration

**Goal:** Complete planning phase with error handling

**Files to Create:**

1. **`src/planning/planningPhase.ts`** - Copy from V3 plan

**Testing:**
```bash
# Integration test
cat > tests/integration/planning.test.ts << 'EOF'
import { describe, it, expect } from "bun:test";
import { runPlanningPhase } from "../../src/planning/planningPhase";

describe("Planning Phase", () => {
  it("should complete planning with verified cleanup", async () => {
    // Test implementation
  });
});
EOF
```

**Success Criteria:**
- [ ] Planning phase compiles
- [ ] Can spawn 3 agents in parallel
- [ ] Structured merge works
- [ ] Session deletion verified

---

## Phase 5: Backlog Management (Week 3, Days 1-3)

### Step 5.1: Backlog Generator

**Goal:** Generate and validate backlog from plan

**Files to Create:**

1. **`src/backlog/backlogGenerator.ts`** - Copy from V3 plan

### Step 5.2: Backlog Manager

**Goal:** Manage backlog state and dependencies

**Files to Create:**

1. **`src/backlog/backlogManager.ts`** - Copy from V3 plan

### Step 5.3: Context Compressor

**Goal:** Compress task context to <3KB

**Files to Create:**

1. **`src/backlog/contextCompressor.ts`** - Copy from V3 plan

**Testing:**
```bash
# Test backlog generation
cat > tests/integration/backlog.test.ts << 'EOF'
import { describe, it, expect } from "bun:test";
import { BacklogGenerator } from "../../src/backlog/backlogGenerator";

describe("Backlog Generation", () => {
  it("should generate valid backlog", async () => {
    // Test implementation
  });
});
EOF
```

**Success Criteria:**
- [ ] Backlog generation works
- [ ] Schema validation passes
- [ ] Context compression enforces <3KB

---

## Phase 6: Implementation Phase (Week 3-4)

### Step 6.1: Model Router

**Goal:** Route tasks to appropriate models

**Files to Create:**

1. **`src/implementation/modelRouter.ts`** - Copy from V3 plan

### Step 6.2: Worktree Manager

**Goal:** Manage git worktrees for isolation

**Files to Create:**

1. **`src/implementation/worktreeManager.ts`** - Copy from V3 plan

**Testing:**
```bash
# Test worktree creation
git init test-repo
cd test-repo
git commit --allow-empty -m "Initial"
# Test worktree manager
```

### Step 6.3: Implementation Command

**Goal:** Orchestrate parallel implementation

**Files to Create:**

1. **`src/implementation/implementCommand.ts`** - Copy from V3 plan

**Success Criteria:**
- [ ] Model routing works
- [ ] Worktrees created/cleaned up
- [ ] Parallel execution works
- [ ] Health checks run first

---

## Phase 7: Monitoring & Rebasing (Week 4, Days 4-5)

### Step 7.1: Context Drift Detector

**Files to Create:**

1. **`src/monitoring/contextDriftDetector.ts`** - Copy from V3 plan

### Step 7.2: Rebase Engine

**Files to Create:**

1. **`src/rebasing/rebaseEngine.ts`** - Copy from V3 plan

### Step 7.3: Spec Repository

**Files to Create:**

1. **`src/factory/specRepository.ts`** - Copy from V3 plan

**Success Criteria:**
- [ ] Drift detection works
- [ ] Rebase engine detects messy runs
- [ ] Spec repository stores/loads specs

---

## Phase 8: Plugin Entry Point (Week 5, Day 1)

### Step 8.1: Main Plugin File

**Goal:** Create OpenCode plugin interface

**Files to Create:**

1. **`src/index.ts`** - Copy from V3 plan

**Commands:**
```bash
touch src/index.ts
pnpm build
```

**Testing:**
```bash
# Test plugin loading
opencode plugin list
opencode plugin install ./dist
```

**Success Criteria:**
- [ ] Plugin compiles
- [ ] OpenCode recognizes plugin
- [ ] All commands available

---

## Phase 9: Integration Testing (Week 5, Days 2-3)

### Step 9.1: End-to-End Test

**Goal:** Test complete workflow

**Files to Create:**

1. **`tests/integration/fullWorkflow.test.ts`**

```typescript
import { describe, it, expect } from "bun:test";
import { runPlanningPhase } from "../../src/planning/planningPhase";
import { BacklogGenerator } from "../../src/backlog/backlogGenerator";
import { runImplementation } from "../../src/implementation/implementCommand";

describe("Full Workflow", () => {
  it("should complete feature request end-to-end", async () => {
    // 1. Planning
    const planResult = await runPlanningPhase("test-feature.md", "test-output");
    expect(planResult.planFile).toContain("PLAN.md");
    
    // 2. Backlog
    const generator = new BacklogGenerator();
    await generator.generateFromPlan(planResult.planFile, "test-backlog.yaml", "test");
    
    // 3. Implementation
    const results = await runImplementation("test-backlog.yaml", process.cwd());
    expect(results.some(r => r.success)).toBe(true);
  });
});
```

**Success Criteria:**
- [ ] End-to-end test passes
- [ ] All phases work together
- [ ] No memory leaks
- [ ] Cleanup works

---

## Phase 10: Documentation & Polish (Week 5, Days 4-5)

### Step 10.1: Plugin README

**Files to Create:**

1. **`README.md`** (root level)

```markdown
# Multi-Agent Coder - OpenCode Plugin

Context-engineered multi-agent coding system with verified feedback loops.

## Installation

\`\`\`bash
pnpm install
pnpm build
opencode plugin install ./dist
\`\`\`

## Usage

\`\`\`bash
# 1. Planning (Gemini free tier)
opencode run plan --context_file=feature.md

# 2. Backlog generation
opencode run backlog --plan_file=tasks/PLAN.md --track_id=my-feature

# 3. Implementation (parallel)
opencode run implement --backlog_file=tasks/BACKLOG.yaml
\`\`\`

## Features

- ✅ Parallel planning with 3 agents (Gemini free tier)
- ✅ Structured merge ($0 cost)
- ✅ Context verification gates
- ✅ Health checks before feedback loops
- ✅ Proactive rebasing
- ✅ Git worktree isolation

## Documentation

See [docs/](./docs/) for complete documentation.
```

### Step 10.2: Example Files

**Files to Create:**

1. **`examples/feature-request.md`**
2. **`examples/simple-task.md`**
3. **`examples/complex-feature.md`**

**Success Criteria:**
- [ ] README is clear and helpful
- [ ] Examples work
- [ ] Documentation is complete

---

## Implementation Order Summary

### Week 1: Foundation
- Days 1-2: Project setup
- Days 3-5: Core infrastructure

### Week 2: Verification & Planning
- Days 1-2: Verification layer
- Days 3-5: Planning phase

### Week 3: Backlog & Implementation
- Days 1-3: Backlog management
- Days 4-5: Implementation phase (start)

### Week 4: Implementation & Monitoring
- Days 1-3: Implementation phase (complete)
- Days 4-5: Monitoring & rebasing

### Week 5: Integration & Polish
- Day 1: Plugin entry point
- Days 2-3: Integration testing
- Days 4-5: Documentation & polish

---

## Quick Start Commands

### Initial Setup
```bash
# 1. Create directory structure
mkdir -p src/{core,verification,planning,backlog,implementation,monitoring,rebasing,factory}
mkdir -p tests/{unit,integration}
mkdir -p examples

# 2. Install dependencies
pnpm add @opencode-ai/plugin @opencode-ai/sdk js-yaml p-limit p-retry
pnpm add -D typescript @types/node @types/js-yaml bun-types eslint prettier

# 3. Create config files
# (Copy package.json, tsconfig.json, .gitignore from plan above)

# 4. Verify setup
pnpm typecheck
```

### Development Workflow
```bash
# Start development
pnpm dev  # Watch mode

# In another terminal
pnpm test --watch

# Build for production
pnpm build

# Install plugin
opencode plugin install ./dist
```

### Testing Strategy
```bash
# Unit tests (fast)
pnpm test tests/unit/

# Integration tests (slower)
pnpm test tests/integration/

# Full test suite
pnpm test
```

---

## File Creation Checklist

### Phase 1: Setup
- [ ] `package.json`
- [ ] `tsconfig.json`
- [ ] `.gitignore`
- [ ] Directory structure

### Phase 2: Core
- [ ] `src/types.ts`
- [ ] `src/config.ts`
- [ ] `src/core/retry.ts`
- [ ] `src/core/rateLimit.ts`
- [ ] `src/core/shell.ts`
- [ ] `src/core/gracefulShutdown.ts`

### Phase 3: Verification
- [ ] `src/verification/contextVerifier.ts`
- [ ] `src/verification/instrumentationChecker.ts`

### Phase 4: Planning
- [ ] `src/planning/structuredMerge.ts`
- [ ] `src/planning/planningAgents.ts`
- [ ] `src/planning/planningPhase.ts`

### Phase 5: Backlog
- [ ] `src/backlog/backlogGenerator.ts`
- [ ] `src/backlog/backlogManager.ts`
- [ ] `src/backlog/contextCompressor.ts`

### Phase 6: Implementation
- [ ] `src/implementation/modelRouter.ts`
- [ ] `src/implementation/worktreeManager.ts`
- [ ] `src/implementation/implementCommand.ts`

### Phase 7: Monitoring
- [ ] `src/monitoring/contextDriftDetector.ts`
- [ ] `src/rebasing/rebaseEngine.ts`
- [ ] `src/factory/specRepository.ts`

### Phase 8: Plugin
- [ ] `src/index.ts`

### Phase 9: Tests
- [ ] `tests/unit/*.test.ts`
- [ ] `tests/integration/*.test.ts`

### Phase 10: Documentation
- [ ] `README.md`
- [ ] `examples/*.md`

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Build Success** | 100% | `pnpm build` exits 0 |
| **Type Safety** | 0 errors | `pnpm typecheck` |
| **Test Coverage** | >80% | `pnpm test --coverage` |
| **Plugin Load** | Success | `opencode plugin list` |
| **Planning Phase** | <15 min | Time from start to PLAN.md |
| **Context Size** | <3KB | Measured in tests |
| **Session Cleanup** | 100% | Verified with 404 checks |

---

## Next Steps

1. **Start with Phase 1** (Project Setup)
   ```bash
   cd /Users/rakeshbhatt/code-agents-workshop
   mkdir -p src/{core,verification,planning,backlog,implementation,monitoring,rebasing,factory}
   mkdir -p tests/{unit,integration}
   ```

2. **Copy V3 code** from `IMPLEMENTATION_PLAN_FINAL_V3.md` into respective files

3. **Test incrementally** - Don't wait until the end

4. **Commit frequently** - After each working phase

---

## Troubleshooting

### Issue: TypeScript errors
**Solution:** Check `tsconfig.json` and ensure all imports use `.js` extension

### Issue: OpenCode doesn't recognize plugin
**Solution:** Ensure `dist/index.js` exists and `package.json` has correct `main` field

### Issue: Tests fail
**Solution:** Run tests individually to isolate failures

### Issue: Build is slow
**Solution:** Use `pnpm dev` for watch mode during development

---

## References

- [V3 Implementation Plan](./IMPLEMENTATION_PLAN_FINAL_V3.md) - Complete code
- [V3 Review](./V3_FINAL_REVIEW.md) - All fixes explained
- [OpenCode Plugin Docs](https://opencode.ai/docs/plugins) - Plugin API

---

**Ready to build!** Start with Phase 1 and work through incrementally.

