# PostgreSQL MCP Server

**Natural Language PostgreSQL Queries with LLM Integration**

Query your PostgreSQL database using plain English powered by GitHub Copilot. Create tables, views, stored procedures, and execute complex queries without writing SQL.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8%2B-blue)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)

---

## 🚀 Quick Start

**30 seconds to natural language SQL:**

```bash
# 1. Clone and install
git clone https://github.com/syedmajidraza/mcp-postgres.git
cd mcp-postgres
./install.sh

# 2. Configure database
nano ~/.postgres-mcp/mcp-server/.env

# 3. Install VS Code extension
# Cmd+Shift+P → "Extensions: Install from VSIX" → Select .vsix file

# 4. Start using
# Open Copilot Chat: @postgres show tables
```

📖 **Detailed Guide:** [Developer Quick Start](docs/DEVELOPER_QUICK_START.md)

---

## ✨ Features

### Core Features
- 🤖 **Natural Language to SQL** - Ask questions in plain English, powered by GitHub Copilot LLM
- 🔧 **8 PostgreSQL Tools** - Complete database operations via MCP protocol
- 🎛️ **VS Code Extension** - Start/stop/status controls with status bar integration
- 🌐 **Web Chatbot** - Popup chat widget for users without VS Code - [See Demo](web-chatbot/README.md)
- 🧠 **Schema-Aware** - LLM knows your actual table and column names
- 📊 **Complex Queries** - Handles JOINs, subqueries, aggregations, and analytics
- 🛠️ **Database Development** - Create tables, indexes, procedures, functions, triggers, and views
- 🛡️ **Transparent & Safe** - Shows generated SQL before execution
- 🔌 **MCP Connection Status** - Real-time display of database connection info
- 🎨 **Cross-Platform** - macOS, Linux, and Windows support

### NEW! Inline Mode 🎉
- ⚡ **Context-Aware Completions** - Get intelligent SQL suggestions while typing
- 📝 **Schema Integration** - Auto-complete with your actual database schema
- 🔧 **Stored Procedure Support** - Generate PL/pgSQL functions and procedures
- 🎯 **Smart Triggers** - Automatic detection of SQL keywords (CREATE, SELECT, INSERT, etc.)
- ⚙️ **Performance Optimized** - Schema caching for fast, responsive suggestions
- 📖 **[Quick Start Guide](vscode-extension/INLINE_MODE_QUICKSTART.md)**

---

## 📖 Documentation

### **Getting Started**
| Document | Description |
|----------|-------------|
| [🚀 Developer Quick Start](docs/DEVELOPER_QUICK_START.md) | 30-second installation and first query |
| [💡 Usage Examples](docs/USAGE_EXAMPLES.md) | Complete query examples for all features |
| [📘 Quick Reference](docs/QUICK_REFERENCE.md) | Everything you need to know in one page |
| [🧪 Testing Guide](docs/TESTING_GUIDE.md) | Comprehensive testing instructions |

### **Inline Mode (NEW!)**
| Document | Description |
|----------|-------------|
| [⚡ Inline Mode Quick Start](vscode-extension/INLINE_MODE_QUICKSTART.md) | Get started with inline completions in 30 seconds |
| [📖 Inline Mode Guide](vscode-extension/INLINE_MODE_GUIDE.md) | Complete guide to inline mode features |
| [📋 Inline Mode Cheat Sheet](vscode-extension/INLINE_MODE_CHEATSHEET.md) | Quick reference card for inline completions |
| [🏗️ Inline Mode Architecture](vscode-extension/ARCHITECTURE_INLINE_MODE.md) | Technical architecture and implementation details |

### **Database Development**
| Document | Description |
|----------|-------------|
| [🗂️ DDL Examples](docs/DDL_EXAMPLES.md) | 40+ examples: tables, indexes, procedures, functions, triggers, views |
| [⚡ Database Development Guide](docs/DATABASE_DEVELOPMENT_IMPROVEMENTS.md) | Technical enhancements for production DDL operations |

