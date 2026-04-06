# OpenAI Codex Configuration Stack

> A layered configuration system for OpenAI Codex (the cloud-based coding agent accessible via the OpenAI platform and ChatGPT).
> Each layer builds on the one below — lower layers establish ground rules; higher layers add task-specific precision and tooling.

---

## Layer 1 — `AGENTS.md` (Repository Instructions)

**What it is:** The primary instruction file that Codex reads when it clones or accesses your repository. It is the direct equivalent of Claude's `CLAUDE.md` and establishes the foundational rules for the entire project.

**Where it lives:**
```
AGENTS.md           ← root of the repository (primary)
src/AGENTS.md       ← scoped to a subdirectory
docs/AGENTS.md      ← scoped to docs only
```

Codex automatically discovers `AGENTS.md` files and merges them from the repo root down to the working directory, with more specific files taking precedence.

**What to put here:**
- Project purpose and architecture overview
- Language versions and runtime requirements
- Coding conventions (style, naming, patterns)
- Required commands Codex must run (lint, test, typecheck)
- File structure and where things live
- What Codex should and should not touch

**Example:**
```markdown
# AGENTS.md

## Project
E-commerce backend API — Python 3.12, FastAPI, PostgreSQL 15, Redis.

## Environment Setup
- Install deps: `pip install -r requirements.txt`
- Run migrations: `alembic upgrade head`
- Start server: `uvicorn app.main:app --reload`

## Coding Standards
- Follow PEP 8; use `ruff` for linting
- Type-annotate all functions (mypy strict mode)
- Use `pydantic` v2 models for request/response schemas
- Never use `print()` — use the `logger` from `app.utils.logging`

## Testing
- Framework: `pytest` with `pytest-asyncio`
- Run tests: `pytest tests/ -v`
- All new endpoints must have at least one integration test
- Tests must pass before Codex marks a task complete

## Do Not Touch
- `alembic/versions/` — never edit migration files directly
- `app/core/security.py` — security-critical, requires human review
- `.env` files — never create, read, or log these
```

---

## Layer 2 — Codex Environment & Tool Configuration

**What it is:** Configuration that controls Codex's sandboxed execution environment — which tools it can use, network access, installed packages, and resource limits. This is the infrastructure layer that determines Codex's capabilities per task.

**Where it lives:**
- Configured in the **OpenAI Codex UI** (task settings panel)
- Or via the **Codex API** using environment parameters
- Project-level defaults can be set in `codex.yaml` (emerging convention)

**Key configuration areas:**

```yaml
# codex.yaml (project-level Codex config)
environment:
  python: "3.12"
  node: "20"
  install_commands:
    - "pip install -r requirements.txt --quiet"
    - "npm install --silent"
  setup_commands:
    - "alembic upgrade head"

tools:
  terminal: true          # Allow Codex to run shell commands
  file_read: true         # Allow reading any file in the repo
  file_write: true        # Allow creating/editing files
  web_search: false       # Disable web browsing (security)
  network: false          # No outbound network calls

limits:
  max_runtime_minutes: 30
  max_file_size_mb: 10
```

**What to configure here:**
- Allowed tools (terminal, file read/write, browser, search)
- Network access policy (on/off, allowlist of domains)
- Runtime environment (language versions, install scripts)
- Resource limits (time, memory, file sizes)
- Secrets injection (env vars passed securely at runtime)

---

## Layer 3 — Task Instructions & Hooks (Per-Task Guidance)

**What it is:** Task-level instructions that guide Codex through a specific coding task. This layer is the equivalent of Claude's Hooks — event-driven and task-scoped rules that run when Codex begins, executes, and finishes a task.

**Where it lives:**
- Entered directly in the **Codex task prompt** (UI or API)
- Can be templated in `AGENTS.md` under a `## Task Template` section
- Automated via the **Codex API** with `task_instructions` parameter

**Three stages of task hooks:**

