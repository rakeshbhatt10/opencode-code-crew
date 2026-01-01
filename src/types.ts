/**
 * Shared type definitions for the multi-agent coder system
 */

export interface BacklogTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  depends_on: string[];
  acceptance: string[];
  attempts: number;
  scope: {
    files_hint: string[];
    estimated_hours: number;
  };
  context?: {
    constraints?: string[];
    patterns?: string[];
    gotchas?: string[];
  };
}

export type TaskStatus = 
  | "pending" 
  | "ready" 
  | "in_progress" 
  | "review" 
  | "completed" 
  | "failed";

export interface Backlog {
  version: string;
  track_id: string;
  created_at: string;
  updated_at: string;
  tasks: BacklogTask[];
}

export interface ContextMetrics {
  size: number;
  uniqueFiles: number;
  taskIds: Set<string>;
  planningKeywords: number;
  hasFullFiles: boolean;
}

export interface TaskResult {
  taskId: string;
  attempts: number;
  contextSize: number;
  duration: number;
  commits: number;
  logs: string;
  success: boolean;
}

export interface ModelConfig {
  provider: "openai" | "google" | "anthropic";
  model: string;
  costPerToken: number;
}

export interface PlanningOutput {
  agentType: "spec" | "arch" | "qa";
  content: string;
  sessionId: string;
}

export interface VerificationResult {
  passed: boolean;
  issues: string[];
  metrics?: ContextMetrics;
}

export interface HealthCheckResult {
  testRunner: boolean;
  linter: boolean;
  typeChecker: boolean;
  issues: string[];
}

export interface RebaseRecommendation {
  shouldRebase: boolean;
  reason: string;
  indicators: {
    highAttempts: boolean;
    largeContext: boolean;
    longDuration: boolean;
    errorPatterns: boolean;
    manyCommits: boolean;
    lowSuccessRate: boolean;
  };
}

export interface WorktreeInfo {
  path: string;
  branch: string;
  taskId: string;
}

export interface SpecVersion {
  version: number;
  content: string;
  timestamp: string;
  reason: string;
}

