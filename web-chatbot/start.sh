#!/bin/bash

# PostgreSQL MCP Web Chatbot Startup Script

echo "🚀 Starting PostgreSQL MCP Web Chatbot..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js found: $(node --version)"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✓ Dependencies installed"
fi

# Check if Copilot proxy is running
echo ""
echo "🔍 Checking GitHub Copilot proxy..."
if curl -s http://localhost:9000/health > /dev/null 2>&1; then
    echo "✓ Copilot proxy is running (port 9000)"
else
    echo "⚠️  Warning: Copilot proxy not responding on port 9000"
    echo "   Make sure VS Code is running with PostgreSQL MCP extension"
fi

# Check if MCP server is running
echo ""
echo "🔍 Checking MCP server..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✓ MCP server is running (port 3000)"
else
    echo "⚠️  Warning: MCP server not responding on port 3000"
    echo "   Start it with: cd mcp-server && python server.py"
fi

# Start web chatbot server
echo ""
echo "🌐 Starting web chatbot server..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PostgreSQL MCP Web Chatbot"
echo "  URL: http://localhost:8080"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
