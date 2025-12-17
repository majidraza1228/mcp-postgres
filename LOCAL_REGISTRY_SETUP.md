# Adding PostgreSQL MCP to Local Registry (localhost:8080)

## Overview

This guide shows how to add your PostgreSQL MCP server to your local MCP registry running at `http://localhost:8080`.

---

## 📋 Registry Entry

Add this entry to your local registry's `seed.json` file:

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-10-17/server.schema.json",
  "name": "io.github.syedmajidraza/mcp-postgres",
  "description": "PostgreSQL MCP Server with Natural Language Queries - Convert plain English to SQL using GitHub Copilot LLM. Features 8 database tools, VS Code extension with server management, and schema-aware SQL generation for complex queries, table creation, and stored procedures.",
  "repository": {
    "url": "https://github.com/syedmajidraza/mcp-postgres",
    "source": "github"
  },
  "version": "1.0.0",
  "packages": [
    {
      "registryType": "git",
      "identifier": "mcp-postgres",
      "version": "1.0.0",
      "transport": {
        "type": "http",
        "url": "http://127.0.0.1:3000"
      },
      "runtime": {
        "type": "python",
        "version": ">=3.8"
      },
      "installation": {
        "steps": [
          "git clone https://github.com/syedmajidraza/mcp-postgres.git",
          "cd mcp-postgres",
          "./install.sh",
          "Configure database in ~/.postgres-mcp/mcp-server/.env",
          "Install VS Code extension: postgres-mcp-copilot-1.0.0.vsix"
        ]
      }
    }
  ],
  "tools": [
    {
      "name": "list_tables",
      "description": "List all tables in a PostgreSQL schema"
    },
    {
      "name": "describe_table",
      "description": "Get detailed schema information for a specific table"
    },
    {
      "name": "query_database",
      "description": "Execute SELECT queries on the PostgreSQL database"
    },
    {
      "name": "execute_sql",
      "description": "Execute INSERT, UPDATE, DELETE, CREATE statements"
    },
    {
      "name": "create_table",
      "description": "Create new tables with proper schema"
    },
    {
      "name": "create_stored_procedure",
      "description": "Create stored procedures and functions in PL/pgSQL"
    },
    {
      "name": "get_table_indexes",
      "description": "Get all indexes for a specific table"
    },
    {
      "name": "analyze_query_plan",
      "description": "Analyze query execution plans (EXPLAIN)"
    }
  ],
  "capabilities": {
    "naturalLanguage": true,
    "llmIntegration": "GitHub Copilot",
    "schemaAware": true,
    "vscodeExtension": true
  },
  "requirements": {
    "postgresql": ">=10.0",
    "vscode": ">=1.80.0",
    "githubCopilot": true
  },
  "endpoints": {
    "health": "http://127.0.0.1:3000/health",
    "mcp": "http://127.0.0.1:3000/mcp/v1"
  }
}
```

---

## 🚀 Step-by-Step: Add to Your Local Registry

### **Step 1: Locate Your Registry's seed.json**

Your local registry is running at `http://localhost:8080`. Find the `seed.json` file:

```bash
# Common locations for local registry
cd ~/mcp-registry
# or
cd /path/to/your/local/mcp-registry

# Find seed.json
find . -name "seed.json"
```

### **Step 2: Backup Current seed.json**

```bash
cp seed.json seed.json.backup
```

### **Step 3: Add PostgreSQL MCP Entry**

Open `seed.json` and add the PostgreSQL MCP entry to the array:

```bash
nano seed.json
```

Add the entry from above to the JSON array. Your `seed.json` should look like:

