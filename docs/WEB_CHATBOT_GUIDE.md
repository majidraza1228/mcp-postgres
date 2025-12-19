# Web Chatbot Setup Guide

**Complete guide for setting up the standalone web chatbot interface**

This guide will help you set up the web chatbot interface that allows users to interact with your PostgreSQL database using GitHub Copilot - without needing VS Code!

---

## 🎯 What You're Building

A beautiful web-based chat interface where users can:
- Ask database questions in natural language
- See generated SQL before execution
- View results in formatted tables
- Execute direct SQL queries
- All powered by GitHub Copilot!

---

## 📋 Architecture Overview

```
┌──────────────────────────────────────────────────┐
│  Users (Web Browsers)                            │
│  - No VS Code needed                             │
│  - No GitHub account needed                      │
│  - No Copilot subscription needed                │
└─────────────────┬────────────────────────────────┘
                  │ http://localhost:8080
                  ▼
┌──────────────────────────────────────────────────┐
│  Web Chatbot Server (Node.js/Express)           │
│  - Handles chat requests                         │
│  - Manages sessions                              │
│  - Routes to Copilot proxy and MCP server        │
└────┬──────────────────────┬──────────────────────┘
     │                      │
     │ Port 9000            │ Port 3000
     ▼                      ▼
┌─────────────────┐    ┌───────────────────────────┐
│ VS Code Ext     │    │ MCP Server                │
│ (Copilot Proxy) │    │ (PostgreSQL Operations)   │
│                 │    │                           │
│ - YOU login to  │    │ - Connects to PostgreSQL  │
│   GitHub Copilot│    │ - Executes queries        │
│ - VS Code runs  │    │ - Returns results         │
│   in background │    │                           │
└─────────────────┘    └───────────────────────────┘
```

---

## ✅ Prerequisites

### **What You Need:**

1. **VS Code** - Installed and running
2. **GitHub Copilot** - Active subscription
3. **PostgreSQL MCP Extension** - Installed in VS Code
4. **MCP Server** - Python server for PostgreSQL
5. **Node.js** - Version 18 or higher
6. **PostgreSQL Database** - Accessible database

---

## 🚀 Step-by-Step Setup

### **Step 1: Verify VS Code Extension**

The VS Code extension has been enhanced with a Copilot API proxy server.

```bash
# 1. Open VS Code
code /Users/syedraza/postgres-mcp

# 2. Recompile the extension (if not done already)
cd vscode-extension
npm run compile
npm run package

# 3. Install the .vsix file in VS Code
# VS Code → Extensions → ... → Install from VSIX
# Select: postgres-mcp-copilot-1.0.0.vsix

# 4. Reload VS Code
# Cmd+Shift+P → "Developer: Reload Window"
```

**Verify extension is running:**
- Check status bar: Should show "PostgreSQL MCP: Running"
- Check Copilot icon: Should be active (✓)

**Verify Copilot proxy:**
```bash
curl http://localhost:9000/health
# Expected: {"status":"running","service":"copilot-proxy"}
```

If you see this, the Copilot API proxy is working! ✅

---

### **Step 2: Ensure MCP Server is Running**

```bash
# Navigate to MCP server directory
cd /Users/syedraza/postgres-mcp/mcp-server

# Activate virtual environment
source venv/bin/activate

# Start MCP server
python server.py
```

**Expected output:**
```
INFO:     Started server process
INFO:     Uvicorn running on http://127.0.0.1:3000
```

**Verify MCP server:**
```bash
curl http://localhost:3000/health
# Expected: {"status":"running","database":"connected",...}
```

---

### **Step 3: Install Web Chatbot Dependencies**

```bash
# Navigate to web-chatbot directory
cd /Users/syedraza/postgres-mcp/web-chatbot

# Install Node.js dependencies
npm install
```

**Expected output:**
```
added 50 packages, and audited 51 packages in 2s
found 0 vulnerabilities
```

---

### **Step 4: Start Web Chatbot Server**

```bash
# Option 1: Using the start script (recommended)
./start.sh

# Option 2: Using npm directly
npm start
```

**Expected output:**
```
PostgreSQL MCP Web Chatbot running on http://localhost:8080
Authentication: DISABLED
Copilot Proxy: http://localhost:9000
MCP Server: http://localhost:3000
```

