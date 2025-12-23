#!/bin/bash

# Install GitHub Copilot Agent to Claude Desktop
# This script automatically configures Claude Desktop to use the agent

set -e

echo "Installing GitHub Copilot Agent to Claude Desktop"
echo "=================================================="
echo ""

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     OS_TYPE=Linux;;
    Darwin*)    OS_TYPE=Mac;;
    *)          OS_TYPE="UNKNOWN:${OS}"
esac

echo "Detected OS: ${OS_TYPE}"
echo ""

# Set config path based on OS
if [ "${OS_TYPE}" == "Mac" ]; then
    CONFIG_DIR="$HOME/Library/Application Support/Claude"
    CONFIG_FILE="${CONFIG_DIR}/claude_desktop_config.json"
elif [ "${OS_TYPE}" == "Linux" ]; then
    CONFIG_DIR="$HOME/.config/Claude"
    CONFIG_FILE="${CONFIG_DIR}/claude_desktop_config.json"
else
    echo "❌ Error: Unsupported operating system: ${OS_TYPE}"
    echo "Please configure manually. See SETUP.md for instructions."
    exit 1
fi

# Create config directory if it doesn't exist
if [ ! -d "${CONFIG_DIR}" ]; then
    echo "Creating Claude config directory..."
    mkdir -p "${CONFIG_DIR}"
    echo "✓ Directory created: ${CONFIG_DIR}"
fi

# Get absolute path to the agent
AGENT_PATH="$(cd "$(dirname "$0")/.." && pwd)/dist/index.js"

if [ ! -f "${AGENT_PATH}" ]; then
    echo "❌ Error: Agent not built yet"
    echo "Please run: npm run build"
    exit 1
fi

echo "Agent path: ${AGENT_PATH}"
echo ""

# Create or update config file
if [ -f "${CONFIG_FILE}" ]; then
    echo "Backing up existing config..."
    cp "${CONFIG_FILE}" "${CONFIG_FILE}.backup"
    echo "✓ Backup created: ${CONFIG_FILE}.backup"
    echo ""

    # Parse existing config and add our server
    echo "Updating existing configuration..."

    # Check if jq is available
    if command -v jq &> /dev/null; then
        # Use jq to properly merge JSON
        jq --arg path "${AGENT_PATH}" \
           '.mcpServers["github-copilot-agent"] = {
              "command": "node",
              "args": [$path]
            }' "${CONFIG_FILE}" > "${CONFIG_FILE}.tmp"
        mv "${CONFIG_FILE}.tmp" "${CONFIG_FILE}"
    else
        echo "⚠️  Warning: jq not found, creating simple config"
        echo "   You may need to manually merge with existing config"
        cat > "${CONFIG_FILE}" <<EOF
{
  "mcpServers": {
    "github-copilot-agent": {
      "command": "node",
      "args": [
        "${AGENT_PATH}"
      ]
    }
  }
}
EOF
    fi
else
    echo "Creating new configuration file..."
    cat > "${CONFIG_FILE}" <<EOF
{
  "mcpServers": {
    "github-copilot-agent": {
      "command": "node",
      "args": [
        "${AGENT_PATH}"
      ]
    }
  }
}
EOF
fi

echo "✓ Configuration updated"
echo ""

echo "=================================================="
echo "✓ Installation Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Restart Claude Desktop completely"
echo "2. The GitHub Copilot Agent tools should now be available"
echo ""
echo "To verify the installation:"
echo "- Open Claude Desktop"
echo "- Try: 'Can you list the available tools?'"
echo "- You should see tools like 'generate_code', 'explain_code', etc."
echo ""
echo "Configuration file: ${CONFIG_FILE}"
echo ""
