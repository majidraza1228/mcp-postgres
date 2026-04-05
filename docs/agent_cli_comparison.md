# Agent-Based Programming CLI Tools Comparison
## Codex CLI vs GitHub Copilot CLI vs Claude Code

### Executive Summary

This comparison analyzes three leading agent-based programming CLI tools, focusing on their command structures, capabilities, and unique features. Each tool takes a different approach to AI-assisted development in the terminal.

---

## 1. Tool Overview

### Codex CLI (OpenAI)
- **Developer**: OpenAI
- **Models**: GPT-5.4, GPT-5.3-Codex, GPT-5.3-Codex-Spark (Pro users)
- **Installation**: `npm install -g codex`
- **Platform Support**: macOS, Linux, Windows (experimental/WSL)
- **Default Model**: GPT-5.4

### GitHub Copilot CLI
- **Developer**: GitHub/Microsoft
- **Models**: Claude Sonnet 4.5 (default), Claude Sonnet 4, GPT-5
- **Installation**: `npm install -g @github/copilot`
- **Platform Support**: macOS, Linux, Windows
- **Licensing**: Included with all GitHub Copilot plans (Free, Pro, Pro+, Business, Enterprise)

### Claude Code
- **Developer**: Anthropic
- **Models**: Claude Sonnet 4.5, Claude Haiku 4.5, Claude Opus 4.5
- **Installation**: npm package `@anthropic-ai/claude-code`
- **Platform Support**: macOS, Linux, Windows
- **Default Model**: Claude Sonnet 4.5

---

## 2. Command Comparison Matrix

### 2.1 Session Management Commands

| Feature | Codex CLI | GitHub Copilot CLI | Claude Code |
|---------|-----------|-------------------|-------------|
| **Clear history** | `/clear` | `/clear` | `/clear` |
| **Exit session** | `/quit`, `/exit` | `/quit`, `/exit` | `/exit` |
| **Resume session** | `/resume` | Not available | `/resume` |
| **Fork session** | `/fork` | Not available | Not available |
| **New session** | `/new` | Not available | Not available |

**Analysis**: Codex CLI has the richest session management with fork and new session capabilities. Claude Code supports resume. GitHub Copilot CLI focuses on simpler session control.

---

### 2.2 Model Selection & Configuration

| Feature | Codex CLI | GitHub Copilot CLI | Claude Code |
|---------|-----------|-------------------|-------------|
| **Switch model** | `/model` | `/model` | `/model` |
| **Fast mode** | `/fast` | Not available | Not available |
| **Status check** | `/status` | Not available | `/context` (shows token usage) |
| **Debug config** | `/debug-config` | Not available | Not available |
| **Feature flags** | `codex features` | Not available | Not available |

**Analysis**: Codex CLI provides most comprehensive model and performance controls including fast mode and detailed status tracking. GitHub Copilot CLI has basic model switching. Claude Code shows context/token usage.

---

### 2.3 Code Review & Quality Commands

| Feature | Codex CLI | GitHub Copilot CLI | Claude Code |
|---------|-----------|-------------------|-------------|
| **Code review** | `/review` | Not available | `/code-review` (plugin) |
| **Review diff** | `/review diff` | Not available | Not available |
| **Review commit** | `/review commit HEAD` | Not available | Not available |
| **Diff viewer** | `/diff` | Not available | Not available |

**Analysis**: Codex CLI has built-in comprehensive code review with multiple review modes. Claude Code requires plugins. GitHub Copilot CLI lacks native code review commands.

---

### 2.4 Context & File Management

| Feature | Codex CLI | GitHub Copilot CLI | Claude Code |
|---------|-----------|-------------------|-------------|
| **Mention files** | `/mention` | Not available | `@filename` syntax |
| **Add directory** | `/add-dir` | `/add-dir` | Not available |
| **List directories** | `/list-dirs` | `/list-dirs` | Not available |
| **List files** | `/list-files` | `/list-files` | Not available |
| **Working directory** | Not available | `/cwd` (check current) | Not available |
| **Compact context** | `/compact` | `/compact` | `/compact` |

