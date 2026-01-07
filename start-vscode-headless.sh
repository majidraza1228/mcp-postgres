#!/bin/bash
# Start VS Code in background on macOS
# Minimizes window and hides it from view

echo "🚀 Starting VS Code in background mode..."
echo ""

# Open VS Code workspace
echo "1. Opening VS Code with workspace..."
open -a "Visual Studio Code" /Users/syedraza/mcp-postgres

# Wait for VS Code to fully load
echo "2. Waiting for VS Code to load (10 seconds)..."
sleep 10

# Minimize and hide VS Code window using AppleScript
echo "3. Minimizing VS Code window..."
osascript <<EOF
tell application "System Events"
    tell process "Visual Studio Code"
        set visible to false
        set frontmost to false
    end tell
end tell
tell application "Visual Studio Code"
    set miniaturized of every window to true
end tell
EOF

# Wait for extension to activate
echo "4. Waiting for Copilot Bridge extension to start..."
sleep 5

# Check if Copilot Bridge started on port 9001
echo "5. Checking Copilot Bridge status..."
if lsof -i :9001 > /dev/null 2>&1; then
    echo "   ✅ Copilot Bridge is running on port 9001"
    if curl -s http://localhost:9001/health | grep -q "ok"; then
        echo "   ✅ Health check passed"
    else
        echo "   ⚠️  Port is listening but health check failed"
    fi
else
    echo "   ⚠️  Copilot Bridge not detected on port 9001 yet"
    echo "   Waiting 10 more seconds..."
    sleep 10
    if lsof -i :9001 > /dev/null 2>&1; then
        echo "   ✅ Copilot Bridge is now running"
    else
        echo "   ❌ Copilot Bridge failed to start"
        echo ""
        echo "   Troubleshooting:"
        echo "   1. Un-minimize VS Code from Dock"
        echo "   2. Press Cmd+Shift+P"
        echo "   3. Type: 'Copilot Web Bridge: Start Server'"
        echo "   4. Check View → Output → 'Copilot Web Bridge' for errors"
        exit 1
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "VS Code is now running minimized in the background"
echo "• Copilot Bridge: http://localhost:9001"
echo "• The window is hidden but you can see it in Dock"
echo "• Un-minimize from Dock if you need to access VS Code"
echo ""
echo "Commands:"
echo "  Check status:  lsof -i :9001"
echo "  Test bridge:   curl http://localhost:9001/health"
echo "  Stop VS Code:  osascript -e 'quit app \"Visual Studio Code\"'"
echo ""
