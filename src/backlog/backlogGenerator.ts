/**
 * Backlog generation from planning output
 */

import { readFile, writeFile } from "fs/promises";
import { createOpencode } from "@opencode-ai/sdk";
import yaml from "js-yaml";
import { CONFIG } from "../config.js";
import type { Backlog, BacklogTask } from "../types.js";

export class BacklogGenerator {
  /**
   * Generate backlog from planning document using LLM
   */
  async generateFromPlan(
    planFile: string,
    outputFile: string,
    trackId: string
  ): Promise<void> {
    // Read plan
    const planContent = await readFile(planFile, "utf-8");
    
    // Create OpenCode client
    const opencode = await createOpencode({
      config: {
        model: `${CONFIG.models.implementation.provider}/${CONFIG.models.implementation.model}`,
      },
    });
    
    // Create session for backlog generation
    const sessionResponse = await opencode.client.session.create({
      body: {
        title: `Backlog Generation - ${trackId}`,
      },
    });
    
    if (!sessionResponse.data) {
      throw new Error("Failed to create session");
    }
    
    const session = sessionResponse.data;
    
    try {
      // Prompt for backlog generation
      const prompt = `You are a task breakdown specialist. 

Analyze this implementation plan and break it down into atomic, independent tasks.

PLAN:
${planContent}

Generate a YAML backlog with this EXACT structure:

\`\`\`yaml
version: "1.0"
track_id: "${trackId}"
created_at: "${new Date().toISOString()}"
updated_at: "${new Date().toISOString()}"
tasks:
  - id: "T01"
    title: "Short task title"
    description: "Detailed description"
    status: "pending"
    depends_on: []
    acceptance:
      - "Acceptance criterion 1"
      - "Acceptance criterion 2"
    attempts: 0
    scope:
      files_hint:
        - "src/path/to/file.ts"
      estimated_hours: 2
    context:
      constraints:
        - "Must be backward compatible"
      patterns:
        - "Use existing pattern X"
      gotchas:
        - "Watch out for Y"
\`\`\`

RULES:
1. Each task must be atomic (1-4 hours)
2. Tasks must have clear acceptance criteria
3. Use depends_on for task dependencies
4. Keep context under 3KB total
5. Be specific about files to modify

Generate the backlog now:`;

      await opencode.client.session.prompt({
        path: { id: session.id },
        body: {
          parts: [{ type: "text", text: prompt }],
        },
      });
      
      // Wait for response
      await this.waitForResponse(opencode, session.id);
      
      // Get response
      const messagesResponse = await opencode.client.session.messages({
        path: { id: session.id },
      });
      
      if (!messagesResponse.data) {
        throw new Error("Failed to get messages");
      }
      
      const messages = messagesResponse.data;
      const lastMessage = messages[messages.length - 1];
      const response = lastMessage?.parts?.map((p: any) => p.text).join("\n") || "";
      
      // Extract YAML from response
      const yamlMatch = response.match(/```(?:yaml)?\n([\s\S]+?)\n```/);
      if (!yamlMatch) {
        throw new Error("Failed to extract YAML from response");
      }
      
      const yamlContent = yamlMatch[1];
      
      // Parse and validate
      const backlog = yaml.load(yamlContent) as Backlog;
      this.validateBacklog(backlog);
      
      // Save to file
      await writeFile(outputFile, yaml.dump(backlog, { indent: 2 }), "utf-8");
      
      console.log(`✓ Backlog generated: ${backlog.tasks.length} tasks`);
    } finally {
      // Cleanup session
      await opencode.client.session.delete({ path: { id: session.id } });
    }
  }
  
  private async waitForResponse(opencode: any, sessionId: string): Promise<void> {
    const maxWait = 60000; // 60 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      const session = await opencode.client.session.get({
        path: { id: sessionId },
      });
      
      if (session.status === "completed" || session.status === "idle") {
        return;
      }
      
      if (session.status === "failed" || session.status === "error") {
        throw new Error("Backlog generation failed");
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error("Backlog generation timed out");
  }
  
  private validateBacklog(backlog: Backlog): void {
    if (!backlog.version || !backlog.track_id || !backlog.tasks) {
      throw new Error("Invalid backlog structure");
    }
    
    if (backlog.tasks.length === 0) {
      throw new Error("Backlog must have at least one task");
    }
    
    // Validate each task
    for (const task of backlog.tasks) {
      if (!task.id || !task.title || !task.description) {
        throw new Error(`Invalid task: ${JSON.stringify(task)}`);
      }
      
      if (!task.acceptance || task.acceptance.length === 0) {
        throw new Error(`Task ${task.id} must have acceptance criteria`);
      }
    }
    
    // Validate dependencies
    const taskIds = new Set(backlog.tasks.map(t => t.id));
    for (const task of backlog.tasks) {
      for (const depId of task.depends_on) {
        if (!taskIds.has(depId)) {
          throw new Error(`Task ${task.id} depends on non-existent task ${depId}`);
        }
      }
    }
  }
}

