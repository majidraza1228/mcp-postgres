#!/bin/bash

# Quick start script for GitHub Copilot Agent with your MCP server

echo "╔════════════════════════════════════════════════════════╗"
echo "║   GitHub Copilot Agent - Quick Start                  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if built
if [ ! -d "dist" ]; then
    echo "Building agent..."
    npm run build
    echo ""
fi

# Check if MCP server is already running
if pgrep -f "server.py" > /dev/null; then
    echo "MCP server is already running. Skipping MCP server startup."
else
    # Start with your Python MCP server
    echo "Starting agent with Python MCP server..."
    echo "MCP Server: ../mcp-server/server.py"
    echo ""

    # Start the MCP server
    python ../mcp-server/server.py &
    MCP_SERVER_PID=$!

    # Ensure MCP server stops when the script exits
    trap "kill $MCP_SERVER_PID" EXIT
fi

# Start the GitHub Copilot Agent
npm run start
