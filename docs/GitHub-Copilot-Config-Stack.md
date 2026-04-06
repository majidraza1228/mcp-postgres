# GitHub Copilot Configuration Stack

> A layered configuration system for GitHub Copilot (VS Code, JetBrains, GitHub.com, and Copilot Workspace).
> Each layer builds on the one below — lower layers set broad defaults; higher layers add precision and specialization.

---

## Layer 1 — `copilot-instructions.md` (Repository Instructions)

**What it is:** The primary instruction file that GitHub Copilot reads for every repository. It sets coding standards, project conventions, and behavioral rules at the repo level — the equivalent of Claude's `CLAUDE.md`.

**Where it lives:**
```
.github/copilot-instructions.md
```

**What to put here:**
- Project overview and purpose
- Tech stack and language versions
- Coding conventions (style, naming, patterns to prefer/avoid)
- Testing requirements (frameworks, coverage expectations)
- Security rules (never hardcode secrets, use env vars, etc.)
- Documentation standards

**Example:**
```markdown
# Copilot Instructions

## Project
This is a multi-tenant SaaS platform built with Node.js 20 and React 18.

## Code Style
- Use TypeScript for all new files
- Prefer functional components with hooks over class components
- Use `const` over `let`; avoid `var`
- All async functions must handle errors with try/catch

## Testing
- Write unit tests with Jest for all utility functions
- Integration tests use Supertest against a real DB (not mocks)
- Minimum 80% coverage on new files

## Security
- Never log passwords, tokens, or PII
- Always sanitize user input before DB queries
- Use parameterized queries — never string concatenation in SQL

## Avoid
- `any` types in TypeScript (use `unknown` if truly needed)
- Inline styles in React components (use CSS modules)
- Synchronous file I/O in request handlers
```

---

## Layer 2 — Workspace & Editor Settings (IDE Configuration)

**What it is:** Editor-level configuration that controls Copilot's behavior in the developer's local environment — scope, model selection, agent mode, and feature toggles.

**Where it lives:**
- **VS Code**: `.vscode/settings.json` (project) or `settings.json` (user)
- **JetBrains**: `.idea/` or IDE settings panel
- **GitHub.com**: Repository settings → Copilot tab

**Key settings to configure:**

```json
// .vscode/settings.json
{
  // Enable/disable Copilot per language
  "github.copilot.enable": {
    "*": true,
    "plaintext": false,
    "markdown": true,
    "yaml": true
  },

  // Copilot Chat model selection
  "github.copilot.chat.defaultModel": "gpt-4o",

  // Agent mode (enables multi-step task execution)
  "github.copilot.chat.agent.enabled": true,

  // Inline suggestions
  "github.copilot.inlineSuggest.enable": true,

  // Next Edit Suggestions (NES) — follows your edits
  "github.copilot.nextEditSuggestions.enabled": true,

  // Limit completions to relevant files only
  "github.copilot.chat.useProjectTemplates": true
}
```

**What to configure here:**
- Which languages get completions
- Which Copilot model to use (GPT-4o, Claude Sonnet, etc.)
- Whether agent mode is active
- Telemetry and privacy settings
- Keybindings for accept/reject suggestions

---

## Layer 3 — Agent Mode Instructions & `.github/agents/` (Task-Level Guidance)

**What it is:** When Copilot operates in **Agent Mode** (multi-step, autonomous task execution), it can be given additional scoped instructions per task or workspace. This is the equivalent of Claude's `Agents.md` — defining what Copilot is allowed to do and how it should behave during agentic runs.

### Folder Structure