---

### **Step 5: Access the Chatbot**

Open your web browser and navigate to:
```
http://localhost:8080
```

You should see a beautiful chat interface! 🎉

---

## 💬 Using the Chatbot

### **Example Queries**

Try these natural language queries:

```
1. Show all tables in my database
2. What's the minimum salary of employees?
3. Create a table for storing products with name and price
4. Show top 10 customers by total orders
5. Find employees who earn more than 70000
6. Create an index on the email column of users table
```

### **Direct SQL**

You can also execute SQL directly:
```sql
SELECT * FROM employees WHERE department = 'Engineering' LIMIT 10
```

### **Chat Flow**

1. **You type:** "What's the average salary?"
2. **Copilot generates:** `SELECT AVG(salary) FROM employees`
3. **SQL is displayed:** You see the generated SQL
4. **Query executes:** Results appear in a formatted table
5. **Results shown:** `Average salary: $75,000`

---

## 🔐 Enable Authentication (Optional)

By default, anyone who can access the URL can use the chatbot. To add security:

### **Method 1: Environment Variable**

```bash
# Set environment variable
export ENABLE_AUTH=true

# Start server
npm start
```

### **Method 2: Edit Configuration**

Edit `src/server.js`:
```javascript
const ENABLE_AUTH = true; // Change to true

const USERS = {
    'admin': 'your-secure-password',
    'developer': 'another-password',
    'analyst': 'data-analyst-pwd'
};
```

Restart the server:
```bash
npm start
```

Now users will see a login screen before accessing the chat.

---

## 🌐 Network Access (Optional)

By default, the chatbot is only accessible on `localhost`. To allow network access:

### **Step 1: Find Your IP Address**

```bash
# macOS/Linux
ifconfig | grep "inet "

# Output example:
inet 192.168.1.100 netmask 0xffffff00 broadcast 192.168.1.255
```

### **Step 2: Update CORS if Needed**

The server already has CORS enabled (`app.use(cors())`), so no changes needed.

### **Step 3: Access from Other Devices**

From any device on the same network:
```
http://192.168.1.100:8080
```

**Note:** Make sure your firewall allows connections on port 8080.

---

## 🛠️ Customization

### **Change Port**

Edit `src/server.js`:
```javascript
const PORT = 8080; // Change to your preferred port
```

### **Change Styling**

Edit `public/styles.css`:
- Colors: Look for `#667eea` and `#764ba2` (gradient colors)
- Fonts: Modify `font-family` properties
- Layout: Adjust `.container`, `.chat-messages`, etc.

### **Add Features**

Edit `public/app.js`:
- Add new API endpoints
- Modify message formatting
- Add export functionality
- Implement query history

---

## 🐛 Troubleshooting

### **Problem: "GitHub Copilot not available"**

**Cause:** VS Code extension not running or Copilot not authenticated

**Solution:**
1. Open VS Code
2. Check Copilot icon in status bar (should be active)
3. Sign in: VS Code → Accounts → Sign in with GitHub
4. Verify proxy: `curl http://localhost:9000/health`
5. Reload VS Code extension

---

### **Problem: "Connection refused to localhost:9000"**

**Cause:** Copilot proxy server not started

**Solution:**
1. Verify VS Code is open
2. Check extension is active
3. Look for notification: "Copilot API Proxy started on port 9000"
4. If not, reload VS Code: Cmd+Shift+P → "Developer: Reload Window"

---

### **Problem: "Connection refused to localhost:3000"**

**Cause:** MCP server not running

**Solution:**
```bash
cd mcp-server
source venv/bin/activate
python server.py
```

---

### **Problem: Web chatbot won't start**

**Cause:** Port 8080 already in use

**Solution:**
```bash
# Find what's using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or use a different port
# Edit src/server.js and change PORT = 8080
```

---

### **Problem: SQL errors in chatbot**

**Cause:** Invalid SQL generated or database error

**Solution:**
1. Check the generated SQL (shown in chat)
2. Verify table/column names exist
3. Check database connection
4. Try rephrasing your question
5. Use direct SQL to test

---

## 📊 System Health Check

### **Quick Health Check**

