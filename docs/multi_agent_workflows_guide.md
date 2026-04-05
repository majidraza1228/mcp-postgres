# Multi-Agent & Subagent Workflows Comparison
## Codex CLI vs GitHub Copilot CLI vs Claude Code

### Complete Guide to Agent-Based Development Workflows

---

## Executive Summary

All three tools support multi-agent workflows, but with fundamentally different architectures and use cases. This guide helps developers understand when and how to use each tool's multi-agent capabilities.

**Quick Comparison:**
- **Codex CLI**: Subagent-style (spawn & report back) + MCP server orchestration
- **GitHub Copilot CLI**: Fleet-style orchestration with centralized coordinator
- **Claude Code**: Both subagents AND agent teams (peer-to-peer communication)

---

## 1. Architecture Patterns Overview

### Subagent Pattern (Spawn & Report)
```
Main Agent
  ├── Spawns Subagent A (isolated context)
  ├── Spawns Subagent B (isolated context)  
  └── Spawns Subagent C (isolated context)
       ↓ (results only)
    Main Agent (synthesizes)
```

**Characteristics:**
- One-way communication (child → parent only)
- No inter-agent communication
- Parent synthesizes all results
- Simpler coordination

---

### Orchestrator Pattern (Centralized)
```
Orchestrator Agent
  ├── Plans & decomposes task
  ├── Dispatches Subagent A
  ├── Dispatches Subagent B
  ├── Dispatches Subagent C
  └── Manages dependencies
       ↓ (coordinated results)
    Orchestrator (final synthesis)
```

**Characteristics:**
- Central task decomposition
- Dependency-aware execution
- Parallel where possible
- Single point of coordination

---

### Agent Teams Pattern (Peer-to-Peer)
```
Team Lead
  ├── Spawns Teammate A
  ├── Spawns Teammate B
  └── Spawns Teammate C
       ↓↔↓↔↓ (direct messaging)
  Teammates coordinate directly
  Share task list
       ↓
    Team Lead (synthesis)
```

**Characteristics:**
- Peer-to-peer communication
- Shared task management
- Self-coordination
- Collaborative problem-solving

---

## 2. Codex CLI - Subagent & MCP Orchestration

### 2.1 Subagent Architecture

**Type**: Spawn-and-report subagents
**Availability**: Enabled by default in current releases
**Context**: Each subagent has isolated context window

#### How It Works

```bash
# Codex automatically spawns subagents when you ask
> Review this PR comprehensively

# Behind the scenes:
# - pr_explorer: Maps codebase (read-only)
# - security_reviewer: Checks vulnerabilities
# - test_analyzer: Reviews test coverage
# - Each returns focused results
# - Main agent synthesizes into final report
```

#### Key Features

| Feature | Details |
|---------|---------|
| **Spawning** | Automatic based on task complexity |
| **Context** | Each subagent gets own context window |
| **Communication** | One-way (subagent → main agent) |
| **Parallelism** | Yes, multiple subagents run in parallel |
| **Max Depth** | Configurable (default: 1 level) |
| **Tool Access** | Inherits from parent + custom restrictions |

#### Custom Subagent Configuration

**Location**: `~/.codex/agents/` (global) or `.codex/agents/` (project)

**Example: Security Reviewer**
```toml
# ~/.codex/agents/security-reviewer.toml

name = "security-reviewer"
description = "PR reviewer focused on security vulnerabilities"

developer_instructions = """
Review code for security issues:
- SQL injection risks
- XSS vulnerabilities  
- Authentication flaws
- Exposed credentials
"""

nickname_candidates = ["Guardian", "Sentinel", "Watchdog"]
model = "gpt-5.3-codex"
model_reasoning_effort = "high"
sandbox_mode = "read-only"
```

**Example: Code Mapper**
```toml
name = "code_mapper"
description = "Maps codebase structure and dependencies"

developer_instructions = """
Create comprehensive codebase map:
- Module dependencies
- File relationships
- Entry points
- Key interfaces
"""

sandbox_mode = "read-only"
```

#### Multi-Agent Review Example

```bash
# This triggers 3 specialized subagents automatically
codex
> Review this PR for security, performance, and architecture

# Codex spawns:
# 1. security_reviewer - Scans for vulnerabilities
# 2. performance_analyzer - Identifies bottlenecks
# 3. architecture_reviewer - Checks design patterns
#
# Each works independently, returns focused report
# Main agent synthesizes comprehensive review
```

### 2.2 MCP Server Orchestration

**Advanced Pattern**: Codex as MCP server + Agents SDK

#### Use Cases
- Multi-agent software delivery pipelines
- Coordinated team workflows
- Deterministic, traceable orchestration

#### Setup

