#!/bin/bash

# Test script for GitHub Copilot Agent
# This script tests the agent with your MCP server

echo "╔════════════════════════════════════════════════════════╗"
echo "║       GitHub Copilot Agent - Test Suite               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AGENT_URL="http://localhost:3000"

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4

    echo -n "Testing $name... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s "$AGENT_URL$endpoint")
    else
        response=$(curl -s -X POST "$AGENT_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    if [ $? -eq 0 ] && [ ! -z "$response" ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        echo "  Response: ${response:0:100}..."
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        return 1
    fi
}

# Check if agent is running
echo "Checking if agent is running..."
if ! curl -s "$AGENT_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}✗ Agent is not running!${NC}"
    echo ""
    echo "Please start the agent first:"
    echo "  MCP_SERVER_COMMAND=python \\"
    echo "  MCP_SERVER_ARGS=\"../mcp-server/server.py\" \\"
    echo "  npm run start:server"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Agent is running${NC}"
echo ""

# Run tests
echo "Running API tests..."
echo ""

# Test 1: Health check
test_endpoint "Health Check" "GET" "/health"
echo ""

# Test 2: Agent info
test_endpoint "Agent Info" "GET" "/agent/info"
echo ""

# Test 3: List tools
test_endpoint "List Tools" "GET" "/tools"
echo ""

# Test 4: Chat
test_endpoint "Chat" "POST" "/chat" '{"message": "Hello, can you help me?"}'
echo ""

# Test 5: Generate code (will fallback to chat if tool not available)
test_endpoint "Generate Code" "POST" "/generate-code" \
    '{"prompt": "Create a function to add two numbers", "language": "python"}'
echo ""

# Test 6: Explain code
test_endpoint "Explain Code" "POST" "/explain-code" \
    '{"code": "def add(a, b): return a + b"}'
echo ""

echo "╔════════════════════════════════════════════════════════╗"
echo "║       Test Suite Complete                              ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. Open web chatbot: open examples/web-chatbot-rest.html"
echo "2. Try the WebSocket version: open examples/web-chatbot-websocket.html"
echo "3. Check the logs in the agent terminal"
echo ""
