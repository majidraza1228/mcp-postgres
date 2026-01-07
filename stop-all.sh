#!/bin/bash
# Stop all PostgreSQL Chatbot services

echo "🛑 Stopping PostgreSQL Chatbot Services"
echo "========================================"
echo ""

# Stop Web Server
echo "Stopping Web Server (port 9000)..."
lsof -ti:9000 | xargs kill -9 2>/dev/null && echo "✅ Web Server stopped" || echo "⚠️  Web Server not running"

# Stop Copilot Bridge / VS Code
echo "Stopping VS Code + Copilot Bridge..."
osascript -e 'quit app "Visual Studio Code"' 2>/dev/null && echo "✅ VS Code stopped" || echo "⚠️  VS Code not running"

# Stop MCP Server
echo "Stopping MCP Server (port 3000)..."
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "✅ MCP Server stopped" || echo "⚠️  MCP Server not running"

echo ""
echo "========================================"
echo "✅ All services stopped"
echo "========================================"
echo ""