```python
# codex_mcp.py
from agents import Agent, Runner
from agents.mcp import MCPServerStdio

async def main():
    # Start Codex as MCP server
    async with MCPServerStdio(
        name="Codex",
        params={"command": "codex", "args": ["mcp"]}
    ) as codex_server:
        
        # Define specialized agents
        designer = Agent(
            name="Game Designer",
            instructions="Create game design briefs",
            mcp_servers=[codex_server]
        )
        
        developer = Agent(
            name="Developer", 
            instructions="Implement games using Codex",
            mcp_servers=[codex_server]
        )
        
        # Orchestrate workflow
        runner = Runner(agents=[designer, developer])
        result = await runner.run("Create a browser game")
```

#### Advanced Multi-Agent Example

```python
# Full development pipeline
project_manager = Agent(
    name="Project Manager",
    instructions="Coordinate team, enforce standards",
    handoff_to=["designer", "frontend_dev", "backend_dev", "tester"]
)

designer = Agent(
    name="Designer",
    instructions="Create technical specs",
    output_folder="design/"
)

frontend_dev = Agent(
    name="Frontend Developer",
    instructions="Build UI components",
    output_folder="frontend/",
    mcp_servers=[codex_server]
)

backend_dev = Agent(
    name="Backend Developer", 
    instructions="Build APIs and services",
    output_folder="backend/",
    mcp_servers=[codex_server]
)

tester = Agent(
    name="Tester",
    instructions="Write and run tests",
    output_folder="tests/"
)
```

### 2.3 Configuration

**Subagent Settings**: `~/.codex/config.toml`

```toml
[agents]
max_depth = 1  # Prevent deep nesting
# max_depth = 2 allows subagents to spawn their own subagents
```

**Approval Inheritance**:
- Subagents inherit parent's sandbox policy
- Runtime overrides (--yolo, /approvals) apply to children
- Can override per-agent in .toml file

### 2.4 Strengths & Limitations

**Strengths:**
- ✅ Simple spawn-and-report pattern
- ✅ Custom agent definitions (.toml files)
- ✅ MCP server mode for external orchestration
- ✅ Automatic parallelization
- ✅ Nickname customization
- ✅ Works with Agents SDK for complex workflows

**Limitations:**
- ❌ No peer-to-peer agent communication
- ❌ Subagents can't message each other
- ❌ Limited to hierarchical coordination
- ❌ Requires external orchestrator for complex workflows

**Best For:**
- PR reviews with multiple perspectives
- Parallel codebase exploration
- Code review with focused specialists
- Integration with Agents SDK pipelines

---

## 3. GitHub Copilot CLI - Fleet Orchestration

### 3.1 Fleet Architecture

**Type**: Centralized orchestrator with parallel subagents
**Command**: `/fleet`
**Availability**: Generally available (all Copilot plans)

#### How It Works

```bash
# 1. Create plan in plan mode
copilot
Shift+Tab  # Enter plan mode
> Refactor authentication module with tests

# 2. Execute with /fleet
/fleet implement the plan

# Behind the scenes:
# - Main agent decomposes into independent tasks
# - Creates dependency graph (stored in SQLite)
# - Dispatches parallelizable tasks to subagents
# - Waits for dependencies before dispatching next wave
# - Verifies outputs and synthesizes results
```

#### Orchestration Process

```
User Prompt
     ↓
Orchestrator Analysis
     ↓
Task Decomposition (→ SQLite DB)
     ├─ Task A (no deps) → Subagent 1 ⚡
     ├─ Task B (no deps) → Subagent 2 ⚡
     ├─ Task C (depends on A, B) → waits...
     └─ Task D (no deps) → Subagent 3 ⚡
          ↓ (A, B complete)
     Task C → Subagent 4 ⚡
          ↓
Final Synthesis
```

### 3.2 Key Features

| Feature | Details |
|---------|---------|
| **Dependency Tracking** | SQLite database per session |
| **Parallelization** | Automatic based on task graph |
| **Context Isolation** | Each subagent has own context window |
| **Task Visibility** | `/tasks` command shows all subagents |
| **Custom Agents** | Use `@agent-name` to specify |
| **Model Selection** | Per-task model specification |

### 3.3 Usage Patterns

#### Basic Fleet Usage

```bash
# Start with plan mode
copilot
Shift+Tab  # Plan mode

> Add OAuth2 authentication to all API endpoints

# Plan appears - review it
# Then execute with fleet:

/fleet implement the plan
# or
Accept plan and build on autopilot + /fleet
```

#### Custom Agent Assignment

```bash
# .github/agents/technical-writer.md
---
name: technical-writer
description: Documentation specialist
model: claude-sonnet-4
tools: ["bash", "create", "edit", "view"]
---

You write clear, concise technical documentation.
Follow the project style guide in /docs/styleguide.md.
```

