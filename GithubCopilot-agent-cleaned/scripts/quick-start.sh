#!/bin/bash

# Quick Start Script for GitHub Copilot Agent
# This script helps you get started quickly

set -e

echo "GitHub Copilot Agent - Quick Start"
echo "==================================="
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18 or higher is required"
    echo "Current version: $(node -v)"
    exit 1
fi
echo "✓ Node.js version: $(node -v)"
echo ""

# Check if VS Code is installed
echo "Checking VS Code installation..."
if command -v code &> /dev/null; then
    echo "✓ VS Code is installed"
else
    echo "⚠️  Warning: VS Code command not found"
    echo "   Make sure VS Code is installed and 'code' command is in PATH"
fi
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Build the project
echo "Building the project..."
npm run build
echo "✓ Project built successfully"
echo ""

# Run tests
echo "Running tests..."
echo "This will attempt to extract your Claude Code token and test the API connection."
echo ""

if npm test; then
    echo ""
    echo "==================================="
    echo "✓ Setup Complete!"
    echo "==================================="
    echo ""
    echo "Next steps:"
    echo "1. The agent is ready to use"
    echo "2. Run 'npm start' to start the MCP server"
    echo "3. Or configure Claude Desktop (see SETUP.md)"
    echo ""
    echo "For detailed usage examples, see:"
    echo "- README.md"
    echo "- SETUP.md"
    echo "- examples/usage-examples.md"
    echo ""
else
    echo ""
    echo "==================================="
    echo "⚠️  Setup Issues Detected"
    echo "==================================="
    echo ""
    echo "The tests failed. This usually means:"
    echo "1. Claude Code is not installed in VS Code"
    echo "2. You're not logged in to Claude Code"
    echo "3. The token location is different on your system"
    echo ""
    echo "Please:"
    echo "1. Install Claude Code extension in VS Code"
    echo "2. Sign in to your Claude account"
    echo "3. Try running 'npm test' again"
    echo ""
    echo "For help, see SETUP.md"
    echo ""
    exit 1
fi