### 3a. Pre-Task (Setup & Constraints)
What Codex must do before starting work:
```markdown
Before writing any code:
1. Read `AGENTS.md` and `src/AGENTS.md`
2. Run `pytest tests/ -v` to confirm the baseline passes
3. Understand the existing patterns in `src/api/` before creating new endpoints
4. Do not modify files outside `src/api/` and `tests/api/`
```

### 3b. During Task (Execution Rules)
How Codex should behave while working:
```markdown
While implementing:
- Write the implementation first, then the tests
- Commit in logical chunks with descriptive messages
- If you encounter an ambiguity, make a reasonable assumption and note it in a comment
- Run `ruff check .` and `mypy src/` after each file change
```

### 3c. Post-Task (Verification & Handoff)
What Codex must do before marking complete:
```markdown
Before finishing:
1. Run the full test suite: `pytest tests/ -v --tb=short`
2. Run type checking: `mypy src/ --strict`
3. Run linting: `ruff check . && ruff format --check .`
4. Write a PR description summarizing what changed and why
5. Flag any areas that need human review
```

---

## Layer 4 — Memory & Persistent Context

**What it is:** Codex operates **statelessly by default** — every task starts with a clean slate. There is no built-in conversation history or user memory. All persistence must be engineered through files and the API. This layer explains how to control what Codex knows across tasks.

### Memory Control Mechanisms

| Mechanism | Scope | Auto-loaded? | How to Control |
|-----------|-------|-------------|----------------|
| `AGENTS.md` (root) | Repo-wide, always | ✅ Yes | Edit the file — Codex reads it every task |
| `AGENTS.md` (subdir) | Subdirectory-scoped | ✅ Yes | Codex merges root + subdir AGENTS.md |
| `CONTEXT.md` | Repo-wide | ❌ Reference in task | Mention it in task prompt or AGENTS.md |
| `docs/decisions/` ADRs | Historical | ❌ Reference in task | Point Codex to them in task instructions |
| Code comments | File-level | ✅ Implicit | Write `# NOTE:` / `# DECISION:` annotations |
| Git log | Historical | ✅ Implicit | Codex reads git history when cloning repo |
| API `context` field | Session-level | ✅ Via API | Pass prior task output as context in next API call |
| Task chaining | Cross-task | ❌ Manual | Feed output of Task A as input to Task B |

### 4a. Always-On Memory (Automatic)

These are loaded by Codex on every task without any extra steps:

**`AGENTS.md` — your primary memory file.** Anything evergreen goes here:
```markdown
# AGENTS.md

## Architecture Decisions (Memory)
- We use PostgreSQL (not MongoDB) — chosen for relational integrity
- Auth is JWT-based; tokens expire in 15 min; refresh tokens in Redis
- All money values are stored as integers (cents), never floats
- The `uploadToS3` utility in `src/utils/storage.py` handles all file uploads

## Patterns to Follow
- New API endpoints: follow `src/api/products.py` as the reference pattern
- Error handling: always raise `AppError` (defined in `src/core/errors.py`)
- DB queries: use the async session from `src/core/database.py`, never raw connections

## What NOT to Change
- `alembic/versions/` — never edit existing migration files
- `app/core/security.py` — requires security team review
- `.env` files — never read, create, or log
```

**Code comments as in-file memory:** Annotate key decisions directly in code so Codex sees them as it works:
```python
# DECISION: Using integer cents (not Decimal) for all monetary values.
# See docs/decisions/003-money-storage.md for rationale.
PRICE_CENTS = 1999

# NOTE: This Redis key has a 15-min TTL matching the JWT expiry.
# Do not change the TTL here without updating auth/tokens.py.
redis_client.setex(f"session:{user_id}", 900, token)
```

**Git history as implicit memory:** Codex reads commit history when it accesses the repo. Write meaningful commit messages — they become searchable context:
```
feat(payments): add Stripe webhook signature verification
fix(auth): prevent token reuse after logout (invalidate Redis key)
refactor(db): replace raw psycopg2 with SQLAlchemy async session
```

