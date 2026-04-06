# Claude Configuration Stack

> A layered configuration system for Claude (claude.ai, Claude Code, Cowork, and the Claude API).
> Each layer builds on the one below it — lower layers set the foundation; higher layers refine and extend.

---

## Layer 1 — `CLAUDE.md` (Project Instructions)

**What it is:** The primary instruction file Claude reads at the start of every session. It establishes the foundational context for the entire project.

**Where it lives:**
- Project root: `CLAUDE.md`
- Home directory: `~/.claude/CLAUDE.md` (applies globally to all projects)
- Subdirectory: `src/CLAUDE.md` (scoped to that subtree)

**What to put here:**
- Project overview and purpose
- Tech stack and architecture summary
- Coding standards (naming conventions, formatting, language versions)
- File structure conventions
- Key commands (build, test, lint, deploy)
- Do's and Don'ts for this codebase
- Links to important docs or external resources

**Example:**
```markdown
# My Project

## Stack
- Backend: Python 3.12, FastAPI
- Frontend: React 18, TypeScript
- DB: PostgreSQL 15

## Standards
- Use snake_case for variables, PascalCase for classes
- All functions must have docstrings
- Run `pytest` before every commit

## Key Commands
- `make dev` — start local dev server
- `make test` — run full test suite
- `make lint` — run ruff + mypy
```

---

## Layer 2 — `Agents.md` (Sub-Agent Definitions)

**What it is:** Defines the roles, responsibilities, and boundaries of any AI sub-agents used in the project. This layer is relevant when using Claude's multi-agent or orchestration features.

**Where it lives:**
- Project root: `Agents.md` or `.claude/agents/`
- Can also be embedded in `CLAUDE.md` under a dedicated `## Agents` section

**What to put here:**
- Named agent roles (e.g., Researcher, Coder, Reviewer, Tester)
- Each agent's scope: what it can/cannot do
- Tool permissions per agent (e.g., which agents can run bash, read files, call APIs)
- Inter-agent communication patterns (who calls whom)
- Output format expectations per agent

**Example:**
```markdown
# Agent Definitions

## Coder Agent
- Role: Writes and edits source code
- Tools allowed: Read, Write, Edit, Bash (limited to build/test commands)
- Must not: Delete files, commit to git, push to remote

## Reviewer Agent
- Role: Reviews diffs and suggests improvements
- Tools allowed: Read only
- Output: Structured review in Markdown with severity labels

## Tester Agent
- Role: Runs tests and reports failures
- Tools allowed: Bash (test commands only)
- Output: Pass/fail summary with error logs
```

---

## Layer 3 — Hooks (Event-Driven Automation)

**What it is:** Hooks let you intercept Claude's actions at key lifecycle points — before a tool runs, after it completes, or when a session starts/ends. They are scripts or functions that fire automatically.

**Where it lives:**
- `.claude/hooks/` directory
- Configured in `claude_config.json` or via Claude Code settings

**Hook types:**

| Hook | Fires When | Common Use |
|------|-----------|------------|
| `UserPromptSubmit` | User sends a message | Inject context, validate input |
| `PreToolUse` | Before Claude calls a tool | Guard rails, logging, approval gates |
| `PostToolUse` | After a tool finishes | Audit logs, trigger follow-up actions |
| `Stop` | Claude finishes a response | Notifications, summaries, cleanup |

**What to put here:**
- Input validation (e.g., block certain file paths)
- Automatic logging of all tool calls
- Notifications (Slack, email) on specific events
- Auto-formatting after file edits
- Security guardrails (prevent writes outside allowed dirs)

**Example hook (bash):**
```bash
#!/bin/bash
# PostToolUse hook: log all file writes to audit.log
TOOL=$1
FILE=$2
echo "[$(date)] Tool: $TOOL | File: $FILE" >> ~/.claude/audit.log
```

---

## Layer 4 — Memory (Persistent Context)

**What it is:** Memory allows Claude to retain information across sessions — project facts, user preferences, past decisions, and evolving knowledge that would otherwise be lost when a conversation ends.

**Types of memory:**

| Type | Scope | Mechanism |
|------|-------|-----------|
| **In-context** | Current session only | Text in the conversation window |
| **External (file-based)** | Persistent across sessions | Files in `.claude/memory/` or `CLAUDE.md` |
| **Project memory** | Shared across team | Checked-in `.claude/` files in the repo |
| **User memory** | Personal, per-user | `~/.claude/memory/` or user profile |

**What to put here:**
- Decisions made and why (architectural choices, trade-offs)
- User preferences (communication style, output format, verbosity)
- Ongoing tasks and their status
- Known bugs, tech debt, and workarounds
- Glossary of project-specific terms

**Example memory file (`.claude/memory/decisions.md`):**
```markdown
# Project Decisions

## 2026-03-10: Chose PostgreSQL over MongoDB
Reason: Team is more familiar with SQL; data is highly relational.

## 2026-03-22: Switched from Webpack to Vite
Reason: 10x faster HMR; Webpack config was too complex to maintain.

## 2026-04-01: API versioning via URL path (/v1/, /v2/)
Reason: Easier for clients to pin versions; avoids header complexity.
```

