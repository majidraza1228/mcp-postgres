# Using PostgreSQL MCP Server with GitHub Copilot in VS Code

## Overview

GitHub Copilot in VS Code can connect directly to your PostgreSQL MCP server, allowing you to interact with your database using natural language **right in VS Code** - no separate web chatbot needed!

## Architecture

```
VS Code GitHub Copilot Chat
         ↓
   MCP Server (Port 3000)
         ↓
   PostgreSQL Database
```

## Setup Steps

### 1. Start Your PostgreSQL MCP Server

```bash
cd /Users/syedraza/postgres-mcp/mcp-server
./venv/bin/python server.py
```

You should see:
```
✅ Connected to PostgreSQL database: Adventureworks
INFO:     Uvicorn running on http://127.0.0.1:3000
```

### 2. Configure VS Code Settings

Open VS Code settings (`Cmd+,`) and add MCP server configuration:

**Option A: Using Settings UI**

1. Open Settings (`Cmd+,`)
2. Search for "mcp" or "GitHub Copilot MCP"
3. Add your MCP server configuration

**Option B: Using settings.json**

1. Open Command Palette (`Cmd+Shift+P`)
2. Type "Preferences: Open User Settings (JSON)"
3. Add this configuration:

```json
{
  "github.copilot.chat.mcpServers": {
    "postgres-mcp": {
      "url": "http://localhost:3000",
      "name": "PostgreSQL Database",
      "description": "PostgreSQL database operations via MCP",
      "enabled": true
    }
  }
}
```

### 3. Restart VS Code

Close and reopen VS Code to activate the MCP server connection.

### 4. Use GitHub Copilot Chat

1. Open GitHub Copilot Chat panel (`Cmd+Shift+I` or click the chat icon)
2. Start asking questions about your database!

## Example Queries

Once configured, you can ask GitHub Copilot:

### Database Schema
```
@postgres-mcp List all tables in the database
@postgres-mcp Describe the employees table
@postgres-mcp Show me the structure of all tables
```

### Query Data
```
@postgres-mcp Show me all employees
@postgres-mcp Get the first 10 product reviews
@postgres-mcp Find all suppliers in USA
```

### Create Tables
```
@postgres-mcp Create a table for storing customer orders with id, customer name, order date, and total amount
```

### Analyze
```
@postgres-mcp Analyze the query plan for SELECT * FROM employees WHERE department = 'Engineering'
@postgres-mcp Show indexes for the employees table
```

## Alternative: Using Cursor or Windsurf

If you're using Cursor or Windsurf IDE (VS Code alternatives), they also support MCP servers:

### Cursor Configuration

Edit `~/.cursor/config.json`:

```json
{
  "mcpServers": {
    "postgres": {
      "command": "python",
      "args": ["/Users/syedraza/postgres-mcp/mcp-server/server.py"],
      "url": "http://localhost:3000"
    }
  }
}
```

### Windsurf Configuration

Edit `~/.windsurf/mcp-settings.json`:

```json
{
  "mcpServers": {
    "postgres-mcp": {
      "url": "http://localhost:3000",
      "displayName": "PostgreSQL Database"
    }
  }
}
```

## Troubleshooting

### MCP Server Not Detected

1. Verify MCP server is running:
```bash
curl http://localhost:3000/health
```

2. Check MCP server provides required endpoints:
```bash
curl http://localhost:3000/mcp/v1/tools
```

3. Restart VS Code after adding configuration

### GitHub Copilot Can't See Database

1. Check that MCP server is connected to database:
```bash
curl http://localhost:3000/health | python3 -m json.tool
```

Should show:
```json
{
  "status": "healthy",
  "mcpServer": {
    "status": "running",
    "database": "connected"
  }
}
```

2. Test a tool directly:
```bash
curl -X POST http://localhost:3000/tool/list_tables \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Benefits of This Approach

✅ **No separate chatbot needed** - Use GitHub Copilot you already have
✅ **Integrated in VS Code** - Don't leave your editor
✅ **GitHub's LLM** - Powered by GPT-4, no API keys needed
✅ **Context aware** - Copilot can see your code and database
✅ **Multi-modal** - Ask about code AND database together

## Using Your VS Code Extension

Your VS Code extension (`syed-mcp-server-extension`) can help manage the MCP server:

1. **Install the extension** (if not already installed):
```bash
cd /Users/syedraza/postgres-mcp/syed-mcp-server-extension
code --install-extension syed-mcp-server-extension-*.vsix
```

2. **Open MCP Servers sidebar** in VS Code

3. **Start/Stop MCP server** from the extension UI

4. **View logs** directly in VS Code

This way you can control your MCP server without leaving VS Code!

## Comparison: Web Chatbot vs VS Code Copilot

| Feature | Web Chatbot | VS Code Copilot |
|---------|-------------|-----------------|
| **Access** | Any browser | VS Code only |
| **LLM** | Needs configuration | Uses GitHub Copilot |
| **Setup** | 2 servers | 1 server (MCP) |
| **UI** | Custom HTML | VS Code Chat |
| **Code Integration** | ❌ No | ✅ Yes |
| **Team Sharing** | ✅ Easy | ❌ Each user needs VS Code |
| **Mobile** | ✅ Yes | ❌ No |

## When to Use Each

**Use VS Code Copilot when:**
- You're already working in VS Code
- You want code + database context together
- You have GitHub Copilot subscription
- You're writing code that uses the database

**Use Web Chatbot when:**
- You need browser access
- Team members don't have VS Code
- You want mobile access
- You want a standalone database UI

## Complete VS Code Setup

For the best experience, use both:

1. **MCP Server** - Connects to PostgreSQL
2. **VS Code Extension** - Manages MCP server
3. **GitHub Copilot** - Chat interface with MCP

```
┌──────────────────────────────┐
│        VS Code IDE           │
│  ┌────────────────────────┐  │
│  │  GitHub Copilot Chat   │  │
│  └───────────┬────────────┘  │
│              │                │
│  ┌───────────▼────────────┐  │
│  │   MCP Extension        │  │
│  │   (Manage Server)      │  │
│  └───────────┬────────────┘  │
└──────────────┼───────────────┘
               │
        ┌──────▼───────┐
        │  MCP Server  │
        │  Port 3000   │
        └──────┬───────┘
               │
        ┌──────▼────────┐
        │  PostgreSQL   │
        └───────────────┘
```

## Next Steps

1. ✅ Start MCP server
2. ✅ Configure VS Code settings
3. ✅ Restart VS Code
4. ✅ Test with `@postgres-mcp` in Copilot Chat
5. ✅ Optional: Install your VS Code extension for easier management

---

**Note:** If GitHub Copilot doesn't support HTTP-based MCP servers yet, you may need to use the stdio version of your MCP server. Let me know if you need help converting your HTTP MCP server to stdio format.