### 4b. Session-Level Memory (API Control)

When using the Codex API, you can chain tasks to build up context:

```python
# Task 1: research + plan
task1_result = codex.tasks.create(
    repo="org/myrepo",
    prompt="Analyze the current auth system and write a summary of how it works.",
)

# Task 2: feed Task 1's output as memory into Task 2
task2_result = codex.tasks.create(
    repo="org/myrepo",
    context=task1_result.output,   # ← inject prior task output as memory
    prompt="Based on the analysis above, implement the token refresh endpoint."
)
```

This is the closest Codex gets to conversation memory — **explicit task chaining via the API**.

### 4c. Structured Memory Files to Maintain

```
AGENTS.md                        ← always-on, primary memory (auto-loaded)
CONTEXT.md                       ← live project state (reference in tasks)
docs/
└── decisions/                   ← ADRs — historical memory
    ├── 001-use-postgresql.md
    ├── 002-money-as-cents.md
    └── 003-jwt-auth-pattern.md
src/
└── **/*.py                      ← in-code comments as file-level memory
```

**`CONTEXT.md`** — reference this in your task prompt for current state:
```markdown
# Project Context (updated: 2026-04-05)

## Current Sprint
Working on: Payment processing integration (Stripe)
In progress: `src/api/payments.py` — endpoint scaffolding done, webhook handler pending
Blocked: Waiting on Stripe sandbox credentials from DevOps

## Known Issues
- `GET /users/{id}` returns 500 on soft-deleted users (bug, not yet fixed)
- Redis connection pool occasionally exhausted under load (ticket #342)

## Upcoming Changes
- DB schema change planned for `orders` table — do not add new columns yet
- Auth system being replaced in Q3 — avoid deep coupling to current JWT logic
```

**ADR example (`docs/decisions/001-use-postgresql.md`):**
```markdown
# ADR 001: Use PostgreSQL over MongoDB

## Date: 2026-01-15
## Status: Accepted

## Context
Need a primary datastore. Evaluated PostgreSQL, MongoDB, and CockroachDB.

## Decision
Chose PostgreSQL 15.

## Reasons
- Team expertise in SQL
- Strong transactional guarantees needed for order processing
- JSONB columns handle semi-structured data when needed

## Consequences
- ORM: SQLAlchemy with async support
- Migrations: Alembic
```

### 4d. Memory Control Summary

```
ALWAYS ON (auto)   →  AGENTS.md (root + subdir) + code comments + git history
TASK START         →  Add "Read CONTEXT.md first" in task prompt or AGENTS.md
CROSS-TASK         →  API task chaining: pass task1.output as task2.context
HISTORICAL         →  Reference docs/decisions/ ADRs in task instructions
SCOPE CONTROL      →  Use subdir AGENTS.md to limit/override root rules per folder
```

---

## Hooks — Where to Define Them in OpenAI Codex

> Codex has **more structured hook support than Copilot**, primarily through `codex.yaml` setup commands, `AGENTS.md` task templates, and the Codex API's lifecycle callbacks. Think of it in three stages: before the task, during the task, and after the task.

### Hook Locations & What They Do

```
codex.yaml                 ← environment setup hooks (pre-task, always run)
AGENTS.md                  ← behavioral hooks (rules Codex follows at each stage)
scripts/                   ← shell scripts Codex can execute as hooks
├── pre-task.sh            ← setup/validation before Codex starts coding
├── post-task.sh           ← verification after Codex finishes
└── lint-and-test.sh       ← called mid-task or post-task
Codex API (on_complete)    ← true webhook: fires when task completes
```

### 1. `codex.yaml` — Pre-Task Environment Hooks (Always Run)

These run **before every task** starts, every time, automatically:

```yaml
# codex.yaml
environment:
  python: "3.12"
  install_commands:
    - "pip install -r requirements.txt --quiet"
    - "npm install --silent"
  setup_commands:
    # These are your pre-task hooks — run before Codex touches any code
    - "alembic upgrade head"           # ensure DB is migrated
    - "python scripts/verify-env.py"  # check required env vars exist
    - "pytest tests/smoke/ -q"        # confirm baseline is green before starting
```

