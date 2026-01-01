/**
 * Backlog state management
 */

import { readFile, writeFile } from "fs/promises";
import yaml from "js-yaml";
import type { Backlog, BacklogTask, TaskStatus } from "../types.js";

export class BacklogManager {
  private backlog: Backlog | null = null;
  
  constructor(private backlogFile: string) {}
  
  async load(): Promise<Backlog> {
    const content = await readFile(this.backlogFile, "utf-8");
    this.backlog = yaml.load(content) as Backlog;
    return this.backlog;
  }
  
  async save(): Promise<void> {
    if (!this.backlog) {
      throw new Error("No backlog loaded");
    }
    
    this.backlog.updated_at = new Date().toISOString();
    const content = yaml.dump(this.backlog, { indent: 2 });
    await writeFile(this.backlogFile, content, "utf-8");
  }
  
  getTask(taskId: string): BacklogTask | undefined {
    return this.backlog?.tasks.find(t => t.id === taskId);
  }
  
  updateTaskStatus(taskId: string, status: TaskStatus): void {
    const task = this.getTask(taskId);
    if (task) {
      task.status = status;
    }
  }
  
  incrementAttempts(taskId: string): void {
    const task = this.getTask(taskId);
    if (task) {
      task.attempts++;
    }
  }
  
  getReadyTasks(): BacklogTask[] {
    if (!this.backlog) return [];
    
    return this.backlog.tasks.filter(task => {
      // Task must be pending or ready
      if (task.status !== "pending" && task.status !== "ready") {
        return false;
      }
      
      // All dependencies must be completed
      return task.depends_on.every(depId => {
        const dep = this.getTask(depId);
        return dep?.status === "completed";
      });
    });
  }
  
  getAllTasks(): BacklogTask[] {
    return this.backlog?.tasks || [];
  }
  
  getTasksByStatus(status: TaskStatus): BacklogTask[] {
    return this.backlog?.tasks.filter(t => t.status === status) || [];
  }
  
  isComplete(): boolean {
    if (!this.backlog) return false;
    return this.backlog.tasks.every(t => 
      t.status === "completed" || t.status === "failed"
    );
  }
  
  getStats(): {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    inProgress: number;
  } {
    if (!this.backlog) {
      return { total: 0, completed: 0, failed: 0, pending: 0, inProgress: 0 };
    }
    
    return {
      total: this.backlog.tasks.length,
      completed: this.backlog.tasks.filter(t => t.status === "completed").length,
      failed: this.backlog.tasks.filter(t => t.status === "failed").length,
      pending: this.backlog.tasks.filter(t => t.status === "pending").length,
      inProgress: this.backlog.tasks.filter(t => t.status === "in_progress").length,
    };
  }
}

