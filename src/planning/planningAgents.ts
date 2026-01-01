/**
 * Planning agent spawning and management
 */

import { CONFIG } from "../config.js";
import type { PlanningOutput } from "../types.js";

interface Session {
  id: string;
}

export async function spawnPlanningAgent(
  opencode: any,
  agentType: "planner-spec" | "planner-arch" | "planner-qa",
  context: string,
  outputDir: string
): Promise<Session> {
  const agentName = agentType.replace("planner-", "").toUpperCase();
  
  const session = await opencode.client.session.create({
    body: {
      title: `Planning: ${agentName} - ${Date.now()}`,
      agent: agentType,
      modelConfig: CONFIG.models.planning, // Use Gemini free tier
    },
  });
  
  const prompts: Record<string, string> = {
    "planner-spec": `You are the Product/Spec Planning Agent.

Analyze this context and produce a SPEC.md document with:
## Requirements
- Clear, numbered requirements
- Functional and non-functional requirements

## Acceptance Criteria  
- Testable acceptance criteria for each requirement
- Use "GIVEN/WHEN/THEN" format

Be thorough but concise. Your exploration context will be deleted - only your final document matters.

CONTEXT:
${context}`,

    "planner-arch": `You are the Architecture Planning Agent.

Analyze this context and produce an ARCH.md document with:
## Design
- System architecture overview
- Component diagram (ASCII)
- Key design decisions

## API
- API endpoints or interfaces
- Data models
- Integration points

Be thorough but concise. Your exploration context will be deleted - only your final document matters.

CONTEXT:
${context}`,

    "planner-qa": `You are the QA/Risk Planning Agent.

Analyze this context and produce a QA.md document with:
## Test Plan
- Unit test strategy
- Integration test plan
- Edge cases to cover

## Risks
- Technical risks and mitigations
- Dependencies and blockers
- Gotchas from similar implementations

Be thorough but concise. Your exploration context will be deleted - only your final document matters.

CONTEXT:
${context}`,
  };
  
  await opencode.client.session.prompt({
    path: { id: session.id },
    body: {
      parts: [{ type: "text", text: prompts[agentType] }],
    },
  });
  
  return session;
}

export async function waitForCompletion(
  opencode: any,
  sessionId: string,
  timeoutMs: number
): Promise<string> {
  const startTime = Date.now();
  const pollInterval = CONFIG.pollIntervalMs;
  
  while (true) {
    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(
        `Planning agent ${sessionId} timed out after ${timeoutMs}ms`
      );
    }
    
    // Get session status
    const session = await opencode.client.session.get({
      path: { id: sessionId },
    });
    
    // Check if complete
    if (session.status === "completed" || session.status === "idle") {
      // Get final output
      const messages = await opencode.client.session.messages({
        path: { id: sessionId },
      });
      
      const lastMessage = messages[messages.length - 1];
      return lastMessage?.parts?.map((p: any) => p.text).join("\n") || "";
    }
    
    // Check for errors
    if (session.status === "failed" || session.status === "error") {
      throw new Error(`Planning agent ${sessionId} failed`);
    }
    
    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
}