```
.github/
├── copilot-instructions.md          ← Layer 1: auto-loaded repo-wide rules (OFFICIAL)
├── agents/                          ← Layer 3: agent role files (CONVENTION, not auto-loaded)
│   ├── coder.md                     ← instructions for coding/implementation tasks
│   ├── reviewer.md                  ← instructions for PR review tasks
│   ├── tester.md                    ← instructions for test generation tasks
│   └── architect.md                 ← instructions for design/planning tasks
├── prompts/                         ← reusable prompt templates (VS Code Copilot feature)
│   ├── add-feature.prompt.md
│   └── review-pr.prompt.md
└── decisions/                       ← ADRs for persistent context (Layer 4)
```

> **Important:** The `.github/agents/` folder is a **recommended convention**, not an officially recognized GitHub feature. Copilot does **not** auto-load files from this folder — you must reference them manually with `#file:.github/agents/reviewer.md` in the chat prompt. The only file Copilot auto-loads today is `copilot-instructions.md`.

### How to Reference Agent Files

In Copilot Chat, manually inject the agent role:
```
#file:.github/agents/reviewer.md Review this PR for security issues and suggest improvements.
```

Or create a reusable prompt file (`.github/prompts/review-pr.prompt.md`):
```markdown
---
mode: agent
description: Full PR review with security, performance, and style checks
---
#file:.github/agents/reviewer.md
Review the current diff. Check for:
1. Security vulnerabilities
2. Performance bottlenecks
3. Code style violations per copilot-instructions.md
4. Missing tests
```

### What to put in each agent file

**`.github/agents/coder.md`** — for implementation tasks:
```markdown
## Coder Agent Instructions
- Scope: only modify files listed in the task
- Always write tests alongside new code
- Run `npm run lint` and `npm test` before finishing
- Do NOT refactor unrelated code in the same PR
- Commit message format: `feat(scope): short description`
```

**`.github/agents/reviewer.md`** — for review tasks:
```markdown
## Reviewer Agent Instructions
- Read-only mode: suggest changes, do not edit files directly
- Check: security, performance, test coverage, naming clarity
- Output format: use severity labels [CRITICAL] [WARN] [SUGGESTION]
- Always explain the reason behind each suggestion
```

**`.github/agents/tester.md`** — for test generation:
```markdown
## Tester Agent Instructions
- Framework: Jest + React Testing Library
- Cover: happy path, edge cases, error states
- Do NOT mock the database — use test fixtures
- Each test file must have a describe block per component/function
```

### Example task spec (Copilot Workspace):
```markdown
## Task: Add user profile picture upload feature

### Scope
- Modify: `src/components/Profile.tsx`, `src/api/users.ts`
- Create: `src/components/AvatarUpload.tsx`
- Do NOT touch: any auth files, DB migration files

### Constraints
- Max file size: 5MB (enforce on both client and server)
- Accepted types: PNG, JPG, WEBP only
- Store in S3 (use existing `uploadToS3` utility — don't create a new one)

### Output
- Working feature with error handling
- Unit tests for the new component
- Update the README with the new environment variable required
```

---

## Layer 4 — Context & Memory (Persistent Project Knowledge)

**What it is:** GitHub Copilot has **no native cross-session memory** — every chat session starts fresh. Memory must be deliberately engineered through files, embeddings, and settings. This layer is about the strategies to control what Copilot knows and retains.

### Memory Control Mechanisms

| Mechanism | Scope | Auto-loaded? | How to Control |
|-----------|-------|-------------|----------------|
| `copilot-instructions.md` | Team-wide, always-on | ✅ Yes | Edit the file — all rules apply every session |
| Custom user instructions | Personal, always-on | ✅ Yes | VS Code settings → Copilot → Instructions |
| `@workspace` index | Full repo, semantic | ✅ Yes (when enabled) | Toggle in VS Code; rebuild index after big changes |
| `#file:` references | Per-session, scoped | ❌ Manual | Reference specific files in each chat prompt |
| `#selection` / `#editor` | Current open file | ❌ Manual | Automatically scopes to visible code |
| `.github/agents/` files | Per-task, scoped | ❌ Manual | Reference with `#file:` in the prompt |
| `.github/prompts/` files | Reusable templates | ❌ Via prompt picker | Appear in Copilot Chat prompt picker in VS Code |
| Git history | Historical | ❌ On request | Ask Copilot to read recent commits via `@workspace` |

