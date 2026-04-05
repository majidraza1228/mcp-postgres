# Developer Productivity Commands Guide
## Daily Development CLI Commands for Codex CLI, GitHub Copilot CLI, and Claude Code

### Commands to Boost Developer Productivity in Day-to-Day Work

---

## 1. Context & Workspace Management

### Codex CLI

| Command | Purpose | Example Use Case |
|---------|---------|------------------|
| `/mention <file>` | Add specific file to context | `/mention src/api/auth.ts` - Include auth file in discussion |
| `/diff` | View Git diff inline | `/diff` - Quick review of uncommitted changes |
| `/copy` | Copy last output to clipboard | `/copy` - Copy generated code without selecting |
| `/copy 2` | Copy specific turn output | `/copy 2` - Copy output from 2 turns ago |
| `/title` | Set terminal session title | `/title auth-bug-fix` - Organize multiple terminals |
| `!<command>` | Execute bash command inline | `!git log --oneline -5` - Run commands without leaving Codex |
| `--image <path>` | Attach image to prompt | `codex --image error.png "Fix this error"` - Visual debugging |

**Productivity Tips:**
```bash
# Quick file inspection without leaving chat
!cat package.json
> What dependencies should I update?

# View recent commits for context
!git log --oneline -10
> Explain the recent changes

# Copy generated code instantly
> Generate utility function for date formatting
/copy
# Paste into your editor
```

---

### GitHub Copilot CLI

| Command | Purpose | Example Use Case |
|---------|---------|------------------|
| `/cwd` | Check current directory | `/cwd` - Verify you're in the right project |
| `/add-dir <path>` | Add directory to context | `/add-dir ./shared-utils` - Include shared code |
| `/list-dirs` | Show accessible directories | `/list-dirs` - See what Copilot can access |
| `/list-files` | Show files in context | `/list-files` - Verify file visibility |
| `/compact` | Compress context | `/compact` - Free up token space mid-session |
| `/context` | View token usage | `/context` - Monitor context window usage |
| `-p "<prompt>"` | Non-interactive mode | `copilot -p "Fix syntax errors"` - Scriptable AI |

**Productivity Tips:**
```bash
# Verify workspace before starting
/cwd
/list-dirs

# Quick non-interactive fixes
copilot -p "Add error handling to fetchUser function"

# Monitor context during long sessions
/context
# If running low on tokens
/compact
```

---

### Claude Code

| Command | Purpose | Example Use Case |
|---------|---------|------------------|
| `@filename` | Reference file in chat | `@auth.ts what does this function do?` - Quick file queries |
| `/copy` | Copy last output | `/copy` - Instant clipboard access |
| `/intro` | Create CLAUDE.md | `/intro` - Set project guidelines once |
| `/terminal-setup` | Configure terminal | `/terminal-setup` - Better multi-line input |
| `/ide` | Connect to VS Code | `/ide` - Visual diff viewing |
| `/voice` | Enable voice input | `/voice` - Hands-free coding |
| `/context` | Show context usage | `/context` - Token monitoring |
| `!<command>` | Execute bash inline | `!npm run build` - Quick command execution |
| `/compact` | Compress context | `/compact` - Free up memory |

**Productivity Tips:**
```bash
# Set up project once
/intro
# Creates CLAUDE.md with project-specific instructions

# Enable better terminal input
/terminal-setup
# Option+Enter for new lines instead of sending

# Quick file questions
@package.json
> What scripts are available?

# Visual diff in VS Code
/ide
# Then ask for code changes - opens in VS Code
```

---

## 2. Quick Information Retrieval

### Codex CLI

| Command | Purpose | Example Use Case |
|---------|---------|------------------|
| `codex --search` | Web search during coding | Research APIs, libraries, best practices |
| `/status` | Check usage & rate limits | `/status` - See remaining quota |
| `/help` | List available commands | `/help` - Quick command reference |
| `--output-schema` | Get structured JSON | For parsing outputs in scripts |

**Productivity Workflows:**
```bash
# Research while coding
codex --search
> How to implement OAuth2 refresh tokens in Node.js

# Check if you're near limits
/status
# Shows 5-hour rolling limits

# Get structured data for automation
codex --output-schema schema.json -p "List all TODO comments in codebase"
# Returns parseable JSON
```

---

### GitHub Copilot CLI

| Command | Purpose | Example Use Case |
|---------|---------|------------------|
| `/help` | Command reference | `/help` - Quick lookup |
| `Shift+Tab` | Cycle modes | Toggle between normal/plan/autopilot |
| `/feedback` | Submit feedback | `/feedback` - Report issues or suggestions |