Open browser: `http://localhost:8080`

Click "Check Status" button in header.

You should see:
- ✓ Web Server: Running
- ✓ GitHub Copilot Proxy: Running
- ✓ MCP Server: Running, Database Connected

---

### **Command Line Health Check**

```bash
# Web server
curl http://localhost:8080/health

# Copilot proxy
curl http://localhost:9000/health

# MCP server
curl http://localhost:3000/health
```

All should return status 200 with JSON response.

---

## 🚀 Production Deployment

### **Running as a Service**

Create systemd service (Linux):

```ini
# /etc/systemd/system/postgres-chatbot.service
[Unit]
Description=PostgreSQL MCP Web Chatbot
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/postgres-mcp/web-chatbot
ExecStart=/usr/bin/node src/server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable postgres-chatbot
sudo systemctl start postgres-chatbot
```

---

### **Using PM2 (Process Manager)**

```bash
# Install PM2
npm install -g pm2

# Start chatbot
cd web-chatbot
pm2 start src/server.js --name postgres-chatbot

# Auto-start on boot
pm2 startup
pm2 save

# View logs
pm2 logs postgres-chatbot

# Monitor
pm2 monit
```

---

### **Using Docker**

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

```bash
# Build
docker build -t postgres-chatbot .

# Run
docker run -d -p 8080:8080 --name chatbot postgres-chatbot
```

---

## 🔒 Security Best Practices

### **1. Enable Authentication**
```javascript
const ENABLE_AUTH = true;
```

### **2. Use Environment Variables**
```bash
# .env file
SESSION_SECRET=your-random-secret-key
DB_CONNECTION_STRING=postgresql://...
ENABLE_AUTH=true
```

### **3. Enable HTTPS**
Use nginx or Apache as reverse proxy with SSL certificate.

### **4. Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

app.use('/api/', limiter);
```

### **5. Input Validation**
The system already sanitizes SQL, but add extra validation for production.

---

## 📈 Performance Optimization

### **1. Schema Caching**
Cache database schema to reduce MCP calls:

```javascript
let schemaCache = null;
let schemaCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getSchema() {
    if (schemaCache && Date.now() - schemaCacheTime < CACHE_TTL) {
        return schemaCache;
    }

    // Fetch schema from MCP
    // ...

    schemaCache = schema;
    schemaCacheTime = Date.now();
    return schema;
}
```

### **2. Connection Pooling**
Already implemented via axios (HTTP keep-alive).

### **3. Result Limiting**
Limit large result sets:
```javascript
if (result.rows.length > 1000) {
    result.rows = result.rows.slice(0, 1000);
    result.truncated = true;
}
```

---

## 📝 Summary Checklist

Before using the web chatbot, ensure:

- [ ] VS Code is running
- [ ] GitHub Copilot is active (signed in)
- [ ] PostgreSQL MCP extension is installed and running
- [ ] Copilot proxy responds on port 9000
- [ ] MCP server is running on port 3000
- [ ] MCP server can connect to PostgreSQL
- [ ] Web chatbot dependencies installed (`npm install`)
- [ ] Web chatbot server started (`npm start`)
- [ ] Browser can access `http://localhost:8080`

**All checked?** You're ready to use the chatbot! 🎉

---

## 🎯 What Users Need

**Users of the web chatbot need:**
- ✅ Web browser (Chrome, Firefox, Safari, Edge)
- ✅ URL to chatbot (`http://localhost:8080` or your server)
- ✅ (Optional) Login credentials if authentication enabled

**Users DON'T need:**
- ❌ VS Code
- ❌ GitHub account
- ❌ Copilot subscription
- ❌ Technical knowledge

---

## 🎉 Success!

You now have a fully functional web chatbot that:
- ✅ Uses GitHub Copilot for SQL generation
- ✅ Works independently from VS Code (users don't need it)
- ✅ Provides beautiful chat interface
- ✅ Executes queries on PostgreSQL
- ✅ Shows formatted results
- ✅ Supports authentication

**Happy querying! 🚀**

---

**For more help:**
- [Web Chatbot README](../web-chatbot/README.md)
- [Main Project README](../README.md)
- [MCP Server Guide](MCP_FASTAPI_IMPLEMENTATION_GUIDE.md)