> **Key insight:** `setup_commands` is Codex's equivalent of Claude's `UserPromptSubmit` hook — it fires before Codex begins any work.

### 2. `AGENTS.md` — Behavioral Hooks (Task Lifecycle Rules)

Embed hook-like rules directly in `AGENTS.md` so Codex follows them on every task:

```markdown
## Task Lifecycle Rules (Hooks)

### Before Writing Any Code (Pre-Task Hook)
1. Run `pytest tests/ -q` to confirm the baseline passes
2. Read `CONTEXT.md` for current project state
3. Identify which files you plan to modify — list them before starting
4. Check `docs/decisions/` for any ADRs relevant to the task

### While Working (Mid-Task Hook)
- After every file edit, run `ruff check <file>` and `mypy <file>`
- Commit after each logical unit of work (don't batch everything into one commit)
- If a test fails, fix it before moving to the next file
- Log assumptions made in a `## Assumptions` comment block at the top of changed files

### Before Finishing (Post-Task Hook)
1. Run: `pytest tests/ -v --tb=short` — all tests must pass
2. Run: `mypy src/ --strict` — no type errors
3. Run: `ruff check . && ruff format --check .` — clean lint
4. Write a PR description with: what changed, why, and what to review
5. Flag files that need human review with a `# NEEDS_REVIEW` comment
```

### 3. Shell Script Hooks (Referenced from `AGENTS.md`)

Create reusable scripts Codex can call at hook points:

**`scripts/pre-task.sh`** — pre-task validation hook:
```bash
#!/bin/bash
set -e

echo "🔍 Running pre-task checks..."

# Check environment
python -c "import app.core.config" || { echo "❌ Config import failed"; exit 1; }

# Confirm baseline green
pytest tests/smoke/ -q --tb=short || { echo "❌ Baseline tests failing — fix before starting"; exit 1; }

echo "✅ Pre-task checks passed. Codex may proceed."
```

**`scripts/post-task.sh`** — post-task verification hook:
```bash
#!/bin/bash
set -e

echo "🔍 Running post-task verification..."

pytest tests/ -v --tb=short        # full test suite
mypy src/ --strict                  # type check
ruff check . && ruff format --check .  # lint + format

echo "✅ All checks passed. Task ready for review."
```

Reference these in `AGENTS.md`:
```markdown
## Task Lifecycle Rules
### Before starting: run `bash scripts/pre-task.sh`
### Before finishing: run `bash scripts/post-task.sh`
```

### 4. Codex API — True Webhook (Post-Task Hook)

When using the API, you can register a webhook URL that Codex calls when a task completes. This is the closest equivalent to Claude's `Stop` hook:

```python
import openai

task = openai.codex.tasks.create(
    repo="org/myrepo",
    prompt="Add rate limiting to the /api/users endpoint",

    # Post-task webhook — Codex POSTs to this URL when done
    webhook={
        "url": "https://yourserver.com/hooks/codex-complete",
        "secret": "your-hmac-secret"
    }
)
```

Your webhook server receives a payload like:
```json
{
  "task_id": "task_abc123",
  "status": "completed",
  "branch": "codex/rate-limiting-users",
  "pr_url": "https://github.com/org/repo/pull/42",
  "summary": "Added token bucket rate limiter to /api/users..."
}
```

Use this webhook to: trigger CI, notify Slack, run security scans, log to audit systems, or chain the next Codex task.

### Hook Comparison: Claude vs OpenAI Codex

| Claude Hook | Codex Equivalent | Where Defined |
|-------------|-----------------|---------------|
| `UserPromptSubmit` | `codex.yaml` → `setup_commands` | `codex.yaml` |
| `PreToolUse` | `AGENTS.md` pre-task rules + `scripts/pre-task.sh` | `AGENTS.md` / `scripts/` |
| `PostToolUse` | `AGENTS.md` mid-task rules + per-file lint scripts | `AGENTS.md` / `scripts/` |
| `Stop` | Codex API `webhook.url` callback | API configuration |

---

## Agentic Programming — Advanced Configuration

This section covers the critical patterns for running Codex as a serious autonomous coding agent at scale.

### A. Git Worktrees & Sandbox Isolation

**Codex has the strongest isolation model of all three tools.** Every task runs in a fully sandboxed cloud environment — a fresh Docker container with a complete clone of your repo. This is functionally equivalent to a git worktree but goes further:

```
Your Repo (GitHub)
      │
      ▼