### 4a. Always-On Memory (Automatic)

These load every session without any manual action:

**Team memory** — `.github/copilot-instructions.md`:
Put anything the whole team always needs Copilot to know here. This is your primary always-on memory.

**Personal memory** — VS Code `settings.json`:
```json
{
  "github.copilot.chat.codeGeneration.instructions": [
    { "text": "I prefer concise responses — skip obvious explanations." },
    { "text": "Always use TypeScript strict mode." },
    { "file": ".github/copilot-instructions.md" }
  ],
  "github.copilot.chat.reviewSelection.instructions": [
    { "text": "Flag any use of `any` type as a warning." }
  ],
  "github.copilot.chat.testGeneration.instructions": [
    { "text": "Use Jest. Always test error states, not just happy paths." }
  ]
}
```

> You can set **different persistent instructions per action type** — code generation, review, test generation, commit messages — giving you fine-grained memory control.

### 4b. On-Demand Memory (Manual Injection)

Load context only when needed to keep prompts focused:

```
# Inject a specific file as context
#file:.github/agents/reviewer.md Review this component.

# Inject multiple files
#file:src/api/auth.ts #file:.github/decisions/001-jwt.md
Explain how our auth flow works.

# Use the workspace index for broad questions
@workspace Where do we handle rate limiting?

# Scope to current editor selection
#selection Refactor this function to use the repository pattern.
```

### 4c. Structured Memory Files to Maintain

```
.github/
├── copilot-instructions.md      ← always-on team memory
├── agents/                      ← role-specific memory (manual)
├── prompts/                     ← reusable task templates (manual)
└── decisions/                   ← ADRs — historical memory
    ├── 001-use-postgresql.md
    ├── 002-switch-to-vite.md
    └── 003-api-versioning.md

CONTEXT.md                       ← live project state (manual reference)
```

**`CONTEXT.md`** — inject this at the start of complex sessions:
```markdown
# Project Context (updated: 2026-04-05)

## Active Work
- Feature: Stripe payment integration (branch: feat/stripe-payments)
- Status: Webhook handler in progress — `src/api/webhooks.ts`
- Blocked on: Stripe sandbox keys from DevOps

## Known Issues
- `GET /users/{id}` 500s on soft-deleted users — avoid touching this until fixed
- Redis pool exhaustion under load (ticket #342)

## Don't Touch
- `alembic/versions/` — schema frozen until Q3 migration
- `src/auth/` — being replaced; don't add dependencies on it
```

### 4d. Memory Control Summary

```
ALWAYS ON          →  copilot-instructions.md + user settings instructions
SESSION START      →  inject CONTEXT.md with #file: for complex tasks
TASK-SPECIFIC      →  inject .github/agents/<role>.md with #file:
BROAD QUESTIONS    →  use @workspace to search across the full codebase
HISTORICAL         →  reference .github/decisions/ ADRs with #file:
```

---

## Hooks — Where to Define Them in GitHub Copilot

> GitHub Copilot has **no native hook system** like Claude's `PreToolUse` / `PostToolUse`. Instead, hooks are approximated through a combination of VS Code tasks, Git hooks, GitHub Actions, and — for advanced use — Copilot Extensions.

### Hook Locations & What They Do

```
.vscode/
├── settings.json          ← config-time hooks: control what fires before completions
└── tasks.json             ← quasi-hooks: run scripts before/after Copilot agent actions

.git/hooks/                ← post-edit hooks: validate/format after Copilot writes code
├── pre-commit             ← runs linting/tests before any commit Copilot creates
└── commit-msg             ← enforce commit message format on Copilot-generated commits

.github/
└── workflows/             ← post-PR hooks: CI validation of Copilot-generated PRs
    ├── copilot-pr-check.yml
    └── auto-review.yml
```