**Use it:**
```bash
/fleet Use @technical-writer for all docs tasks, 
       default agent for code changes
```

#### Monitoring Fleet

```bash
# View all background tasks
/tasks

# Navigate with arrow keys
# Press Enter to view details
# Press 'k' to kill a task
# Press 'r' to remove completed tasks
```

### 3.4 Task Decomposition Quality

**Good Decomposition Indicators:**
- Plan shows multiple independent tracks
- Background task UI shows parallel activity
- Progress updates reference separate tracks

**If Fleet Isn't Parallelizing:**
```bash
> Stop
> Decompose this into independent tracks first, 
  then execute tracks in parallel
```

### 3.5 Ideal Use Cases

**Excellent for /fleet:**
```bash
# Multi-file refactors
> Refactor error handling across all API routes

# Parallel documentation
> Generate API docs for all controller classes

# Feature spanning layers
> Implement user profile feature: API + UI + tests

# Independent module updates
> Update all service clients to use new auth
```

**Not ideal for /fleet:**
```bash
# Single-file work
> Refactor this function

# Linear dependencies
> Implement step 1, then step 2, then step 3

# Highly coupled changes
> Redesign database schema and update all queries
```

### 3.6 Cost Considerations

**Premium Request Usage:**
- Each subagent interaction = 1 premium request
- Multiplier varies by model
- Check with `/model` command

**Optimization:**
```bash
# Use lower-cost models for simple subtasks
/fleet Use claude-haiku-4-5 for documentation,
       claude-sonnet-4-5 for complex logic
```

### 3.7 Configuration

**Custom Agents**: `.github/agents/`
**System Agents**: Built-in (no configuration needed)
**MCP Integration**: GitHub MCP server built-in

### 3.8 Strengths & Limitations

**Strengths:**
- ✅ Dependency-aware task orchestration
- ✅ SQLite-based task tracking
- ✅ Custom agent support
- ✅ Per-task model selection  
- ✅ Built-in GitHub MCP integration
- ✅ Background task management
- ✅ Automatic parallelization

**Limitations:**
- ❌ No peer-to-peer agent communication
- ❌ Centralized coordination only
- ❌ Requires well-defined tasks
- ❌ Coordination overhead for simple tasks

**Best For:**
- Large multi-file refactors
- Feature implementation across layers
- Parallel documentation generation
- Complex CI/CD workflows
- Tasks with clear dependency graphs

---

## 4. Claude Code - Dual System (Subagents + Agent Teams)

### 4.1 Two Distinct Patterns

Claude Code supports BOTH patterns:
1. **Subagents**: Traditional spawn-and-report
2. **Agent Teams**: Peer-to-peer collaboration (experimental)

### 4.2 Subagents (Traditional)

**Type**: Hierarchical spawn-and-report
**Availability**: Built-in, always available

#### How Subagents Work

```bash
claude
> Review this codebase for security issues

# Behind the scenes:
# - Main agent spawns security-focused subagent
# - Subagent gets own context window
# - Works independently
# - Reports findings back to main agent
# - Main agent synthesizes response
```

#### Custom Subagent Definition

**Location**: `.claude/subagents/` or `~/.claude/subagents/`

**Example: security-reviewer.md**
```markdown
---
name: security-reviewer
description: Security vulnerability specialist
tools: [Read, Grep, Glob]
sandbox: read-only
---

# Security Review Agent

You are a security expert. Scan for:
- SQL injection vulnerabilities
- XSS attack vectors
- Authentication bypass risks
- Insecure data handling
- Exposed credentials

Provide actionable remediation steps.
```

#### Usage

```bash
# Explicit delegation
> Use security-reviewer to audit auth module

# Automatic (Claude decides)
> Do a comprehensive security review
```

### 4.3 Agent Teams (Experimental)

**Type**: Peer-to-peer collaborative teams
**Availability**: v2.1.32+, requires feature flag
**Status**: Experimental

#### How Agent Teams Work

```
Team Lead (Main Claude Session)
  │
  ├─ Spawns Teammate A (Frontend)
  │   ├─ Own context window
  │   ├─ Can message Team Lead
  │   └─ Can message other teammates ←→
  │
  ├─ Spawns Teammate B (Backend)  
  │   ├─ Own context window      ←→
  │   └─ Reads shared task list
  │
  └─ Spawns Teammate C (Tests)
      └─ Claims tasks from shared list

Teammates coordinate autonomously
Share findings without routing through lead
```

#### Key Differences: Subagents vs Agent Teams

