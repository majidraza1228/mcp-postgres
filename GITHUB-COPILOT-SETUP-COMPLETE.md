# Complete GitHub Copilot + MCP Setup Guide

## What I've Created

I've converted your HTTP-based MCP server to **stdio format** so it works with GitHub Copilot in VS Code.

## Files Created

1. **[stdio_server.py](mcp-server/stdio_server.py)** - Stdio-based MCP server (compatible with VS Code Copilot)
2. **[vscode-mcp-settings.json](vscode-mcp-settings.json)** - VS Code configuration

## Setup Steps

### Step 1: Configure VS Code for GitHub Copilot + MCP

You have two options:

#### Option A: User Settings (Recommended - Works for all projects)

1. Open VS Code
2. Press `Cmd+Shift+P` (Command Palette)
3. Type: "Preferences: Open User Settings (JSON)"
4. Add this configuration:

```json
{
  "github.copilot.chat.mcpServers": {
    "postgres-mcp": {
      "command": "/Users/syedraza/postgres-mcp/mcp-server/venv/bin/python",
      "args": ["/Users/syedraza/postgres-mcp/mcp-server/stdio_server.py"]
    }
  }
}
```

#### Option B: Workspace Settings (Only for this project)

1. In VS Code, open your project folder: `/Users/syedraza/postgres-mcp`
2. Create `.vscode/settings.json` with:

```json
{
  "github.copilot.chat.mcpServers": {
    "postgres-mcp": {
      "command": "/Users/syedraza/postgres-mcp/mcp-server/venv/bin/python",
      "args": ["/Users/syedraza/postgres-mcp/mcp-server/stdio_server.py"]
    }
  }
}
```

### Step 2: Test the Stdio Server

First, test that the stdio server works:

```bash
cd /Users/syedraza/postgres-mcp/mcp-server

# Test the stdio server
echo '{"method":"tools/list","id":1}' | ./venv/bin/python stdio_server.py
```

You should see a JSON response with the list of tools.

### Step 3: Restart VS Code

Close and reopen VS Code to load the MCP configuration.

### Step 4: Use GitHub Copilot Chat

1. Open GitHub Copilot Chat in VS Code (`Cmd+Shift+I` or click the chat icon)
2. Type `@workspace` to reference your MCP server
3. Ask database questions!

## Example Queries in GitHub Copilot Chat

Once configured, in GitHub Copilot Chat, try:

```
@workspace List all tables in the database

@workspace Show me the structure of the employees table

@workspace Query the employees table and show me the first 5 rows

@workspace Find all employees in the Engineering department

@workspace Create a new table called 'orders' with columns: id (serial), customer_name (varchar), order_date (date), total_amount (decimal)
```

## How It Works

```
┌──────────────────────────────────────┐
│  You type in GitHub Copilot Chat    │
│  "List all tables"                   │
└──────────────┬───────────────────────┘
               │
┌──────────────▼───────────────────────┐
│  GitHub Copilot (GPT-4)              │
│  - Understands your request          │
│  - Sees available MCP tools          │
│  - Calls: list_tables()              │
└──────────────┬───────────────────────┘
               │ stdio
┌──────────────▼───────────────────────┐
│  stdio_server.py                     │
│  - Receives tool call                │
│  - Executes SQL query                │
└──────────────┬───────────────────────┘
               │
┌──────────────▼───────────────────────┐
│  PostgreSQL Database                 │
│  - Returns results                   │
└──────────────────────────────────────┘
```

## Differences from HTTP Server

| Feature | HTTP Server | Stdio Server |
|---------|-------------|--------------|
| **Port** | 3000 | None (stdio) |
| **Protocol** | HTTP/REST | JSON-RPC over stdio |
| **Use Case** | Web chatbot | VS Code Copilot |
| **File** | server.py | stdio_server.py |
| **Start Command** | `python server.py` | Auto-started by VS Code |

## Both Servers Can Run Together!

You can run **both** servers simultaneously:

1. **HTTP Server** (for web chatbot):
   ```bash
   cd /Users/syedraza/postgres-mcp/mcp-server
   ./venv/bin/python server.py
   ```

2. **Stdio Server** (for VS Code):
   - Automatically started by VS Code when you use Copilot Chat
   - No manual start needed!

## Troubleshooting

### "MCP server not found" in Copilot Chat

**Solution:**
1. Check VS Code settings contain the MCP configuration
2. Restart VS Code
3. Ensure the path to `stdio_server.py` is correct

