/**
 * Context drift detection and monitoring
 */

import type { ContextMetrics } from "../types.js";

export class ContextDriftDetector {
  private baselines = new Map<string, ContextMetrics>();
  private readonly maxGrowth = 0.5; // 50% growth triggers alert
  
  /**
   * Track context metrics and detect drift
   */
  async checkDrift(
    taskId: string,
    phase: string,
    metrics: ContextMetrics
  ): Promise<void> {
    const key = `${taskId}:${phase}`;
    
    // Store baseline on first check for this phase
    if (!this.baselines.has(key)) {
      this.baselines.set(key, metrics);
      console.log(`📊 Baseline for ${taskId}/${phase}: ${metrics.size} bytes`);
      return;
    }
    
    const baseline = this.baselines.get(key)!;
    
    // Check for excessive growth
    if (baseline.size > 0) {
      const growth = (metrics.size - baseline.size) / baseline.size;
      
      if (growth > this.maxGrowth) {
        throw new Error(
          `Context drift detected in ${taskId}/${phase}: ` +
          `${metrics.size} bytes (grew ${(growth * 100).toFixed(1)}% from ${baseline.size})`
        );
      }
    }
    
    // Check for cross-task contamination
    if (metrics.taskIds.size > 1) {
      throw new Error(
        `Cross-task contamination in ${taskId}: ` +
        `Found ${metrics.taskIds.size} task IDs: ${[...metrics.taskIds].join(", ")}`
      );
    }
    
    // Check for planning debris in implementation
    if (phase.startsWith("implementation") && metrics.planningKeywords > 0) {
      throw new Error(
        `Planning debris in ${taskId}/${phase}: ` +
        `${metrics.planningKeywords} planning keywords detected`
      );
    }
    
    console.log(`✓ Drift check passed: ${taskId}/${phase}`);
  }
  
  /**
   * Get summary report
   */
  getReport(): string {
    const lines = ["\n=== Context Drift Report ===\n"];
    
    for (const [key, metrics] of this.baselines) {
      lines.push(`${key}:`);
      lines.push(`  Size: ${metrics.size} bytes`);
      lines.push(`  Files: ${metrics.uniqueFiles}`);
      lines.push(`  Tasks: ${metrics.taskIds.size}`);
      lines.push("");
    }
    
    return lines.join("\n");
  }
  
  /**
   * Clear baselines (for new run)
   */
  reset(): void {
    this.baselines.clear();
  }
}