| Aspect | Subagents | Agent Teams |
|--------|-----------|-------------|
| **Communication** | Parent only | Direct peer-to-peer |
| **Context** | Summarized to parent | Fully independent |
| **Coordination** | Through parent | Self-organized via task list |
| **Use Case** | Quick focused work | Complex collaborative tasks |
| **Token Cost** | Lower (1x per agent) | Higher (3-4x for 3 agents) |
| **Sharing** | Results only | Findings, feedback, challenges |

#### Setup

**1. Enable Feature Flag**

```json
// settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Or environment variable:
```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

**2. Create Team**

```bash
claude

> Create an agent team to refactor authentication.
  Spawn three teammates:
  - Frontend specialist for UI components
  - Backend specialist for API endpoints  
  - Test specialist for coverage

# Claude creates:
# - Team lead (orchestrator)
# - 3 independent teammates
# - Shared task list in ~/.claude/tasks/
# - Communication channels
```

#### Team Structure

**Automatically Created:**
```
~/.claude/
├── teams/
│   └── auth-refactor/
│       ├── team.json          # Team config
│       └── tasks/             # Shared task list
└── projects/
    └── your-project/
        └── memory/
```

**team.json** (auto-generated):
```json
{
  "name": "auth-refactor",
  "members": [
    {
      "name": "frontend-specialist",
      "agent_id": "abc123",
      "agent_type": "subagent"
    },
    {
      "name": "backend-specialist", 
      "agent_id": "def456",
      "agent_type": "subagent"
    },
    {
      "name": "test-specialist",
      "agent_id": "ghi789",
      "agent_type": "subagent"
    }
  ]
}
```

#### Communication Mechanisms

**1. Direct Messaging**
```bash
# Teammate A → Teammate B
SendMessage(
  to: "backend-specialist",
  message: "Found auth issue in login.tsx - 
           can you check if API validates this?"
)
```

**2. Shared Task List**
```bash
# Any teammate can claim tasks
TaskList: ~/.claude/tasks/auth-refactor/
  - [ ] Update login component
  - [x] Refactor auth middleware (claimed by backend)
  - [ ] Add integration tests
```

**3. Team Lead Coordination**
```bash
# Lead monitors all teammates
# Synthesizes final results
# Can message any teammate individually
```

#### Interacting with Teammates

**Via Team Lead:**
```bash
claude
> Tell frontend specialist to use Material-UI
```

**Directly (Shift+Down):**
```bash
# In terminal, cycle through teammates
Shift+Down  # Switch to next teammate
# Now talking directly to that teammate
```

**In tmux/iTerm2:**
- Each teammate opens in own split pane
- Visual separation
- Easy context switching

### 4.4 Reusing Subagent Definitions in Teams

**Powerful Feature**: Same definition works as both

```markdown
<!-- .claude/subagents/security-reviewer.md -->
---
name: security-reviewer
description: Security auditing specialist
tools: [Read, Grep, Glob]
sandbox: read-only
model: claude-opus-4-5
---

Audit code for security vulnerabilities.
Prioritize authentication and authorization issues.
```

**Use as subagent:**
```bash
> Use security-reviewer to audit auth module
```

**Use as teammate:**
```bash
> Spawn a teammate using security-reviewer 
  agent type to audit the auth module
```

### 4.5 Use Case Decision Matrix

| Your Need | Use Subagent | Use Agent Team |
|-----------|--------------|----------------|
| Quick focused analysis | ✅ | ❌ |
| Need results, not collaboration | ✅ | ❌ |
| Same-file edits | ✅ | ❌ |
| Sequential dependencies | ✅ | ❌ |
| Multiple specialists needed | ❌ | ✅ |
| Agents sharing findings | ❌ | ✅ |
| Complex cross-layer changes | ❌ | ✅ |
| Agents challenging each other | ❌ | ✅ |
| Token cost matters | ✅ | ❌ |

### 4.6 Real-World Examples

#### Example 1: Quick Security Audit (Subagent)

```bash
claude
> Do a security audit of the payment processing module

# Behind the scenes:
# - Spawns security-focused subagent
# - Subagent scans code
# - Returns vulnerability report
# - Main agent presents findings
```

#### Example 2: Full Feature Implementation (Agent Team)

```bash
claude

> Create agent team for user profile feature.
  Three teammates:
  - API developer: Build backend endpoints
  - Frontend developer: Create UI components
  - Test engineer: Write integration tests
  
  Have them coordinate through task list.

# What happens:
# 1. Team lead created
# 2. Three teammates spawn
# 3. Shared task list: ~/.claude/tasks/user-profile/
# 4. API dev starts on endpoints
# 5. Frontend dev asks API dev about response format
# 6. Test engineer waits for both, then writes tests
# 7. Team coordinates without lead intervention
# 8. Lead synthesizes final deliverable
```

