# GitHub Copilot Agent - MCP Bridge

A bridge server that connects your web chatbot to any MCP (Model Context Protocol) server with LLM capabilities.

## 🎯 Architecture

```
Your Web Chatbot → Agent Server → Any MCP Server → LLM
```

**What this does:**
- Your web chatbot acts as an MCP client (via HTTP/WebSocket)
- Agent server bridges HTTP/WebSocket to MCP protocol
- MCP server provides the actual LLM functionality
- Clean, decoupled architecture!

## ⚡ Quick Start

### 1. Install Dependencies

```bash
npm install
npm run build
```

### 2. Start the Server

You need to specify which MCP server to connect to:

**Option A: Environment Variables**
```bash
MCP_SERVER_COMMAND=node \
MCP_SERVER_ARGS="../your-mcp-server/dist/index.js" \
npm run start:server
```

**Option B: Command Line**
```bash
node dist/server.js node ../your-mcp-server/dist/index.js
```

**Example with postgres-mcp:**
```bash
MCP_SERVER_COMMAND=node \
MCP_SERVER_ARGS="../postgres-mcp/dist/index.js" \
npm run start:server
```

### 3. Open the Web Chatbot

```bash
# REST API version
open examples/web-chatbot-rest.html

# WebSocket version
open examples/web-chatbot-websocket.html
```

## 🏗️ How It Works

```
┌──────────────────────┐
│   Your Web Chatbot   │  ← Acts as MCP client (via HTTP/WS)
└──────────┬───────────┘
           │ HTTP/WebSocket
           │
┌──────────▼────────────────────────┐
│   Agent Server (This Project)    │
│   - HTTP/WebSocket API            │
│   - MCP Client internally         │
│   - Protocol bridge               │
└──────────┬────────────────────────┘
           │ MCP Protocol (stdio)
           │
┌──────────▼────────────────────┐
│   Your MCP Server             │
│   - Has LLM access            │
│   - Provides tools            │
│   - postgres-mcp, etc.        │
└───────────────────────────────┘
```

## 🔌 API Endpoints

### REST API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chat` | POST | General chat with LLM |
| `/generate-code` | POST | Generate code |
| `/explain-code` | POST | Explain code |
| `/review-code` | POST | Review code |
| `/fix-code` | POST | Fix bugs |
| `/tools` | GET | List available MCP tools |
| `/tool/:toolName` | POST | Call any MCP tool directly |
| `/health` | GET | Health check |
| `/agent/info` | GET | Get agent info and tools |

### WebSocket Messages

| Type | Purpose |
|------|---------|
| `chat` | Chat with LLM |
| `generate_code` | Generate code |
| `explain_code` | Explain code |
| `review_code` | Review code |
| `fix_code` | Fix bugs |
| `list_tools` | List MCP tools |
| `call_tool` | Call specific MCP tool |
| `ping/pong` | Keep alive |

## 💡 Example Usage

### From Your Web Chatbot (REST)

```javascript
// Chat with the LLM
const response = await fetch('http://localhost:3000/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Explain async/await in JavaScript'
  })
});

const data = await response.json();
console.log(data.response);
```

### From Your Web Chatbot (WebSocket)

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'chat',
    message: 'How do I create a React component?'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'chat_response') {
    console.log(data.response);
  }
};
```

### Call Any MCP Tool Directly

```javascript
// List available tools from your MCP server
const tools = await fetch('http://localhost:3000/tools').then(r => r.json());

// Call a specific tool
const result = await fetch('http://localhost:3000/tool/your_tool_name', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    // tool arguments here
    param1: 'value1',
    param2: 'value2'
  })
});
```

## 🎨 Features

- ✅ **MCP Bridge** - Connects web chatbots to MCP servers
- ✅ **HTTP REST API** - Simple integration
- ✅ **WebSocket** - Real-time communication
- ✅ **Generic** - Works with any MCP server
- ✅ **No Token Management** - MCP server handles authentication
- ✅ **CORS Enabled** - Works from any origin
- ✅ **Tool Discovery** - Automatically lists available MCP tools
- ✅ **Beautiful Examples** - Ready-to-use web chatbots included

## 🔧 Configuration

### Environment Variables

```bash
# Server port (default: 3000)
PORT=8080

# MCP server command
MCP_SERVER_COMMAND=node

# MCP server arguments (space-separated)
MCP_SERVER_ARGS="../your-mcp-server/dist/index.js --config config.json"
```

### Command Line

```bash
node dist/server.js <command> [args...]

# Examples:
node dist/server.js node ../postgres-mcp/dist/index.js
node dist/server.js python ../my-mcp-server/main.py
node dist/server.js /path/to/executable --flag value
```

## 📚 Documentation

- **README.md** - This file
- **[examples/](examples/)** - Web chatbot examples (REST and WebSocket)

## 🛠️ Development

```bash
# Install
npm install

# Build
npm run build

# Run
npm run start:server
```

## 🔒 Security

- CORS enabled (configure for production)
- All requests proxied to MCP server
- No credentials stored in this agent
- Add authentication for production use

## 🎯 Use Cases

1. **Web Chatbot Integration** - Connect browser chatbots to MCP servers
2. **Mobile App Backend** - REST API for mobile apps
3. **Multi-Platform Support** - One MCP server, multiple frontends
4. **Tool Aggregation** - Expose MCP tools via HTTP/WebSocket

## 📊 Compatible MCP Servers

- **postgres-mcp** - PostgreSQL with LLM
- **filesystem-mcp** - File operations
- **browser-mcp** - Browser automation
- **Any MCP server** - Following MCP protocol!

## 🚀 Quick Example

```bash
# 1. Build the agent
npm install && npm run build

# 2. Start with your MCP server
MCP_SERVER_COMMAND=node \
MCP_SERVER_ARGS="../postgres-mcp/dist/index.js" \
npm run start:server

# 3. Open web chatbot
open examples/web-chatbot-rest.html

# 4. Start chatting!
```

## 📝 License

MIT
