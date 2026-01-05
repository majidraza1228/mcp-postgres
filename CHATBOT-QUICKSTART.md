# PostgreSQL Web Chatbot - Quick Start Guide

This guide will help you run the standalone PostgreSQL web chatbot without VS Code.

## What You Have

A complete web-based chatbot system that lets you interact with your PostgreSQL database using natural language:

```
Web Browser (Chatbot) → GitHub Copilot Agent (Port 8080) → PostgreSQL MCP Server (Port 3000) → PostgreSQL Database
```

## Quick Start

### 1. Start the PostgreSQL MCP Server

Open a terminal and run:

```bash
cd /Users/syedraza/postgres-mcp/mcp-server
./venv/bin/python server.py
```

You should see:
```
✅ Connected to PostgreSQL database: Adventureworks
INFO:     Uvicorn running on http://127.0.0.1:3000
```

### 2. Start the GitHub Copilot Agent

Open another terminal and run:

```bash
cd /Users/syedraza/postgres-mcp/GithubCopilot-agent
npm run start:server
```

You should see:
```
╔════════════════════════════════════════════════════════╗
║    GitHub Copilot Agent with LLM Started              ║
╠════════════════════════════════════════════════════════╣
║  HTTP Server:      http://localhost:8080              ║
║  WebSocket:        ws://localhost:8080                ║
║  MCP Server:       http://localhost:3000              ║
╚════════════════════════════════════════════════════════╝
```

### 3. Open the Web Chatbot

**Option 1: PostgreSQL-Specific Chatbot (Recommended)**
```bash
open /Users/syedraza/postgres-mcp/GithubCopilot-agent/examples/postgres-chatbot.html
```

**Option 2: General REST Chatbot**
```bash
open /Users/syedraza/postgres-mcp/GithubCopilot-agent/examples/web-chatbot-rest.html
```

**Option 3: WebSocket Chatbot**
```bash
open /Users/syedraza/postgres-mcp/GithubCopilot-agent/examples/web-chatbot-websocket.html
```

## Using the Chatbot

### PostgreSQL Chatbot Features

The PostgreSQL chatbot (`postgres-chatbot.html`) includes:

- 🎯 **Quick Actions** - Pre-built buttons for common tasks
- 📊 **Smart Table Formatting** - Query results display as beautiful tables
- 🔍 **Database Status** - Shows connected database and available tools
- 💬 **Natural Language** - Ask questions in plain English

### Example Questions to Try

1. **List tables:**
   - "List all tables"
   - "Show me all tables"
   - "What tables are available?"

2. **Query data:**
   - "Show me all employees"
   - "Get data from the employees table"
   - "SELECT * FROM employees LIMIT 10"

3. **Table structure:**
   - "Describe the employees table"
   - "Show structure of employees table"
   - "What columns are in the employees table?"

4. **Create tables:**
   - "Create a table for storing customer orders"
   - "Make a table called products with name and price columns"

5. **Indexes:**
   - "Show indexes for the employees table"
   - "List all indexes"

### Quick Action Buttons

Click these buttons for instant actions:
- 📋 **List Tables** - Show all database tables
- 🏗️ **Table Structures** - Display table schemas
- 👥 **View Employees** - Query the employees table
- ❓ **Available Tables** - List available tables
- 🔍 **Show Indexes** - Display table indexes

## Available MCP Tools

Your chatbot has access to these PostgreSQL tools:

1. **query_database** - Execute SELECT queries
2. **execute_sql** - Run INSERT, UPDATE, DELETE, CREATE statements
3. **create_table** - Create new tables
4. **create_stored_procedure** - Create stored procedures
5. **list_tables** - List all tables in schema
6. **describe_table** - Get table structure
7. **get_table_indexes** - Show table indexes
8. **analyze_query_plan** - Analyze query execution plans

## API Endpoints

If you want to integrate with your own application:

### Health Check
```bash
curl http://localhost:8080/health
```

### List Available Tools
```bash
curl http://localhost:8080/tools
```

### Query Database
```bash
curl -X POST http://localhost:8080/tool/query_database \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM employees LIMIT 5"}'
```

