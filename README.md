# PostgreSQL Chatbot with GitHub Copilot

Query your PostgreSQL database using natural language through a web interface powered by GitHub Copilot.

---

## 🚀 Quick Start

**One-command startup:**

```bash
./start-all.sh
```

This single script will:
1. ✅ Start MCP Server (port 3000)
2. ✅ Start VS Code + Copilot Bridge (port 9001) - minimized in background
3. ✅ Start Web Server (port 9000)
4. ✅ Open chatbot in your browser automatically

**Want detailed setup instructions?** → Read **[SETUP.md](SETUP.md)**

---

## What You Get

✅ **Web-based chatbot** - Query your database from a browser
✅ **GitHub Copilot powered** - Uses GPT-4 for SQL generation
✅ **Natural language** - Ask questions in plain English
✅ **No coding required** - Just type and get results
✅ **Table visualization** - See results in formatted tables

---

## Architecture

```
Web Browser → VS Code Extension → GitHub Copilot (GPT-4) → MCP Server → PostgreSQL
```

**Components:**
- **Web Interface** (`index.html`) - Chat with your database
- **VS Code Extension** - Middleware between web and GitHub Copilot
- **MCP Server** - PostgreSQL connector with 8 database tools
- **GitHub Copilot** - Natural language to SQL conversion

---

## Requirements

- VS Code installed
- GitHub Copilot subscription
- PostgreSQL database
- Python 3.9+

---

## Example Queries

```
"Show me all tables"
"List employees with salary above 70000"
"What is the average salary by department?"
"Show me the top 5 highest rated products"
"How many orders were placed last month?"
```

---

## Installation

**Full installation guide:** [SETUP.md](SETUP.md)

**Quick setup:**

1. **Install dependencies:**
   ```bash
   # Python dependencies
   pip3 install fastapi uvicorn asyncpg python-dotenv

   # Node.js (for web server) - should already be installed
   ```

2. **Configure database:**
   ```bash
   # Edit mcp-server/.env with your database credentials
   nano mcp-server/.env
   ```

3. **Install VS Code extension:**
   ```bash
   code --install-extension copilot-web-bridge/copilot-web-bridge-1.0.0.vsix
   ```

4. **Start everything:**
   ```bash
   ./start-all.sh
   ```

   The chatbot will open automatically in your browser!

**To stop all services:**
```bash
./stop-all.sh
```

---

## How It Works

1. **User types question** in web browser
2. **Web page sends request** to VS Code extension (localhost:9000)
3. **Extension calls GitHub Copilot** to generate SQL
4. **SQL executed** via MCP Server (localhost:3000)
5. **Results displayed** in formatted table with summary

---

## File Structure

```
postgres-mcp/
├── index.html                          # Web chatbot interface
├── SETUP.md                            # Complete setup guide
├── copilot-web-bridge/                 # VS Code extension
│   ├── copilot-web-bridge-1.0.0.vsix  # Extension installer
│   └── src/extension.ts                # Extension code
└── mcp-server/                         # PostgreSQL MCP Server
    ├── server.py                       # HTTP server
    ├── stdio_server.py                 # Stdio version
    └── config.py                       # Database config
```

---

## Available Database Tools

The MCP server provides 8 tools for database operations:

- `query_database` - Execute SELECT queries
- `execute_sql` - Run INSERT/UPDATE/DELETE
- `list_tables` - List all tables
- `describe_table` - Get table structure
- `get_table_indexes` - View indexes
- `analyze_query_plan` - EXPLAIN queries
- `create_table` - Create new tables
- `create_stored_procedure` - Create procedures

---

## Important Notes

⚠️ **VS Code must stay open** - The extension runs inside VS Code
⚠️ **GitHub Copilot required** - Active subscription needed
⚠️ **Local only** - Web interface only works on localhost

---

## Troubleshooting

**Web page won't connect?**
- Check VS Code is running
- Run: `Copilot Web Bridge: Start Server` in VS Code

**Database errors?**
- Verify config.py has correct credentials
- Check PostgreSQL is running
- Test: `curl http://localhost:3000/health`

**Full troubleshooting guide:** [SETUP.md](SETUP.md#troubleshooting)

---

## Screenshots

### Startup - All Services Running

When you run `./start-all.sh`, all three services start automatically:

![All Services Running](docs/screenshot-startup.png)

The script:
- ✅ Starts MCP Server in background
- ✅ Starts VS Code minimized (you won't see it)
- ✅ Starts Web Server
- ✅ Opens chatbot automatically

### Chatbot Interface

The PostgreSQL AI Assistant provides a clean, intuitive interface for querying your database:

![PostgreSQL AI Assistant](docs/screenshot-chatbot.png)

**Features shown:**
- ✅ **Connection Status** - Real-time status indicator (Connected/Disconnected)
- 🔌 **Agent Info** - Shows server endpoint (localhost:8080)
- 🗄️ **Database Info** - Connected database name and details
- 📊 **Quick Actions** - Predefined buttons for common queries:
  - List Tables
  - Table Structures
  - View Employees
  - Available Tables
  - Show Indexes
- 💬 **Natural Language Input** - Ask questions in plain English
- 📋 **Query Results** - Beautiful table display with row counts
- 🔍 **SQL Query Viewer** - Expandable section to see generated SQL
- 📈 **AI Summary** - Copilot-generated explanation of results

### Example Query Results

When you ask "Show Indexes", the chatbot:
1. Generates the appropriate SQL query
2. Executes it against your database
3. Displays results in a formatted table
4. Shows the SQL query used (expandable)

The interface handles all types of queries - from simple table listings to complex analytical queries.

---

## Support

📖 **Documentation:** [SETUP.md](SETUP.md)
🐛 **Issues:** Check extension output panel
💬 **Questions:** Review troubleshooting section

---

**Start querying your database with natural language! 🎉**
