# Using GitHub Copilot in VS Code with PostgreSQL MCP Server

## What You Want

Use **GitHub Copilot** (that you already have in VS Code) to interact with your PostgreSQL database through the MCP server - **no API keys needed!**

## Architecture

```
VS Code GitHub Copilot Chat
         ↓
   MCP Server (Port 3000)
         ↓
   PostgreSQL Database
```

**No web chatbot needed!** Everything happens inside VS Code.

## Setup Steps

### Step 1: Start Your MCP Server

```bash
cd /Users/syedraza/postgres-mcp/mcp-server
./venv/bin/python server.py
```

Should show:
```
✅ Connected to PostgreSQL database: Adventureworks
INFO:     Uvicorn running on http://127.0.0.1:3000
```

### Step 2: Configure GitHub Copilot in VS Code

GitHub Copilot needs to know about your MCP server. There are two ways to do this:

#### Option A: Using VS Code Settings (Recommended)

1. Open VS Code
2. Press `Cmd+Shift+P` (Command Palette)
3. Type: "Preferences: Open User Settings (JSON)"
4. Add this configuration:

```json
{
  "github.copilot.advanced": {
    "mcpServers": {
      "postgres": {
        "command": "python",
        "args": ["/Users/syedraza/postgres-mcp/mcp-server/server.py"],
        "transport": "stdio"
      }
    }
  }
}
```

**Note:** GitHub Copilot expects stdio-based MCP servers, but yours is HTTP-based. We need to convert it.

#### Option B: Using MCP Configuration File

Create `~/.vscode/mcp-config.json`:

```json
{
  "mcpServers": {
    "postgres-db": {
      "command": "python",
      "args": ["/Users/syedraza/postgres-mcp/mcp-server/venv/bin/python", "/Users/syedraza/postgres-mcp/mcp-server/server.py"],
      "env": {}
    }
  }
}
```

### Step 3: Problem - Your MCP Server is HTTP, not Stdio

**GitHub Copilot expects stdio-based MCP servers**, but your server uses HTTP (FastAPI).

You have two options:

#### Option 1: Create a Stdio Wrapper for Your HTTP MCP Server

I'll create a wrapper script that bridges stdio to your HTTP server:

```python
# /Users/syedraza/postgres-mcp/mcp-server/stdio_wrapper.py
import json
import sys
import asyncio
import aiohttp

MCP_SERVER_URL = "http://localhost:3000"

async def handle_request(request):
    """Forward stdio request to HTTP MCP server"""
    async with aiohttp.ClientSession() as session:
        if request.get("method") == "tools/list":
            async with session.get(f"{MCP_SERVER_URL}/mcp/v1/tools") as resp:
                data = await resp.json()
                return {"tools": data["tools"]}

        elif request.get("method") == "tools/call":
            tool_name = request["params"]["name"]
            arguments = request["params"].get("arguments", {})
            async with session.post(
                f"{MCP_SERVER_URL}/mcp/v1/tools/call",
                json={"name": tool_name, "arguments": arguments}
            ) as resp:
                return await resp.json()

    return {"error": "Unknown method"}

async def main():
    """Stdio bridge to HTTP MCP server"""
    while True:
        line = sys.stdin.readline()
        if not line:
            break

        try:
            request = json.loads(line)
            response = await handle_request(request)
            print(json.dumps(response), flush=True)
        except Exception as e:
            error_response = {"error": str(e)}
            print(json.dumps(error_response), flush=True)

if __name__ == "__main__":
    asyncio.run(main())
```

#### Option 2: Use Your VS Code Extension + Direct Copilot Chat

Since you have the VS Code extension (`syed-mcp-server-extension`), you can:

1. Use the extension to manage the MCP server
2. Use GitHub Copilot Chat to ask questions
3. Manually call MCP tools based on Copilot's suggestions

This is simpler but less integrated.

## Better Solution: Use the Web Chatbot WITHOUT LLM

Actually, you can still use the web chatbot! Just use **specific queries** that don't require LLM:

### Queries That Work WITHOUT LLM

These work because they're directly mapped to MCP tools:

```
✅ List all tables
✅ SELECT * FROM employees
✅ Describe employees table
✅ Show indexes for employees
✅ SELECT * FROM employees WHERE department = 'Engineering'
```

### Queries That REQUIRE LLM

```
❌ Show me all employees
❌ What tables do I have?
❌ Who works in engineering?
```

## Recommended Approach

Since GitHub Copilot in VS Code doesn't easily support HTTP-based MCP servers, I recommend:

### Option 1: Use Ollama (Free, Local LLM)

This is the best solution if you don't want to use API keys:

```bash
# 1. Install Ollama (one-time setup)
brew install ollama

# 2. Start Ollama (in Terminal 1)
ollama serve

# 3. Download model (in Terminal 2)
ollama pull llama3

# 4. Configure GitHub Copilot Agent
cd /Users/syedraza/postgres-mcp/GithubCopilot-agent
nano .env

# Set:
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# 5. Start everything
cd /Users/syedraza/postgres-mcp
./start-chatbot.sh
```

**This gives you:**
- ✅ Free natural language queries
- ✅ No API keys needed
- ✅ Works in web browser (no VS Code needed)
- ✅ Private (runs locally)

### Option 2: Convert MCP Server to Stdio

I can create a stdio version of your MCP server that works with GitHub Copilot in VS Code.

Would you like me to create that?

### Option 3: Direct Tool Queries (No LLM)

Just use specific SQL queries in the chatbot:

**In the PostgreSQL chatbot, type:**
```sql
SELECT * FROM employees
SELECT * FROM employees WHERE department = 'Engineering'
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
```

These work perfectly without any LLM!

## My Recommendation

**Use Ollama** - It's the perfect middle ground:

```bash
# Takes 5 minutes to set up
brew install ollama
ollama serve &
ollama pull llama3

# Update .env
cd /Users/syedraza/postgres-mcp/GithubCopilot-agent
cat > .env << EOF
PORT=8080
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3
EOF

# Restart
cd ..
./stop-chatbot.sh
./start-chatbot.sh
```

Then you can use natural language in the web chatbot:
- "Show me all employees"
- "List all tables"
- "What's in the database?"

All running locally, no API keys, no costs!

## Summary

| Solution | Pros | Cons | Setup Time |
|----------|------|------|------------|
| **Ollama (Local LLM)** | Free, Private, Natural language | Requires 8GB RAM | 5 minutes |
| **VS Code Copilot** | Already have it | Requires stdio MCP conversion | 30 minutes |
| **Direct SQL** | Works now | Less user-friendly | 0 minutes |
| **OpenAI API** | Best quality | Costs money | 2 minutes |

**I recommend Ollama.** Want me to help you set it up?