```json
[
  {
    "$schema": "...",
    "name": "io.github.mirza-glitch/markitdown-js",
    ...existing entries...
  },
  {
    "$schema": "...",
    "name": "io.github.dead8309/markitdown-ts",
    ...existing entries...
  },
  {
    "$schema": "...",
    "name": "io.github.antonorlov/mcp-postgres-server",
    ...existing entries...
  },
  {
    "$schema": "...",
    "name": "io.github.postmanlabs/postman-mcp-server",
    ...existing entries...
  },
  {
    "$schema": "...",
    "name": "io.github.modelcontextprotocol/github",
    ...existing entries...
  },
  {
    "$schema": "https://static.modelcontextprotocol.io/schemas/2025-10-17/server.schema.json",
    "name": "io.github.syedmajidraza/mcp-postgres",
    "description": "PostgreSQL MCP Server with Natural Language Queries - Convert plain English to SQL using GitHub Copilot LLM. Features 8 database tools, VS Code extension with server management, and schema-aware SQL generation for complex queries, table creation, and stored procedures.",
    "repository": {
      "url": "https://github.com/syedmajidraza/mcp-postgres",
      "source": "github"
    },
    "version": "1.0.0",
    "packages": [
      {
        "registryType": "git",
        "identifier": "mcp-postgres",
        "version": "1.0.0",
        "transport": {
          "type": "http",
          "url": "http://127.0.0.1:3000"
        },
        "runtime": {
          "type": "python",
          "version": ">=3.8"
        },
        "installation": {
          "steps": [
            "git clone https://github.com/syedmajidraza/mcp-postgres.git",
            "cd mcp-postgres",
            "./install.sh",
            "Configure database in ~/.postgres-mcp/mcp-server/.env",
            "Install VS Code extension: postgres-mcp-copilot-1.0.0.vsix"
          ]
        }
      }
    ],
    "tools": [
      {
        "name": "list_tables",
        "description": "List all tables in a PostgreSQL schema"
      },
      {
        "name": "describe_table",
        "description": "Get detailed schema information for a specific table"
      },
      {
        "name": "query_database",
        "description": "Execute SELECT queries on the PostgreSQL database"
      },
      {
        "name": "execute_sql",
        "description": "Execute INSERT, UPDATE, DELETE, CREATE statements"
      },
      {
        "name": "create_table",
        "description": "Create new tables with proper schema"
      },
      {
        "name": "create_stored_procedure",
        "description": "Create stored procedures and functions in PL/pgSQL"
      },
      {
        "name": "get_table_indexes",
        "description": "Get all indexes for a specific table"
      },
      {
        "name": "analyze_query_plan",
        "description": "Analyze query execution plans (EXPLAIN)"
      }
    ],
    "capabilities": {
      "naturalLanguage": true,
      "llmIntegration": "GitHub Copilot",
      "schemaAware": true,
      "vscodeExtension": true
    },
    "requirements": {
      "postgresql": ">=10.0",
      "vscode": ">=1.80.0",
      "githubCopilot": true
    },
    "endpoints": {
      "health": "http://127.0.0.1:3000/health",
      "mcp": "http://127.0.0.1:3000/mcp/v1"
    }
  }
]
```

### **Step 4: Validate JSON**

```bash
# Check if JSON is valid
python3 -m json.tool seed.json > /dev/null && echo "✅ Valid JSON" || echo "❌ Invalid JSON"

# Or use jq
jq empty seed.json && echo "✅ Valid JSON" || echo "❌ Invalid JSON"
```

### **Step 5: Restart Your Local Registry**

```bash
# Stop the registry server
# (Method depends on how you're running it)

# If using npm/node:
# Ctrl+C to stop, then:
npm start

# If using Docker:
docker restart mcp-registry

# If using systemd:
sudo systemctl restart mcp-registry
```

### **Step 6: Verify in Registry UI**

Open your browser:

```
http://localhost:8080
```

You should now see **"PostgreSQL MCP Server with Natural Language Queries"** in your registry!

---

## 🌐 Using the Registry API

### **View All Servers**

```bash
curl http://localhost:8080/api/servers
```

### **View PostgreSQL MCP Details**

```bash
curl http://localhost:8080/api/servers/io.github.syedmajidraza/mcp-postgres
```

### **Search for PostgreSQL**

```bash
curl "http://localhost:8080/api/search?q=postgresql"
```

---

## 👥 Developer Installation from Registry

Once published, developers can install from your registry:

### **Option 1: Via Registry UI**

1. Open `http://localhost:8080`
2. Search for "PostgreSQL MCP"
3. Click "Install"
4. Follow installation instructions displayed

### **Option 2: Via CLI (if your registry provides CLI)**

```bash
# Install from registry
mcp-registry install io.github.syedmajidraza/mcp-postgres

# Or manually clone from GitHub
git clone https://github.com/syedmajidraza/mcp-postgres.git
cd mcp-postgres
./install.sh
```

### **Installation Steps Shown to Developers:**

