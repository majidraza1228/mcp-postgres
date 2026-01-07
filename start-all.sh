#!/bin/bash
# Start all PostgreSQL Chatbot services on macOS
# Run this script and everything starts automatically!

echo "🚀 PostgreSQL Chatbot - Starting All Services"
echo "=================================================="
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Step 1: Start MCP Server
echo "1️⃣  Starting MCP Server (port 3000)..."
if lsof -i :3000 > /dev/null 2>&1; then
    echo "   ⚠️  MCP Server already running"
else
    cd mcp-server
    /usr/local/Caskroom/miniconda/base/bin/python3 server.py > /tmp/mcp-server.log 2>&1 &
    MCP_PID=$!
    cd ..
    sleep 3

    if curl -s http://localhost:3000/health | grep -q "running"; then
        echo "   ✅ MCP Server started (PID: $MCP_PID)"
    else
        echo "   ❌ MCP Server failed to start"
        echo "   Check logs: tail /tmp/mcp-server.log"
        exit 1
    fi
fi
echo ""

# Step 2: Start VS Code with Copilot Bridge (minimized)
echo "2️⃣  Starting VS Code + Copilot Bridge (port 9001)..."
if lsof -i :9001 > /dev/null 2>&1; then
    echo "   ⚠️  Copilot Bridge already running"
else
    echo "   Opening VS Code workspace (will be minimized)..."
    open -a "Visual Studio Code" "$SCRIPT_DIR"

    echo "   Waiting for VS Code to load (10 seconds)..."
    sleep 10

    # Minimize VS Code window
    echo "   Minimizing VS Code window..."
    osascript <<EOF 2>/dev/null
tell application "Visual Studio Code"
    set miniaturized of every window to true
end tell
tell application "System Events"
    tell process "Visual Studio Code"
        set visible to false
    end tell
end tell
EOF

    echo "   Waiting for Copilot Bridge extension (5 seconds)..."
    sleep 5

    if curl -s http://localhost:9001/health | grep -q "ok"; then
        echo "   ✅ Copilot Bridge started and running"
    else
        echo "   ⚠️  Copilot Bridge not responding yet, waiting 10 more seconds..."
        sleep 10
        if curl -s http://localhost:9001/health | grep -q "ok"; then
            echo "   ✅ Copilot Bridge started"
        else
            echo "   ❌ Copilot Bridge failed to start"
            echo "   Troubleshooting:"
            echo "   1. Un-minimize VS Code from Dock"
            echo "   2. Press Cmd+Shift+P"
            echo "   3. Type: 'Copilot Web Bridge: Start Server'"
            echo "   4. Check View → Output → 'Copilot Web Bridge'"
            # Don't exit - continue with web server
        fi
    fi
fi
echo ""

# Step 3: Start Web Server
echo "3️⃣  Starting Web Server (port 9000)..."
if lsof -i :9000 > /dev/null 2>&1; then
    echo "   ⚠️  Web Server already running"
else
    node web-server.js > /tmp/web-server.log 2>&1 &
    WEB_PID=$!
    sleep 3

    if curl -s http://localhost:9000/health | grep -q "healthy"; then
        echo "   ✅ Web Server started (PID: $WEB_PID)"
    else
        echo "   ❌ Web Server failed to start"
        echo "   Check logs: tail /tmp/web-server.log"
        exit 1
    fi
fi
echo ""

# Final status check
echo "=================================================="
echo "📊 Service Status Check"
echo "=================================================="
echo ""

MCP_STATUS=$(curl -s http://localhost:3000/health > /dev/null 2>&1 && echo '✅ Running' || echo '❌ Not Running')
COPILOT_STATUS=$(curl -s http://localhost:9001/health > /dev/null 2>&1 && echo '✅ Running' || echo '❌ Not Running')
WEB_STATUS=$(curl -s http://localhost:9000/health > /dev/null 2>&1 && echo '✅ Running' || echo '❌ Not Running')

echo "MCP Server (3000):      $MCP_STATUS"
echo "Copilot Bridge (9001):  $COPILOT_STATUS"
echo "Web Server (9000):      $WEB_STATUS"

echo ""

# Check if all services are running
if [[ "$MCP_STATUS" == *"Running"* ]] && [[ "$COPILOT_STATUS" == *"Running"* ]] && [[ "$WEB_STATUS" == *"Running"* ]]; then
    echo "=================================================="
    echo "✅ All Services Running Successfully!"
    echo "=================================================="
    echo ""
    echo "🌐 Chatbot Interface: http://localhost:9000"
    echo ""
    echo "📱 Opening chatbot in your browser..."
    sleep 1
    open http://localhost:9000
    echo ""
    echo "💡 VS Code is running minimized in the Dock"
    echo "   • You can keep it minimized - it works in background"
    echo "   • Un-minimize from Dock if needed"
    echo "   • Don't close VS Code or the AI chat will stop working"
    echo ""
    echo "🛑 To stop all services: ./stop-all.sh"
    echo ""
    echo "📋 Service Logs:"
    echo "   MCP Server:  tail -f /tmp/mcp-server.log"
    echo "   Web Server:  tail -f /tmp/web-server.log"
    echo ""
else
    echo "=================================================="
    echo "⚠️  Some Services Failed to Start"
    echo "=================================================="
    echo ""
    if [[ "$MCP_STATUS" == *"Not Running"* ]]; then
        echo "❌ MCP Server not running"
        echo "   Check: tail /tmp/mcp-server.log"
        echo "   Fix: Check database connection in mcp-server/.env"
    fi
    if [[ "$COPILOT_STATUS" == *"Not Running"* ]]; then
        echo "❌ Copilot Bridge not running"
        echo "   1. Un-minimize VS Code from Dock"
        echo "   2. Press Cmd+Shift+P"
        echo "   3. Run: 'Copilot Web Bridge: Start Server'"
    fi
    if [[ "$WEB_STATUS" == *"Not Running"* ]]; then
        echo "❌ Web Server not running"
        echo "   Check: tail /tmp/web-server.log"
    fi
    echo ""
fi
