#!/bin/bash
# PostgreSQL Chatbot Stop Script

echo "🛑 Stopping PostgreSQL Chatbot servers..."
echo ""

# Check for PID files
if [ -f /tmp/chatbot-mcp.pid ] && [ -f /tmp/chatbot-agent.pid ]; then
    MCP_PID=$(cat /tmp/chatbot-mcp.pid)
    AGENT_PID=$(cat /tmp/chatbot-agent.pid)

    echo "Stopping MCP Server (PID: $MCP_PID)..."
    kill $MCP_PID 2>/dev/null && echo "   ✅ MCP Server stopped" || echo "   ⚠️  MCP Server not running"

    echo "Stopping Agent (PID: $AGENT_PID)..."
    kill $AGENT_PID 2>/dev/null && echo "   ✅ Agent stopped" || echo "   ⚠️  Agent not running"

    rm -f /tmp/chatbot-mcp.pid /tmp/chatbot-agent.pid
else
    echo "No PID files found. Attempting to stop by port..."

    # Try to find and kill processes by port
    MCP_PID=$(lsof -ti:3000)
    AGENT_PID=$(lsof -ti:8080)

    if [ ! -z "$MCP_PID" ]; then
        echo "Stopping MCP Server on port 3000 (PID: $MCP_PID)..."
        kill $MCP_PID 2>/dev/null && echo "   ✅ MCP Server stopped" || echo "   ⚠️  Could not stop"
    else
        echo "   ℹ️  No process running on port 3000"
    fi

    if [ ! -z "$AGENT_PID" ]; then
        echo "Stopping Agent on port 8080 (PID: $AGENT_PID)..."
        kill $AGENT_PID 2>/dev/null && echo "   ✅ Agent stopped" || echo "   ⚠️  Could not stop"
    else
        echo "   ℹ️  No process running on port 8080"
    fi
fi

echo ""
echo "✅ Done!"
