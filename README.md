# MCP Registry & Server Manager

Complete internal solution for managing MCP servers - publish, browse, install, and run MCP servers locally.

---

## 📦 Components

### 1. **MCP Registry** (Docker)
Central registry for hosting MCP servers internally.
- **Location:** `mcp-registry/`
- **Ports:** Backend (8000), Frontend (3001)

### 2. **PostgreSQL MCP Server**
Query PostgreSQL databases via MCP protocol.
- **Location:** `mcp-server/`
- **Tools:** Query DB, List Tables, Describe Schema

### 3. **VS Code Extension**
Unified manager for all MCP servers.
- **Location:** `unified-mcp-extension/`
- **Features:** Install, Start, Stop, Configure, View Logs

---

## 🚀 Quick Start

### 1. Start MCP Registry

```bash
cd mcp-registry
docker-compose up -d
```

**Access:**
- Web UI: http://localhost:3001
- API: http://localhost:8000

### 2. Install VS Code Extension

```bash
cd unified-mcp-extension
npm install
npm run compile
npm run package
code --install-extension mcp-server-manager-1.0.0.vsix
```

**Reload VS Code:** `Cmd+Shift+P` → "Developer: Reload Window"

### 3. Use Extension

1. **Click MCP Servers icon** in VS Code sidebar
2. **See Registry panel** with available servers
3. **Click download icon** on postgres-mcp → Installs
4. **Click gear icon** → Configure DB credentials
5. **Click play icon** → Server starts
6. **Query your database** via any MCP client!

---

## 📖 Developer Guide

### Publish MCP Server to Registry

```bash
# Package your server
cd my-mcp-server
tar -czf my-server-1.0.0.tar.gz .

# Publish via API
curl -X POST http://localhost:8000/api/v1/publish \
  -F "package=@my-server-1.0.0.tar.gz" \
  -F "name=my-server" \
  -F "version=1.0.0" \
  -F "description=My MCP server" \
  -F "author=Your Name" \
  -F "tags=database,custom"
```

Or use **Web UI:** http://localhost:3001 → Publish tab

### Install & Run MCP Server

**Via VS Code Extension:**
1. Open MCP Servers panel
2. Find server in Registry panel
3. Click download → Install
4. Click gear → Configure
5. Click play → Start
6. Server runs at `~/.mcp-servers/{name}/`

**Via Command Palette:**
- `Cmd+Shift+P` → `MCP: Install Server`
- Select from dropdown
- Configure and start

---

## 🎯 Use Cases

### Query Database with AI

1. Install `postgres-mcp` via extension
2. Configure: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
3. Start server
4. Use with Claude Desktop/Cline/Continue
5. Ask: "List all tables" or "Show sales data"

### Team Setup

1. **Admin:** Publish approved MCP servers to registry
2. **Developers:** Install VS Code extension
3. **Developers:** Browse registry, install needed servers
4. **Everyone:** Uses same tested MCP servers
5. **Centralized** version management and updates

---

## 🛠️ Management

### MCP Registry

**Start:**
```bash
cd mcp-registry
docker-compose up -d
```

**Stop:**
```bash
docker-compose down
```

**API:**
- `GET /api/v1/servers` - List servers
- `GET /api/v1/servers/search?q=query` - Search
- `POST /api/v1/publish` - Publish server
- `GET /api/v1/servers/{name}/{version}/download` - Download

### VS Code Extension Commands

- `MCP: Install Server` - Install from registry
- `MCP: Start Server` - Start server
- `MCP: Stop Server` - Stop server
- `MCP: Configure Server` - Set environment vars
- `MCP: View Server Logs` - Debug logs
- `MCP: Refresh Registry` - Reload list

### Settings

```json
{
  "mcpManager.registryUrl": "http://localhost:8000",
  "mcpManager.installDirectory": "~/.mcp-servers",
  "mcpManager.pythonPath": "python3"
}
```

---

## 📁 Structure

```
postgres-mcp/
├── mcp-registry/              # Docker registry
│   ├── backend/               # FastAPI
│   ├── frontend/              # Web UI
│   └── docker-compose.yml
│
├── mcp-server/                # PostgreSQL MCP
│   ├── server.py
│   ├── config.py
│   └── requirements.txt
│
└── unified-mcp-extension/     # VS Code ext
    ├── src/
    ├── package.json
    └── mcp-server-manager-1.0.0.vsix
```

---

## 🐛 Troubleshooting

**Registry not accessible:**
```bash
docker ps  # Check running
curl http://localhost:8000  # Test API
```

**Extension not showing:**
```
Cmd+Shift+P → "Developer: Reload Window"
```

**Server won't start:**
1. Check configuration (gear icon)
2. View logs (right-click → View Logs)
3. Verify DB credentials

**Installation fails:**
1. Check Output panel: View → Output → "MCP Server Manager"
2. Verify registry URL: `curl http://localhost:8000`
3. Check permissions: `ls -la ~/.mcp-servers/`

---

## ✅ What You Get

- ✅ **Internal MCP Registry** - No public dependencies
- ✅ **One-Click Install** - Browse and install from VS Code
- ✅ **Server Management** - Start/Stop/Configure via GUI
- ✅ **PostgreSQL Queries** - Ask AI to query your databases
- ✅ **Team Distribution** - Centralized, version-controlled servers
- ✅ **Works with any MCP client** - Claude Desktop, Cline, Continue, Cursor, Zed

---

**Everything runs locally. Developers query databases through AI assistants.** 🚀