### List Tables
```bash
curl -X POST http://localhost:8080/tool/list_tables \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Chat (Natural Language)
```bash
curl -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me all tables in the database"}'
```

## Troubleshooting

### "Disconnected" status in chatbot

**Check if servers are running:**
```bash
# Check MCP server
curl http://localhost:3000/health

# Check Agent server
curl http://localhost:8080/health
```

**Restart servers if needed:**
```bash
# Stop with Ctrl+C, then restart as shown in Quick Start
```

### Port already in use

**Find and kill process:**
```bash
# For port 3000
lsof -ti:3000 | xargs kill

# For port 8080
lsof -ti:8080 | xargs kill
```

### Database connection failed

**Check PostgreSQL is running:**
```bash
# Check if postgres is running
ps aux | grep postgres

# Test connection
psql -h localhost -p 5431 -U postgres -d Adventureworks
```

**Check .env file in mcp-server:**
```bash
cat /Users/syedraza/postgres-mcp/mcp-server/.env
```

Should contain:
```
DB_HOST=localhost
DB_PORT=5431
DB_NAME=Adventureworks
DB_USER=postgres
DB_PASSWORD=your_password
```

## Running Both Servers in One Command

Create a startup script:

```bash
#!/bin/bash
# Save as: start-chatbot.sh

echo "Starting PostgreSQL MCP Server..."
cd /Users/syedraza/postgres-mcp/mcp-server
./venv/bin/python server.py &
MCP_PID=$!

sleep 3

echo "Starting GitHub Copilot Agent..."
cd /Users/syedraza/postgres-mcp/GithubCopilot-agent
npm run start:server &
AGENT_PID=$!

sleep 2

echo "Opening chatbot..."
open /Users/syedraza/postgres-mcp/GithubCopilot-agent/examples/postgres-chatbot.html

echo ""
echo "✅ All servers started!"
echo "MCP Server PID: $MCP_PID"
echo "Agent Server PID: $AGENT_PID"
echo ""
echo "To stop servers:"
echo "  kill $MCP_PID $AGENT_PID"

# Wait for Ctrl+C
trap "kill $MCP_PID $AGENT_PID; exit" INT
wait
```

Make it executable:
```bash
chmod +x start-chatbot.sh
./start-chatbot.sh
```

## Architecture Overview

```
┌─────────────────────────────────────────┐
│     Web Browser (You)                   │
│     - PostgreSQL Chatbot UI             │
│     - No installation needed            │
│     - Works on any device               │
└─────────────────┬───────────────────────┘
                  │ HTTP/WebSocket
                  │ localhost:8080
┌─────────────────▼───────────────────────┐
│   GitHub Copilot Agent                  │
│   - Port: 8080                          │
│   - Provides REST/WebSocket API         │
│   - Routes requests to MCP server       │
└─────────────────┬───────────────────────┘
                  │ HTTP
                  │ localhost:3000
┌─────────────────▼───────────────────────┐
│   PostgreSQL MCP Server                 │
│   - Port: 3000                          │
│   - FastAPI application                 │
│   - Provides database tools             │
└─────────────────┬───────────────────────┘
                  │ PostgreSQL Protocol
                  │ localhost:5431
┌─────────────────▼───────────────────────┐
│   PostgreSQL Database                   │
│   - Database: Adventureworks            │
│   - Tables: employees, products, etc.   │
└─────────────────────────────────────────┘
```

## Benefits of This Setup

✅ **No VS Code Required** - Just open the HTML file in any browser
✅ **No Installation** - Everything runs in the browser
✅ **Cross-Platform** - Works on Mac, Windows, Linux
✅ **Mobile-Friendly** - Responsive design works on phones/tablets
✅ **Secure** - Runs locally, data never leaves your machine
✅ **Extensible** - Easy to customize the HTML/CSS/JavaScript
✅ **Multi-User** - Share the URL with team members on your network

## Next Steps

1. **Customize the chatbot** - Edit the HTML files to match your brand
2. **Add authentication** - Secure the agent with API keys
3. **Deploy to production** - Host on a server for team access
4. **Add more tools** - Extend the MCP server with custom tools
5. **Create mobile app** - Use the REST API to build native apps

## Support

For issues or questions:
- Check logs in the terminal where servers are running
- Test endpoints with curl commands above
- Review the TESTING.md in GithubCopilot-agent folder