Codex Cloud Sandbox (per task)
├── Fresh Docker container (Ubuntu)
├── Full repo clone (your exact branch)
├── Isolated filesystem (no cross-task contamination)
├── Controlled network (allowlist only)
├── Separate git identity (codex-bot commits)
└── Auto-creates branch: `codex/<task-description>`
```

**Each Codex task automatically:**
1. Clones the repo into a fresh sandbox
2. Creates a new branch (`codex/<description>`)
3. Does all work on that branch
4. Opens a PR when complete
5. Destroys the sandbox

This means Codex never touches your local machine and never conflicts with other tasks.

**For local development — manual worktrees to mirror Codex's isolation:**
```bash
# Simulate Codex isolation locally for testing
git worktree add ../codex-sim-auth   codex/auth-refactor
git worktree add ../codex-sim-tests  codex/test-generation

# Run each task independently
cd ../codex-sim-auth  && codex "refactor the auth module"
cd ../codex-sim-tests && codex "generate tests for auth module"

# Review outputs before merging
git worktree remove ../codex-sim-auth
```

**Control the branch Codex uses via `codex.yaml`:**
```yaml
# codex.yaml
git:
  base_branch: "develop"          # Codex branches off develop, not main
  branch_prefix: "codex/"         # All agent branches: codex/<description>
  auto_pr: true                   # Automatically open PR when done
  pr_target: "develop"            # PR targets develop, not main
  draft_pr: true                  # Open as Draft PR — requires human to mark ready
```

---

### B. Branch Strategy for Codex Agent Work

**Define in `AGENTS.md`:**
```markdown
## Git & Branch Policy

### Branch Naming
- Codex auto-creates: `codex/<short-description>`
- Never commit to: `main`, `master`, `develop`, `release/*`
- All Codex work lands in Draft PRs targeting `develop`

### Commit Style
- Each logical unit of work = one commit
- Commit message format: `<type>(<scope>): <description>`
- Always include `[codex]` tag for traceability: `feat(auth): add refresh tokens [codex]`
- Final PR squash: Codex squashes checkpoint commits before opening PR

### Protected Paths (Codex must not modify)
- `alembic/versions/`      → schema migrations (human only)
- `app/core/security.py`   → security-critical (human only)
- `.github/workflows/`     → CI config (human only)
- `*.env`, `*.pem`, `*.key` → secrets (never touch)
```

---

### C. Parallel Agent Execution via API

Codex supports **true parallel task execution** — multiple tasks running simultaneously in separate sandboxes. This is its strongest advantage over Claude Code and Copilot.

```python
import openai
import asyncio

async def run_parallel_tasks():
    client = openai.AsyncOpenAI()

    # Launch 3 tasks simultaneously — each gets its own sandbox + branch
    tasks = await asyncio.gather(
        client.codex.tasks.create(
            repo="org/myapp",
            prompt="Refactor the auth module to use async/await",
            branch="codex/auth-async-refactor"
        ),
        client.codex.tasks.create(
            repo="org/myapp",
            prompt="Add rate limiting to all API endpoints",
            branch="codex/rate-limiting"
        ),
        client.codex.tasks.create(
            repo="org/myapp",
            prompt="Generate integration tests for the payments module",
            branch="codex/payments-integration-tests"
        )
    )

    # Each task runs in its own isolated sandbox concurrently
    for task in tasks:
        print(f"Task {task.id}: {task.status} → PR: {task.pr_url}")

