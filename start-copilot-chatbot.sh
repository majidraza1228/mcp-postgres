#!/bin/bash

echo "🚀 Starting PostgreSQL Chatbot with GitHub Copilot..."

# Start MCP Server
cd /Users/syedraza/postgres-mcp/mcp-server
echo "📊 Starting PostgreSQL MCP Server on port 3000..."
nohup python3 server.py > /tmp/mcp-server.log 2>&1 &
MCP_PID=$!
echo "   MCP Server PID: $MCP_PID"

# Wait for MCP server to be ready
sleep 3

# Check MCP server
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "   ✅ MCP Server is running"
else
    echo "   ❌ MCP Server failed to start"
    exit 1
fi

echo ""
echo "⚠️  IMPORTANT: You must complete these steps in VS Code:"
echo ""
echo "1. Reload VS Code:"
echo "   - Press Cmd+Shift+P"
echo "   - Type: Developer: Reload Window"
echo "   - Press Enter"
echo ""
echo "2. Start Copilot Web Bridge:"
echo "   - Press Cmd+Shift+P"
echo "   - Type: Copilot Web Bridge: Start Server"
echo "   - Press Enter"
echo "   - Wait for message: 'Copilot Web Bridge started on http://localhost:9000'"
echo ""
echo "3. Then run this command to open the chatbot:"
echo "   open /Users/syedraza/postgres-mcp/GithubCopilot-agent/examples/postgres-chatbot-copilot.html"
echo ""
echo "📝 Architecture:"
echo "   Web Page (port 9000) → VS Code Extension → GitHub Copilot → MCP Server (port 3000) → PostgreSQL"
echo ""