**Analysis**: GitHub Copilot CLI provides explicit directory management commands. Claude Code uses @ syntax for file mentions. All three support context compaction.

---

### 2.5 Memory & Learning

| Feature | Codex CLI | GitHub Copilot CLI | Claude Code |
|---------|-----------|-------------------|-------------|
| **Auto memory** | Not available | Not available | Auto Memory system |
| **Project memory** | Not available | Not available | `~/.claude/projects/<project>/memory/` |
| **Memory commands** | Not available | Not available | `/memory` |

**Analysis**: Claude Code has the most sophisticated memory system with automatic learning from conversations. Other tools lack persistent memory features.

---

### 2.6 Task Planning & Execution

| Feature | Codex CLI | GitHub Copilot CLI | Claude Code |
|---------|-----------|-------------------|-------------|
| **Plan mode** | Not available | `/plan` (Shift+Tab toggle) | `/plan` |
| **Autopilot mode** | Full auto with `--full-auto` | Shift+Tab cycle to autopilot | Not available |
| **Batch processing** | Not available | Not available | `/batch` |
| **Multi-agent** | Sub-agents via `/agent` | Fleet coordination with `/fleet` | Sub-agents system |

**Analysis**: GitHub Copilot CLI has structured plan mode with autopilot. Claude Code offers batch processing. All three support multi-agent workflows but with different implementations.

---

### 2.7 MCP (Model Context Protocol) Integration

| Feature | Codex CLI | GitHub Copilot CLI | Claude Code |
|---------|-----------|-------------------|-------------|
| **MCP servers** | `/mcp` command | Native GitHub MCP + custom | Native MCP support |
| **List MCP tools** | `/mcp` | Not explicitly listed | `/mcp` or `/help` |
| **MCP management** | `codex mcp` CLI commands | Config via ~/.copilot/mcp-config.json | MCP server configuration |
| **Built-in servers** | Configurable | GitHub MCP (built-in) | Configurable |

**Analysis**: All three support MCP, but GitHub Copilot CLI has native GitHub integration. Codex and Claude Code require manual MCP server configuration.

---

### 2.8 GitHub Integration

| Feature | Codex CLI | GitHub Copilot CLI | Claude Code |
|---------|-----------|-------------------|-------------|
| **GitHub operations** | Not built-in | Native (`/gh` commands implied) | `/install-github-app` (PR reviews) |
| **Cloud tasks** | `codex cloud` | Not available | Not available |
| **PR creation** | Not available | Natural language via MCP | Plugins available |
| **Issue management** | Not available | Native GitHub integration | Via GitHub app |

**Analysis**: GitHub Copilot CLI has the deepest GitHub integration (native). Codex CLI has cloud task management. Claude Code uses GitHub app for PR reviews.

---

### 2.9 Customization & Extensibility