**Productivity Workflows:**
```bash
# Quick mode switching
Shift+Tab  # Enter plan mode
> Refactor this module
Shift+Tab  # Back to normal mode

# Toggle autopilot for autonomous work
Shift+Tab  # Until you see "Autopilot"
> Implement all the TODOs in this file
# Copilot works autonomously until done
```

---

### Claude Code

| Command | Purpose | Example Use Case |
|---------|---------|------------------|
| `/help` | Command reference | `/help` - See all commands |
| `/memory` | View/manage memory | `/memory` - See what Claude remembers |
| `Esc Esc` | Rewind menu | Quick undo for code changes |
| `/cost` | View session cost | `/cost` - Track API usage |

**Productivity Workflows:**
```bash
# See what Claude learned
/memory
# Shows auto-learned project facts

# Undo experimental changes
# Make some code changes
Esc Esc
# Choose "Rewind code only"
# Keeps conversation, reverts code

# Track spending
/cost
# Shows token usage and cost
```

---

## 3. Session & State Management

### Codex CLI

| Command | Purpose | Example Use Case |
|---------|---------|------------------|
| `/resume` | Continue previous session | `/resume` - Pick up where you left off |
| `/resume <id>` | Resume specific session | `/resume abc123` - Return to exact session |
| `/fork` | Branch conversation | `/fork` - Try different approach |
| `/new` | Start fresh in same session | `/new` - New topic, same terminal |
| `codex exec --resume <id>` | Resume in non-interactive | Automation with context |

**Productivity Workflows:**
```bash
# Morning workflow
/resume
# Automatically continues yesterday's work

# Experiment without losing main thread
> Implement feature with approach A
/fork
> Try approach B instead
# Compare both in separate threads

# Quick context switch
/new
# New conversation, don't close terminal
```

---

### GitHub Copilot CLI

| Command | Purpose | Example Use Case |
|---------|---------|------------------|
| `/clear` | Clear history | `/clear` - Fresh start for new task |
| Session auto-save | Automatic | Sessions saved automatically |

**Productivity Workflows:**
```bash
# Context switching between tasks
/clear
> Work on new feature

# Sessions auto-resume
# Close terminal, reopen
copilot
# Previous context available
```

---

### Claude Code

| Command | Purpose | Example Use Case |
|---------|---------|------------------|
| `/resume` | Continue session | `/resume` - Return to previous work |
| `/clear` | Clear history | `/clear` - New task |
| Session auto-restore | Automatic | Full context restored |
| `Esc Esc` | Rewind changes | Undo code without losing chat |

**Productivity Workflows:**
```bash
# Auto-restore from yesterday
claude
# Automatically loads previous context

# Safe experimentation
> Refactor this entire module
# See the result
Esc Esc
> Rewind code only
# Chat history preserved, code reverted
```

---

## 4. Performance & Speed Optimization

### Codex CLI

| Command | Purpose | Example Use Case |
|---------|---------|------------------|
| `/fast on` | Enable fast mode | `/fast on` - Quick responses for simple tasks |
| `/fast off` | Disable fast mode | `/fast off` - Back to normal quality |
| `/fast status` | Check fast mode | `/fast status` - See current setting |
| `codex features` | Manage feature flags | Enable experimental features |

**Productivity Workflows:**
```bash
# Speed up simple tasks
/fast on
> Add JSDoc comments to all functions
> Fix import statements
/fast off
# Back to normal for complex work

# Enable experimental features
codex features list
codex features enable unified_exec
```

---

### GitHub Copilot CLI

| Command | Purpose | Example Use Case |
|---------|---------|------------------|
| `--experimental` | Access preview features | Try new capabilities |
| `/model` | Switch models | Faster or more capable models |

**Productivity Workflows:**
```bash
# Access cutting-edge features
copilot --experimental

# Switch models mid-session
/model
# Select Claude Sonnet 4 for complex tasks
# Select GPT-5 for speed
```

---

### Claude Code

| Command | Purpose | Example Use Case |
|---------|---------|------------------|
| `/effort high` | Max thinking for hard problems | Complex architectural decisions |
| `/effort medium` | Balanced performance | Default mode |
| `ultrathink` keyword | One-time high effort | For next response only |
| Extended thinking toggle | Control reasoning depth | Balance speed vs quality |

**Productivity Workflows:**
```bash
# Normal development
# Extended thinking on by default

# Complex architecture decision
/effort high
> Design microservices architecture for this system

# Quick one-time boost
> ultrathink - Optimize this algorithm for performance
# Returns to normal effort after response
```