### **Technical Documentation**
| Document | Description |
|----------|-------------|
| [🏗️ Architecture](docs/LLM_ENHANCED_GUIDE.md) | How LLM integration works with GitHub Copilot |
| [📋 Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md) | Complete implementation overview |
| [🔧 MCP Protocol Guide](docs/MCP_FASTAPI_IMPLEMENTATION_GUIDE.md) | MCP protocol implementation & LLM integration |
| [⚖️ FastAPI-MCP Library Comparison](docs/FASTAPI_MCP_LIBRARY_COMPARISON.md) | Custom vs library approach analysis |
| [📁 Folder Structure](docs/FOLDER_STRUCTURE.md) | Project organization and automated workflows |
| [🎯 Model Selection](docs/MODEL_SELECTION_ANALYSIS.md) | GitHub Copilot model selection and preferences |

### **Distribution & Publishing**
| Document | Description |
|----------|-------------|
| [📦 Distribution Guide](docs/DISTRIBUTION_GUIDE.md) | Share with your team (network/web/git) |
| [🌐 Registry Publishing](docs/REGISTRY_PUBLISHING_GUIDE.md) | Publish to internal MCP registry |
| [🔄 Quick Update Instructions](docs/QUICK_UPDATE_INSTRUCTIONS.md) | How to quickly update the package |

### **Web Chatbot (NEW!)**
| Document | Description |
|----------|-------------|
| [🌐 Web Chatbot](web-chatbot/README.md) | Popup chat widget for non-VS Code users |
| [📸 Screenshot Guide](web-chatbot/SCREENSHOT_GUIDE.md) | Visual overview and features |
| [🔄 Upgrade Guide](web-chatbot/UPGRADE_GUIDE.md) | Migrating from full-page to popup |
| [📝 Implementation Details](web-chatbot/POPUP_CHATBOT_CHANGES.md) | Technical changes in v2.0 |

### **Additional Resources**
| Document | Description |
|----------|-------------|
| [🤝 Contributing](docs/CONTRIBUTING.md) | Contribution guidelines |
| [🐛 Bug Fixes & Improvements](docs/BUGFIX_NATURAL_LANGUAGE_ROUTING.md) | Natural language routing fixes |
| [🔍 SQL Detection Analysis](docs/SQL_DETECTION_ANALYSIS.md) | Complete SQL statement detection coverage |
| [✅ SQL Detection Tests](docs/SQL_DETECTION_TEST_CASES.md) | Test cases for SQL detection |

---

## 🎯 Example Queries

### Natural Language Queries
```
@postgres what's the minimum salary of employees?
@postgres show employees earning more than average salary
@postgres create a table for product reviews with ratings
@postgres find duplicate emails in the users table
@postgres show top 10 products by revenue this month
@postgres create a stored procedure to calculate shipping cost
@postgres analyze the query plan for my slow query
```

### Direct SQL
```sql
-- Just type SQL directly - it's detected automatically
SELECT * FROM employees WHERE salary > 70000

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) CHECK (price >= 0)
)

CREATE OR REPLACE FUNCTION calculate_bonus(emp_id INTEGER)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (SELECT salary * 0.10 FROM employees WHERE id = emp_id);
END;
$$
```

📚 **More Examples:**
- [Usage Examples](docs/USAGE_EXAMPLES.md) - Basic query examples
- [DDL Examples](docs/DDL_EXAMPLES.md) - 40+ database development examples
- [Quick Reference](docs/QUICK_REFERENCE.md) - Comprehensive quick reference

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│              VS Code                        │
│  ┌───────────────────────────────────────┐ │
│  │  PostgreSQL MCP Extension             │ │
│  │  - Natural Language Input             │ │
│  │  - GitHub Copilot LLM (vscode.lm API) │ │
│  │  - Start/Stop/Status Controls         │ │
│  └─────────────────┬─────────────────────┘ │
└────────────────────┼───────────────────────┘
                     │ HTTP (port 3000)
                     ▼
      ┌──────────────────────────────────┐
      │   MCP Server (FastAPI)           │
      │   - 8 PostgreSQL Tools           │
      │   - Schema Discovery             │
      │   - Query Execution              │
      └────────────┬─────────────────────┘
                   │ asyncpg
                   ▼
        ┌────────────────────────┐
        │   PostgreSQL Database  │
        └────────────────────────┘
