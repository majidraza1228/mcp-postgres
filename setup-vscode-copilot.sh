#!/bin/bash
# Setup GitHub Copilot to use PostgreSQL MCP Server in VS Code

set -e

echo "🚀 Setting up GitHub Copilot + PostgreSQL MCP Server"
echo ""

# Define paths
PROJECT_ROOT="/Users/syedraza/postgres-mcp"
VSCODE_SETTINGS="$HOME/Library/Application Support/Code/User/settings.json"
PYTHON_PATH="$PROJECT_ROOT/mcp-server/venv/bin/python"
STDIO_SERVER="$PROJECT_ROOT/mcp-server/stdio_server.py"

# Test stdio server
echo "📝 Testing stdio server..."
if echo '{"method":"initialize","id":1}' | "$PYTHON_PATH" "$STDIO_SERVER" 2>/dev/null | grep -q "postgres-mcp"; then
    echo "   ✅ Stdio server works!"
else
    echo "   ❌ Stdio server test failed"
    echo "   Please check the server configuration"
    exit 1
fi
echo ""

# Check if VS Code settings exists
if [ ! -f "$VSCODE_SETTINGS" ]; then
    echo "📁 Creating VS Code settings file..."
    mkdir -p "$(dirname "$VSCODE_SETTINGS")"
    echo '{}' > "$VSCODE_SETTINGS"
fi

# Backup existing settings
echo "💾 Backing up VS Code settings..."
cp "$VSCODE_SETTINGS" "$VSCODE_SETTINGS.backup.$(date +%Y%m%d_%H%M%S)"
echo "   Backup saved to: $VSCODE_SETTINGS.backup.*"
echo ""

# Add MCP configuration
echo "⚙️  Adding MCP configuration to VS Code settings..."

# Read current settings
CURRENT_SETTINGS=$(cat "$VSCODE_SETTINGS")

# Create new settings with MCP config
cat > /tmp/vscode-settings-temp.json << EOF
{
  "github.copilot.chat.mcpServers": {
    "postgres-mcp": {
      "command": "$PYTHON_PATH",
      "args": ["$STDIO_SERVER"]
    }
  }
}
EOF

# Merge settings (simple approach - will overwrite if github.copilot.chat.mcpServers exists)
if echo "$CURRENT_SETTINGS" | grep -q "github.copilot.chat.mcpServers"; then
    echo "   ⚠️  Warning: MCP configuration already exists in settings"
    echo "   Please manually update: $VSCODE_SETTINGS"
    echo ""
    echo "   Add this configuration:"
    cat /tmp/vscode-settings-temp.json
else
    # Simple merge (add to existing JSON)
    python3 << 'PYTHON_SCRIPT'
import json
import sys

settings_file = sys.argv[1]
new_config_file = sys.argv[2]

# Read existing settings
with open(settings_file, 'r') as f:
    settings = json.load(f)

# Read new config
with open(new_config_file, 'r') as f:
    new_config = json.load(f)

# Merge
settings.update(new_config)

# Write back
with open(settings_file, 'w') as f:
    json.dump(settings, f, indent=2)

print("✅ Configuration added successfully!")
PYTHON_SCRIPT
python3 -c "import json, sys; \
settings_file = '$VSCODE_SETTINGS'; \
new_config_file = '/tmp/vscode-settings-temp.json'; \
settings = json.load(open(settings_file)); \
new_config = json.load(open(new_config_file)); \
settings.update(new_config); \
json.dump(settings, open(settings_file, 'w'), indent=2); \
print('   ✅ Configuration added successfully!')"
fi

rm -f /tmp/vscode-settings-temp.json

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Next Steps:"
echo ""
echo "   1. Restart VS Code"
echo "   2. Open GitHub Copilot Chat (Cmd+Shift+I)"
echo "   3. Try: @workspace List all tables in the database"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Example Queries:"
echo ""
echo "   @workspace List all tables"
echo "   @workspace Show me the employees table structure"
echo "   @workspace Query employees in Engineering department"
echo "   @workspace Create a new table for customer orders"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Documentation:"
echo "   Complete guide: $PROJECT_ROOT/GITHUB-COPILOT-SETUP-COMPLETE.md"
echo ""
echo "🔧 Troubleshooting:"
echo "   If it doesn't work, check VS Code Output panel:"
echo "   View → Output → Select 'GitHub Copilot' from dropdown"
echo ""
