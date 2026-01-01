/**
 * Proactive rebasing engine
 */

import type { TaskResult, RebaseRecommendation } from "../types.js";
import { CONFIG } from "../config.js";

export class RebaseEngine {
  /**
   * Analyze task result and recommend rebase if needed
   */
  shouldRebase(result: TaskResult): RebaseRecommendation {
    const indicators = {
      highAttempts: result.attempts >= CONFIG.rebase.maxAttempts,
      largeContext: result.contextSize > CONFIG.rebase.maxContextSize,
      longDuration: result.duration > CONFIG.rebase.maxDurationMs / 1000,
      errorPatterns: this.detectErrorPatterns(result.logs),
      manyCommits: result.commits > CONFIG.rebase.maxCommits,
      lowSuccessRate: !result.success,
    };
    
    const triggerCount = Object.values(indicators).filter(Boolean).length;
    const shouldRebase = triggerCount >= 2; // 2+ indicators trigger rebase
    
    let reason = "";
    if (shouldRebase) {
      const triggered = Object.entries(indicators)
        .filter(([_, value]) => value)
        .map(([key]) => key);
      reason = `Messy run detected: ${triggered.join(", ")}`;
    }
    
    return {
      shouldRebase,
      reason,
      indicators,
    };
  }
  
  /**
   * Detect error patterns in logs
   */
  private detectErrorPatterns(logs: string): boolean {
    const errorPatterns = [
      /error:/i,
      /exception:/i,
      /failed to/i,
      /cannot find/i,
      /undefined is not/i,
      /type error/i,
    ];
    
    return errorPatterns.some(pattern => pattern.test(logs));
  }
  
  /**
   * Generate improved prompt for rebasing
   */
  generateRebasePrompt(
    originalContext: string,
    failureReason: string,
    attempts: number
  ): string {
    return `# Task Rebase (Attempt ${attempts + 1})

## Previous Failure
${failureReason}

## Original Context
${originalContext}

## Instructions for Rebase
1. Review the failure reason carefully
2. Identify the root cause
3. Create a cleaner, simpler implementation
4. Avoid the mistakes from previous attempts
5. Focus on code quality and maintainability

Start fresh - don't try to patch the previous implementation.
`;
  }
  
  /**
   * Analyze multiple task results and provide summary
   */
  analyzeBatch(results: TaskResult[]): {
    totalTasks: number;
    needsRebase: number;
    recommendations: Array<{ taskId: string; reason: string }>;
  } {
    const recommendations: Array<{ taskId: string; reason: string }> = [];
    
    for (const result of results) {
      const recommendation = this.shouldRebase(result);
      if (recommendation.shouldRebase) {
        recommendations.push({
          taskId: result.taskId,
          reason: recommendation.reason,
        });
      }
    }
    
    return {
      totalTasks: results.length,
      needsRebase: recommendations.length,
      recommendations,
    };
  }
}

