/**
 * Code Crew - OpenCode Plugin
 * Your multi-agent coding crew with context engineering
 */

import { tool } from "@opencode-ai/plugin/tool";
import { runPlanningPhase } from "./planning/planningPhase.js";
import { runImplementation } from "./implementation/implementCommand.js";
import { BacklogGenerator } from "./backlog/backlogGenerator.js";
import { RebaseEngine } from "./rebasing/rebaseEngine.js";
import { SpecRepository } from "./factory/specRepository.js";
import { CONFIG } from "./config.js";

export default async function codeCrew(): Promise<any> {
  return {
    tools: {
      // Planning command
      plan: tool({
        description: "Run parallel planning phase with 3 agents (Gemini free tier)",
        args: {
          context_file: tool.schema.string().describe("Path to feature context"),
          output_dir: tool.schema.string().optional().describe("Output directory"),
        },
        async execute(args) {
          const outputDir = args.output_dir || CONFIG.outputDir;
          const result = await runPlanningPhase(args.context_file, outputDir);
          return `Planning complete. Plan: ${result.planFile}`;
        },
      }),
      
      // Backlog generation command
      backlog: tool({
        description: "Generate task backlog from plan",
        args: {
          plan_file: tool.schema.string().describe("Path to PLAN.md"),
          track_id: tool.schema.string().describe("Track identifier"),
        },
        async execute(args) {
          const generator = new BacklogGenerator();
          const outputFile = `${CONFIG.outputDir}/BACKLOG.yaml`;
          await generator.generateFromPlan(args.plan_file, outputFile, args.track_id);
          return `Backlog generated: ${outputFile}`;
        },
      }),
      
      // Implementation command
      implement: tool({
        description: "Implement tasks from backlog with verification",
        args: {
          backlog_file: tool.schema.string().describe("Path to BACKLOG.yaml"),
        },
        async execute(args) {
          const results = await runImplementation(args.backlog_file, process.cwd());
          const success = results.filter(r => r.success).length;
          
          // Check for rebase recommendations
          const rebaseEngine = new RebaseEngine();
          const analysis = rebaseEngine.analyzeBatch(results);
          
          let message = `Implementation complete: ${success}/${results.length} tasks succeeded`;
          
          if (analysis.needsRebase > 0) {
            message += `\n\n⚠️  ${analysis.needsRebase} task(s) may need rebasing:`;
            for (const rec of analysis.recommendations) {
              message += `\n  - ${rec.taskId}: ${rec.reason}`;
            }
          }
          
          return message;
        },
      }),
      
      // Rebase command
      rebase: tool({
        description: "Analyze and rebase failed/messy tasks",
        args: {
          backlog_file: tool.schema.string().describe("Path to BACKLOG.yaml"),
          task_id: tool.schema.string().describe("Task ID to rebase"),
        },
        async execute(args) {
          const engine = new RebaseEngine();
          // TODO: Implement actual rebase logic
          return `Rebase analysis for ${args.task_id} complete. Review recommendations.`;
        },
      }),
      
      // Spec history command
      "spec-history": tool({
        description: "View spec version history for a task",
        args: {
          task_id: tool.schema.string().describe("Task ID"),
        },
        async execute(args) {
          const repo = new SpecRepository(process.cwd());
          const history = await repo.getHistory(args.task_id);
          
          if (history.length === 0) {
            return `No spec history found for ${args.task_id}`;
          }
          
          let message = `Spec history for ${args.task_id}:\n\n`;
          for (const spec of history) {
            message += `v${spec.version} (${spec.timestamp}): ${spec.reason}\n`;
          }
          
          return message;
        },
      }),
    },
  };
}