#### Example 3: Multi-Agent PR Review

```bash
# Uses Claude's GitHub app integration
# Automatically spawns multiple review agents:
# - Bug hunter
# - Security auditor
# - Performance analyzer
# - Architecture reviewer

# Agents work in parallel
# Cross-validate findings
# Post inline comments + summary
# ~20 minutes average review time
# 99%+ accuracy (validated findings only)
```

### 4.7 Advanced: /simplify Command

**Built-in Multi-Agent Review**

```bash
/simplify

# Spawns 3 specialized agents:
# 1. Architecture Agent - Finds design issues
# 2. Logic Agent - Detects code duplication
# 3. Performance Agent - Identifies bottlenecks

# Each analyzes independently
# Results merged into actionable report
```

### 4.8 Cost & Performance

**Subagents:**
- Token usage: ~1-1.5x single session
- Speed: 2-3x faster (parallel work)
- Good for: Most daily tasks

**Agent Teams:**
- Token usage: ~3-4x for 3 teammates
- Speed: 3-5x faster (parallel + coordination)
- Good for: Complex multi-domain work

**Lifecycle:**
- Teammates auto-shutdown when idle
- Lead orchestrator manages cleanup
- Don't manually kill agents (can cause issues)

### 4.9 Configuration Files

**Subagent Definition:**
```markdown
<!-- .claude/subagents/refactoring-specialist.md -->
---
name: refactoring-specialist
description: Code refactoring expert
tools: [Read, Write, Bash]
sandbox: workspace-write
model: claude-sonnet-4-5
---

Refactor code following these principles:
- DRY (Don't Repeat Yourself)
- SOLID principles
- Clear naming conventions
- Extract complex logic into functions
```