---

## 5. Inline Command Execution

### All Tools Support

| Command Pattern | Purpose | Example |
|----------------|---------|---------|
| `!git status` | Check git state | See uncommitted changes |
| `!npm test` | Run tests | Immediate test execution |
| `!npm run build` | Build project | Quick build check |
| `!docker ps` | Check containers | DevOps workflows |
| `!curl <url>` | Test API endpoints | API development |
| `!grep -r "TODO"` | Search codebase | Find todos/fixmes |

**Productivity Workflows:**

```bash
# Debugging workflow
!npm test
> Fix the failing test for UserService

!git diff
> Explain these changes and suggest improvements

# API testing
!curl -X GET http://localhost:3000/api/users
> This response is wrong, what's the issue?

# Quick codebase search
!grep -r "deprecated" ./src
> List all deprecated functions and suggest replacements
```

---

## 6. Model Selection for Different Tasks

### When to Switch Models

**For Speed (Simple Tasks):**
- Documentation
- Code formatting
- Simple refactoring
- Adding comments
- Fixing typos

```bash
# Codex CLI
/fast on

# GitHub Copilot CLI
/model
# Select fastest model

# Claude Code
# Use Haiku 4.5
/model
> claude-haiku-4-5
```

**For Quality (Complex Tasks):**
- Architecture decisions
- Complex algorithms
- Security-critical code
- Performance optimization
- Multi-file refactoring

```bash
# Codex CLI
/model claude-opus-4-6

# GitHub Copilot CLI
/model
# Select Claude Sonnet 4.5 or GPT-5

# Claude Code
/model
> claude-opus-4-5
/effort high
```

---

## 7. Clipboard & Output Management

### Codex CLI
```bash
# Copy last output
/copy

# Copy specific turn
/copy 2

# Copy multiple items
/copy
# Paste in editor
/copy 3
# Paste another piece
```

### GitHub Copilot CLI
```bash
# Copy approach: highlight and copy manually
# Or redirect output
copilot -p "Generate function" > output.txt
```

### Claude Code
```bash
# Copy last output
/copy

# Copy from IDE integration
/ide
# Changes open in VS Code for easy copying
```

---

## 8. Configuration & Customization

### Codex CLI

**Create Custom Skills:**
```bash
# .codex/skills/quickfix.md
---
description: Quick bug fix workflow
---
1. Identify the bug
2. Propose minimal fix
3. Add test to prevent regression
4. Verify fix works

# Use it
/quickfix
> User authentication is failing
```

---

### GitHub Copilot CLI

**Custom Instructions:**
```bash
# .github/copilot-instructions.md

## Development Standards
- Always use TypeScript strict mode
- Add tests for new functions
- Run `npm run lint:fix` before committing
- Use conventional commit messages

## Build Commands
- `npm run dev` - Development server
- `npm test` - Run tests
- `npm run build` - Production build
```

---

### Claude Code

**Project Setup:**
```bash
# /intro creates CLAUDE.md
/intro

# Edit CLAUDE.md
# Add project-specific guidelines
# Build commands
# Code style preferences
# Testing requirements

# Claude reads this automatically on every session
```

---

## 9. Time-Saving Aliases & Scripts

### Bash Aliases for Quick Access

```bash
# Add to ~/.bashrc or ~/.zshrc

# Quick launch aliases
alias cx="codex"
alias cxs="codex --search"
alias cxf="codex --full-auto"
alias cop="copilot"
alias cl="claude"

# Quick status checks
alias cxstat="codex /status"
alias clcost="claude /cost"

# Resume last session
alias cxr="codex /resume"
alias clr="claude /resume"

# Common workflows
alias coderev="codex /review"
alias testgen="copilot -p 'Generate tests for last modified file'"
```

---

## 10. Productivity Hotkeys & Shortcuts

### Codex CLI
- `Ctrl+C` - Interrupt current response (keeps session)
- `Ctrl+D` - Exit session
- `Ctrl+L` - Clear screen (not context)

### GitHub Copilot CLI
- `Shift+Tab` - Cycle through modes (Normal → Plan → Autopilot)
- `Ctrl+Y` - View and edit plan in editor
- `Esc` - Cancel current operation

### Claude Code
- `Ctrl+C` - Interrupt response
- `Ctrl+D` - Exit
- `Option+Enter` (Mac) / `Alt+Enter` (Windows) - New line (after `/terminal-setup`)
- `Esc Esc` - Rewind menu

---

## 11. Advanced Productivity Patterns

