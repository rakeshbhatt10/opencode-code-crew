/**
 * Model routing based on task characteristics
 */

import type { BacklogTask, ModelConfig } from "../types.js";
import { CONFIG } from "../config.js";

type TaskType = "documentation" | "simple_change" | "review" | "complex_change" | "implementation";

export class ModelRouter {
  /**
   * Determine the best model for a task based on its characteristics
   */
  getModel(task: BacklogTask): ModelConfig {
    const taskType = this.classifyTask(task);
    return this.getModelForType(taskType);
  }
  
  getModelForType(taskType: TaskType): ModelConfig {
    switch (taskType) {
      case "documentation":
        return CONFIG.models.documentation;
      
      case "simple_change":
        // Use free tier for simple changes
        return CONFIG.models.documentation;
      
      case "review":
        return CONFIG.models.review;
      
      case "complex_change":
      case "implementation":
      default:
        return CONFIG.models.implementation;
    }
  }
  
  private classifyTask(task: BacklogTask): TaskType {
    const titleLower = task.title.toLowerCase();
    const descLower = task.description.toLowerCase();
    
    // Documentation tasks
    if (
      titleLower.includes("document") ||
      titleLower.includes("readme") ||
      titleLower.includes("comment") ||
      descLower.includes("add documentation")
    ) {
      return "documentation";
    }
    
    // Simple changes (< 2 hours, 1-2 files)
    if (
      task.scope.estimated_hours <= 2 &&
      task.scope.files_hint.length <= 2
    ) {
      return "simple_change";
    }
    
    // Complex changes (> 4 hours or many files)
    if (
      task.scope.estimated_hours > 4 ||
      task.scope.files_hint.length > 5
    ) {
      return "complex_change";
    }
    
    // Default: standard implementation
    return "implementation";
  }
  
  /**
   * Get model string for OpenCode
   */
  getModelString(task: BacklogTask): string {
    const config = this.getModel(task);
    return `${config.provider}/${config.model}`;
  }
}

