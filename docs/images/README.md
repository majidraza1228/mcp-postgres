# Images Directory

This directory contains screenshots and visual assets for the PostgreSQL MCP project documentation.

## Required Screenshot

### Popup Chatbot Screenshot

**File**: `popup-chatbot-screenshot.png`

**Description**: Screenshot showing the web chatbot popup widget with:
- Floating chat button in bottom-right corner
- Popup window displaying chat interface
- MCP connection status banner
- Example query with SQL and results
- Connection info (database name, host, port)

**How to Create**:
1. Start all services (VS Code extension, MCP server, Web chatbot)
2. Open browser to `http://localhost:8080`
3. Click the floating chat button to open popup
4. Send a query (e.g., "Show all tables")
5. Wait for results to display
6. Take screenshot showing the complete popup with results
7. Save as `popup-chatbot-screenshot.png` in this directory

**Dimensions**: Should capture the popup (420x600px) plus some surrounding context

**Current Status**:
- ⚠️ Screenshot needs to be added to this directory
- Referenced in: `web-chatbot/README.md` (line 7)
- Referenced in: `web-chatbot/SCREENSHOT_GUIDE.md`

## Screenshot Guidelines

When adding screenshots:
- Use PNG format for crisp quality
- Include enough context to show feature clearly
- Avoid showing sensitive data (passwords, real customer data, etc.)
- Keep file sizes reasonable (compress if needed)
- Use descriptive filenames

## Additional Screenshots (Optional)

Consider adding:
- `chatbot-closed.png` - Just the floating button
- `chatbot-disconnected.png` - Showing disconnected status
- `chatbot-complex-query.png` - JOIN query with multiple tables
- `status-modal.png` - Detailed system status view
- `vscode-extension.png` - VS Code extension in action
- `mcp-server-running.png` - MCP server console output

---

**Note**: The popup chatbot screenshot from the user's message should be saved here as `popup-chatbot-screenshot.png` for proper documentation linking.