---

---

## Layer 5 — Agentic Programming (Advanced Configuration)

This layer covers everything needed to run Claude as a true autonomous coding agent — in isolation, in parallel, with guardrails, and with full observability.

### 5a. Git Worktrees — Isolation for Parallel Agents

Git worktrees allow multiple agents to work on the same repo simultaneously without stepping on each other. Each worktree is a separate checkout of the repo on a different branch — same git history, fully isolated filesystem.

**Why it matters:** If two Claude sub-agents edit the same file at the same time without worktrees, you get conflicts. Worktrees give each agent its own sandbox.

**Claude Code native support:**
```bash
# Claude Code automatically uses worktrees when isolation: "worktree" is set
# Each sub-agent gets its own isolated copy of the repo
```

**Setting up worktrees manually for parallel agents:**
```bash
# Main repo at: ~/projects/myapp
# Agent 1 works on the auth feature
git worktree add ~/projects/myapp-auth feature/auth-refactor

# Agent 2 works on the payments feature simultaneously
git worktree add ~/projects/myapp-payments feature/stripe-integration

# Agent 3 does code review on a PR branch
git worktree add ~/projects/myapp-review origin/pr/142

# List all active worktrees
git worktree list

# Clean up when agent is done
git worktree remove ~/projects/myapp-auth
```

**In CLAUDE.md — tell Claude about worktree usage:**
```markdown
## Parallel Agent Policy
- Each agent task runs in its own git worktree (isolated branch)
- Never commit directly to `main` or `develop`
- Branch naming: `agent/<task-id>/<short-description>` (e.g., `agent/t42/add-rate-limiting`)
- After task complete: open PR, do not merge without human review
```

---

### 5b. MCP — Model Context Protocol (External Tool Integration)

MCP is Claude's plugin system for connecting to external data sources and tools. It is a **major missing piece** if you're doing serious agentic work — it's how Claude reaches beyond the local filesystem.

**Where it lives:**
```
~/.claude/claude_config.json     ← user-level MCP servers (personal)
.claude/claude_config.json       ← project-level MCP servers (team-shared)
```

**Configuration:**
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": { "DATABASE_URL": "${DATABASE_URL}" }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": { "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}" }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"]
    }
  }
}
```

**Common MCP servers for agentic coding:**

| MCP Server | What Claude Can Do |
|------------|-------------------|
| `server-github` | Read PRs, issues, create branches, comment on code |
| `server-postgres` | Query DB, inspect schema, run migrations |
| `server-filesystem` | Read/write files scoped to an allowed directory |
| `server-slack` | Post notifications, read channel messages |
| `server-brave-search` | Web search for documentation |
| `server-puppeteer` | Control a browser for UI testing |

**Security — restrict MCP scope in CLAUDE.md:**
```markdown
## MCP Permissions
- `server-github`: read-only on all repos except `org/myapp` (read+write)
- `server-postgres`: read-only on production DB; full access on dev DB only
- `server-filesystem`: scoped to `/workspace/` — never access `/etc/`, `~/.ssh/`, or `.env`
- No MCP server may transmit credentials or secrets in tool call arguments
```

---

### 5c. Sub-Agent Orchestration Patterns

When Claude orchestrates multiple sub-agents, the pattern matters for reliability and parallelism.

**Fan-out / Fan-in (parallel):**
```
Orchestrator Claude
├── Sub-agent A: Write auth module     → worktree: feature/auth
├── Sub-agent B: Write payments module → worktree: feature/payments
└── Sub-agent C: Write tests           → worktree: feature/tests
         ↓ (all complete)
Orchestrator: merge results, resolve conflicts, open single PR
```

**Sequential pipeline:**
```
Agent 1 (Planner)  → produces: task-plan.md
Agent 2 (Coder)    → reads task-plan.md, produces: code + tests
Agent 3 (Reviewer) → reads diff, produces: review-notes.md
Agent 4 (Fixer)    → reads review-notes.md, applies fixes
```

**Define orchestration in Agents.md:**
```markdown
## Orchestration Pattern: Fan-out

### Orchestrator
- Decomposes task into parallel sub-tasks
- Assigns each sub-task to a sub-agent with an isolated worktree
- Waits for all sub-agents to complete
- Reviews combined output before merging

