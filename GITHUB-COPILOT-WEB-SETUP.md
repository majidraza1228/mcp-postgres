# GitHub Copilot Web Chatbot Setup

This setup allows you to query your PostgreSQL database using GitHub Copilot's LLM through a web interface.

## Architecture

```
┌─────────────────────┐
│   Web Browser       │
│ (localhost:9000)    │
└──────────┬──────────┘
           │
           │ HTTP Request
           ▼
┌─────────────────────────────────┐
│  VS Code Extension              │
│  Copilot Web Bridge             │
│  - Receives web requests        │
│  - Calls GitHub Copilot Chat    │
│  - Generates SQL                │
│  - Returns results              │
└──────────┬──────────────────────┘
           │
           │ Chat API
           ▼
┌─────────────────────┐
│  GitHub Copilot     │
│  (GPT-4)            │
└─────────────────────┘
           │
           │ Tool calls
           ▼
┌─────────────────────┐
│  PostgreSQL MCP     │
│  Server             │
│  (localhost:3000)   │
└──────────┬──────────┘
           │
           │ SQL queries
           ▼
┌─────────────────────┐
│  PostgreSQL DB      │
│  (localhost:5431)   │
│  Database: Adventureworks
└─────────────────────┘
```

## Prerequisites

✅ VS Code installed
✅ GitHub Copilot subscription active and signed in
✅ PostgreSQL MCP Server configured
✅ Copilot Web Bridge extension installed

## Installation

The extension has already been installed at:
```
/Users/syedraza/postgres-mcp/copilot-web-bridge/copilot-web-bridge-1.0.0.vsix
```

If you need to reinstall:
```bash
code --install-extension /Users/syedraza/postgres-mcp/copilot-web-bridge/copilot-web-bridge-1.0.0.vsix
```

## How to Start

### Step 1: Start the MCP Server

```bash
./start-copilot-chatbot.sh
```

This will start the PostgreSQL MCP Server on port 3000.

### Step 2: Reload VS Code

1. Open VS Code
2. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
3. Type: `Developer: Reload Window`
4. Press Enter

This activates the Copilot Web Bridge extension.

### Step 3: Start Copilot Web Bridge

1. Press `Cmd+Shift+P` again
2. Type: `Copilot Web Bridge: Start Server`
3. Press Enter
4. Wait for the notification: **"Copilot Web Bridge started on http://localhost:9000"**

### Step 4: Open the Web Chatbot

```bash
open /Users/syedraza/postgres-mcp/GithubCopilot-agent/examples/postgres-chatbot-copilot.html
```

Or manually navigate to:
```
file:///Users/syedraza/postgres-mcp/GithubCopilot-agent/examples/postgres-chatbot-copilot.html
```

## Usage

Once the web page is open:

1. The status indicator should show **"LLM: GitHub Copilot (GPT-4)"**
2. Try these example queries:
   - "Show me all tables"
   - "List all employees"
   - "What is the average salary by department?"
   - "Show me products with ratings above 4"

## How It Works

1. **You type a query** in the web chatbot
2. **Web page sends HTTP request** to `localhost:9000/chat`
3. **VS Code extension receives request** and forwards to GitHub Copilot
4. **GitHub Copilot generates SQL** based on your database schema
5. **Extension executes SQL** via MCP Server
6. **Results are returned** to the web page
7. **GitHub Copilot explains results** in natural language

## Configuration

The extension can be configured in VS Code settings:

```json
{
  "copilotWebBridge.port": 9000,
  "copilotWebBridge.mcpServerUrl": "http://localhost:3000",
  "copilotWebBridge.autoStart": true
}
```

### Settings:

- **port**: Port for the web bridge HTTP server (default: 9000)
- **mcpServerUrl**: URL of your PostgreSQL MCP Server (default: http://localhost:3000)
- **autoStart**: Automatically start server when VS Code opens (default: true)

## Available Commands

Open Command Palette (`Cmd+Shift+P`) and type:

- `Copilot Web Bridge: Start Server` - Start the HTTP server
- `Copilot Web Bridge: Stop Server` - Stop the HTTP server
- `Copilot Web Bridge: Show Status` - Check if server is running

## Troubleshooting

### Extension not starting

1. Verify GitHub Copilot is active:
   - Check you're signed into GitHub Copilot in VS Code
   - Try using Copilot in a code file to verify it works

2. Check the Output panel:
   - View → Output
   - Select "Copilot Web Bridge" from dropdown
   - Look for any error messages

### Web page shows "Connection Error"

1. Verify Copilot Web Bridge is running:
   - Run command: `Copilot Web Bridge: Show Status`
   - Should say "running on port 9000"

2. Check port 9000 is not in use:
   ```bash
   lsof -i :9000
   ```

### "MCP Server error"

1. Check MCP Server is running:
   ```bash
   curl http://localhost:3000/health
   ```

2. Check MCP Server logs:
   ```bash
   tail -f /tmp/mcp-server.log
   ```

### "GitHub Copilot not available"

This means:
- GitHub Copilot is not signed in, or
- Your GitHub Copilot subscription is not active

**Solution:**
1. Open VS Code
2. Click on GitHub Copilot icon in status bar
3. Sign in to GitHub Copilot
4. Verify your subscription is active

## Benefits vs Ollama Setup

| Feature | Ollama (llama3.2:1b) | GitHub Copilot (GPT-4) |
|---------|---------------------|------------------------|
| **Quality** | Basic | Excellent |
| **SQL Generation** | Sometimes errors | Very accurate |
| **Natural Language** | Simple responses | Detailed explanations |
| **Cost** | Free | Included with Copilot subscription |
| **Setup** | Standalone | Requires VS Code + subscription |
| **Speed** | Fast (local) | Medium (API call) |

## Files

- **Extension source**: `/Users/syedraza/postgres-mcp/copilot-web-bridge/src/extension.ts`
- **Extension package**: `/Users/syedraza/postgres-mcp/copilot-web-bridge/copilot-web-bridge-1.0.0.vsix`
- **Web chatbot**: `/Users/syedraza/postgres-mcp/GithubCopilot-agent/examples/postgres-chatbot-copilot.html`
- **Startup script**: `/Users/syedraza/postgres-mcp/start-copilot-chatbot.sh`
- **MCP Server**: `/Users/syedraza/postgres-mcp/mcp-server/server.py`

## Stopping Servers

### Stop Copilot Web Bridge
```
Cmd+Shift+P → Copilot Web Bridge: Stop Server
```

### Stop MCP Server
```bash
pkill -f "python3 server.py"
```

## Security Notes

- The web bridge only accepts connections from localhost
- CORS is enabled for local development
- GitHub Copilot API calls are authenticated through VS Code
- Database credentials are stored in MCP server config

## Next Steps

1. Customize the web page UI in `postgres-chatbot-copilot.html`
2. Add more database tools to the MCP server
3. Configure the extension settings to your preferences
4. Set `autoStart: true` to automatically start on VS Code launch

---

**Need Help?**

Check the extension output:
1. View → Output
2. Select "Copilot Web Bridge" from dropdown

Check MCP Server logs:
```bash
tail -f /tmp/mcp-server.log
```