```

📖 **Detailed Architecture:** [LLM Enhanced Guide](docs/LLM_ENHANCED_GUIDE.md)

---

## 🛠️ Components

### **1. MCP Server** (`mcp-server/`)
- **Technology:** Python 3.8+, FastAPI, asyncpg
- **Port:** 3000 (configurable)
- **Tools:** 8 MCP tools for database operations
- **Docs:** [mcp-server/README.md](mcp-server/README.md)

### **2. VS Code Extension** (`vscode-extension/`)
- **Technology:** TypeScript, VS Code Extension API
- **Integration:** GitHub Copilot via `vscode.lm` API
- **Features:**
  - Chat participant `@postgres` for natural language queries
  - Inline completion provider with schema context
  - Server management and status monitoring
- **Docs:** [vscode-extension/README.md](vscode-extension/README.md)

### **3. Distribution Package** (`postgres-mcp-package/`)
- **Auto-generated** by `./create-package.sh`
- Contains: MCP server, extension, docs, installers
- **Output:** `postgres-mcp-v1.0.0.tar.gz`

📁 **Full Structure:** [Folder Structure](docs/FOLDER_STRUCTURE.md)

---

## 📦 Installation

### **Option 1: Automated Install (Recommended)**

```bash
# Clone repository
git clone https://github.com/syedmajidraza/mcp-postgres.git
cd mcp-postgres

# Run installer (macOS/Linux)
./install.sh