### Pattern 1: Contextual Code Exploration

```bash
# Navigate unfamiliar codebase
!find . -name "*.ts" -type f | head -20
> Explain the project structure

@src/index.ts
> What does this entry point do?

!git log --oneline --all --graph -10
> Explain the recent development flow
```

### Pattern 2: Iterative Refinement

```bash
# Start broad
> Create REST API for user management

# Review output
/copy

# Refine
> Add input validation using Zod
> Add authentication middleware
> Add rate limiting
```

### Pattern 3: Multi-File Changes

```bash
# List affected files
!git status
> These files need to be updated for the new API

# Make changes
> Update all import statements to use new API

# Review changes
!git diff
> Is this correct?
```

### Pattern 4: Documentation Workflow

```bash
# Generate docs
> Document all public API functions with JSDoc

# Review
/copy
# Check generated docs

# Refine
> Add examples to all function docs
```

---

## 12. Debugging Productivity Commands

### Quick Debugging Workflow

```bash
# See error
!npm test
# Test output appears in context

# Debug with AI
> The UserService test is failing, why?

# Get fix
> Fix the issue

# Verify
!npm test
> Did that fix it?
```

### Log Analysis

```bash
# Share logs
!tail -50 server.log
> What's causing these errors?

# Real-time monitoring
!tail -f server.log &
# (Send Ctrl+Z to background)
> Monitor for authentication errors
```

---

## 13. Daily Workflow Optimizations

### Morning Startup Routine

**Codex CLI:**
```bash
codex /resume  # Continue yesterday's work
/status        # Check quota
!git status    # See uncommitted changes
> Summarize what I was working on yesterday
```

**GitHub Copilot CLI:**
```bash
copilot
/cwd           # Verify project
> List my open PRs
> What issues are assigned to me?
```

**Claude Code:**
```bash
claude
# Auto-resumes last session
/cost          # Check usage
@CLAUDE.md     # Review project guidelines
> What should I focus on today?
```

---

### Pre-Commit Workflow

```bash
# Format & lint
!npm run lint:fix
!npm run format

# Check what's changed
!git diff

# Get AI review
/review  # (Codex)
# or
> Review my changes  # (Copilot/Claude)

# Run tests
!npm test

# Commit with AI-generated message
> Generate a conventional commit message for these changes
/copy
!git commit -m "<paste>"
```

---

### End-of-Day Workflow

```bash
# Review day's work
!git log --since="today" --author="$(git config user.name)"
> Summarize my commits today

# Document for tomorrow
> What are the open tasks and blockers?
/copy
# Save to notes

# Check status
/status  # or /cost
```

---

## 14. Tool-Specific Power Features

### Codex CLI Exclusive

| Feature | Command | Productivity Boost |
|---------|---------|-------------------|
| **Web Search** | `codex --search` | Research APIs, libraries during coding |
| **Structured Output** | `--output-schema` | Parse outputs in scripts |
| **Cloud Tasks** | `codex cloud` | Distributed development |
| **Fork Sessions** | `/fork` | Experiment without losing context |
| **Shell Completions** | `codex completion zsh` | Tab completion for Codex |

---

### GitHub Copilot CLI Exclusive

| Feature | Command | Productivity Boost |
|---------|---------|-------------------|
| **Plan Mode** | `Shift+Tab` | Structured development workflow |
| **GitHub Native** | Natural language | Manage PRs, issues from terminal |
| **Autopilot** | `Shift+Tab` cycle | Autonomous task completion |
| **Enterprise Policies** | Automatic | Compliance built-in |

---

### Claude Code Exclusive

| Feature | Command | Productivity Boost |
|---------|---------|-------------------|
| **Voice Input** | `/voice` | Hands-free coding |
| **Auto Memory** | Automatic | Learns project patterns |
| **IDE Integration** | `/ide` | Visual diffs in VS Code |
| **Extended Thinking** | Default on | Better solutions for complex problems |
| **Hooks System** | Configuration | Automated quality gates |
| **Rewind** | `Esc Esc` | Safe experimentation |

---

## 15. Team Collaboration Commands

### Share Context with Team

**Codex CLI:**
```bash
# Export session
codex exec -p "Summarize this implementation approach" > approach.md
# Share with team
```

**GitHub Copilot CLI:**
```bash
# Create issue from work
> Create issue documenting this bug fix

# Update team
> Add comment to PR #123 summarizing changes
```

**Claude Code:**
```bash
# Export knowledge
/memory
> Export all project learnings to documentation

# Share hooks
# .claude/hooks/ in git
# Team benefits from same automation
```