```bash
# 1. Clone repository
git clone https://github.com/syedmajidraza/mcp-postgres.git
cd mcp-postgres

# 2. Run installer
./install.sh

# 3. Configure database
nano ~/.postgres-mcp/mcp-server/.env
# Update: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

# 4. Install VS Code extension
# Cmd+Shift+P → "Extensions: Install from VSIX"
# Select: postgres-mcp-copilot-1.0.0.vsix

# 5. Reload VS Code
# Cmd+Shift+P → "Developer: Reload Window"

# 6. Start using
# @postgres show tables
```

---

## 🔄 Updating Your Entry

### **When You Release a New Version:**

```bash
# 1. Update version in your code
nano vscode-extension/package.json
# Change: "version": "1.0.0" → "1.1.0"

nano mcp-server/package.json
# Change: "version": "1.0.0" → "1.1.0"

# 2. Rebuild and push to GitHub
cd vscode-extension
npm run compile
npm run package
cd ..
./create-package.sh
git add .
git commit -m "Release v1.1.0"
git tag v1.1.0
git push origin main --tags

# 3. Update registry entry
cd /path/to/mcp-registry
nano seed.json
# Update version: "1.0.0" → "1.1.0"

# 4. Restart registry
npm start  # or your restart command
```

---

## 📊 Registry Entry Explained

| Field | Value | Description |
|-------|-------|-------------|
| `$schema` | Schema URL | MCP server schema version |
| `name` | `io.github.syedmajidraza/mcp-postgres` | Unique identifier (reverse domain format) |
| `description` | Full description | Shown in registry UI |
| `repository.url` | GitHub URL | Source code location |
| `version` | `1.0.0` | Current version (semantic versioning) |
| `packages[0].registryType` | `git` | Installation method |
| `packages[0].transport.type` | `http` | MCP server uses HTTP transport |
| `packages[0].transport.url` | `http://127.0.0.1:3000` | MCP server endpoint |
| `runtime.type` | `python` | Runtime environment |
| `tools` | Array of 8 tools | MCP tools provided |
| `capabilities` | Custom metadata | Special features |
| `requirements` | Dependencies | What developers need |
| `endpoints` | API URLs | Health check and MCP endpoints |

---

## ✅ Verification Checklist

After adding to registry:

- [ ] Entry appears at `http://localhost:8080`
- [ ] Search for "PostgreSQL" finds your server
- [ ] Server details page shows correctly
- [ ] Installation instructions are visible
- [ ] Tools list displays all 8 tools
- [ ] GitHub repository link works
- [ ] Version number is correct

---

## 🆘 Troubleshooting

### **Entry Not Showing in Registry**

```bash
# Check JSON syntax
jq empty seed.json

# Check registry logs
# (depends on your setup)
tail -f /path/to/registry/logs/app.log

# Restart registry
npm restart  # or your restart command
```

### **Invalid JSON Error**

```bash
# Validate JSON
python3 -m json.tool seed.json

# Common issues:
# - Missing comma between entries
# - Trailing comma at end of array
# - Unescaped quotes in strings
```

### **Registry Won't Start**

```bash
# Check port 8080 is available
lsof -i :8080

# Check registry configuration
cat /path/to/registry/config.json

# View detailed logs
npm start --verbose
```

---

## 📁 Files Reference

**Created Files:**
- `registry-seed-entry.json` - Complete entry for your registry
- `LOCAL_REGISTRY_SETUP.md` - This guide

**Registry Files to Modify:**
- `seed.json` - Add PostgreSQL MCP entry here

---

## 🎉 Summary

**You can now:**
1. ✅ Add PostgreSQL MCP to your local registry at `localhost:8080`
2. ✅ Developers can discover it in the registry UI
3. ✅ One-click installation instructions
4. ✅ Complete metadata and tool descriptions
5. ✅ Easy version updates

**Your PostgreSQL MCP server is now available in your internal registry! 🚀**

---

## 📞 Support

- **Registry Issues:** Check your local registry documentation
- **PostgreSQL MCP Issues:** https://github.com/syedmajidraza/mcp-postgres/issues
- **Documentation:** See main [README.md](README.md)

---

**Next Steps:**
1. Add entry to `seed.json`
2. Restart registry
3. Verify at `http://localhost:8080`
4. Share with developers!
