# Documentation Assets

This directory contains screenshots and other documentation assets for the PostgreSQL Chatbot project.

## Screenshots

### screenshot-startup.png
Terminal output from running `./start-all.sh` showing:
- MCP Server starting
- VS Code + Copilot Bridge starting
- Web Server starting
- All services status check
- Success message with instructions

**To capture:**
1. Run `./stop-all.sh` to stop all services
2. Run `./start-all.sh`
3. Take screenshot of terminal showing full output
4. Save as `screenshot-startup.png`

### screenshot-chatbot.png
Main chatbot interface showing:
- Connection status (green "Connected")
- Agent info (localhost:8080)
- Database info (Adventureworks)
- Quick action buttons
- Query results table with employee data
- SQL query viewer (collapsible)
- Natural language input field

**To capture:**
1. Open http://localhost:9000 in browser
2. Click "View Employees" button or type a query
3. Wait for results to display
4. Take screenshot showing the interface with results
5. Save as `screenshot-chatbot.png`

## Current Screenshots

The user has already provided both screenshots - they should be saved in this directory for the README to display them properly.
