/**
 * Git worktree management for task isolation
 */

import { runShell, runShellOrThrow } from "../core/shell.js";
import { mkdir } from "fs/promises";
import { join } from "path";
import { CONFIG } from "../config.js";
import type { WorktreeInfo } from "../types.js";

export class WorktreeManager {
  private readonly worktreeDir: string;
  private activeWorktrees = new Set<string>();
  
  constructor(projectRoot: string) {
    this.worktreeDir = join(projectRoot, CONFIG.worktreeDir);
  }
  
  /**
   * Create an isolated worktree for a task
   */
  async create(taskId: string): Promise<string> {
    const worktreePath = join(this.worktreeDir, taskId);
    const branchName = `task/${taskId}`;
    
    // Ensure worktree directory exists
    await mkdir(this.worktreeDir, { recursive: true });
    
    // Check if worktree already exists
    const existing = await runShell(`git worktree list`, { cwd: process.cwd() });
    if (existing.stdout.includes(worktreePath)) {
      console.log(`♻️  Worktree already exists for ${taskId}`);
      return worktreePath;
    }
    
    // Create new worktree
    try {
      await runShellOrThrow(
        `git worktree add -b ${branchName} ${worktreePath} HEAD`,
        process.cwd()
      );
    } catch (error: any) {
      // Branch might already exist
      if (error.message.includes("already exists")) {
        await runShellOrThrow(
          `git worktree add ${worktreePath} ${branchName}`,
          process.cwd()
        );
      } else {
        throw error;
      }
    }
    
    this.activeWorktrees.add(taskId);
    console.log(`✓ Created worktree for ${taskId} at ${worktreePath}`);
    
    return worktreePath;
  }
  
  /**
   * Clean up a worktree after task completion
   */
  async cleanup(taskId: string): Promise<void> {
    const worktreePath = join(this.worktreeDir, taskId);
    const branchName = `task/${taskId}`;
    
    // Remove worktree
    try {
      await runShell(`git worktree remove ${worktreePath} --force`, { cwd: process.cwd() });
    } catch {
      // Ignore if already removed
    }
    
    // Delete branch
    try {
      await runShell(`git branch -D ${branchName}`, { cwd: process.cwd() });
    } catch {
      // Ignore if branch doesn't exist
    }
    
    this.activeWorktrees.delete(taskId);
    console.log(`✓ Cleaned up worktree for ${taskId}`);
  }
  
  /**
   * Merge worktree back to main branch
   */
  async merge(taskId: string): Promise<void> {
    const branchName = `task/${taskId}`;
    
    // Merge with no-ff to preserve history
    await runShellOrThrow(
      `git merge --no-ff ${branchName} -m "Merge task ${taskId}"`,
      process.cwd()
    );
    
    console.log(`✓ Merged ${taskId} to main branch`);
  }
  
  /**
   * Get path to worktree for a task
   */
  getPath(taskId: string): string {
    return join(this.worktreeDir, taskId);
  }
  
  /**
   * Clean up all active worktrees (for shutdown)
   */
  async cleanupAll(): Promise<void> {
    console.log(`🧹 Cleaning up ${this.activeWorktrees.size} worktrees...`);
    
    for (const taskId of this.activeWorktrees) {
      try {
        await this.cleanup(taskId);
      } catch (error) {
        console.error(`Failed to cleanup worktree ${taskId}:`, error);
      }
    }
    
    this.activeWorktrees.clear();
  }
  
  /**
   * Get info about active worktrees
   */
  getActiveWorktrees(): WorktreeInfo[] {
    return Array.from(this.activeWorktrees).map(taskId => ({
      path: this.getPath(taskId),
      branch: `task/${taskId}`,
      taskId,
    }));
  }
}