**Team Config** (auto-generated - don't edit):
```json
{
  "name": "my-team",
  "created_at": "2026-04-05T12:00:00Z",
  "members": [...]
}
```

### 4.10 Strengths & Limitations

**Subagents:**

**Strengths:**
- ✅ Simple spawn-and-report
- ✅ Lower token cost
- ✅ Fast for focused tasks
- ✅ Easy to understand
- ✅ Reusable definitions

**Limitations:**
- ❌ No inter-agent communication
- ❌ Parent must coordinate everything
- ❌ Results-only sharing

**Agent Teams:**

**Strengths:**
- ✅ Peer-to-peer communication
- ✅ Self-coordination
- ✅ Shared task management
- ✅ Agents challenge each other
- ✅ Complex collaboration patterns
- ✅ Direct teammate interaction

**Limitations:**
- ❌ Higher token cost (3-4x)
- ❌ Experimental feature
- ❌ Setup complexity
- ❌ Coordination overhead
- ❌ Known limitations (docs warn about edge cases)

**Best For:**

**Subagents:**
- Quick code reviews
- Focused analysis
- Sequential workflows
- Cost-sensitive tasks

**Agent Teams:**
- Multi-layer refactors
- Feature development (API + UI + Tests)
- Complex investigations
- When agents need to share findings

---

## 5. Side-by-Side Comparison

### 5.1 Architecture Comparison

| Tool | Pattern Type | Communication | Coordination |
|------|--------------|---------------|--------------|
| **Codex CLI** | Subagent (spawn & report) | One-way (child → parent) | Parent synthesizes |
| **GitHub Copilot** | Fleet (orchestrator) | One-way (child → orchestrator) | SQLite task graph |
| **Claude Code** | Both subagents + teams | Subagent: one-way<br>Teams: peer-to-peer | Teams: self-coordinate |

### 5.2 Feature Matrix

| Feature | Codex CLI | GitHub Copilot | Claude Code |
|---------|-----------|----------------|-------------|
| **Subagents** | ✅ | ✅ | ✅ |
| **Custom agents** | ✅ (.toml) | ✅ (.agent.md) | ✅ (.md) |
| **Parallel execution** | ✅ | ✅ | ✅ |
| **Dependency tracking** | ❌ | ✅ (SQLite) | ⚠️ (manual via lead) |
| **Peer-to-peer comms** | ❌ | ❌ | ✅ (Agent Teams) |
| **Shared task list** | ❌ | ✅ | ✅ (Agent Teams) |
| **Direct teammate access** | ❌ | ❌ | ✅ (Agent Teams) |
| **MCP orchestration** | ✅ | ✅ | ✅ |
| **External orchestration** | ✅ (Agents SDK) | ⚠️ (limited) | ✅ |
| **Background tasks UI** | ❌ | ✅ (/tasks) | ⚠️ (tmux/iTerm2) |
| **Cost per agent** | ~1.5x | Varies by model | Sub: 1x, Teams: 3-4x |

### 5.3 Use Case Recommendations

| Use Case | Best Tool | Why |
|----------|-----------|-----|
| **PR Review** | Codex CLI | Built-in review commands + subagents |
| **Large Multi-File Refactor** | GitHub Copilot | SQLite dependency tracking |
| **Complex Feature (API+UI+Tests)** | Claude Code Teams | Peer coordination needed |
| **Quick Security Audit** | Any (subagents) | All support focused workers |
| **Pipeline Orchestration** | Codex CLI | Best Agents SDK integration |
| **GitHub-native Workflows** | GitHub Copilot | Native GitHub MCP |
| **Collaborative Debugging** | Claude Code Teams | Agents share findings |
| **Cost-Sensitive Tasks** | Subagents (any tool) | Lower token usage |

---

## 6. Workflow Examples

### 6.1 Multi-File Refactoring

#### Using Codex CLI

```bash
codex

> Refactor authentication across the codebase.
  Use subagents to parallelize:
  - Frontend components
  - Backend routes
  - Database queries
  - Test updates

# Codex spawns 4 subagents
# Each focuses on their domain
# Results synthesized into cohesive refactor
```

#### Using GitHub Copilot

```bash
copilot
Shift+Tab  # Plan mode

> Refactor authentication module

# Review plan
/fleet implement the plan

# Fleet:
# - Decomposes into frontend, backend, DB, tests
# - Checks dependencies (tests depend on code)
# - Runs frontend + backend + DB in parallel
# - Waits for all 3 before running tests
# - SQLite tracks progress
```

#### Using Claude Code (Agent Teams)

```bash
claude

> Create agent team for auth refactor.
  Four teammates:
  - Frontend: Update React components
  - Backend: Refactor Express routes
  - Database: Update queries and models
  - Tests: Update all test suites
  
  Have backend share API changes with frontend.
  Have tests wait for code changes.

# Teams pattern allows:
# - Backend messages frontend with API changes
# - Frontend adapts without lead intervention
# - Tests claim tasks when code ready
# - Self-coordination via shared task list
```

### 6.2 Feature Implementation

#### Problem: Add OAuth2 to Entire Application

**Codex CLI + Agents SDK:**
```python
# Orchestrate with Agents SDK
project_manager = Agent("PM", handoff_to=[...])
spec_writer = Agent("Spec Writer")
backend_dev = Agent("Backend Dev", mcp_servers=[codex])
frontend_dev = Agent("Frontend Dev", mcp_servers=[codex])
qa_engineer = Agent("QA", mcp_servers=[codex])

# PM coordinates, devs use Codex MCP
# Deterministic, traceable workflow
```

**GitHub Copilot Fleet:**
```bash
copilot
Shift+Tab

> Implement OAuth2 across application:
  - Backend: Add OAuth2 endpoints
  - Frontend: Add login UI
  - Config: Environment variables
  - Tests: Integration tests
  - Docs: Update README

/fleet implement plan

# Fleet identifies:
# - Backend + Config can run parallel
# - Frontend depends on backend
# - Tests depend on frontend + backend
# - Docs independent
# Executes with dependency awareness
```

**Claude Code Agent Teams:**
```bash
claude

> Create OAuth2 implementation team:
  - Architect: Design OAuth2 flow
  - Backend: Implement server endpoints
  - Frontend: Create auth UI
  - DevOps: Configure secrets
  - QA: Write security tests
  
  Have architect share design with all.
  Have backend and frontend coordinate on tokens.
  Have QA validate each component.

# Team coordinates autonomously:
# - Architect shares design doc
# - Backend/frontend discuss token format
# - QA tests as components complete
# - No bottlenecks through lead
```

### 6.3 Codebase Investigation

**Scenario**: Unknown codebase, need to understand architecture

#### Codex CLI
```bash
> Use multiple subagents to map this codebase:
  - Module structure
  - Entry points
  - Database schema
  - API endpoints
  - Key dependencies

# Subagents explore in parallel
# Each returns focused map
# Main agent synthesizes architecture doc
```

#### GitHub Copilot
```bash
/fleet Analyze codebase architecture:
  - Map module dependencies
  - Identify entry points
  - Document API surface
  - Review database schema

# Less ideal - fleet better for implementation
# Consider regular mode with /research instead
```

#### Claude Code Agent Teams
```bash
> Create exploration team:
  - Code Mapper: Module structure
  - API Analyst: Endpoint documentation
  - DB Analyst: Schema and relationships
  - Dependency Tracker: External libraries
  
  Have them share findings and identify patterns.

# Agents coordinate discoveries:
# - Code Mapper finds main entry
# - API Analyst maps routes
# - DB Analyst correlates with endpoints
# - Dependency Tracker flags outdated libs
# - Cross-validation improves accuracy
```

---

## 7. Best Practices

### 7.1 When to Use Subagents (Any Tool)

**✅ Good Use Cases:**
- Focused, independent analysis
- Parallel exploration of separate areas
- When you only need final results
- Cost-sensitive workflows
- Quick turnaround needed

**❌ Avoid For:**
- Tasks requiring agent discussion
- Complex cross-dependencies
- When agents need to share discoveries
- Highly coupled changes

### 7.2 When to Use Fleet (GitHub Copilot)

**✅ Good Use Cases:**
- Well-defined implementation plans
- Clear dependency structure
- Multi-file refactors
- Feature spanning layers (API + UI + Tests)
- GitHub-centric workflows

**❌ Avoid For:**
- Exploratory work without clear plan
- Single-file changes
- Highly sequential tasks
- Vague requirements

### 7.3 When to Use Agent Teams (Claude Code)

**✅ Good Use Cases:**
- Agents need to challenge each other
- Complex multi-domain problems
- Sharing findings improves quality
- Self-coordination reduces bottlenecks
- Investigation requiring discussion

**❌ Avoid For:**
- Simple focused tasks
- Cost-sensitive work
- Sequential workflows
- Same-file edits

### 7.4 Configuration Tips

**Codex CLI:**
```toml
# ~/.codex/config.toml
[agents]
max_depth = 1  # Prevent deep recursion
# Only increase if you specifically need subagents spawning subagents
```

**GitHub Copilot:**
```markdown
# .github/agents/custom-agent.md
---
name: my-specialist
description: When to invoke this agent
model: claude-sonnet-4-5
tools: ["bash", "edit", "view"]
---

Clear, focused instructions for this agent's role.
```

**Claude Code:**
```markdown
<!-- .claude/subagents/specialist.md -->
---
name: specialist
description: Role description
tools: [Read, Write]
sandbox: workspace-write
---

Instructions that work for both subagent and teammate use.
```

### 7.5 Prompt Engineering

**For Subagents (All Tools):**
```bash
# Be explicit about roles
> Use three subagents to review code:
  - Security: Check for vulnerabilities
  - Performance: Identify bottlenecks
  - Style: Verify code standards

# Give clear boundaries
> Have code-mapper subagent focus only on module structure,
  not implementation details
```

**For Fleet:**
```bash
# Emphasize independence
> Decompose into independent tracks:
  Track 1: Update frontend components
  Track 2: Refactor backend services
  Track 3: Update documentation
  
  Execute tracks in parallel.
```

**For Agent Teams:**
```bash
# Encourage collaboration
> Create team where:
  - Teammates share discoveries
  - Backend tells frontend about API changes
  - QA validates as work completes
  - Team coordinates through shared task list
```

---

## 8. Performance & Cost

### 8.1 Speed Comparison

| Pattern | Speed Gain | Conditions |
|---------|------------|------------|
| **Single agent** | 1x (baseline) | Sequential work |
| **Subagents** | 2-3x | Parallelizable tasks |
| **Fleet** | 2-4x | Good task decomposition |
| **Agent Teams** | 3-5x | Complex with coordination |

### 8.2 Token Cost

| Pattern | Token Multiplier | Notes |
|---------|------------------|-------|
| **Single agent** | 1x | Baseline |
| **Subagents** | 1-1.5x | Results summarized |
| **Fleet** | 1.5-2.5x | Depends on # of subagents |
| **Agent Teams** | 3-4x | Full context per teammate |

### 8.3 Cost Optimization

**Use cheaper models for simple subagents:**

```bash
# GitHub Copilot
/fleet Use claude-haiku-4-5 for documentation tasks,
       claude-sonnet-4-5 for complex logic

# Codex CLI (in agent .toml)
model = "gpt-5-codex-mini"  # For simple tasks

# Claude Code (in subagent .md)
model: claude-haiku-4-5  # For read-only analysis
```

**Limit team size:**
```bash
# Instead of 5 teammates, use 3
# Focus on specialists that truly need to collaborate
```

---

## 9. Advanced Patterns

### 9.1 Hybrid Approach

**Use multiple tools for their strengths:**

```bash
# 1. Plan with GitHub Copilot
copilot
Shift+Tab
> Create implementation plan for user management

# 2. Code review with Codex
codex /review

# 3. Complex feature with Claude Code Teams
claude
> Create agent team for implementation
```

### 9.2 Pipeline Orchestration

**Codex CLI as MCP + Agents SDK:**

```python
# Multi-tool pipeline
async def development_pipeline():
    # Planning phase
    planner = Agent("Planner")
    plan = await planner.run("Design auth system")
    
    # Implementation with Codex
    codex_dev = Agent(
        "Developer",
        mcp_servers=[codex_server]
    )
    implementation = await codex_dev.run(plan)
    
    # Review with dedicated reviewer
    reviewer = Agent(
        "Reviewer",
        mcp_servers=[codex_server]
    )
    review = await reviewer.run(f"Review: {implementation}")
    
    # Return full pipeline result
    return {
        "plan": plan,
        "code": implementation,
        "review": review
    }
```

### 9.3 Specialized Teams

**Claude Code: Domain-Specific Teams**

```bash
# Security Team
> Create security audit team:
  - Penetration tester
  - Vulnerability scanner
  - Compliance checker
  Share findings and validate each other's results.

# Performance Team  
> Create performance optimization team:
  - Profiler (identifies bottlenecks)
  - Optimizer (suggests improvements)
  - Validator (benchmarks changes)
  Coordinate through shared metrics.
```

---

## 10. Troubleshooting

### 10.1 Common Issues

**Subagents Not Spawning:**
- Check if task is complex enough
- Explicitly request parallel work
- Verify agent definitions are valid

**Fleet Not Parallelizing:**
```bash
# Solution: Explicitly request decomposition
> Stop. Decompose into independent tracks, then /fleet
```

**Agent Teams Not Communicating:**
- Verify feature flag is enabled
- Check Claude Code version (need v2.1.32+)
- Ensure teammates are actually independent sessions

### 10.2 Debugging

**Codex CLI:**
```bash
# Check agent activity
> Show me which subagents are running

# Review agent config
cat ~/.codex/agents/my-agent.toml
```

**GitHub Copilot:**
```bash
# Monitor tasks
/tasks

# Check usage
/usage
```

**Claude Code:**
```bash
# List team members
> Show me the current team roster

# Switch to teammate
Shift+Down  # Cycle through teammates
```

---

## 11. Future Trends

### 11.1 Emerging Patterns

**A2A Protocol** (Agent-to-Agent):
- Open standard for cross-framework communication
- Released April 2025
- Allows Codex ↔ Claude Code coordination

**Orchestration Frameworks:**
- CrewAI: Autonomous teams + event-driven flows
- LangGraph: Checkpoint-based workflows
- Agents SDK: Production-ready handoffs

### 11.2 Evolution

**Codex CLI:**
- More sophisticated subagent routing
- Better MCP orchestration patterns
- Enhanced Agents SDK integration

**GitHub Copilot:**
- Fleet improvements
- More custom agent features
- Advanced dependency resolution

**Claude Code:**
- Agent Teams graduating from experimental
- Better team coordination primitives
- Enhanced peer-to-peer patterns

---

## 12. Summary & Decision Guide

### Quick Decision Tree

```
Need multi-agent workflow?
│
├─ Simple parallel work?
│  └─ Use subagents (any tool)
│
├─ Complex dependencies?
│  └─ Use GitHub Copilot /fleet
│
├─ Agents need to collaborate?
│  └─ Use Claude Code Agent Teams
│
└─ Pipeline orchestration?
   └─ Use Codex CLI + Agents SDK
```

### By Developer Type

**Solo Developer:**
- Start with subagents (any tool)
- Explore fleet for large refactors
- Try agent teams for learning

**Small Team:**
- GitHub Copilot fleet for shared workflows
- Codex CLI for code reviews
- Experiment with Claude Code teams

**Enterprise:**
- Codex CLI + Agents SDK for pipelines
- GitHub Copilot for GitHub-native work
- Claude Code teams for complex features

### Final Recommendations

**Learn This Order:**
1. **Subagents** - Foundation pattern (all tools)
2. **Fleet** - Structured orchestration (Copilot)
3. **Agent Teams** - Advanced collaboration (Claude Code)
4. **MCP Orchestration** - Production pipelines (Codex)

**Start Here:**
- If you're on GitHub: GitHub Copilot /fleet
- If you need reviews: Codex CLI subagents
- If you want bleeding edge: Claude Code Agent Teams

---

## Resources

**Codex CLI:**
- Subagents Docs: https://developers.openai.com/codex/subagents
- Agents SDK Guide: https://developers.openai.com/codex/guides/agents-sdk

**GitHub Copilot:**
- Fleet Command: https://docs.github.com/copilot/concepts/agents/copilot-cli/fleet
- Custom Agents: https://docs.github.com/copilot/how-tos/copilot-cli/customize-copilot

**Claude Code:**
- Agent Teams: https://code.claude.com/docs/en/agent-teams
- Subagents: Standard feature (built-in docs)

**Community:**
- Awesome Codex Subagents: https://github.com/VoltAgent/awesome-codex-subagents
- Claude Code Agents: https://github.com/wshobson/agents
- Shipyard Multi-Agent Guide: https://shipyard.build/blog/claude-code-multi-agent/
