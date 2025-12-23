# Testing Guide

This guide will help you test the MCP bridge with your MCP server.

## Prerequisites

1. Your MCP server must be working and accessible
2. Agent dependencies installed (`npm install` in GithubCopilot-agent)
3. Agent built (`npm run build` in GithubCopilot-agent)

## Testing Steps

### Step 1: Test Your MCP Server Independently

First, verify your MCP server works on its own:

**For Python MCP Server:**
```bash
cd /Users/syedraza/postgres-mcp/mcp-server
python server.py
```

**For Node.js MCP Server:**
```bash
cd /path/to/your/mcp-server
node dist/index.js
```

If it starts without errors, it's ready!

### Step 2: Start the Agent Bridge

Now start the agent bridge and connect it to your MCP server:

**Option 1: Using Environment Variables**

```bash
cd /Users/syedraza/postgres-mcp/GithubCopilot-agent

# For Python MCP server
MCP_SERVER_COMMAND=python \
MCP_SERVER_ARGS="../mcp-server/server.py" \
npm run start:server

# For Node.js MCP server
MCP_SERVER_COMMAND=node \
MCP_SERVER_ARGS="../your-mcp-server/dist/index.js" \
npm run start:server
```

**Option 2: Using Command Line**

```bash
cd /Users/syedraza/postgres-mcp/GithubCopilot-agent

# For Python MCP server
node dist/server.js python ../mcp-server/server.py

# For Node.js MCP server
node dist/server.js node ../your-mcp-server/dist/index.js
```

You should see:
```
╔════════════════════════════════════════════════════════╗
║       GitHub Copilot Agent Server Started             ║
╠════════════════════════════════════════════════════════╣
║  HTTP Server:      http://localhost:3000              ║
║  WebSocket:        ws://localhost:3000                ║
║  MCP Connected:    ✓ Yes                              ║
║  Status:           Ready                               ║
╚════════════════════════════════════════════════════════╝
```

### Step 3: Test the API

**Test 1: Health Check**

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-22T...",
  "mcpConnected": true
}
```

**Test 2: List Available Tools**

```bash
curl http://localhost:3000/tools
```

This will show all tools available from your MCP server.

**Test 3: Get Agent Info**

```bash
curl http://localhost:3000/agent/info
```

Expected response:
```json
{
  "name": "GitHub Copilot Agent",
  "version": "2.0.0",
  "mcpConnected": true,
  "availableTools": ["tool1", "tool2", ...],
  "status": "ready"
}
```

**Test 4: Send a Chat Message**

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, can you help me?"}'
```

**Test 5: Generate Code**

```bash
curl -X POST http://localhost:3000/generate-code \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a function to add two numbers", "language": "python"}'
```

### Step 4: Test with Web Chatbot

Open the example web chatbot:

```bash
cd /Users/syedraza/postgres-mcp/GithubCopilot-agent
open examples/web-chatbot-rest.html
```

Or for WebSocket version:

```bash
open examples/web-chatbot-websocket.html
```

The chatbot should:
1. Show "Connected" status (green dot)
2. Allow you to send messages
3. Get responses from your MCP server via the agent

### Step 5: Test WebSocket Connection

Create a simple test file:

```javascript
// test-websocket.js
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  console.log('✓ Connected to agent');

  // Send a chat message
  ws.send(JSON.stringify({
    type: 'chat',
    message: 'Hello from test client!'
  }));
});

ws.on('message', (data) => {
  const response = JSON.parse(data);
  console.log('Received:', response);

  if (response.type === 'chat_response') {
    console.log('✓ Chat response received!');
    ws.close();
  }
});

ws.on('error', (error) => {
  console.error('✗ Error:', error);
});
```

Run it:
```bash
node test-websocket.js
```

## Troubleshooting

### Issue: "MCP Server not configured"

**Solution:**
Make sure you provide either:
- Environment variables: `MCP_SERVER_COMMAND` and `MCP_SERVER_ARGS`
- Command line args: `node dist/server.js <command> <args>`

### Issue: "Failed to connect to MCP server"

**Possible causes:**
1. MCP server path is wrong
2. MCP server has errors
3. MCP server not following MCP protocol

**Debug steps:**
```bash
# Test MCP server standalone
cd /path/to/mcp-server
python server.py  # or node dist/index.js

# Check if it responds to stdio
```

### Issue: "No chat tool available in MCP server"

**Solution:**
Your MCP server needs to provide at least one of these tools:
- `chat`
- `ask`
- `query`
- `prompt`

Or you can call specific tools directly:
```bash
curl -X POST http://localhost:3000/tool/your_tool_name \
  -H "Content-Type: application/json" \
  -d '{"param": "value"}'
```

### Issue: "Connection refused" on port 3000

**Solution:**
Change the port:
```bash
PORT=8080 \
MCP_SERVER_COMMAND=python \
MCP_SERVER_ARGS="../mcp-server/server.py" \
npm run start:server
```

### Issue: Web chatbot doesn't connect

**Possible causes:**
1. Agent server not running
2. CORS issues
3. Wrong URL in chatbot

**Debug:**
1. Check agent is running: `curl http://localhost:3000/health`
2. Check browser console for errors
3. Verify URL in chatbot HTML matches server port

## Common Test Scenarios

### Test with PostgreSQL MCP Server

```bash
# Start agent with postgres-mcp
cd /Users/syedraza/postgres-mcp/GithubCopilot-agent

MCP_SERVER_COMMAND=python \
MCP_SERVER_ARGS="../mcp-server/server.py" \
npm run start:server

# Test database query
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "List all tables in the database"}'
```

### Test Tool Discovery

```bash
# List all tools
curl http://localhost:3000/tools | python -m json.tool

# Call a specific tool
curl -X POST http://localhost:3000/tool/list_tables \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Test Error Handling

```bash
# Send invalid request
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{}'

# Should return error with proper status code
```

## Success Criteria

✅ Agent starts without errors
✅ MCP server connects successfully
✅ `/health` returns `mcpConnected: true`
✅ `/tools` lists available tools
✅ `/chat` returns responses
✅ Web chatbot connects and works
✅ WebSocket messages work bidirectionally

## Next Steps

Once testing is successful:
1. Integrate with your actual web chatbot
2. Deploy to production
3. Add authentication if needed
4. Configure CORS for your domain
5. Set up monitoring and logging
