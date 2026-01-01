/**
 * Spec versioning and storage
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import yaml from "js-yaml";
import { CONFIG } from "../config.js";
import type { SpecVersion } from "../types.js";

export class SpecRepository {
  private readonly specsDir: string;
  
  constructor(projectRoot: string) {
    this.specsDir = join(projectRoot, CONFIG.specsDir);
  }
  
  /**
   * Save a new spec version
   */
  async saveSpec(
    taskId: string,
    content: string,
    reason: string
  ): Promise<number> {
    await mkdir(this.specsDir, { recursive: true });
    
    const taskDir = join(this.specsDir, taskId);
    await mkdir(taskDir, { recursive: true });
    
    // Get current version
    const versions = await this.getVersions(taskId);
    const newVersion = versions.length + 1;
    
    const spec: SpecVersion = {
      version: newVersion,
      content,
      timestamp: new Date().toISOString(),
      reason,
    };
    
    const specFile = join(taskDir, `v${newVersion}.yaml`);
    await writeFile(specFile, yaml.dump(spec, { indent: 2 }), "utf-8");
    
    console.log(`✓ Saved spec v${newVersion} for ${taskId}: ${reason}`);
    
    return newVersion;
  }
  
  /**
   * Load a specific spec version
   */
  async loadSpec(taskId: string, version: number): Promise<SpecVersion> {
    const specFile = join(this.specsDir, taskId, `v${version}.yaml`);
    const content = await readFile(specFile, "utf-8");
    return yaml.load(content) as SpecVersion;
  }
  
  /**
   * Load the latest spec version
   */
  async loadLatestSpec(taskId: string): Promise<SpecVersion | null> {
    const versions = await this.getVersions(taskId);
    if (versions.length === 0) {
      return null;
    }
    
    const latestVersion = Math.max(...versions);
    return this.loadSpec(taskId, latestVersion);
  }
  
  /**
   * Get all version numbers for a task
   */
  async getVersions(taskId: string): Promise<number[]> {
    const taskDir = join(this.specsDir, taskId);
    
    try {
      const { readdir } = await import("fs/promises");
      const files = await readdir(taskDir);
      
      return files
        .filter(f => f.startsWith("v") && f.endsWith(".yaml"))
        .map(f => parseInt(f.substring(1, f.length - 5)))
        .filter(v => !isNaN(v))
        .sort((a, b) => a - b);
    } catch {
      return [];
    }
  }
  
  /**
   * Get spec history for a task
   */
  async getHistory(taskId: string): Promise<SpecVersion[]> {
    const versions = await this.getVersions(taskId);
    const specs: SpecVersion[] = [];
    
    for (const version of versions) {
      try {
        const spec = await this.loadSpec(taskId, version);
        specs.push(spec);
      } catch (error) {
        console.warn(`Failed to load spec v${version} for ${taskId}`);
      }
    }
    
    return specs;
  }
  
  /**
   * Compare two spec versions
   */
  async compareVersions(
    taskId: string,
    version1: number,
    version2: number
  ): Promise<{
    v1: SpecVersion;
    v2: SpecVersion;
    sizeDiff: number;
    timeDiff: number;
  }> {
    const v1 = await this.loadSpec(taskId, version1);
    const v2 = await this.loadSpec(taskId, version2);
    
    const sizeDiff = v2.content.length - v1.content.length;
    const timeDiff = new Date(v2.timestamp).getTime() - new Date(v1.timestamp).getTime();
    
    return { v1, v2, sizeDiff, timeDiff };
  }
}

