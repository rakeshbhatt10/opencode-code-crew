/**
 * Context compression with strict size limits
 */

import type { BacklogTask } from "../types.js";
import { CONFIG } from "../config.js";

export class ContextCompressor {
  private readonly budget = {
    title: 100,
    spec: 600,
    acceptance: 400,
    constraints: 250,
    patterns: 500,
    gotchas: 200,
  };
  
  /**
   * Build minimal task context with STRICT compression
   * ENFORCES <3KB limit (throws if exceeded)
   */
  buildTaskContext(task: BacklogTask): string {
    const sections: string[] = [];
    
    // Header
    sections.push(`# Task ${task.id}: ${this.truncate(task.title, this.budget.title)}`);
    sections.push("");
    
    // Specification
    sections.push("## Specification");
    sections.push(this.truncate(task.description, this.budget.spec));
    sections.push("");
    
    // Acceptance Criteria
    sections.push("## Acceptance Criteria");
    const acceptancePerItem = Math.floor(
      this.budget.acceptance / Math.max(task.acceptance.length, 1)
    );
    for (const criterion of task.acceptance) {
      sections.push(`- ${this.truncate(criterion, acceptancePerItem)}`);
    }
    sections.push("");
    
    // Files to modify
    sections.push("## Files");
    for (const file of task.scope.files_hint.slice(0, 10)) {
      sections.push(`- ${file}`);
    }
    sections.push("");
    
    // Context sections (optional)
    if (task.context) {
      // Constraints
      if (task.context.constraints?.length) {
        sections.push("## Constraints");
        for (const constraint of task.context.constraints.slice(0, 5)) {
          this.validateConstraint(constraint, task.id);
          sections.push(`- ${this.truncate(constraint, 100)}`);
        }
        sections.push("");
      }
      
      // Patterns
      if (task.context.patterns?.length) {
        sections.push("## Patterns");
        for (const pattern of task.context.patterns.slice(0, 5)) {
          this.validatePattern(pattern, task.id);
          sections.push(`- ${this.truncate(pattern, 120)}`);
        }
        sections.push("");
      }
      
      // Gotchas
      if (task.context.gotchas?.length) {
        sections.push("## Gotchas");
        for (const gotcha of task.context.gotchas.slice(0, 3)) {
          sections.push(`- ${this.truncate(gotcha, 100)}`);
        }
        sections.push("");
      }
    }
    
    const context = sections.join("\n");
    
    // ENFORCE hard limit
    const byteSize = new TextEncoder().encode(context).length;
    if (byteSize > CONFIG.maxContextSize) {
      throw new Error(
        `Task ${task.id} context too large: ${byteSize} bytes (max: ${CONFIG.maxContextSize}). ` +
        `Reduce description, acceptance criteria, or patterns.`
      );
    }
    
    return context;
  }
  
  private truncate(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars - 3) + "...";
  }
  
  private validateConstraint(constraint: string, taskId: string): void {
    // Ensure constraints are specific, not vague
    const vague = ["be careful", "make sure", "don't forget", "remember to"];
    const lower = constraint.toLowerCase();
    
    for (const phrase of vague) {
      if (lower.includes(phrase)) {
        console.warn(
          `⚠️  Task ${taskId} has vague constraint: "${constraint}". ` +
          `Be more specific.`
        );
      }
    }
  }
  
  private validatePattern(pattern: string, taskId: string): void {
    // Ensure patterns reference actual code patterns
    if (pattern.length < 20) {
      console.warn(
        `⚠️  Task ${taskId} has short pattern: "${pattern}". ` +
        `Provide more detail.`
      );
    }
  }
}

