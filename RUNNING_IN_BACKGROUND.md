# Running Services in Background

This document explains how the PostgreSQL Chatbot runs all services in the background, allowing you to use the chatbot without visible terminals or VS Code windows.

---

## Quick Start

**Start everything with one command:**

```bash
./start-all.sh
```

**What happens:**
1. MCP Server starts in background (no visible window)
2. VS Code starts and minimizes automatically (hidden in Dock)
3. Web Server starts in background (no visible window)
4. Browser opens automatically to http://localhost:9000

**You'll see this output:**

```
🚀 PostgreSQL Chatbot - Starting All Services
==================================================

1️⃣  Starting MCP Server (port 3000)...
   ✅ MCP Server started (PID: 12345)

2️⃣  Starting VS Code + Copilot Bridge (port 9001)...
   Opening VS Code workspace (will be minimized)...
   Waiting for VS Code to load (10 seconds)...
   Minimizing VS Code window...
   Waiting for Copilot Bridge extension (5 seconds)...
   ✅ Copilot Bridge started and running

3️⃣  Starting Web Server (port 9000)...
   ✅ Web Server started (PID: 12346)

==================================================
📊 Service Status Check
==================================================

MCP Server (3000):      ✅ Running
Copilot Bridge (9001):  ✅ Running
Web Server (9000):      ✅ Running

==================================================
✅ All Services Running Successfully!
==================================================

🌐 Chatbot Interface: http://localhost:9000

📱 Opening chatbot in your browser...

💡 VS Code is running minimized in the Dock
   • You can keep it minimized - it works in background
   • Un-minimize from Dock if needed
   • Don't close VS Code or the AI chat will stop working

🛑 To stop all services: ./stop-all.sh

📋 Service Logs:
   MCP Server:  tail -f /tmp/mcp-server.log
   Web Server:  tail -f /tmp/web-server.log
```

---

## How Background Services Work

### 1. MCP Server (Port 3000)

**What it does:**
- Connects to PostgreSQL database
- Provides 8 database tools (query, list_tables, describe_table, etc.)
- Runs as a Python FastAPI server

**How it runs in background:**
```bash
/usr/local/Caskroom/miniconda/base/bin/python3 server.py > /tmp/mcp-server.log 2>&1 &
```

**Key points:**
- `&` at end = runs in background
- Output redirected to `/tmp/mcp-server.log`
- No visible terminal window
- Process runs independently

**Check if running:**
```bash
lsof -i :3000
curl http://localhost:3000/health
```

**View logs:**
```bash
tail -f /tmp/mcp-server.log
```

---

### 2. VS Code + Copilot Bridge (Port 9001)

**What it does:**
- Runs GitHub Copilot for AI-powered SQL generation
- Copilot Web Bridge extension provides API on port 9001
- Bridges chatbot requests to Copilot

**How it runs in background (macOS):**

```bash
# 1. Open VS Code with workspace
open -a "Visual Studio Code" /path/to/mcp-postgres

# 2. Wait for VS Code to load
sleep 10

# 3. Minimize window using AppleScript
osascript <<EOF
tell application "Visual Studio Code"
    set miniaturized of every window to true
end tell
tell application "System Events"
    tell process "Visual Studio Code"
        set visible to false
    end tell
end tell
EOF

# 4. Extension auto-starts (due to autoStart: true in settings)
# 5. Copilot Bridge now listening on port 9001
```

**Key points:**
- VS Code window is **minimized**, not closed
- You can see it in the Dock (minimized icon)
- Extension runs in background
- GitHub Copilot credentials already saved on disk
- No browser popup needed (already authenticated)

**Check if running:**
```bash
lsof -i :9001
curl http://localhost:9001/health
```

**Visual confirmation:**
- Check Dock - you'll see VS Code icon (minimized)
- Un-minimize to see VS Code if needed
- Bottom right shows "GitHub Copilot" (authenticated)

**Why VS Code must stay open:**
- Copilot is a VS Code extension
- Extension can only run inside VS Code
- Closing VS Code stops the extension = AI chat stops working