asyncio.run(run_parallel_tasks())
```

**Fan-out / Fan-in orchestration:**
```python
# Phase 1: Parallel research tasks
research_tasks = await asyncio.gather(
    codex.tasks.create(repo=repo, prompt="Analyze the current auth system and output a summary"),
    codex.tasks.create(repo=repo, prompt="List all endpoints missing rate limiting"),
    codex.tasks.create(repo=repo, prompt="Find all places where raw SQL is used"),
)

# Phase 2: Synthesize outputs
combined_context = "\n\n".join([t.output for t in research_tasks])

# Phase 3: Sequential implementation tasks using the synthesized context
impl_task = await codex.tasks.create(
    repo=repo,
    context=combined_context,
    prompt="Based on the analysis above, implement the security improvements."
)
```

---

### D. Human-in-the-Loop (HITL) Checkpoints

**Define in `AGENTS.md`:**
```markdown
## Human Approval Required

Codex MUST stop and open a Draft PR (do not mark Ready for Review) if:
- Any change touches security, auth, or payment code
- The task requires modifying more than 20 files
- A test cannot be fixed after 3 attempts
- The implementation requires a DB schema change
- An architectural decision needs to be made that isn't covered in AGENTS.md

## Draft PR Workflow
1. Codex completes work → opens Draft PR with summary
2. Human reviews → requests changes or approves
3. Human marks PR "Ready for Review" → triggers full CI
4. Second human reviews → merges

Codex does NOT auto-merge under any circumstances.
```

**API-level HITL — pause and wait for human input:**
```python
task = await codex.tasks.create(
    repo="org/myapp",
    prompt="Implement Stripe webhook handler",
    options={
        "draft_pr": True,           # Always open as draft
        "pause_on_security": True,  # Stop if security files are touched
        "max_files_changed": 15,    # Stop if scope grows beyond 15 files
    },
    webhook={
        "url": "https://yourapp.com/hooks/codex",
        "events": ["task.paused", "task.completed", "task.failed"]
    }
)
```

---

### E. Sandbox Security & Network Isolation

Control exactly what Codex can and cannot access during task execution:

```yaml
# codex.yaml — security hardening
security:
  # Network access control
  network:
    enabled: false                  # Default: no outbound internet
    allowlist:
      - "pypi.org"                  # pip install only
      - "registry.npmjs.org"        # npm install only
      - "api.github.com"            # GitHub API (for PR operations)
    blocklist:
      - "0.0.0.0/8"                 # Block internal network
      - "169.254.169.254"           # Block AWS metadata endpoint

  # Filesystem restrictions
  filesystem:
    readonly_paths:
      - ".github/workflows/"
      - "alembic/versions/"
      - "app/core/security.py"
    forbidden_patterns:
      - "*.env"
      - "*.pem"
      - "*.key"
      - "*secret*"
      - "*password*"

  # Process restrictions
  process:
    allowed_commands:
      - "python"
      - "pytest"
      - "ruff"
      - "mypy"
      - "git"
      - "pip"
    blocked_commands:
      - "curl"                      # No arbitrary HTTP requests
      - "wget"
      - "ssh"
      - "nc"                        # No network tools
      - "sudo"
```

---

### F. Rollback & Recovery

Codex's sandbox model makes rollback straightforward — each task is on its own branch, so you can simply close the PR and delete the branch.

```bash
# Option 1: Close the PR and delete the Codex branch
gh pr close <pr-number> --delete-branch

# Option 2: Reset a Codex branch to pre-task state
git checkout codex/auth-refactor
git reset --hard origin/develop

# Option 3: Cherry-pick only good commits from a Codex PR
git cherry-pick <good-commit-sha>

