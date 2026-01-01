/**
 * Context verification with hygiene checks
 */

import { createOpencode } from "@opencode-ai/sdk";
import { withRetry } from "../core/retry.js";
import { CONFIG } from "../config.js";
import type { ContextMetrics, VerificationResult } from "../types.js";

export class ContextVerifier {
  private readonly planningKeywords = [
    "we explored",
    "alternative approach",
    "after much discussion",
    "three options",
    "let me think",
    "first attempt",
    "trying different",
    "on second thought",
    "let's reconsider",
    "another possibility",
    ...CONFIG.planningKeywords,
  ];

  /**
   * Verify context hygiene before phase transition
   * THROWS if context is polluted
   */
  async verifyClean(
    sessionId: string,
    phase: "implementation" | "review"
  ): Promise<ContextMetrics> {
    const context = await this.getSessionContext(sessionId);
    const metrics = this.analyzeContext(context);
    
    if (phase === "implementation") {
      // 1. Size check
      if (metrics.size > CONFIG.maxContextSize) {
        throw new Error(
          `Context too large: ${metrics.size} bytes (max: ${CONFIG.maxContextSize}). ` +
          `Reduce context before proceeding.`
        );
      }
      
      // 2. Planning debris check
      if (metrics.planningKeywords > 0) {
        const examples = this.findPlanningDebris(context);
        throw new Error(
          `Planning debris detected (${metrics.planningKeywords} keywords): ` +
          `"${examples.slice(0, 2).join('", "')}"`
        );
      }
      
      // 3. Cross-task contamination
      if (metrics.taskIds.size > 1) {
        throw new Error(
          `Cross-task contamination detected: ` +
          `${[...metrics.taskIds].join(", ")}. ` +
          `Each session should have exactly one task.`
        );
      }
      
      // 4. Full file contents check
      if (metrics.hasFullFiles) {
        throw new Error(
          "Full file contents detected. Use file paths and line ranges only."
        );
      }
    }
    
    return metrics;
  }
  
  /**
   * Verify session was actually deleted
   * THROWS if session still exists after max retries
   */
  async verifyDeleted(sessionId: string): Promise<void> {
    // Wait a bit for deletion to propagate
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const opencode = await createOpencode({});
    
    try {
      await opencode.client.session.get({ path: { id: sessionId } });
      // If we get here, session still exists!
      throw new Error(
        `Session ${sessionId} still exists after deletion attempt. ` +
        `This is a critical error - planning context may leak.`
      );
    } catch (error: any) {
      // Check if it's a "not found" error (which is what we want)
      if (
        error.status === 404 || 
        error.message?.toLowerCase().includes("not found") ||
        error.message?.toLowerCase().includes("does not exist")
      ) {
        // Good - session is gone
        return;
      }
      // Other error - rethrow
      throw error;
    }
  }

  private analyzeContext(context: string): ContextMetrics {
    return {
      size: new TextEncoder().encode(context).length, // Accurate byte count
      uniqueFiles: this.countUniqueFiles(context),
      taskIds: this.extractTaskIds(context),
      planningKeywords: this.countPlanningKeywords(context),
      hasFullFiles: this.detectFullFiles(context),
    };
  }
  
  private countPlanningKeywords(context: string): number {
    const lower = context.toLowerCase();
    return this.planningKeywords.filter(kw => 
      lower.includes(kw.toLowerCase())
    ).length;
  }
  
  private findPlanningDebris(context: string): string[] {
    const lower = context.toLowerCase();
    return this.planningKeywords
      .filter(kw => lower.includes(kw.toLowerCase()));
  }
  
  private countUniqueFiles(context: string): number {
    const filePattern = /(?:src|lib|test|tests)\/[\w\/\-\.]+\.\w+/g;
    const files = new Set(context.match(filePattern) || []);
    return files.size;
  }
  
  private extractTaskIds(context: string): Set<string> {
    const taskPattern = /\b(T\d{2,4})\b/g;
    const matches = context.match(taskPattern) || [];
    return new Set(matches);
  }
  
  private detectFullFiles(context: string): boolean {
    const lines = context.split("\n");
    let currentFile = "";
    let lineCount = 0;
    
    for (const line of lines) {
      // Detect file markers
      if (line.match(/^(?:\/\/|#)\s*(?:File|file):\s/)) {
        if (lineCount > 50) return true;
        currentFile = line;
        lineCount = 0;
      } else if (currentFile) {
        lineCount++;
      }
    }
    
    return lineCount > 50;
  }
  
  private async getSessionContext(sessionId: string): Promise<string> {
    return withRetry(async () => {
      const opencode = await createOpencode({});
      const messagesResponse = await opencode.client.session.messages({
        path: { id: sessionId },
      });
      
      if (!messagesResponse.data) {
        return "";
      }
      
      const messages = messagesResponse.data;
      return messages
        .map((m: any) => m.parts?.map((p: any) => p.text).join("\n") || "")
        .join("\n\n");
    });
  }
}