---

### 3. Web Server (Port 9000)

**What it does:**
- Serves the chatbot HTML interface
- Provides API endpoints (/chat, /tool/*, /health)
- Proxies requests to Copilot Bridge and MCP Server

**How it runs in background:**
```bash
node web-server.js > /tmp/web-server.log 2>&1 &
```

**Key points:**
- `&` at end = runs in background
- Output redirected to `/tmp/web-server.log`
- No visible terminal window
- Handles all browser requests

**Check if running:**
```bash
lsof -i :9000
curl http://localhost:9000/health
```

**View logs:**
```bash
tail -f /tmp/web-server.log
```

---

## Process Flow

```
User opens browser → http://localhost:9000
                              ↓
                        Web Server (bg)
                              ↓
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            Copilot Bridge         MCP Server
            (VS Code - bg)         (Python - bg)
                    │                   │
                    │                   ▼
                    │              PostgreSQL
                    │              Database
                    └───────────────────┘
                    Returns results to browser
```

**All services run in background - no visible windows needed!**

---

## VS Code in Background - Technical Details

### Why Minimize Instead of Headless?

**macOS doesn't support true headless VS Code like Linux does.**

**Options:**
1. ❌ True headless - Not supported on macOS without Xvfb
2. ✅ Minimize window - Window hidden but process runs normally
3. ⚠️ Run visible - Works but clutters desktop

**Our approach (Option 2):**
- VS Code opens normally
- Script immediately minimizes window
- Window hidden in Dock
- All extensions work normally
- GitHub Copilot API accessible

### What "Minimized" Means

**Minimized != Closed**

```
┌─────────────────────────────────────────┐
│  MINIMIZED (What we do)                 │
├─────────────────────────────────────────┤
│  • Process running ✅                    │
│  • Extensions active ✅                  │
│  • API accessible ✅                     │
│  • Window hidden in Dock ✅              │
│  • Can un-minimize anytime ✅            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  CLOSED (Don't do this!)                │
├─────────────────────────────────────────┤
│  • Process stopped ❌                    │
│  • Extensions not running ❌             │
│  • API not accessible ❌                 │
│  • Chatbot AI features stop working ❌  │
└─────────────────────────────────────────┘
```

### Copilot Credentials in Background

**How Copilot works without browser popup:**

```
First Time (One-time setup):
1. Open VS Code (GUI visible)
2. Install GitHub Copilot extension
3. Sign in (browser opens for auth)
4. Token saved to disk:
   ~/Library/Application Support/Code/User/globalStorage/github.copilot-chat/

Every Subsequent Start (Including Background):
1. VS Code starts (minimized or visible)
2. Extension loads
3. Reads token from disk ✅
4. Validates with GitHub API ✅
5. Works! No browser needed ✅
```

**You already completed the one-time setup, so:**
- ✅ Token stored on disk
- ✅ Works when VS Code runs minimized
- ✅ No browser popup needed
- ✅ Auto-authenticates from saved credentials

---

## Monitoring Background Services

### Check All Services Status

```bash
# Quick check
lsof -i :3000  # MCP Server
lsof -i :9001  # Copilot Bridge
lsof -i :9000  # Web Server

# Health checks
curl http://localhost:3000/health  # MCP
curl http://localhost:9001/health  # Copilot
curl http://localhost:9000/health  # Web

# View logs
tail -f /tmp/mcp-server.log
tail -f /tmp/web-server.log
# (VS Code logs in VS Code Output panel)
```

### Service Health Script

Created for you: `health-check.sh`

```bash
#!/bin/bash
echo "=== PostgreSQL Chatbot Health Check ==="

echo -n "MCP Server (3000):     "
curl -s http://localhost:3000/health > /dev/null 2>&1 && echo "✅ Running" || echo "❌ Down"

echo -n "Copilot Bridge (9001): "
curl -s http://localhost:9001/health > /dev/null 2>&1 && echo "✅ Running" || echo "❌ Down"

echo -n "Web Server (9000):     "
curl -s http://localhost:9000/health > /dev/null 2>&1 && echo "✅ Running" || echo "❌ Down"

echo -n "VS Code Process:       "
pgrep -f "Visual Studio Code" > /dev/null && echo "✅ Running" || echo "❌ Not Running"
```

---

## Stopping Services

### Stop All Services

```bash
./stop-all.sh
```

**This will:**
1. Stop Web Server (port 9000)
2. Quit VS Code (closes Copilot Bridge)
3. Stop MCP Server (port 3000)

**Output:**
```
🛑 Stopping PostgreSQL Chatbot Services
==================================================

Stopping Web Server (port 9000)...
✅ Web Server stopped

Stopping VS Code + Copilot Bridge...
✅ VS Code stopped

Stopping MCP Server (port 3000)...
✅ MCP Server stopped

==================================================
✅ All services stopped
==================================================
```

### Stop Individual Services

```bash
# Stop MCP Server only
lsof -ti:3000 | xargs kill -9

# Stop VS Code only
osascript -e 'quit app "Visual Studio Code"'

# Stop Web Server only
lsof -ti:9000 | xargs kill -9
```

---

## Logs and Troubleshooting

### Log Locations

| Service | Log File | Command |
|---------|----------|---------|
| MCP Server | `/tmp/mcp-server.log` | `tail -f /tmp/mcp-server.log` |
| Web Server | `/tmp/web-server.log` | `tail -f /tmp/web-server.log` |
| VS Code | VS Code Output Panel | View → Output → "Copilot Web Bridge" |

### Common Issues

**Issue: Copilot Bridge not starting**

**Symptoms:**
- `curl http://localhost:9001/health` fails
- Chat requests timeout

**Fix:**
1. Un-minimize VS Code from Dock
2. Press `Cmd+Shift+P`
3. Type: "Copilot Web Bridge: Start Server"
4. Check View → Output → "Copilot Web Bridge" for errors

**Issue: MCP Server can't connect to database**

**Symptoms:**
- `curl http://localhost:3000/health` shows "disconnected"
- Database queries fail

**Fix:**
1. Check database is running: `psql -h localhost -p 5431 -U postgres -l`
2. Verify credentials in `mcp-server/.env`
3. Check logs: `tail /tmp/mcp-server.log`

**Issue: VS Code closes unexpectedly**

**Symptoms:**
- AI chat stops working
- Port 9001 not listening

**Fix:**
1. Run `./start-all.sh` again
2. Don't close VS Code window - minimize it instead
3. If accidental close, restart script

---

## Server Deployment

**For production Linux servers:**

Use systemd services instead of start-all.sh:

```bash
# Create service files (see DEPLOYMENT.md for details)
sudo systemctl enable mcp-server
sudo systemctl enable chatbot-web
sudo systemctl enable vscode-copilot

# Start on boot
sudo systemctl start mcp-server chatbot-web vscode-copilot
```

**Key differences from macOS:**
- Linux: Uses Xvfb (virtual display) for true headless VS Code
- macOS: Uses minimized window (shown in Dock)
- Both: Same functionality, services run in background

See [DEPLOYMENT.md](DEPLOYMENT.md) and [VSCODE_SERVER_SETUP.md](VSCODE_SERVER_SETUP.md) for full details.

---

## Summary

✅ **One command starts everything:** `./start-all.sh`
✅ **All services run in background:** No visible windows
✅ **VS Code minimized in Dock:** Hidden but running
✅ **Copilot auto-authenticates:** No browser popup needed
✅ **Chatbot opens automatically:** http://localhost:9000
✅ **Logs available:** Check `/tmp/*.log` files
✅ **Easy to stop:** `./stop-all.sh`

**The user experience:**
1. Run `./start-all.sh`
2. Wait ~30 seconds
3. Browser opens with chatbot
4. Start asking questions!
5. All AI features work (Copilot running in background)
6. When done: `./stop-all.sh`

**No manual terminal juggling, no visible VS Code window, just a working chatbot!**