### 1. VS Code Tasks (`.vscode/tasks.json`) — Quasi Pre/Post Hooks

Run scripts automatically before or after Copilot agent completes a task:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Post-Copilot: Lint & Test",
      "type": "shell",
      "command": "npm run lint && npm test",
      "presentation": { "reveal": "always" },
      "group": "build",
      "runOptions": { "runOn": "folderOpen" }
    },
    {
      "label": "Pre-Task: Reset to clean state",
      "type": "shell",
      "command": "git stash && npm install"
    }
  ]
}
```

### 2. Git Hooks (`.git/hooks/`) — Post-Edit Enforcement

These fire after Copilot edits files and the developer stages/commits:

**`pre-commit`** — validate all Copilot-generated code before it enters git:
```bash
#!/bin/sh
# Run linting on staged files
npm run lint --silent
if [ $? -ne 0 ]; then
  echo "❌ Lint failed — fix errors before committing Copilot output"
  exit 1
fi

# Run type checking
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors found in Copilot output"
  exit 1
fi
echo "✅ Pre-commit checks passed"
```

Use **Husky** to share git hooks with your team (git hooks aren't committed by default):
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint --edit $1"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

### 3. GitHub Actions (`.github/workflows/`) — Post-PR Hooks

Automatically validate Copilot-generated pull requests:

```yaml
# .github/workflows/copilot-pr-check.yml
name: Validate Copilot PR

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Run tests
        run: npm test -- --coverage

      - name: Check coverage threshold
        run: npx jest --coverageThreshold='{"global":{"lines":80}}'
```

### 4. Copilot Extensions (Advanced — True API Hooks)

For teams that need real hook behavior, **GitHub Copilot Extensions** let you build a GitHub App that intercepts Copilot Chat messages and injects logic before/after responses. This requires building and hosting a service:

```
User message → [Your Extension Hook] → Copilot → [Your Extension Hook] → Response
```

Use cases: inject proprietary context, audit logs, block certain prompts, post-process suggestions, connect to internal APIs.

> See: [GitHub Copilot Extensions docs](https://docs.github.com/en/copilot/building-copilot-extensions)

### Hook Comparison: Claude vs GitHub Copilot

| Claude Hook | GitHub Copilot Equivalent | Where Defined |
|-------------|--------------------------|---------------|
| `UserPromptSubmit` | Copilot Extension (pre-process message) | GitHub App |
| `PreToolUse` | `.vscode/tasks.json` pre-task script | `.vscode/` |
| `PostToolUse` | Git `pre-commit` hook + VS Code task | `.git/hooks/` |
| `Stop` | GitHub Actions on PR open | `.github/workflows/` |

---

## Agentic Programming — Advanced Configuration

This section covers the critical missing pieces for running GitHub Copilot as a serious autonomous coding agent.

### A. Git Worktrees & Isolation

GitHub Copilot Agent Mode and Copilot Workspace create **isolated branches** automatically, but they do not use git worktrees. Isolation is achieved differently depending on the surface:

| Surface | Isolation Mechanism |
|---------|-------------------|
| **Copilot Agent Mode (VS Code)** | Operates in your current working tree — no automatic isolation. You must manage branches manually. |
| **Copilot Workspace** | Runs in a cloud-side isolated environment per task — closest to a worktree |
| **GitHub Codespaces** | Full VM isolation — best option for true agentic isolation |
| **GitHub.dev** | Browser-based editor — lightweight, no terminal, limited isolation |

**Best practice — use Codespaces for agentic isolation:**
```json
// .devcontainer/devcontainer.json — defines the isolated environment
{
  "name": "Copilot Agent Environment",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:20",
  "postCreateCommand": "npm install",
  "features": {
    "ghcr.io/devcontainers/features/git:1": {}
  },
  "customizations": {
    "vscode": {
      "extensions": ["GitHub.copilot", "GitHub.copilot-chat"]
    }
  }
}
```

**Manual worktree workflow for parallel Copilot sessions:**
```bash
# Give each Copilot agent session its own worktree
git worktree add ../myapp-copilot-auth   copilot/auth-refactor
git worktree add ../myapp-copilot-tests  copilot/test-generation

