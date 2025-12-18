# Quick Update Instructions

**Version:** 1.0.0 (Bug Fix Release - December 17, 2025)

---

## What Was Fixed

✅ **Natural Language Query Routing**
- Queries like `@postgres create a table for product reviews` now properly route through LLM
- Fixed "syntax error at or near 'a'" issue
- Improved detection of direct SQL vs natural language

📖 **Full Details:** [BUGFIX_NATURAL_LANGUAGE_ROUTING.md](BUGFIX_NATURAL_LANGUAGE_ROUTING.md)

---

## 🚀 Quick Update (2 Minutes)

### Step 1: Uninstall Old Extension

1. Open VS Code
2. Go to Extensions (Cmd+Shift+X)
3. Find "PostgreSQL MCP for GitHub Copilot"
4. Click **Uninstall**

### Step 2: Install Updated Extension

1. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
2. Type: **Extensions: Install from VSIX**
3. Navigate to: `/Users/syedraza/postgres-mcp/vscode-extension/`
4. Select: `postgres-mcp-copilot-1.0.0.vsix`
5. Click **Install**

### Step 3: Reload VS Code

1. Press `Cmd+Shift+P`
2. Type: **Developer: Reload Window**
3. Press Enter

### Step 4: Verify Fix

Open GitHub Copilot Chat and try:

```
@postgres create a table for product reviews with id, product name, rating 1-5, and comment
```

**Expected Result:**
```
🤖 Analyzing your request and generating SQL...

Generated SQL:
```sql
CREATE TABLE product_reviews (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT
)
```

✅ Table created successfully
```

---

## Alternative: Full Reinstall

If you prefer a complete fresh install:

```bash
# Navigate to project
cd /Users/syedraza/postgres-mcp

# Extract latest package
tar -xzf postgres-mcp-v1.0.0.tar.gz
cd postgres-mcp-package

# Run installer
./install.sh

# Install extension
# Cmd+Shift+P → "Extensions: Install from VSIX"
# Select: postgres-mcp-copilot-1.0.0.vsix

# Reload VS Code
# Cmd+Shift+P → "Developer: Reload Window"
```

---

## Testing the Fix

### Test 1: Natural Language Table Creation
```
@postgres create a table for orders with order id, customer name, total amount, and order date
```
**Expected:** LLM generates CREATE TABLE statement ✅

### Test 2: Natural Language Query
```
@postgres what's the average salary of employees?
```
**Expected:** LLM generates SELECT statement with AVG() ✅

### Test 3: Direct SQL (No LLM)
```
@postgres SELECT * FROM employees WHERE salary > 70000
```
**Expected:** Execute SQL directly without LLM ✅

### Test 4: Slash Commands
```
@postgres /tables
```
**Expected:** List all tables ✅

---

## Debugging

If you still encounter issues:

### View Extension Logs

1. View → Output
2. Select **PostgreSQL MCP** from dropdown
3. Look for:
   ```
   [LLM Generated SQL]: CREATE TABLE product_reviews (...)
   [LLM Error]: GitHub Copilot is not available
   ```

### Common Issues

| Issue | Solution |
|-------|----------|
| "GitHub Copilot is not available" | Check Copilot status bar icon, ensure active subscription |
| "MCP server is not running" | Run: `PostgreSQL MCP: Start Server` from Command Palette |
| "syntax error" persists | Check Output panel for generated SQL, ensure extension updated |

---

## Verification Checklist

After updating:

- [ ] Extension version shows 1.0.0 in Extensions panel
- [ ] Status bar shows "PostgreSQL MCP: Running" (green)
- [ ] Natural language queries work without syntax errors
- [ ] Direct SQL queries still execute immediately
- [ ] Slash commands (`/tables`, `/describe`) work

---

## Distribution to Team

If you've published to internal registry:

### Option 1: Update Registry Entry

```bash
# Navigate to your registry
cd ~/mcp-registry

# Update seed.json
nano seed.json

# Find io.github.syedmajidraza/mcp-postgres entry
# Update timestamp or add note about bug fix

# Restart registry
npm start
```

### Option 2: Share Distribution Package

```bash
# Package is already updated at:
# /Users/syedraza/postgres-mcp/postgres-mcp-v1.0.0.tar.gz

# Share via:
# 1. Network drive
# 2. Internal web server
# 3. Email/Slack

# Team installation:
tar -xzf postgres-mcp-v1.0.0.tar.gz
cd postgres-mcp-package
./install.sh
```

---

## Rollback (If Needed)

If issues occur:

```bash
cd /Users/syedraza/postgres-mcp
git checkout HEAD~1 vscode-extension/src/extension.ts
cd vscode-extension
npm run compile
npm run package
```

Then reinstall the previous VSIX.

---

## Summary

✅ **What Changed:**
- Fixed natural language query routing logic
- Added debugging logs to Output panel
- Improved SQL vs natural language detection

✅ **What Didn't Change:**
- MCP server (no update needed)
- Database configuration
- Extension settings
- Documentation

✅ **Action Required:**
1. Uninstall old extension
2. Install updated VSIX
3. Reload VS Code
4. Test with natural language query

**Time Required:** ~2 minutes

---

**Questions?** Check [BUGFIX_NATURAL_LANGUAGE_ROUTING.md](BUGFIX_NATURAL_LANGUAGE_ROUTING.md) for technical details.