### "Failed to start MCP server"

**Solution:**
```bash
# Test manually
cd /Users/syedraza/postgres-mcp/mcp-server
echo '{"method":"tools/list","id":1}' | ./venv/bin/python stdio_server.py

# Check if database is accessible
./venv/bin/python -c "import asyncpg; print('OK')"
```

### Database connection error

**Check .env file:**
```bash
cat /Users/syedraza/postgres-mcp/mcp-server/.env
```

Should contain:
```
DB_HOST=localhost
DB_PORT=5431
DB_NAME=Adventureworks
DB_USER=postgres
DB_PASSWORD=your_password
```

### Check VS Code Output Panel

1. Open VS Code
2. View → Output
3. Select "GitHub Copilot" from the dropdown
4. Look for MCP-related messages

## Testing the Configuration

### Test 1: Verify MCP Server Config

In VS Code:
1. Open Command Palette (`Cmd+Shift+P`)
2. Type: "GitHub Copilot: Show MCP Servers"
3. You should see "postgres-mcp" listed

### Test 2: Query in Copilot Chat

Open Copilot Chat and try:
```
@workspace Can you list all available database tools?
```

GitHub Copilot should show you the 7 MCP tools available.

### Test 3: Database Query

```
@workspace List all tables in the database
```

You should get a response with your tables: employees, chatbot, product_reviews, suppliers, test

## Advanced Usage

### Query with Context

```
@workspace I need to find all employees who work in Engineering department. Show me their names and salaries.
```

GitHub Copilot will:
1. Call `query_database` tool
2. Generate SQL: `SELECT firstname, lastname, salary FROM employees WHERE department = 'Engineering'`
3. Show you the results

### Create Tables

```
@workspace Create a new table called 'customers' with columns: id (primary key), name (text), email (text unique), created_at (timestamp)
```

GitHub Copilot will:
1. Call `create_table` tool
2. Generate proper column definitions
3. Execute the CREATE TABLE statement

### Analyze Performance

```
@workspace Analyze the execution plan for: SELECT * FROM employees WHERE salary > 70000
```

GitHub Copilot will:
1. Call `analyze_query_plan` tool
2. Show you the EXPLAIN output
3. Suggest optimizations if needed

## Benefits of This Setup

✅ **No API Keys** - Uses your existing GitHub Copilot subscription
✅ **Integrated** - Works directly in VS Code
✅ **Context Aware** - Copilot can see your code AND database
✅ **Natural Language** - Ask questions in plain English
✅ **Code Generation** - Copilot can write SQL queries for you
✅ **Safe** - All data stays in your environment

## Comparison: Web Chatbot vs VS Code Copilot

| Feature | Web Chatbot | VS Code Copilot |
|---------|-------------|-----------------|
| **LLM** | Needs Ollama/OpenAI | Uses GitHub Copilot |
| **Access** | Any browser | VS Code only |
| **Setup** | 2 servers | 1 config file |
| **Cost** | Free (Ollama) | Included in Copilot |
| **Code Integration** | ❌ No | ✅ Yes |
| **Mobile** | ✅ Yes | ❌ No |

## You Can Use BOTH!

You now have two options:

### Option 1: GitHub Copilot in VS Code
- Use when coding
- Integrated with your editor
- See code + database together
- **Uses your GitHub Copilot subscription (no extra cost!)**

### Option 2: Web Chatbot (with Ollama)
- Use from any browser
- Share with team members
- Works on mobile
- **Free with Ollama**

## Next Steps

1. ✅ Configure VS Code (Step 1 above)
2. ✅ Restart VS Code
3. ✅ Test with `@workspace List all tables`
4. ✅ Start using natural language database queries!

## Quick Reference

### VS Code Settings Location

**User Settings:**
```
~/Library/Application Support/Code/User/settings.json
```

**Workspace Settings:**
```
/Users/syedraza/postgres-mcp/.vscode/settings.json
```

### Stdio Server Start Command

```bash
/Users/syedraza/postgres-mcp/mcp-server/venv/bin/python \
  /Users/syedraza/postgres-mcp/mcp-server/stdio_server.py
```

### HTTP Server Start Command

```bash
cd /Users/syedraza/postgres-mcp/mcp-server
./venv/bin/python server.py
```

---

**You're all set! GitHub Copilot can now access your PostgreSQL database!** 🎉