| Feature | Codex CLI | GitHub Copilot CLI | Claude Code |
|---------|-----------|-------------------|-------------|
| **Custom commands** | Skills (`.codex/`) | Not available | Skills (`.claude/skills/`) |
| **Hooks system** | Not available | Lifecycle hooks (.github/hooks/*.json) | Comprehensive hooks system |
| **Custom instructions** | AGENTS.md | .github/copilot-instructions.md | CLAUDE.md + .claude/rules/ |
| **Configuration layers** | config.toml | Multiple config sources | 7-layer configuration |
| **Plugin marketplace** | Not available | Not available | Plugin marketplace |

**Analysis**: Claude Code has the most comprehensive customization with 7-layer config, hooks, and marketplace. GitHub Copilot CLI has lifecycle hooks. Codex CLI uses skills and AGENTS.md.

---

### 2.10 Shell & Command Execution

| Feature | Codex CLI | GitHub Copilot CLI | Claude Code |
|---------|-----------|-------------------|-------------|
| **Inline bash** | `!command` | Requires approval | `!command` |
| **Sandbox execution** | `/sandbox` | Not available | Not available |
| **PowerShell support** | Not available | Supported | Windows support |
| **Command approval** | Approval modes | Tool approval system | Permission system |

**Analysis**: Codex CLI and Claude Code support `!command` syntax. Codex CLI has sandbox isolation. GitHub Copilot CLI has granular tool approval patterns.

---

### 2.11 Web Search & External Data

| Feature | Codex CLI | GitHub Copilot CLI | Claude Code |
|---------|-----------|-------------------|-------------|
| **Web search** | `--search` flag (live mode) | Not built-in | Not built-in |
| **Search caching** | Default cached mode | Not available | Not available |
| **Browse mode** | `--search` for live browsing | Not available | Not available |

**Analysis**: Codex CLI is the only tool with built-in web search capabilities (cached and live modes). Others require MCP servers or external tools.

---

### 2.12 Special Features

| Feature | Codex CLI | GitHub Copilot CLI | Claude Code |
|---------|-----------|-------------------|-------------|
| **Copy output** | `/copy` | Not listed | `/copy` |
| **Voice input** | Not available | Not available | `/voice` available |
| **Image input** | `--image` flag | Not clearly documented | Image paste support |
| **IDE integration** | Not available | Not available | `/ide` (VS Code extension) |
| **Terminal setup** | Not available | Not available | `/terminal-setup` |
| **Thinking mode** | Not available | Not available | Extended thinking (default on) |

**Analysis**: Claude Code has unique features like voice input, IDE integration, and extended thinking mode. Codex CLI supports images via flag. GitHub Copilot CLI lacks these special modes.

---

## 3. CLI Flags Comparison

### 3.1 Launch Flags

| Flag Category | Codex CLI | GitHub Copilot CLI | Claude Code |
|---------------|-----------|-------------------|-------------|
| **Prompt flag** | `-p` or `--prompt` | `-p` or `--prompt` | `-p` |
| **Model selection** | `--model <model>` | Not via flag | `--model <model>` |
| **Profile** | `--profile <name>` | Not available | Not available |
| **Approval mode** | `--ask-for-approval` | `--allow-all-tools`, `--deny-tool` | `--permission-mode` |
| **Sandbox** | `--sandbox <policy>` | Not available | Not available |
| **Experimental** | Via feature flags | `--experimental` | Not available |

---

### 3.2 Permission & Safety Flags

| Flag | Codex CLI | GitHub Copilot CLI | Claude Code |
|------|-----------|-------------------|-------------|
| **Allow all** | `--full-auto` | `--allow-all` | `--dangerously-skip-permissions` |
| **Allow specific tools** | Not available | `--allow-tool=Kind(arg)` | Permission configuration |
| **Deny specific tools** | Not available | `--deny-tool=Kind(arg)` | Not via flag |
| **Auto edit** | Via approval mode | Not available | `--permission-mode acceptEdits` |

---

### 3.3 Advanced Flags

| Flag | Codex CLI | GitHub Copilot CLI | Claude Code |
|------|-----------|-------------------|-------------|
| **System prompt** | Not listed | Not available | `--system-prompt`, `--append-system-prompt` |
| **Output schema** | `--output-schema` | Not available | Not available |
| **Include plan** | `--include-plan-tool` | Not available | Not available |
| **MCP config** | Not available | `--additional-mcp-config` | Not available |
| **Disable MCP** | Not available | `--disable-builtin-mcps` | Not available |
| **Worktree** | Not available | Not available | `--worktree <branch>` |

---

## 4. Unique Commands by Tool

### Codex CLI Only

| Command | Purpose |
|---------|---------|
| `/cloud` | Manage Codex cloud tasks |
| `/fork` | Fork session into new thread |
| `/new` | Start fresh conversation in same session |
| `/fast` | Toggle fast mode |
| `/apps` | List and mention available apps |
| `/agent` | Switch between agent threads |
| `/feedback` | Submit feedback with diagnostics |
| `/logout` | Remove authentication credentials |
| `/sandbox-add-read-dir` | Add directories to Windows sandbox (Windows only) |
| `codex features` | Manage feature flags |
| `codex cloud exec` | Execute cloud tasks |
| `codex completion` | Generate shell completions |

---

### GitHub Copilot CLI Only

| Command | Purpose |
|---------|---------|
| `/cwd` | Confirm current working directory |
| `/add-dir` | Add directory to context |
| `/list-dirs` | Show accessible directories |
| `/list-files` | Show files in context |
| `/session` | Session management |
| `/fleet` | Multi-agent coordination |
| `/login` | GitHub authentication |

---

### Claude Code Only

| Command | Purpose |
|---------|---------|
| `/intro` | Create CLAUDE.md project instructions |
| `/terminal-setup` | Configure terminal for better input |
| `/voice` | Voice input mode |
| `/ide` | Connect to VS Code extension |
| `/batch` | Batch processing across worktrees |
| `/memory` | Memory management |
| `/install-github-app` | Install GitHub app for PR reviews |
| `/hooks` | Interactive hook configuration |
| `/effort` | Control thinking effort level |
| `/simplify` | 3-agent quality review pipeline |

---

## 5. Approval & Permission Systems

### Codex CLI
- **Modes**: Suggest (default), Auto Edit, Full Auto
- **Configuration**: Via `--ask-for-approval` flag
- **Session persistence**: Approval choices can persist for session
- **Sandbox**: macOS seatbelt, Linux Landlock/bubblewrap

### GitHub Copilot CLI
- **Pattern-based**: `--allow-tool=Kind(argument)`, `--deny-tool=Kind(argument)`
- **Granular control**: Can allow/deny specific commands (e.g., `shell(git push)`)
- **Session approvals**: Reset on `/clear` or new session
- **Deny precedence**: Deny rules always take precedence over allow

### Claude Code
- **Permission modes**: Via `--permission-mode` flag
- **Skip permissions**: `--dangerously-skip-permissions` flag
- **Hooks-based**: Pre/post tool use hooks for validation
- **Configuration**: Defined in settings.json with allowed-tools

---

## 6. Configuration Systems

### Codex CLI
- **Location**: `~/.codex/config.toml`
- **Structure**: TOML format
- **Project files**: `.codex/` directory
- **Skills**: Skills system (SKILL.md files)
- **Agent instructions**: AGENTS.md

### GitHub Copilot CLI
- **Location**: `~/.copilot/mcp-config.json`
- **Repository config**: `.github/copilot/settings.json`
- **Local overrides**: `.github/copilot/settings.local.json`
- **Custom instructions**: `.github/copilot-instructions.md`
- **Hooks**: `.github/hooks/*.json`

### Claude Code
- **7-layer system**:
  1. CLAUDE.md (project instructions)
  2. Auto Memory (~/.claude/projects/)
  3. .claude/rules/ (modular rules)
  4. settings.json (permissions, tools, hooks)
  5. Hooks (lifecycle automation)
  6. Skills (.claude/skills/)
  7. Environment variables
- **Most flexible**: Supports both project and personal configurations
- **Agent Skills Open Standard**: Skills conform to standard for cross-tool sharing

---

## 7. Strengths & Weaknesses

### Codex CLI

**Strengths:**
- Built-in web search (cached and live modes)
- Comprehensive code review commands
- Cloud task management
- Rich session management (fork, new, resume)
- Fast mode for quick responses
- Structured output via `--output-schema`

**Weaknesses:**
- Windows support is experimental
- No native GitHub integration
- Limited memory/learning capabilities
- Fewer customization options than Claude Code

**Best for:** Developers who need web search, structured outputs, and comprehensive code review features.

---

### GitHub Copilot CLI

**Strengths:**
- Native GitHub integration (issues, PRs, branches)
- Granular tool permission patterns
- Plan mode with structured implementation
- Autopilot mode for autonomous work
- Included with GitHub Copilot subscription
- Enterprise governance & policies

**Weaknesses:**
- Limited custom command support
- No built-in code review commands
- Fewer advanced configuration options
- Less sophisticated memory system

**Best for:** Teams already using GitHub with need for native repository integration and enterprise governance.

---

### Claude Code

**Strengths:**
- Most sophisticated memory system (auto-learning)
- Comprehensive 7-layer configuration
- Plugin marketplace
- Extensive hooks system
- Voice input support
- Extended thinking mode
- IDE integration (VS Code)
- Batch processing across worktrees
- Best customization options

**Weaknesses:**
- No built-in web search
- Steeper learning curve
- Requires setup for GitHub integration
- More complex configuration

**Best for:** Power users who want maximum customization, memory persistence, and advanced workflow automation.

---

## 8. Use Case Recommendations

### Choose Codex CLI if you need:
- Built-in web search for current information
- Structured JSON outputs (`--output-schema`)
- Comprehensive code review workflows
- Cloud task management
- Fast prototyping with fast mode

### Choose GitHub Copilot CLI if you need:
- Native GitHub repository integration
- Enterprise governance and policies
- Plan mode for structured development
- Simple setup with existing GitHub Copilot subscription
- Team collaboration with consistent policies

### Choose Claude Code if you need:
- Persistent memory across sessions
- Maximum customization and extensibility
- Plugin ecosystem
- Batch processing workflows
- Voice input capabilities
- Extended thinking for complex problems
- Advanced hook-based automation

---

## 9. Command Learning Curve

### Easy to Learn (All Tools)
- `/help` - Get help
- `/clear` - Clear history
- `/exit` - Exit session
- `/model` - Switch models

### Medium Complexity
- **Codex CLI**: `/review`, `/cloud`, `/mention`
- **GitHub Copilot CLI**: `/add-dir`, `/cwd`, `/plan`
- **Claude Code**: `@filename`, `/memory`, `/intro`

### Advanced (Power Users)
- **Codex CLI**: `--output-schema`, `/agent`, feature flags
- **GitHub Copilot CLI**: `--allow-tool` patterns, hooks configuration
- **Claude Code**: 7-layer config, hooks system, batch processing

---

## 10. Summary Comparison Table

| Aspect | Codex CLI | GitHub Copilot CLI | Claude Code |
|--------|-----------|-------------------|-------------|
| **Ease of Use** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **GitHub Integration** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Customization** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Memory/Learning** | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Code Review** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Enterprise Features** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Extensibility** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Web Search** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐ |

---

## 11. Command Count Summary

- **Codex CLI**: ~30+ slash commands + cloud commands
- **GitHub Copilot CLI**: ~15-20 documented slash commands
- **Claude Code**: ~25+ slash commands + extensive plugin ecosystem

---

## Conclusion

Each tool excels in different areas:

- **Codex CLI** is ideal for developers who value built-in web search, comprehensive code review, and structured outputs.
- **GitHub Copilot CLI** is best for teams heavily invested in GitHub ecosystem with need for native integration and enterprise governance.
- **Claude Code** offers the most advanced customization, memory persistence, and extensibility for power users who want maximum control over their AI coding assistant.

The choice depends on your workflow, team needs, and which ecosystem you're already invested in.

---

## References

- Codex CLI Documentation: https://developers.openai.com/codex/cli
- GitHub Copilot CLI Documentation: https://docs.github.com/copilot/concepts/agents/about-copilot-cli
- Claude Code Documentation: https://code.claude.com/docs