### Sub-agents (run in parallel)
- Each operates in its own git worktree
- Each produces a PR to a staging branch (not main)
- Sub-agents do NOT communicate with each other directly
- All sub-agent output is reviewed by the Orchestrator before merging
```

---

### 5d. Human-in-the-Loop (HITL) Checkpoints

Agentic tasks need defined points where humans must approve before the agent proceeds. Configure these in hooks and CLAUDE.md.

**Define HITL checkpoints in CLAUDE.md:**
```markdown
## Human Approval Required Before:
- Deleting any file
- Modifying DB schema or migration files
- Pushing to any protected branch (main, develop, release/*)
- Making any change to authentication or security code
- Running any destructive bash command (DROP, DELETE, rm -rf)
- Spending more than 30 tool calls on a single task (re-confirm scope)
```

**Implement via PreToolUse hook:**
```bash
#!/bin/bash
# .claude/hooks/require-human-approval.sh
# Blocks destructive operations and asks for human confirmation

TOOL=$1
INPUT=$2

# Block direct writes to protected paths
if [[ "$INPUT" == *"app/core/security"* ]] || [[ "$INPUT" == *"alembic/versions"* ]]; then
  echo "BLOCK: This path requires human review. Stopping agent."
  exit 1
fi

# Block git push to main
if [[ "$TOOL" == "Bash" ]] && [[ "$INPUT" == *"git push"*"main"* ]]; then
  echo "BLOCK: Direct push to main is not allowed. Open a PR instead."
  exit 1
fi
```

---

### 5e. Branch Strategy for Agentic Work

```markdown
## Branch Naming Convention (in CLAUDE.md)
- Agent branches:    `agent/<short-description>` (e.g., `agent/add-rate-limiting`)
- Feature branches:  `feat/<description>`
- Fix branches:      `fix/<issue-id>-<description>`
- NEVER commit to:   `main`, `master`, `develop`, `release/*`

## Branch Protection Rules (set in GitHub repo settings)
- `main`: require PR + 1 human reviewer + all CI passing
- `develop`: require PR + CI passing (no direct push, even for agents)
- Agent branches: no protection — agents can push freely here
```

---

### 5f. Rollback & Recovery

```bash
# If an agent makes bad changes — rollback strategies

# Option 1: Undo last commit (keep changes staged)
git reset --soft HEAD~1

# Option 2: Discard last commit and all changes
git reset --hard HEAD~1

# Option 3: Revert a specific commit (safe for shared branches)
git revert <commit-sha>

# Option 4: Nuclear option — reset worktree to remote state
git fetch origin && git reset --hard origin/main

# Option 5: Stash everything and start fresh
git stash push -m "agent-output-$(date +%Y%m%d-%H%M)"
```

**Instruct Claude to create checkpoint commits:**
```markdown
## Checkpointing (in CLAUDE.md)
- Create a checkpoint commit after each logical unit of work
- Commit message prefix: `[checkpoint]` for agent-generated intermediate commits
- This allows easy rollback to any safe state
- Final commit should squash checkpoints: `git rebase -i HEAD~N`
```

---

### 5g. Observability & Audit

Track everything the agent does for debugging and compliance.

**Audit hook (`.claude/hooks/audit.sh`):**
```bash
#!/bin/bash
# Logs all tool calls to a structured audit file
TOOL=$1
INPUT=$2
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SESSION_ID=${CLAUDE_SESSION_ID:-"unknown"}

echo "{\"ts\":\"$TIMESTAMP\",\"session\":\"$SESSION_ID\",\"tool\":\"$TOOL\",\"input\":\"$INPUT\"}" \
  >> ~/.claude/audit/$(date +%Y-%m-%d).jsonl
```

**What to track:**
- Every file written/edited (path, timestamp, agent ID)
- Every bash command executed
- Every external API call (via MCP)
- Every PR opened by an agent
- Task duration and tool call count

---

### 5h. Context Window Management (Large Repos)

For large codebases, Claude can hit context limits. Manage this in CLAUDE.md:

```markdown
## Context Management Rules
- Never read entire files > 500 lines without first checking if you need the whole file
- Use `grep` to find relevant sections before reading full files
- When analyzing architecture, read directory structure first (`ls -la`) then drill down
- Summarize findings before moving to the next subtask (prevents context bloat)
- If context feels full, write a `PROGRESS.md` with current state and start a fresh session

## Files to NEVER read (too large / irrelevant)
- `package-lock.json`, `yarn.lock`, `poetry.lock`
- Any file in `node_modules/`, `.venv/`, `__pycache__/`
- Binary files, images, compiled assets
- Log files (unless specifically debugging)
```

---

### Updated Stack Summary

```
┌───────────────────────────────────────────────────────────────┐
│  Layer 5: Agentic Programming                                 │
│  Worktrees · MCP · Orchestration · HITL · Rollback · Audit   │
├───────────────────────────────────────────────────────────────┤
│  Layer 4: Memory                                              │
│  .claude/memory/ · CLAUDE.md evergreen · user memory         │
├───────────────────────────────────────────────────────────────┤
│  Layer 3: Hooks                                               │
│  PreToolUse · PostToolUse · UserPromptSubmit · Stop           │
├───────────────────────────────────────────────────────────────┤
│  Layer 2: Agents.md                                           │
│  Sub-agent roles · tools · orchestration patterns             │
├───────────────────────────────────────────────────────────────┤
│  Layer 1: CLAUDE.md                                           │
│  Project instructions · branch policy · HITL rules            │
└───────────────────────────────────────────────────────────────┘
```

---

*Last updated: April 2026*