---

## 16. Productivity Metrics

### Track Your Efficiency

**Before AI CLI Tools:**
- 10-15 context switches per hour (terminal → browser → docs)
- 5-10 minutes researching API documentation
- 30-60 minutes on code review
- Manual test running and interpretation

**After AI CLI Tools:**
- 2-3 context switches per hour (stay in terminal)
- Instant API documentation via search
- 10-20 minutes on code review (AI pre-review)
- Automated test generation and fixing

**Time Saved Per Day:**
- Research: ~1-2 hours
- Code review: ~30-60 minutes
- Debugging: ~30-45 minutes
- Documentation: ~30-45 minutes
- **Total: 3-4.5 hours per day**

---

## 17. Recommended Daily Command Patterns

### Most Used Commands (Learn These First)

**Universal (All Tools):**
1. `/help` - When you forget a command
2. `/clear` - Start fresh for new task
3. `/copy` - Grab generated code
4. `!<bash>` - Run commands inline
5. `@file` or `/mention` - Reference files

**Tool-Specific Must-Know:**

**Codex CLI:**
1. `/resume` - Continue work
2. `/review` - Pre-commit check
3. `codex --search` - Research
4. `/status` - Check limits
5. `/fast on` - Speed mode

**GitHub Copilot CLI:**
1. `Shift+Tab` - Mode cycling
2. `/cwd` - Verify location
3. `/context` - Monitor usage
4. Natural language GitHub ops
5. `/compact` - Free up tokens

**Claude Code:**
1. `/intro` - Set up project
2. `@filename` - Quick file reference
3. `/voice` - Hands-free mode
4. `/ide` - Visual integration
5. `Esc Esc` - Undo changes

---

## 18. Common Pitfalls & Solutions

### Pitfall 1: Context Bloat

**Problem:** Session becomes slow with too much context

**Solution:**
```bash
# Regular compaction
/compact  # Every ~30-40 messages

# Or start fresh
/clear
> Here's what we were working on: [summary]
```

### Pitfall 2: Rate Limits

**Problem:** Hit usage limits mid-task

**Solution:**
```bash
# Check limits proactively
/status  # (Codex)
/context # (Copilot)
/cost    # (Claude)

# Use fast mode for simple tasks
/fast on  # (Codex)
```

### Pitfall 3: Lost Work

**Problem:** Forgot to save important output

**Solution:**
```bash
# Always copy important outputs
/copy
# Paste to file immediately

# Use session resume
/resume  # Recover previous work
```

---

## 19. Power User Shortcuts

### Combine Commands for Workflows

```bash
# Quick fix pipeline
!npm test && codex /review
# Tests run, then code review if they pass

# Research and implement
codex --search
> Best practices for React hooks
# Read results
> Implement useAuth hook following these patterns

# Multi-step execution
!git diff > changes.txt
!git log --oneline -10 > commits.txt
> Based on recent commits and current changes, suggest next steps
```

---

## 20. Final Pro Tips

### Maximize Productivity

1. **Set up aliases** - Quick access saves 30+ seconds per invocation
2. **Learn 5 core commands** - Cover 80% of use cases
3. **Use `/resume` daily** - Maintain context across sessions
4. **Leverage inline execution** - Never leave terminal
5. **Enable auto-complete** - Tab through commands
6. **Configure custom instructions** - One-time setup, permanent benefit
7. **Use hooks for quality** - Automatic linting, testing
8. **Switch models strategically** - Speed vs quality trade-offs
9. **Monitor usage** - Avoid hitting limits mid-task
10. **Experiment safely** - Use `/fork` or `Esc Esc` to try ideas

---

## Summary: Top 10 Productivity Commands

| Rank | Command | Why It Matters | Tool |
|------|---------|----------------|------|
| 1 | `!<command>` | Stay in flow, run anything inline | All |
| 2 | `/resume` | Continue yesterday's work instantly | Codex, Claude |
| 3 | `/copy` | Grab output without selecting | All |
| 4 | `@file` or `/mention` | Quick file reference | All |
| 5 | `/compact` | Extend session without limits | All |
| 6 | `codex --search` | Research without context switch | Codex |
| 7 | `Shift+Tab` | Mode cycling for different workflows | Copilot |
| 8 | `/voice` | Hands-free coding | Claude |
| 9 | `Esc Esc` | Safe experimentation with undo | Claude |
| 10 | `/status` or `/cost` | Monitor usage proactively | Codex, Claude |

---

**Use these commands to save 3-4 hours daily and stay in deep flow without context switching.**
