# Implementation Draft: Multi-Agent System Based on Claude Army

> **Adapting Claude Army Architecture to Implement Context-Engineered Multi-Agent Coding System**

---

## Executive Summary

This document provides a concrete implementation plan for adapting the existing **Claude Army** codebase to implement the **Multi-Agent Coding System** described in [COMPREHENSIVE_GUIDE.md](./COMPREHENSIVE_GUIDE.md).

**Key Insight**: Claude Army already implements many foundational patterns (multi-instance management, worktree isolation, process orchestration). We need to add:
1. **Planning subagents** (currently missing)
2. **Structured workflow** (planning → backlog → implementation)
3. **Context engineering** (explicit context hygiene)
4. **OpenCode integration** (currently uses Claude Code CLI directly)

---

## Table of Contents

1. [Architecture Mapping](#architecture-mapping)
2. [Current State Analysis](#current-state-analysis)
3. [Gap Analysis](#gap-analysis)
4. [Implementation Plan](#implementation-plan)
5. [Code Changes Required](#code-changes-required)
6. [Migration Strategy](#migration-strategy)
7. [Testing Strategy](#testing-strategy)

---

## Architecture Mapping

### Current Claude Army Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Telegram Forum Group                        │
├─────────────────────────────────────────────────────────────┤
│  General Topic              │  Task Topics                  │
│  ────────────────           │  ────────────                 │
│  User ↔ Operator Claude     │  feature-x: Worker Claude A   │
│  Natural language commands  │  fix-bug-123: Worker Claude B │
│  Setup, status, management  │  refactor-api: Worker Claude C│
└──────────────┬──────────────┴───────────────┬───────────────┘
               │                              │
               ▼                              ▼
       ┌───────────────┐            ┌─────────────────┐
       │   Operator    │            │     Workers     │
       │  subprocess   │            │  (subprocesses) │
       │ ~/claude-army │            │ repo/trees/X    │
       └───────────────┘            └─────────────────┘
               │                              │
               └──────────────┬───────────────┘
                              ▼
        ┌─────────────────────────────────────────┐
        │               Daemon                      │
        │  - ProcessManager: Claude subprocesses   │
        │  - PermissionManager: tool approvals    │
        │  - TelegramAdapter: Telegram polling    │
        │  - HTTP server: permission hooks        │
        └─────────────────────────────────────────┘
```

### Target Multi-Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CONDUCTOR (Operator)                      │
│  • Orchestrates all phases                                   │
│  • Enforces context hygiene                                  │
│  • Never carries planning debris into implementation         │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
        ┌──────────────┐        ┌──────────────┐
        │  PLANNING    │        │ IMPLEMENTATION│
        │   PHASE      │        │    PHASE      │
        └──────────────┘        └──────────────┘
                │                       │
    ┌───────────┼───────────┐          │
    ▼           ▼           ▼          │
┌────────┐ ┌────────┐ ┌────────┐      │
│ Spec   │ │ Arch   │ │  QA    │      │
│ Agent  │ │ Agent  │ │ Agent  │      │
│(Gemini)│ │(Gemini)│ │(Gemini)│      │
└────────┘ └────────┘ └────────┘      │
    │           │           │          │
    └───────────┼───────────┘          │
                ▼                      │
        ┌──────────────┐               │
        │   PLAN.md    │               │
        │   (merged)   │               │
        └──────────────┘               │
                │                      │
                ▼                      │
        ┌──────────────┐               │
        │BACKLOG.yaml  │               │
        │(atomic tasks)│               │
        └──────────────┘               │
                │                      │
                └──────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Worker T01  │    │  Worker T02  │    │  Worker T03  │
│   (GPT-4)    │    │   (GPT-4)    │    │  (Gemini)    │
│              │    │              │    │              │
│ Code changes │    │ Code changes │    │ Docs/simple  │
│ Worktree T01 │    │ Worktree T02 │    │ Worktree T03 │
│ Context <3KB │    │ Context <3KB │    │ Context <3KB │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Mapping Table

| Claude Army Component | Multi-Agent Equivalent | Status |
|----------------------|------------------------|--------|
| `Operator Claude` | `Conductor` | ✅ Exists (needs enhancement) |
| `Worker Claudes` | `Worker Agents` | ✅ Exists (needs context hygiene) |
| `ProcessManager` | `ProcessManager` | ✅ Exists (can reuse) |
| `Registry` | `Task Graph Store` | ✅ Exists (needs backlog schema) |
| `TelegramAdapter` | `Communication Layer` | ✅ Exists (can reuse) |
| `PermissionManager` | `Permission Gates` | ✅ Exists (can reuse) |
| **Missing** | **Planning Subagents** | ❌ Need to add |
| **Missing** | **Backlog System** | ❌ Need to add |
| **Missing** | **Context Compressor** | ❌ Need to add |
| **Missing** | **Rebase Agent** | ❌ Need to add |

---

## Current State Analysis

### What Claude Army Already Provides

#### ✅ Multi-Instance Management
- **ProcessManager**: Manages multiple Claude subprocesses
- **Session Management**: Spawn/resume/stop processes
- **Event Multiplexing**: Routes events from all processes
- **State Persistence**: Session IDs stored in registry

**Relevance**: Perfect foundation for multi-agent orchestration.

#### ✅ Workspace Isolation
- **Git Worktrees**: Each task gets isolated worktree
- **Marker Files**: `.claude/army.json` tracks tasks
- **Directory Structure**: Clean separation of concerns

**Relevance**: Already implements our "worker agents in isolated workspaces" pattern.

#### ✅ Human-in-the-Loop
- **Telegram Integration**: Notifications and control
- **Permission Prompts**: Human approval for tool calls
- **Interactive Commands**: `/spawn`, `/status`, `/cleanup`

**Relevance**: Can be adapted for our workflow stages.

#### ✅ Task Registry
- **Registry System**: Tracks all tasks
- **Marker Files**: Source of truth for task existence
- **Recovery**: Can rebuild registry from filesystem

**Relevance**: Foundation for backlog system.

### What's Missing

#### ❌ Planning Subagents
**Current**: Operator does everything (planning + implementation)  
**Needed**: Separate planning agents (Spec, Arch, QA) that explore messily and discard context

**Gap**: No parallel planning phase, no context garbage collection for planning.

#### ❌ Structured Workflow
**Current**: Ad-hoc task spawning via `/spawn` command  
**Needed**: Structured workflow (Intake → Planning → Backlog → Implementation → Integration)

**Gap**: No backlog generation, no dependency tracking, no atomic task decomposition.

#### ❌ Context Engineering
**Current**: Relies on Claude's built-in session management  
**Needed**: Explicit context hygiene (delete planning sessions, compress contexts, clear between phases)

**Gap**: No explicit context management, no compression, no rebasing.

#### ❌ OpenCode Integration
**Current**: Uses Claude Code CLI directly (`claude code run`)  
**Needed**: OpenCode SDK for programmatic control

**Gap**: No SDK integration, harder to orchestrate programmatically.

---

## Gap Analysis

### Critical Gaps

#### 1. Planning Phase (High Priority)

**Current State**:
- Operator receives `/spawn` command
- Operator immediately starts implementation
- No separate planning phase
- No parallel planning agents

**Required State**:
- Stage 1: Spawn 3 planning agents in parallel
- Each agent explores independently
- Produce clean output documents
- Delete all planning sessions
- Merge outputs into PLAN.md

**Implementation Effort**: Medium (2-3 days)

#### 2. Backlog System (High Priority)

**Current State**:
- Tasks are ad-hoc (`/spawn` creates immediate worktree)
- No task decomposition
- No dependency tracking
- No atomic task definitions

**Required State**:
- Generate BACKLOG.yaml from PLAN.md
- Atomic tasks with dependencies
- Task status tracking
- Dependency resolution

**Implementation Effort**: Medium (2-3 days)

#### 3. Context Engineering (High Priority)

**Current State**:
- Relies on Claude's session management
- No explicit context deletion
- No context compression
- No rebasing mechanism

**Required State**:
- Delete planning sessions after merge
- Compress task contexts (<3KB)
- Clear context between phases
- Rebase agent for failed tasks

**Implementation Effort**: Medium (2-3 days)

#### 4. OpenCode Integration (Medium Priority)

**Current State**:
- Uses Claude Code CLI directly
- Subprocess-based (`claude code run`)
- Stream-json I/O

**Required State**:
- OpenCode SDK integration
- Programmatic session management
- Better orchestration control

**Implementation Effort**: High (5-7 days)

**Note**: Can defer to Phase 2, keep CLI approach for MVP.

### Nice-to-Have Gaps

#### 5. Model Routing (Low Priority)
- Currently uses single model (Claude)
- Need Gemini integration for planning agents
- Can be added incrementally

#### 6. Metrics & Analytics (Low Priority)
- No cost tracking
- No success rate metrics
- No context size monitoring
- Can be added in Phase 3

---

## Implementation Plan

### Phase 1: Add Planning Subagents (Week 1)

#### Step 1.1: Create Planning Agent Module

**File**: `planning_agents.py`

```python
"""Planning subagents for multi-agent system.

Implements the "context garbage collector" pattern:
1. Explore messily (grep, read, search)
2. Produce clean output document
3. Delete session (context discarded)
"""

import asyncio
from pathlib import Path
from typing import Optional

from claude_process import ClaudeProcess
from process_manager import ProcessManager
from registry import get_registry


class PlanningAgent:
    """Base class for planning agents."""
    
    def __init__(
        self,
        agent_type: str,  # "spec", "arch", "qa"
        process_manager: ProcessManager,
        cwd: str,
        context_file: str
    ):
        self.agent_type = agent_type
        self.pm = process_manager
        self.cwd = cwd
        self.context_file = context_file
        self.output_file = f"{agent_type.upper()}.md"
        self.task_name = f"planning-{agent_type}"
    
    async def run(self) -> str:
        """Run planning agent and return output file path.
        
        Returns:
            Path to output markdown file
            
        Raises:
            RuntimeError: If planning fails
        """
        # Spawn planning agent (Gemini model)
        process = await self.pm.spawn_process(
            task_name=self.task_name,
            cwd=self.cwd,
            prompt=self._build_prompt(),
            allowed_tools=["read", "grep", "find"]  # Read-only tools
        )
        
        try:
            # Wait for completion
            output_path = await self._collect_output(process)
            return output_path
        finally:
            # CRITICAL: Delete planning session (context garbage collection)
            await self.pm.stop_process(self.task_name)
            log(f"Deleted planning session: {self.task_name}")
    
    def _build_prompt(self) -> str:
        """Build agent-specific prompt."""
        base_prompt = f"""You are the {self.agent_type} planning agent.

Read the context file: {self.context_file}

Your role:
{self._get_role_description()}

Process:
1. Explore the codebase (grep, read, search) - be messy, explore freely
2. Produce a clean markdown document: {self.output_file}
3. Include only the final analysis, not your exploration process

Output format: See docs/AGENT_ROLES.md for {self.agent_type} agent specification.
"""
        return base_prompt
    
    def _get_role_description(self) -> str:
        """Get role-specific description."""
        roles = {
            "spec": """- Define requirements from product perspective
- Create acceptance criteria (testable)
- Identify edge cases
- Explicit non-goals""",
            "arch": """- Design technical architecture
- Define module boundaries
- Propose APIs and data flows
- Migration plan if needed""",
            "qa": """- Risk assessment
- Test plan (unit, integration, e2e)
- Failure modes and mitigations
- Rollout safety plan"""
        }
        return roles.get(self.agent_type, "")
    
    async def _collect_output(self, process: ClaudeProcess) -> str:
        """Collect output from planning agent."""
        # Monitor events until completion
        # Extract markdown output
        # Save to output_file
        # Return path
        pass


class PlanningCoordinator:
    """Coordinates parallel planning agents."""
    
    def __init__(self, process_manager: ProcessManager):
        self.pm = process_manager
    
    async def run_planning_phase(
        self,
        context_file: str,
        output_dir: str
    ) -> dict[str, str]:
        """Run all planning agents in parallel.
        
        Returns:
            Dict mapping agent_type -> output_file_path
        """
        # Spawn all three agents in parallel
        agents = [
            PlanningAgent("spec", self.pm, output_dir, context_file),
            PlanningAgent("arch", self.pm, output_dir, context_file),
            PlanningAgent("qa", self.pm, output_dir, context_file),
        ]
        
        # Run in parallel
        results = await asyncio.gather(
            *[agent.run() for agent in agents],
            return_exceptions=True
        )
        
        # Check for failures
        outputs = {}
        for agent, result in zip(agents, results):
            if isinstance(result, Exception):
                log(f"Planning agent {agent.agent_type} failed: {result}")
                raise RuntimeError(f"Planning failed: {agent.agent_type}")
            outputs[agent.agent_type] = result
        
        return outputs
```

#### Step 1.2: Integrate with Operator

**Modify**: `session_operator.py`

```python
# Add to operator commands
async def handle_spawn_request(request: str, context_file: str):
    """Handle spawn request with planning phase."""
    
    # Stage 1: Planning (parallel)
    coordinator = PlanningCoordinator(process_manager)
    planning_outputs = await coordinator.run_planning_phase(
        context_file=context_file,
        output_dir=operator_dir
    )
    
    # Merge planning outputs
    plan_file = await merge_planning_outputs(planning_outputs)
    
    # Stage 2: Backlog generation
    backlog_file = await generate_backlog(plan_file)
    
    # Stage 3: Implementation (existing worker spawning)
    # ... continue with existing workflow
```

#### Step 1.3: Add Planning Commands

**Modify**: `bot_commands.py`

```python
@command_handler("/plan")
async def handle_plan_command(args: str):
    """Start planning phase for a feature request."""
    # Parse feature request
    # Generate context file
    # Run planning phase
    # Return planning outputs
    pass
```

**Success Criteria**:
- [ ] 3 planning agents spawn in parallel
- [ ] Each produces clean output document
- [ ] Planning sessions are deleted after merge
- [ ] Planning context never enters implementation

### Phase 2: Add Backlog System (Week 2)

#### Step 2.1: Create Backlog Module

**File**: `backlog.py`

```python
"""Backlog generation and management."""

import yaml
from pathlib import Path
from typing import Optional

from claude_process import ClaudeProcess
from process_manager import ProcessManager


class BacklogGenerator:
    """Generates task backlog from plan."""
    
    def __init__(self, process_manager: ProcessManager):
        self.pm = process_manager
    
    async def generate_backlog(
        self,
        plan_file: str,
        output_file: str = "BACKLOG.yaml"
    ) -> str:
        """Generate backlog from plan.
        
        CRITICAL: Start with fresh session (no planning debris).
        """
        # Spawn conductor agent (fresh session)
        process = await self.pm.spawn_process(
            task_name="backlog-generation",
            cwd=Path(plan_file).parent,
            prompt=self._build_backlog_prompt(plan_file),
            allowed_tools=["read"]  # Read plan only
        )
        
        try:
            # Collect BACKLOG.yaml
            backlog_path = await self._collect_backlog(process, output_file)
            
            # Validate backlog
            self._validate_backlog(backlog_path)
            
            return backlog_path
        finally:
            # Delete backlog generation session
            await self.pm.stop_process("backlog-generation")
    
    def _build_backlog_prompt(self, plan_file: str) -> str:
        return f"""You are the Conductor generating a task backlog.

Read: {plan_file}

Generate BACKLOG.yaml with atomic tasks following docs/BACKLOG_SCHEMA.md.

Requirements:
- Each task: 2-4 hours, atomic, testable
- Explicit dependencies
- Clear acceptance criteria
- File hints (not full files)

Output: BACKLOG.yaml only. No planning discussion.
"""
    
    def _validate_backlog(self, backlog_path: str):
        """Validate backlog structure."""
        with open(backlog_path) as f:
            backlog = yaml.safe_load(f)
        
        # Check all tasks have acceptance criteria
        for task in backlog.get("tasks", []):
            if not task.get("acceptance"):
                raise ValueError(f"Task {task['id']} missing acceptance criteria")
            
            if not task.get("scope", {}).get("files_hint"):
                raise ValueError(f"Task {task['id']} missing file hints")
        
        # Check for circular dependencies
        self._check_dependencies(backlog)
    
    def _check_dependencies(self, backlog: dict):
        """Check for circular dependencies."""
        # Implementation: DFS to detect cycles
        pass


class BacklogManager:
    """Manages task backlog state."""
    
    def __init__(self, backlog_file: str):
        self.backlog_file = Path(backlog_file)
        self._load()
    
    def _load(self):
        """Load backlog from file."""
        with open(self.backlog_file) as f:
            self.backlog = yaml.safe_load(f)
    
    def get_ready_tasks(self) -> list[dict]:
        """Get tasks ready to start (dependencies met)."""
        completed = {
            t["id"] for t in self.backlog["tasks"]
            if t.get("status") == "completed"
        }
        
        ready = []
        for task in self.backlog["tasks"]:
            if task.get("status") not in ["pending", "ready"]:
                continue
            
            deps = set(task.get("depends_on", []))
            if deps.issubset(completed):
                ready.append(task)
        
        return ready
    
    def update_task_status(self, task_id: str, status: str):
        """Update task status."""
        for task in self.backlog["tasks"]:
            if task["id"] == task_id:
                task["status"] = status
                break
        
        self._save()
    
    def _save(self):
        """Save backlog to file."""
        with open(self.backlog_file, "w") as f:
            yaml.dump(self.backlog, f)
```

#### Step 2.2: Integrate with Worker Spawning

**Modify**: `session_worker.py`

```python
from backlog import BacklogManager

async def spawn_workers_from_backlog(backlog_file: str, max_workers: int = 3):
    """Spawn workers for ready tasks from backlog."""
    backlog = BacklogManager(backlog_file)
    ready_tasks = backlog.get_ready_tasks()
    
    # Spawn up to max_workers
    for task in ready_tasks[:max_workers]:
        await spawn_worker_from_task(task, backlog)


async def spawn_worker_from_task(task: dict, backlog: BacklogManager):
    """Spawn worker for a specific task."""
    # Create worktree
    worktree_path = create_worktree(task["id"])
    
    # Build minimal task context (<3KB)
    context = build_task_context(task)
    
    # Spawn worker (fresh session)
    process = await process_manager.spawn_process(
        task_name=task["id"],
        cwd=worktree_path,
        prompt=context,
        allowed_tools=["read", "write", "edit", "bash"]
    )
    
    # Update backlog status
    backlog.update_task_status(task["id"], "in_progress")
```

**Success Criteria**:
- [ ] Backlog generated from PLAN.md
- [ ] Tasks are atomic with dependencies
- [ ] Ready tasks identified automatically
- [ ] Workers spawned from backlog (not ad-hoc)

### Phase 3: Add Context Engineering (Week 3)

#### Step 3.1: Context Compression

**File**: `context_compressor.py`

```python
"""Context compression for task contexts."""

from claude_process import ClaudeProcess
from process_manager import ProcessManager


class ContextCompressor:
    """Compresses task contexts while preserving critical info."""
    
    async def compress_task_context(
        self,
        task: dict,
        process_manager: ProcessManager
    ) -> str:
        """Compress task context to <3KB."""
        
        # Build full context
        full_context = build_full_context(task)
        
        # Check size
        if len(full_context.encode()) < 3000:
            return full_context
        
        # Spawn compressor agent (Gemini)
        process = await process_manager.spawn_process(
            task_name=f"compress-{task['id']}",
            cwd=task["worktree_path"],
            prompt=self._build_compression_prompt(full_context),
            allowed_tools=[]
        )
        
        try:
            compressed = await self._collect_compressed(process)
            return compressed
        finally:
            await process_manager.stop_process(f"compress-{task['id']}")


def build_task_context(task: dict) -> str:
    """Build minimal task context (<3KB target)."""
    lines = [
        f"# Task {task['id']}: {task['title']}",
        "",
        "## Specification",
        task["description"],
        "",
        "## Acceptance Criteria",
    ]
    
    for criterion in task.get("acceptance", []):
        lines.append(f"- {criterion}")
    
    lines.append("")
    lines.append("## Context (Compressed)")
    
    # Add only essential context
    context = task.get("context", {})
    
    # Constraints only
    if context.get("constraints"):
        lines.append("### Constraints")
        for constraint in context["constraints"]:
            lines.append(f"- {constraint}")
    
    # Patterns (snippets only)
    if context.get("patterns"):
        lines.append("### Code Patterns")
        for pattern in context["patterns"]:
            lines.append(f"- {pattern}")  # File path + line range
    
    # Negative evidence
    if context.get("gotchas"):
        lines.append("### Gotchas")
        for gotcha in context["gotchas"]:
            lines.append(f"- {gotcha}")
    
    return "\n".join(lines)
```

#### Step 3.2: Session Lifecycle Management

**Modify**: `process_manager.py`

```python
class ProcessManager:
    """Enhanced with context lifecycle tracking."""
    
    def __init__(self):
        # ... existing code ...
        self._session_lifecycle: dict[str, dict] = {}
    
    async def spawn_process(self, ...):
        """Track session lifecycle."""
        process = await self._spawn_process(...)
        
        # Track lifecycle
        self._session_lifecycle[task_name] = {
            "phase": "planning" | "backlog" | "implementation",
            "created": datetime.now(),
            "context_size": 0,
            "will_delete": True  # Planning sessions are disposable
        }
        
        return process
    
    async def stop_process(self, task_name: str):
        """Stop and optionally delete session."""
        lifecycle = self._session_lifecycle.get(task_name, {})
        
        if lifecycle.get("will_delete"):
            # Delete session completely (context garbage collection)
            await self._delete_session(task_name)
            log(f"Deleted session: {task_name} (context discarded)")
        else:
            # Just stop, keep session
            await self._stop_process(task_name)
    
    async def _delete_session(self, task_name: str):
        """Completely delete session (context garbage collection)."""
        # Stop process
        await self._stop_process(task_name)
        
        # Delete session from Claude
        # (Implementation depends on Claude Code API)
        
        # Remove from registry
        registry = get_registry()
        registry.remove_task(task_name)
        
        # Clean up lifecycle tracking
        del self._session_lifecycle[task_name]
```

#### Step 3.3: Rebase Agent

**File**: `rebase_agent.py`

```python
"""Rebase agent for improving task specs."""

class RebaseAgent:
    """Analyzes failures and improves task specs."""
    
    async def rebase_task(
        self,
        task_id: str,
        failure_details: dict,
        process_manager: ProcessManager
    ) -> dict:
        """Rebase task spec based on failure."""
        
        # Load original task
        backlog = BacklogManager(backlog_file)
        task = backlog.get_task(task_id)
        
        # Spawn rebase agent
        process = await process_manager.spawn_process(
            task_name=f"rebase-{task_id}",
            cwd=task["worktree_path"],
            prompt=self._build_rebase_prompt(task, failure_details),
            allowed_tools=["read"]
        )
        
        try:
            improved_spec = await self._collect_improved_spec(process)
            
            # Update task spec
            backlog.update_task_spec(task_id, improved_spec)
            
            # Reset status
            backlog.update_task_status(task_id, "ready")
            backlog.increment_attempts(task_id)
            
            return improved_spec
        finally:
            await process_manager.stop_process(f"rebase-{task_id}")
```

**Success Criteria**:
- [ ] Task contexts compressed to <3KB
- [ ] Planning sessions deleted after merge
- [ ] Context cleared between phases
- [ ] Rebase agent improves failed task specs

### Phase 4: OpenCode Integration (Week 4, Optional)

#### Step 4.1: Add OpenCode SDK

**File**: `opencode_client.py`

```python
"""OpenCode SDK integration."""

from opencode import createOpencode


class OpenCodeClient:
    """OpenCode SDK client wrapper."""
    
    def __init__(self):
        self.client = None
    
    async def initialize(self):
        """Initialize OpenCode client."""
        opencode = await createOpencode({
            config: {
                model: "anthropic/claude-3-5-sonnet-20241022"
            }
        })
        self.client = opencode.client
    
    async def create_session(self, title: str, agent: str = None):
        """Create new session."""
        return await self.client.session.create({
            body: {
                title: title,
                agent: agent
            }
        })
    
    async def delete_session(self, session_id: str):
        """Delete session (context garbage collection)."""
        await self.client.session.delete({
            path: { id: session_id }
        })
    
    async def send_prompt(self, session_id: str, prompt: str, no_reply: bool = False):
        """Send prompt to session."""
        return await self.client.session.prompt({
            path: { id: session_id },
            body: {
                parts: [{ type: "text", text: prompt }],
                noReply: no_reply
            }
        })
```

#### Step 4.2: Migrate ProcessManager

**Modify**: `process_manager.py`

```python
# Option 1: Keep Claude Code CLI (simpler for MVP)
# Option 2: Migrate to OpenCode SDK (better long-term)

class ProcessManager:
    """Hybrid: Support both Claude Code CLI and OpenCode SDK."""
    
    def __init__(self, use_opencode: bool = False):
        self.use_opencode = use_opencode
        if use_opencode:
            self.opencode = OpenCodeClient()
            await self.opencode.initialize()
    
    async def spawn_process(self, ...):
        if self.use_opencode:
            return await self._spawn_opencode(...)
        else:
            return await self._spawn_claude_cli(...)
```

**Success Criteria**:
- [ ] OpenCode SDK integrated
- [ ] Can create/delete sessions programmatically
- [ ] Better orchestration control
- [ ] Backward compatible with CLI approach

---

## Code Changes Required

### New Files

1. **`planning_agents.py`** (300 lines)
   - `PlanningAgent` class
   - `PlanningCoordinator` class
   - Planning phase orchestration

2. **`backlog.py`** (400 lines)
   - `BacklogGenerator` class
   - `BacklogManager` class
   - Dependency resolution
   - Task status tracking

3. **`context_compressor.py`** (200 lines)
   - `ContextCompressor` class
   - Context compression logic
   - Task context builders

4. **`rebase_agent.py`** (250 lines)
   - `RebaseAgent` class
   - Failure analysis
   - Spec improvement

5. **`opencode_client.py`** (150 lines, optional)
   - OpenCode SDK wrapper
   - Session management

**Total New Code**: ~1,300 lines

### Modified Files

1. **`session_operator.py`**
   - Add planning phase before spawn
   - Add backlog generation
   - Integrate with planning coordinator

2. **`session_worker.py`**
   - Add backlog-based spawning
   - Add context compression
   - Add task context builders

3. **`process_manager.py`**
   - Add session lifecycle tracking
   - Add context deletion
   - Add OpenCode support (optional)

4. **`bot_commands.py`**
   - Add `/plan` command
   - Add `/backlog` command
   - Add `/rebase` command

5. **`registry.py`**
   - Add backlog file tracking
   - Add task dependency tracking

**Total Modified Code**: ~500 lines

### Configuration Changes

**`~/.claude/settings.json`**:
```json
{
  "hooks": {
    // Existing hooks...
  },
  "agents": {
    "planner-spec": {
      "model": "google/gemini-2.0-flash-exp",
      "description": "Product/spec planning agent"
    },
    "planner-arch": {
      "model": "google/gemini-2.0-flash-exp",
      "description": "Architecture planning agent"
    },
    "planner-qa": {
      "model": "google/gemini-2.0-flash-exp",
      "description": "Risk/QA planning agent"
    },
    "conductor": {
      "model": "anthropic/claude-3-5-sonnet-20241022",
      "description": "Master orchestrator"
    },
    "implementer": {
      "model": "anthropic/claude-3-5-sonnet-20241022",
      "description": "Code implementation agent"
    }
  }
}
```

---

## Migration Strategy

### Phase 1: Add Planning (Non-Breaking)

**Approach**: Add planning phase as optional enhancement

1. **Keep existing `/spawn` command** (backward compatible)
2. **Add new `/plan` command** (new workflow)
3. **Add planning agents** (parallel to existing code)
4. **Test planning phase** independently

**Risk**: Low (doesn't break existing functionality)

### Phase 2: Add Backlog (Non-Breaking)

**Approach**: Add backlog as optional enhancement

1. **Keep ad-hoc spawning** (backward compatible)
2. **Add backlog-based spawning** (new workflow)
3. **Add backlog commands** (`/backlog`, `/tasks`)
4. **Test backlog system** independently

**Risk**: Low (doesn't break existing functionality)

### Phase 3: Add Context Engineering (Breaking)

**Approach**: Make context engineering opt-in

1. **Add context compression** (optional per task)
2. **Add session deletion** (configurable)
3. **Add rebase agent** (optional)
4. **Test context hygiene** independently

**Risk**: Medium (changes session lifecycle)

**Mitigation**: Feature flags, gradual rollout

### Phase 4: OpenCode Integration (Optional)

**Approach**: Hybrid support

1. **Keep Claude Code CLI** (default)
2. **Add OpenCode SDK** (opt-in)
3. **Feature flag** to switch between
4. **Test both paths**

**Risk**: Low (optional, backward compatible)

---

## Testing Strategy

### Unit Tests

**File**: `tests/test_planning_agents.py`

```python
async def test_planning_agents_parallel():
    """Test planning agents run in parallel."""
    coordinator = PlanningCoordinator(mock_process_manager)
    results = await coordinator.run_planning_phase(...)
    
    assert len(results) == 3
    assert "spec" in results
    assert "arch" in results
    assert "qa" in results


async def test_planning_sessions_deleted():
    """Test planning sessions are deleted after merge."""
    # Spawn planning agents
    # Collect outputs
    # Verify sessions deleted
    assert not process_manager.is_running("planning-spec")
    assert not process_manager.is_running("planning-arch")
    assert not process_manager.is_running("planning-qa")
```

**File**: `tests/test_backlog.py`

```python
def test_backlog_generation():
    """Test backlog generated from plan."""
    generator = BacklogGenerator(mock_process_manager)
    backlog = generator.generate_backlog("PLAN.md")
    
    assert Path(backlog).exists()
    assert all(task.get("acceptance") for task in backlog["tasks"])
    assert all(task.get("scope", {}).get("files_hint") for task in backlog["tasks"])


def test_dependency_resolution():
    """Test ready tasks identified correctly."""
    backlog = BacklogManager("BACKLOG.yaml")
    ready = backlog.get_ready_tasks()
    
    # T01 has no dependencies
    assert "T01" in [t["id"] for t in ready]
    
    # T02 depends on T01, not ready yet
    assert "T02" not in [t["id"] for t in ready]
```

**File**: `tests/test_context_compression.py`

```python
def test_context_compression():
    """Test task context compressed to <3KB."""
    compressor = ContextCompressor()
    compressed = compressor.compress_task_context(large_task)
    
    assert len(compressed.encode()) < 3000
    assert "Specification" in compressed
    assert "Acceptance Criteria" in compressed
    # Should NOT include planning discussion
    assert "We explored three approaches" not in compressed
```

### Integration Tests

**File**: `tests/test_integration_workflow.py`

```python
async def test_full_workflow():
    """Test complete workflow: planning → backlog → implementation."""
    # Stage 1: Planning
    coordinator = PlanningCoordinator(process_manager)
    planning_outputs = await coordinator.run_planning_phase(...)
    
    # Verify planning sessions deleted
    assert not any_process_running("planning-*")
    
    # Stage 2: Backlog
    generator = BacklogGenerator(process_manager)
    backlog_file = await generator.generate_backlog("PLAN.md")
    
    # Verify backlog generation session deleted
    assert not process_manager.is_running("backlog-generation")
    
    # Stage 3: Implementation
    backlog = BacklogManager(backlog_file)
    ready_tasks = backlog.get_ready_tasks()
    
    # Spawn workers
    for task in ready_tasks[:3]:
        await spawn_worker_from_task(task, backlog)
    
    # Verify workers have clean contexts
    for task in ready_tasks[:3]:
        context = get_task_context(task["id"])
        assert len(context.encode()) < 3000
        assert "planning" not in context.lower()
```

### Manual Testing Checklist

- [ ] Planning phase runs 3 agents in parallel
- [ ] Planning outputs are clean (no exploration debris)
- [ ] Planning sessions deleted after merge
- [ ] Backlog generated with atomic tasks
- [ ] Dependencies tracked correctly
- [ ] Ready tasks identified automatically
- [ ] Workers spawned from backlog
- [ ] Task contexts <3KB
- [ ] No planning context in implementation
- [ ] Rebase agent improves failed specs
- [ ] Context compression works
- [ ] Session lifecycle tracked correctly

---

## Success Metrics

### Context Quality

- **Planning context in implementation**: 0% ✓
- **Task context size**: <3KB ✓
- **Session reuse**: 0 ✓

### Workflow

- **Planning phase**: 3 agents parallel, 10-15 min ✓
- **Backlog generation**: <5 min ✓
- **Task spawning**: From backlog, not ad-hoc ✓

### Code Quality

- **New code**: ~1,300 lines
- **Modified code**: ~500 lines
- **Test coverage**: >80%
- **Backward compatibility**: Maintained ✓

---

## Next Steps

### Immediate (This Week)

1. **Review this draft** with team
2. **Prioritize phases** (planning vs backlog vs context)
3. **Set up development environment**
4. **Create feature branch**: `feature/multi-agent-system`

### Short-term (Next 2 Weeks)

1. **Implement Phase 1** (Planning subagents)
2. **Test planning phase** end-to-end
3. **Document learnings** in `docs/MVP_RESULTS.md`

### Medium-term (Next Month)

1. **Implement Phase 2** (Backlog system)
2. **Implement Phase 3** (Context engineering)
3. **Integration testing**
4. **Performance optimization**

### Long-term (Next Quarter)

1. **Implement Phase 4** (OpenCode integration)
2. **Metrics & analytics**
3. **Production deployment**
4. **User documentation**

---

## Conclusion

Claude Army provides an excellent foundation for implementing the multi-agent coding system. The key additions are:

1. **Planning subagents** - Parallel planning with context garbage collection
2. **Backlog system** - Structured task decomposition and dependency tracking
3. **Context engineering** - Explicit context hygiene and compression
4. **OpenCode integration** - Better programmatic control (optional)

The implementation can be done incrementally, maintaining backward compatibility while adding new capabilities.

**Estimated Effort**: 3-4 weeks for MVP (Phases 1-3), +1 week for OpenCode integration (Phase 4).

**Risk Level**: Low-Medium (incremental, backward compatible, well-tested)

**Recommendation**: Start with Phase 1 (Planning), validate the pattern, then proceed to Phases 2-3.

---

## References

- **[COMPREHENSIVE_GUIDE.md](./COMPREHENSIVE_GUIDE.md)** - Complete system design
- **[SYSTEM_SPEC.md](./SYSTEM_SPEC.md)** - System specification
- **[AGENT_ROLES.md](./AGENT_ROLES.md)** - Agent specifications
- **[BACKLOG_SCHEMA.md](./BACKLOG_SCHEMA.md)** - Task format
- **[Claude Army SPEC.md](../../lookout-projects/claude-army/SPEC.md)** - Current architecture

