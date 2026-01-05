#!/bin/bash
# PostgreSQL Chatbot Startup Script
# This starts all required servers and opens the chatbot

set -e

echo "🚀 Starting PostgreSQL Web Chatbot..."
echo ""

# Store the project root
PROJECT_ROOT="/Users/syedraza/postgres-mcp"

# Start MCP Server
echo "📦 Starting PostgreSQL MCP Server (port 3000)..."
cd "$PROJECT_ROOT/mcp-server"
./venv/bin/python server.py > /tmp/mcp-server.log 2>&1 &
MCP_PID=$!
echo "   MCP Server started with PID: $MCP_PID"

# Wait for MCP server to be ready
echo "   Waiting for MCP server to start..."
sleep 3

# Check if MCP server is running
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "   ❌ MCP Server failed to start. Check /tmp/mcp-server.log"
    kill $MCP_PID 2>/dev/null || true
    exit 1
fi
echo "   ✅ MCP Server is ready"
echo ""

# Start GitHub Copilot Agent
echo "🤖 Starting GitHub Copilot Agent (port 8080)..."
cd "$PROJECT_ROOT/GithubCopilot-agent"
npm run start:server > /tmp/agent-server.log 2>&1 &
AGENT_PID=$!
echo "   Agent started with PID: $AGENT_PID"

# Wait for agent to be ready
echo "   Waiting for agent to start..."
sleep 3

# Check if agent is running
if ! curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "   ❌ Agent failed to start. Check /tmp/agent-server.log"
    kill $MCP_PID $AGENT_PID 2>/dev/null || true
    exit 1
fi
echo "   ✅ Agent is ready"
echo ""

# Open the chatbot
echo "🌐 Opening PostgreSQL Chatbot in browser..."
open "$PROJECT_ROOT/GithubCopilot-agent/examples/postgres-chatbot.html"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All servers are running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Service URLs:"
echo "   • PostgreSQL Chatbot:  file://$PROJECT_ROOT/GithubCopilot-agent/examples/postgres-chatbot.html"
echo "   • Agent API:           http://localhost:8080"
echo "   • MCP Server:          http://localhost:3000"
echo ""
echo "📊 Process IDs:"
echo "   • MCP Server:  $MCP_PID"
echo "   • Agent:       $AGENT_PID"
echo ""
echo "📝 Logs:"
echo "   • MCP Server:  /tmp/mcp-server.log"
echo "   • Agent:       /tmp/agent-server.log"
echo ""
echo "🛑 To stop all servers, run:"
echo "   kill $MCP_PID $AGENT_PID"
echo ""
echo "   Or press Ctrl+C (this will stop both servers)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Save PIDs to file for easy cleanup
echo $MCP_PID > /tmp/chatbot-mcp.pid
echo $AGENT_PID > /tmp/chatbot-agent.pid

# Handle Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $MCP_PID $AGENT_PID 2>/dev/null || true
    rm -f /tmp/chatbot-mcp.pid /tmp/chatbot-agent.pid
    echo "✅ Servers stopped"
    exit 0
}

trap cleanup INT TERM

# Keep script running
echo "💡 Tip: You can close this terminal and servers will keep running."
echo "   Use the kill command above to stop them later."
echo ""
echo "Press Ctrl+C to stop all servers and exit..."
echo ""

wait