# Open each worktree in a separate VS Code window
code ../myapp-copilot-auth
code ../myapp-copilot-tests

# Each VS Code window runs an independent Copilot agent
# No file conflicts between sessions

# Clean up after agent is done
git worktree remove ../myapp-copilot-auth
```

**Tell Copilot about isolation in `copilot-instructions.md`:**
```markdown
## Agent Isolation Policy
- All agent work happens on a dedicated branch — never commit to main or develop
- Branch naming: `copilot/<short-description>` (e.g., `copilot/add-auth-tests`)
- Each task = one branch = one PR
- Do not modify files outside the stated task scope
```

---

### B. Branch Strategy for Copilot Agent Work

```markdown
## Branch Naming (add to copilot-instructions.md)
- Copilot agent branches: `copilot/<description>`
- Feature branches:       `feat/<description>`
- Bug fix branches:       `fix/<issue-id>-<description>`
- NEVER push to:          `main`, `master`, `develop`, `release/*`

## Branch Protection (GitHub repo settings)
- main:    require PR + 1 reviewer + CI green (no agent direct push)
- develop: require PR + CI green
- copilot/*: no restriction — agents push freely here
```

**GitHub Actions to auto-label Copilot PRs:**
```yaml
# .github/workflows/label-copilot-prs.yml
name: Label Copilot PRs
on:
  pull_request:
    branches: ['copilot/**']
jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/labeler@v4
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          configuration-path: .github/labeler.yml
```

---

### C. Human-in-the-Loop (HITL) Checkpoints

Copilot Agent Mode can make sweeping changes. Define explicit approval gates.

**In `copilot-instructions.md`:**
```markdown
## Human Approval Required Before:
- Deleting any existing file
- Modifying any file in `src/auth/`, `src/payments/`, or DB schema
- Creating new environment variables or config keys
- Opening a PR to main or develop (agent opens to copilot/* only)
- Making changes that affect more than 10 files

## Agent Must Stop and Report If:
- Tests fail and cannot be fixed within 3 attempts
- An ambiguity exists that affects core architecture
- The task scope has grown beyond the original request
```

**GitHub Actions HITL gate — require human approval before merge:**
```yaml
# .github/workflows/copilot-approval-gate.yml
name: Copilot PR Approval Gate
on:
  pull_request:
    types: [opened, ready_for_review]

jobs:
  require-review:
    runs-on: ubuntu-latest
    if: startsWith(github.head_ref, 'copilot/')
    steps:
      - name: Request human review
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.pulls.requestReviewers({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number,
              reviewers: ['your-username']  // always require human review
            })
```

---

### D. Parallel Agent Execution

Copilot Agent Mode is **single-threaded per VS Code window** — one agent, one task at a time. To run agents in parallel:

```
Window 1 (worktree: copilot/auth)      ← Copilot Agent: auth refactor
Window 2 (worktree: copilot/tests)     ← Copilot Agent: test generation
Window 3 (worktree: copilot/docs)      ← Copilot Agent: doc updates
         ↓ (all complete)
Main window: review 3 PRs, merge in order
```

Each VS Code window opens a separate worktree directory with its own Copilot session. This is the only way to achieve true parallelism with Copilot today.

---

### E. Devcontainer — Environment Isolation & Reproducibility

The `.devcontainer/` folder is critical for agentic work — it ensures every Copilot session (local, Codespace, or Copilot Workspace) runs in an identical, reproducible environment.

```
.devcontainer/
├── devcontainer.json       ← primary config
├── Dockerfile              ← custom base image (if needed)
└── scripts/
    ├── post-create.sh      ← runs after container is built
    └── post-start.sh       ← runs every time container starts
```

```json
// .devcontainer/devcontainer.json
{
  "name": "Project Dev Environment",
  "build": { "dockerfile": "Dockerfile" },
  "postCreateCommand": "bash .devcontainer/scripts/post-create.sh",
  "postStartCommand": "bash .devcontainer/scripts/post-start.sh",
  "remoteEnv": {
    "DATABASE_URL": "${localEnv:DATABASE_URL}",
    "NODE_ENV": "development"
  },
  "customizations": {
    "vscode": {
      "settings": {
        "github.copilot.enable": { "*": true },
        "github.copilot.chat.agent.enabled": true
      },
      "extensions": [
        "GitHub.copilot",
        "GitHub.copilot-chat",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ]
    }
  }
}
```

---

### F. Copilot Autofix — Security Hook

Copilot Autofix automatically suggests fixes for security vulnerabilities found by GitHub Advanced Security (CodeQL). This acts as a security-focused post-edit hook.

**Enable in `.github/workflows/`:**
```yaml
# .github/workflows/codeql.yml
name: CodeQL + Copilot Autofix
on: [push, pull_request]
jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: javascript, typescript
      - uses: github/codeql-action/analyze@v3
      # Copilot Autofix suggestions appear automatically on the PR
```

---

### G. Observability — Tracking Copilot Agent Output

```yaml
# .github/workflows/track-copilot-changes.yml
name: Track Agent-Generated Code
on:
  pull_request:
    branches: ['copilot/**']

jobs:
  diff-summary:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }

      - name: Generate change summary
        run: |
          echo "## Copilot Agent Change Summary" >> $GITHUB_STEP_SUMMARY
          echo "Files changed: $(git diff --name-only origin/main | wc -l)" >> $GITHUB_STEP_SUMMARY
          echo "Lines added: $(git diff --stat origin/main | tail -1)" >> $GITHUB_STEP_SUMMARY
          git diff --name-only origin/main >> $GITHUB_STEP_SUMMARY

      - name: Check for sensitive file changes
        run: |
          SENSITIVE=$(git diff --name-only origin/main | grep -E "(auth|security|secret|password|\.env)" || true)
          if [ -n "$SENSITIVE" ]; then
            echo "⚠️ SENSITIVE FILES CHANGED: $SENSITIVE"
            exit 1
          fi
```

---

## Stack Summary

```
┌──────────────────────────────────────────────────────────────┐
│  Layer 4: Context & Memory                                   │
│  Auto: copilot-instructions.md + user settings               │
│  Manual: #file: CONTEXT.md, agents/, decisions/ ADRs         │
│  Broad: @workspace semantic index                            │
├──────────────────────────────────────────────────────────────┤
│  Layer 3: .github/agents/ + Agent Mode Instructions          │
│  agents/coder.md, reviewer.md, tester.md (manual #file:)    │
│  prompts/ reusable templates | Copilot Workspace task specs  │
├──────────────────────────────────────────────────────────────┤
│  Layer 2: Workspace & Editor Settings                        │
│  .vscode/settings.json — model, toggles, per-action rules   │
├──────────────────────────────────────────────────────────────┤
│  Layer 1: .github/copilot-instructions.md                    │
│  Repo-wide coding rules, standards & constraints (auto)      │
└──────────────────────────────────────────────────────────────┘
```

---

## Comparison to Claude Config Stack

| Layer | Claude | GitHub Copilot |
|-------|--------|---------------|
| 1 | `CLAUDE.md` | `.github/copilot-instructions.md` |
| 2 | `Agents.md` | Agent Mode instructions / Copilot Workspace specs |
| 3 | Hooks | `.vscode/settings.json` + editor toggles |
| 4 | Memory | `@workspace` index + custom instructions + ADRs |

---

*Last updated: April 2026*
