# PostgreSQL MCP Web Chatbot

**Beautiful popup chat widget for PostgreSQL queries using GitHub Copilot**

A floating chat widget that connects to your PostgreSQL database through the MCP server and uses GitHub Copilot (via VS Code extension) for natural language SQL generation.

![Popup Chatbot Preview](../docs/images/popup-chatbot-screenshot.png)
*The popup chat widget showing query results with MCP connection status*

## ✨ New Features (v2.0)
- 🎈 **Popup Chat Widget** - Non-intrusive floating button that opens chat on demand
- 🔌 **MCP Connection Status** - Real-time display of MCP server connection and database info
- 🎨 **Compact Design** - Optimized 420x600px popup window
- 🔄 **Auto-refresh Status** - Connection status updates every 30 seconds

### 📚 Documentation
- [Popup Chatbot Changes](POPUP_CHATBOT_CHANGES.md) - Technical implementation details
- [Upgrade Guide](UPGRADE_GUIDE.md) - Migration from v1.0 to v2.0
- [Screenshot Guide](SCREENSHOT_GUIDE.md) - Visual overview and features

---

## 🎯 Overview

This web chatbot provides a user-friendly interface for users who don't use VS Code, while still leveraging the power of GitHub Copilot for SQL generation.

### **Architecture**

```
┌─────────────────────────────────────────────┐
│    Web Browser                              │
│    http://localhost:8080                    │
└─────────────────┬───────────────────────────┘
                  │ HTTP
                  ▼
┌─────────────────────────────────────────────┐
│    Web Server (Express.js)                  │
│    Port: 8080                               │
└────┬──────────────────────┬─────────────────┘
     │                      │
     │ Copilot API          │ MCP API
     ▼                      ▼
┌──────────────────┐  ┌───────────────────────┐
│  VS Code Ext     │  │  MCP Server           │
│  Port: 9000      │  │  Port: 3000           │
│  (Copilot Proxy) │  │  (PostgreSQL)         │
└──────────────────┘  └───────────────────────┘
```

---

## 🚀 Quick Start

### **Prerequisites**

1. ✅ **VS Code** - Must be running with PostgreSQL MCP extension
2. ✅ **GitHub Copilot** - Active subscription and signed in
3. ✅ **MCP Server** - Running on port 3000
4. ✅ **Node.js** - Version 18 or higher

### **Installation**

```bash
# 1. Navigate to web-chatbot directory
cd web-chatbot

# 2. Install dependencies
npm install

# 3. Start the server
npm start
```

The chatbot will be available at `http://localhost:8080`

---

## 📋 Setup Instructions

### **Step 1: Ensure VS Code Extension is Running**

The VS Code extension **must be running** to provide the Copilot API proxy.

```bash
# 1. Open VS Code
code .

# 2. Ensure PostgreSQL MCP extension is installed and active
# (Check status bar - should show "PostgreSQL MCP: Running")

# 3. The extension automatically starts Copilot API proxy on port 9000
```

**Verify Copilot proxy is running:**
```bash
curl http://localhost:9000/health
# Should return: {"status":"running","service":"copilot-proxy"}
```

### **Step 2: Ensure MCP Server is Running**

```bash
# Navigate to mcp-server
cd mcp-server

# Activate virtual environment
source venv/bin/activate

# Start MCP server
python server.py
```

**Verify MCP server is running:**
```bash
curl http://localhost:3000/health
# Should return database connection status
```

### **Step 3: Start Web Chatbot Server**

```bash
# Navigate to web-chatbot
cd web-chatbot

# Install dependencies (first time only)
npm install

# Start server
npm start
```

**Output:**
```
PostgreSQL MCP Web Chatbot running on http://localhost:8080
Authentication: DISABLED
Copilot Proxy: http://localhost:9000
MCP Server: http://localhost:3000
```

### **Step 4: Access the Chatbot**

Open your browser and navigate to:
```
http://localhost:8080
```

---

## 🔐 Authentication (Optional)

By default, authentication is **disabled**. To enable it:

### **Enable Authentication**

```bash
# Set environment variable
export ENABLE_AUTH=true

# Start server
npm start
```

### **Default Credentials**

Edit `src/server.js` to change default users:

```javascript
const USERS = {
    'admin': 'admin123',      // Change these!
    'developer': 'dev123'
};
```

### **Login**

When authentication is enabled, users will see a login screen. Use the configured credentials to access the chatbot.

---

## 💡 Usage Examples

### **Natural Language Queries**

```
User: Show all tables in the database
User: What's the minimum salary of employees?
User: Create a table for storing products
User: Show top 10 customers by revenue this year
User: Find employees who haven't had a raise in 2 years
```

### **Direct SQL**

You can also execute SQL directly:
```sql
SELECT * FROM employees WHERE salary > 70000
```

---

## 🎨 Features

### ✅ **Natural Language Processing**
- Powered by GitHub Copilot
- Schema-aware SQL generation
- Supports complex queries

### ✅ **Beautiful UI**
- Modern, responsive design
- Real-time chat interface
- SQL syntax highlighting
- Formatted result tables

### ✅ **Secure**
- Optional authentication
- Session management
- CORS enabled

### ✅ **Robust**
- Error handling
- Status monitoring
- Connection health checks

---

## 🛠️ Configuration

### **Server Configuration**

Edit `src/server.js`:

```javascript
const PORT = 8080;                              // Web server port
const COPILOT_PROXY_URL = 'http://localhost:9000';  // VS Code extension
const MCP_SERVER_URL = 'http://localhost:3000';     // MCP server
```

### **Authentication Configuration**

```javascript
const ENABLE_AUTH = process.env.ENABLE_AUTH === 'true';
const USERS = {
    'username': 'password'
};
```

---

## 📊 API Endpoints

### **GET /health**
Check system status
```bash
curl http://localhost:8080/health
```

### **POST /api/chat**
Send natural language query
```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "show all tables"}'
```

### **POST /api/execute**
Execute direct SQL
```bash
curl -X POST http://localhost:8080/api/execute \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT * FROM employees LIMIT 10"}'
```

### **GET /api/schema**
Get database schema
```bash
curl http://localhost:8080/api/schema
```

---

## 🔧 Development

### **Development Mode**

```bash
# Install nodemon for auto-reload
npm install --save-dev nodemon

# Start in dev mode
npm run dev
```

### **Project Structure**

```
web-chatbot/
├── package.json          # Dependencies
├── src/
│   └── server.js        # Express server
├── public/
│   ├── index.html       # Main HTML
│   ├── styles.css       # Styling
│   └── app.js           # Client-side JavaScript
└── README.md            # This file
```

---

## 🐛 Troubleshooting

### **"GitHub Copilot not available" error**

**Problem:** VS Code extension not running or Copilot not active

**Solutions:**
1. Ensure VS Code is open
2. Check Copilot status bar icon (should be active)
3. Verify Copilot proxy: `curl http://localhost:9000/health`
4. Reload VS Code extension

### **"Connection refused" to MCP server**

**Problem:** MCP server not running

**Solutions:**
1. Start MCP server: `cd mcp-server && python server.py`
2. Check MCP health: `curl http://localhost:3000/health`
3. Verify database connection in `.env` file

### **"Authentication required" error**

**Problem:** Authentication is enabled but user not logged in

**Solutions:**
1. Login with configured credentials
2. Disable authentication: remove `ENABLE_AUTH` environment variable
3. Check session configuration in `server.js`

### **Web server won't start**

**Problem:** Port already in use

**Solutions:**
1. Check if port 8080 is in use: `lsof -i :8080`
2. Kill the process or change port in `server.js`
3. Use different port: `PORT=8081 npm start`

---

## 🔒 Security Considerations

### **Production Deployment**

If deploying to production:

1. **Enable HTTPS**
   ```javascript
   // Use HTTPS instead of HTTP
   const https = require('https');
   const fs = require('fs');

   const options = {
       key: fs.readFileSync('key.pem'),
       cert: fs.readFileSync('cert.pem')
   };

   https.createServer(options, app).listen(443);
   ```

2. **Strong Authentication**
   - Use a proper authentication system (JWT, OAuth, etc.)
   - Hash passwords (use bcrypt)
   - Implement rate limiting

3. **Secure Sessions**
   ```javascript
   app.use(session({
       secret: process.env.SESSION_SECRET, // Use environment variable
       resave: false,
       saveUninitialized: false,
       cookie: {
           secure: true,      // HTTPS only
           httpOnly: true,    // Prevent XSS
           maxAge: 3600000    // 1 hour
       }
   }));
   ```

4. **Environment Variables**
   ```bash
   # Use .env file
   npm install dotenv
   ```

   ```javascript
   require('dotenv').config();

   const PORT = process.env.PORT || 8080;
   const SESSION_SECRET = process.env.SESSION_SECRET;
   ```

---

## 📈 Performance Tips

### **Caching**
- Cache database schema to reduce MCP calls
- Implement query result caching for common queries

### **Connection Pooling**
- The MCP server uses asyncpg with connection pooling
- Web server reuses HTTP connections via axios

### **Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## 🚀 Deployment Options

### **1. Same Machine as VS Code**
- Simplest setup
- VS Code, MCP server, and web chatbot all on same machine
- Access via `localhost:8080`

### **2. Network Access**
- Run web chatbot on server
- VS Code and MCP on same server
- Users access via `http://server-ip:8080`

### **3. Docker Deployment**
```dockerfile
# Dockerfile (example)
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

### **4. Reverse Proxy (nginx)**
```nginx
server {
    listen 80;
    server_name chatbot.example.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📝 Requirements Summary

### **Runtime Requirements**
- ✅ VS Code with PostgreSQL MCP extension (must be running)
- ✅ GitHub Copilot subscription (active)
- ✅ MCP Server running (port 3000)
- ✅ Node.js 18+ installed
- ✅ PostgreSQL database accessible

### **User Requirements**
- ❌ **NO** GitHub account needed
- ❌ **NO** Copilot subscription needed
- ❌ **NO** VS Code needed
- ✅ Just a web browser!

---

## 🎉 Summary

**What You Get:**
- 🌐 Beautiful web interface
- 🤖 GitHub Copilot SQL generation
- 📊 Real-time query results
- 🔒 Optional authentication
- 💬 Chat-style interaction
- 📱 Mobile responsive

**Perfect For:**
- Teams where not everyone uses VS Code
- Non-technical users who need database access
- Quick database queries via web browser
- Demonstrating database capabilities

---

## 📞 Support

For issues or questions:
1. Check this README
2. Check main project documentation
3. Ensure all servers are running
4. Check browser console for errors
5. Check server logs for errors

---

**Made with ❤️ by Syed Majid Raza**

**Part of PostgreSQL MCP Project**
