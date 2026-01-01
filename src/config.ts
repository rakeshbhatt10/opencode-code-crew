/**
 * Configuration for the multi-agent coder system
 */

export const CONFIG = {
  // Context limits
  maxContextSize: 3000,           // 3KB hard limit
  maxPlanningKeywords: 0,         // Zero tolerance for planning debris
  
  // Timeouts
  planningTimeoutMs: 10 * 60 * 1000,  // 10 minutes
  implementationTimeoutMs: 30 * 60 * 1000, // 30 minutes
  pollIntervalMs: 2000,           // 2 seconds between polls
  
  // Concurrency
  maxPlanningAgents: 3,           // Always 3 (spec, arch, qa)
  maxWorkers: 3,                  // Parallel implementation workers
  
  // Retry
  maxRetries: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  
  // Models
  models: {
    planning: {
      provider: "google" as const,
      model: "gemini-2.0-flash-exp",
      costPerToken: 0,  // Free tier
    },
    implementation: {
      provider: "openai" as const,
      model: "gpt-4",
      costPerToken: 0.00003,
    },
    review: {
      provider: "openai" as const,
      model: "gpt-4",
      costPerToken: 0.00003,
    },
    documentation: {
      provider: "google" as const,
      model: "gemini-2.0-flash-exp",
      costPerToken: 0,
    },
    rebase: {
      provider: "openai" as const,
      model: "gpt-4",
      costPerToken: 0.00003,
    },
  },
  
  // Paths
  outputDir: "tasks",
  worktreeDir: "worktrees",
  specsDir: "specs",
  
  // Planning keywords (for detection)
  planningKeywords: [
    "TODO:",
    "FIXME:",
    "NOTE:",
    "CONSIDER:",
    "EXPLORE:",
    "OPTION:",
    "ALTERNATIVE:",
    "BRAINSTORM:",
    "IDEA:",
    "MAYBE:",
  ],
  
  // Rebase thresholds
  rebase: {
    maxAttempts: 3,
    maxContextSize: 2500,
    maxDurationMs: 20 * 60 * 1000, // 20 minutes
    maxCommits: 10,
    minSuccessRate: 0.5,
  },
} as const;