# Option 4: If you already merged and need to revert
git revert -m 1 <merge-commit-sha>
```

**Instruct Codex to create checkpoint commits in `AGENTS.md`:**
```markdown
## Checkpointing Rules
- Create a commit after each logical unit (function, class, test file)
- Prefix checkpoint commits: `[wip] feat(auth): add token validation`
- Before opening PR: squash WIP commits into clean final commits
- This allows humans to review the step-by-step approach in git history
```

---

### G. Observability & Audit

Track every Codex task across your team:

```python
# Structured audit log via webhook
from fastapi import FastAPI, Request
import json
from datetime import datetime

app = FastAPI()

@app.post("/hooks/codex")
async def codex_webhook(request: Request):
    payload = await request.json()

    audit_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "task_id": payload["task_id"],
        "repo": payload["repo"],
        "branch": payload["branch"],
        "status": payload["status"],
        "files_changed": payload.get("files_changed", []),
        "pr_url": payload.get("pr_url"),
        "triggered_by": payload.get("user"),
        "duration_seconds": payload.get("duration_seconds"),
        "tool_calls": payload.get("tool_call_count"),
    }

    # Write to audit log
    with open("codex-audit.jsonl", "a") as f:
        f.write(json.dumps(audit_entry) + "\n")

    # Alert if sensitive files changed
    sensitive = [f for f in audit_entry["files_changed"]
                 if any(p in f for p in ["auth", "security", "secret", ".env"])]
    if sensitive:
        await notify_security_team(sensitive, audit_entry["pr_url"])
```

---

### H. Context Window Management for Large Repos

Large repos can overwhelm Codex's context. Control scope in `AGENTS.md`:

```markdown
## Context Management Rules

### What Codex Should Read
- Always read `AGENTS.md` first
- Read `CONTEXT.md` for current project state
- For a given task, only read files directly relevant to the task scope
- Use `find` and `grep` to locate relevant files before reading them

### What Codex Should NEVER Read
- `package-lock.json`, `yarn.lock`, `poetry.lock` (too large, irrelevant)
- Files in `node_modules/`, `.venv/`, `__pycache__/`, `dist/`, `build/`
- Binary files, images, compiled assets
- Log files (unless specifically debugging a log issue)

### Scope Limiting
- If a task touches more than 15 files, stop and clarify scope with the human
- Summarize findings in a comment before moving to the next sub-task
- If a file is > 400 lines, read only the relevant section using line ranges
```

---

## Stack Summary

```
┌──────────────────────────────────────────────────────────────┐
│  Layer 4: Memory & Persistent Context                        │
│  Auto: AGENTS.md + code comments + git history               │
│  Manual: CONTEXT.md ref in task | API task chaining          │
│  Historical: docs/decisions/ ADRs                            │
├──────────────────────────────────────────────────────────────┤
│  Layer 3: Task Instructions & Hooks                          │
│  Pre-task setup → execution rules → post-task checks         │
├──────────────────────────────────────────────────────────────┤
│  Layer 2: Environment & Tool Configuration                   │
│  codex.yaml — tools, network, runtime, secrets               │
├──────────────────────────────────────────────────────────────┤
│  Layer 1: AGENTS.md                                          │
│  Root + subdir — repo-wide rules, auto-merged by Codex       │
└──────────────────────────────────────────────────────────────┘
```

---

## Comparison Across All Three Tools

| Layer | Claude | GitHub Copilot | OpenAI Codex |
|-------|--------|---------------|-------------|
| **1 — Project Instructions** | `CLAUDE.md` | `.github/copilot-instructions.md` | `AGENTS.md` |
| **2 — Agent/Tool Config** | `Agents.md` | `.vscode/settings.json` + editor settings | `codex.yaml` + Codex UI tool settings |
| **3 — Hooks/Events** | Claude Hooks (`PreToolUse`, `PostToolUse`, etc.) | Agent Mode task specs + Copilot Workspace | Task-level pre/during/post instructions |
| **4 — Memory/Context** | `.claude/memory/` + user memory | `@workspace` index + custom instructions | `CONTEXT.md` + ADRs + git history |

---

*Last updated: April 2026*