# Windows
.\install.ps1
```

### **Option 2: From Distribution Package**

```bash
# Download and extract
tar -xzf postgres-mcp-v1.0.0.tar.gz
cd postgres-mcp-package
./install.sh
```

### **Post-Installation**

1. **Configure Database:**
   ```bash
   nano ~/.postgres-mcp/mcp-server/.env
   ```
   Update: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

2. **Install VS Code Extension:**
   - Open VS Code
   - `Cmd+Shift+P` → "Extensions: Install from VSIX"
   - Select `postgres-mcp-copilot-1.0.0.vsix`

3. **Reload VS Code:**
   - `Cmd+Shift+P` → "Developer: Reload Window"

📖 **Complete Guide:** [Developer Quick Start](docs/DEVELOPER_QUICK_START.md)

---

## 🎛️ VS Code Extension Features

### **Two Modes of Operation**

#### 1. Chat Mode
Use `@postgres` in GitHub Copilot Chat to ask database questions in natural language:
- Execute queries and view results
- Create tables, procedures, and functions
- Get schema information
- Analyze query plans

#### 2. Inline Mode (NEW!)
Get real-time, context-aware SQL completions while editing `.sql` files:
- Type `CREATE FUNCTION my_function(` and press Tab
- Auto-complete with parameters and function body
- Uses your actual database schema for suggestions
- Works for CREATE TABLE, SELECT, INSERT, and more

📖 **[Inline Mode Quick Start](vscode-extension/INLINE_MODE_QUICKSTART.md)**

### **Commands** (Access via `Cmd+Shift+P` / `Ctrl+Shift+P`)

- `PostgreSQL MCP: Start Server` - Start the MCP server
- `PostgreSQL MCP: Stop Server` - Stop the MCP server
- `PostgreSQL MCP: Restart Server` - Restart the MCP server
- `PostgreSQL MCP: Show Server Status` - Display server and DB status
- `PostgreSQL MCP: Configure Database Connection` - Update DB settings

### **Status Bar**

- 🟢 **PostgreSQL MCP: Running** - Server active, DB connected
- 🟡 **PostgreSQL MCP: Stopped** - Server not running
- 🔴 **PostgreSQL MCP: Error** - Server error (click for details)

---

## 🔧 MCP Tools

| Tool | Description |
|------|-------------|
| `list_tables` | List all tables in a schema |
| `describe_table` | Get detailed table schema information |
| `query_database` | Execute SELECT queries |
| `execute_sql` | Execute INSERT, UPDATE, DELETE, CREATE statements |
| `create_table` | Create new tables with proper schema |
| `create_stored_procedure` | Create stored procedures and functions |
| `get_table_indexes` | Get all indexes for a table |
| `analyze_query_plan` | Analyze query execution plans (EXPLAIN) |

---

## 🗂️ Database Development Capabilities

Your PostgreSQL MCP extension is **production-ready** for professional database development:

### ✅ What You Can Create

- **Tables** - With all constraint types (PK, FK, CHECK, UNIQUE, DEFAULT)
- **Indexes** - All types (B-tree, GIN, GIST, HASH, partial, unique, composite)
- **Stored Procedures** - With transaction handling and error handling
- **Functions** - Scalar, table-returning, JSON, all attributes
- **Triggers** - BEFORE/AFTER, all events, validation, audit
- **Views** - Regular and materialized views
- **Complex Queries** - CTEs, window functions, recursive queries, subqueries

📖 **Complete Guide:** [DDL Examples](docs/DDL_EXAMPLES.md) - 40+ examples
📖 **Technical Details:** [Database Development Guide](docs/DATABASE_DEVELOPMENT_IMPROVEMENTS.md)

---

## 🧪 Testing

### **Test MCP Server**
```bash
cd mcp-server
source venv/bin/activate
python server.py

# Test health endpoint
curl http://127.0.0.1:3000/health
```

### **Test Extension**
```bash
# In VS Code
# Press F5 to launch Extension Development Host
# Type: @postgres show tables
```

📖 **Complete Testing Guide:** [Testing Guide](docs/TESTING_GUIDE.md)

---

## 📊 How It Works

### **Natural Language Query Flow:**

1. **User Input:** `@postgres minimum salary of employees`
2. **Extension:** Fetches database schema from MCP server
3. **LLM (Copilot):** Receives schema + query, generates SQL
4. **Extension:** Displays generated SQL: `SELECT MIN(salary) FROM employees`
5. **MCP Server:** Executes SQL on PostgreSQL
6. **User:** Sees results

```
User Question → Schema Fetch → LLM Generation → SQL Display → Execution → Results
```

📖 **Technical Details:** [LLM Enhanced Guide](docs/LLM_ENHANCED_GUIDE.md)

---

## 🔐 Requirements

- **Python:** 3.8 or higher
- **Node.js:** 18+ (for extension development)
- **PostgreSQL:** 10.0 or higher
- **VS Code:** 1.80.0 or higher
- **GitHub Copilot:** Active subscription required
- **Operating System:** macOS, Linux, or Windows

---

## 🚀 Distribution

### **For Your Team:**

```bash
# Create distribution package
./create-package.sh

# Share the tarball
# postgres-mcp-v1.0.0.tar.gz (836 KB)
```

**Distribution Options:**
- Network share / file server
- Internal web server
- Internal Git repository
- Internal npm registry
- Internal MCP registry

📦 **Distribution Guide:** [Distribution Guide](docs/DISTRIBUTION_GUIDE.md)
🌐 **Registry Publishing:** [Registry Publishing Guide](docs/REGISTRY_PUBLISHING_GUIDE.md)

---

## 🔄 Update Workflow

### **Making Changes:**

```bash
# 1. Edit source code
nano mcp-server/server.py
nano vscode-extension/src/extension.ts

# 2. Compile extension (if changed)
cd vscode-extension
npm run compile
npm run package

# 3. Rebuild distribution (AUTOMATIC)
cd ..
./create-package.sh

# ✅ Done! Package updated with all changes
```

📁 **Detailed Workflow:** [Folder Structure - Making Changes](docs/FOLDER_STRUCTURE.md#making-changes--updates)

---

## 📝 Configuration

### **MCP Server** (`~/.postgres-mcp/mcp-server/.env`)

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=postgres
DB_PASSWORD=your_password

SERVER_HOST=127.0.0.1
SERVER_PORT=3000
```

### **VS Code Extension Settings**

#### Database & Server Settings
- `postgresMcp.database.*` - Database connection settings
- `postgresMcp.server.port` - MCP server port (default: 3000)
- `postgresMcp.server.autoStart` - Auto-start on VS Code launch
- `postgresMcp.pythonPath` - Path to Python executable

#### Inline Mode Settings (NEW!)
- `postgresMcp.inline.enabled` - Enable inline completions (default: true)
- `postgresMcp.inline.triggerOnKeywords` - Trigger on SQL keywords (default: true)
- `postgresMcp.inline.includeSchemaContext` - Include database schema (default: true)

---

## 🆘 Troubleshooting

### **Server won't start**
- Check Python version: `python3 --version`
- Check dependencies: `pip list`
- View logs: View → Output → PostgreSQL MCP

### **Can't connect to database**
- Test manually: `psql -h localhost -p 5432 -U postgres -d your_db`
- Check `.env` file credentials
- Verify PostgreSQL is running

### **Extension not working**
- Ensure GitHub Copilot is active (check status bar)
- Check server is running: `curl http://127.0.0.1:3000/health`
- Restart VS Code

📖 **Complete Troubleshooting:** [Testing Guide - Troubleshooting](docs/TESTING_GUIDE.md#troubleshooting)

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly (see [Testing Guide](docs/TESTING_GUIDE.md))
5. Commit: `git commit -m "Add amazing feature"`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

📖 **Contributing Guidelines:** [Contributing](docs/CONTRIBUTING.md)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Support

- **Issues:** [GitHub Issues](https://github.com/syedmajidraza/mcp-postgres/issues)
- **Documentation:** See documentation links above
- **Questions:** Open a GitHub Discussion

---

## 📚 All Documentation

### **Quick Access**
- [Quick Reference Guide](docs/QUICK_REFERENCE.md) - Everything in one page
- [DDL Examples](docs/DDL_EXAMPLES.md) - 40+ database development examples
- [Usage Examples](docs/USAGE_EXAMPLES.md) - Basic query examples

### **Getting Started**
- [Developer Quick Start](docs/DEVELOPER_QUICK_START.md)
- [Quick Start](docs/QUICK_START.md)
- [Testing Guide](docs/TESTING_GUIDE.md)

### **Architecture & Implementation**
- [Architecture Overview](docs/ARCHITECTURE.md)
- [LLM Enhanced Guide](docs/LLM_ENHANCED_GUIDE.md)
- [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)
- [MCP FastAPI Implementation](docs/MCP_FASTAPI_IMPLEMENTATION_GUIDE.md)
- [Folder Structure](docs/FOLDER_STRUCTURE.md)

### **Database Development**
- [DDL Examples](docs/DDL_EXAMPLES.md)
- [Database Development Improvements](docs/DATABASE_DEVELOPMENT_IMPROVEMENTS.md)

### **Technical Guides**
- [Model Selection Analysis](docs/MODEL_SELECTION_ANALYSIS.md)
- [SQL Detection Analysis](docs/SQL_DETECTION_ANALYSIS.md)
- [SQL Detection Test Cases](docs/SQL_DETECTION_TEST_CASES.md)
- [Comprehensive SQL Detection Update](docs/COMPREHENSIVE_SQL_DETECTION_UPDATE.md)

### **Distribution & Updates**
- [Distribution Guide](docs/DISTRIBUTION_GUIDE.md)
- [Registry Publishing Guide](docs/REGISTRY_PUBLISHING_GUIDE.md)
- [Quick Update Instructions](docs/QUICK_UPDATE_INSTRUCTIONS.md)
- [Local Registry Setup](docs/LOCAL_REGISTRY_SETUP.md)

### **Bug Fixes & Improvements**
- [Bugfix: Natural Language Routing](docs/BUGFIX_NATURAL_LANGUAGE_ROUTING.md)

### **Reference**
- [Project Summary](docs/PROJECT_SUMMARY.md)
- [Structure Overview](docs/STRUCTURE.md)
- [Index](docs/INDEX.md)
- [Examples](docs/EXAMPLES.md)

---

## 🎉 Summary

**What you get:**
- ✅ Natural language SQL queries powered by GitHub Copilot
- ✅ Inline code completions with database schema context (NEW!)
- ✅ 8 comprehensive database tools
- ✅ VS Code extension with server management
- ✅ Production-ready database development (tables, indexes, procedures, functions, triggers, views)
- ✅ Schema-aware SQL generation
- ✅ Complex query support (CTEs, window functions, recursive queries)
- ✅ Cross-platform support
- ✅ Complete documentation
- ✅ Easy distribution to your team

**Ask your database questions like you're talking to a person! 🚀**

---

**Made with ❤️ by Syed Majid Raza**

**Repository:** [https://github.com/syedmajidraza/mcp-postgres](https://github.com/syedmajidraza/mcp-postgres)
