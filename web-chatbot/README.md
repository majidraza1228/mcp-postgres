# PostgreSQL MCP Web Chatbot

**Beautiful web interface for PostgreSQL queries using AI**

A clean, modern web chatbot that connects to your PostgreSQL database through the MCP server and uses AI providers (GitHub Copilot or ChatGPT) for natural language SQL generation.

<p align="center">
  <img src="https://raw.githubusercontent.com/syedmajidraza/mcp-postgres/main/docs/images/popup-chatbot-screenshot.png" alt="Web Chatbot Preview" width="700">
  <br>
  <em>Query your PostgreSQL database using natural language</em>
</p>

## ✨ Features

- 🤖 **Multiple AI Providers**: Choose between GitHub Copilot, ChatGPT, or Azure OpenAI
- 🎨 **Beautiful UI**: Modern, responsive chat interface
- 🔌 **MCP Integration**: Direct PostgreSQL access through MCP server
- ⚡ **No OAuth Setup**: GitHub Copilot works instantly via VS Code
- 💬 **Natural Language**: Ask questions in plain English
- 📊 **Rich Results**: Formatted tables and SQL syntax highlighting
- 🔒 **Developer Friendly**: Disabled options show what's possible with additional setup

---

## 🚀 Quick Start

### **Prerequisites**

1. ✅ **Node.js** - Version 18 or higher
2. ✅ **MCP Server** - Running on port 3000
3. ✅ **VS Code Extension** - PostgreSQL MCP extension active
4. ✅ **GitHub Copilot** - Active subscription (for Copilot option)
5. ⚙️ **OpenAI API Key** - Optional (for ChatGPT option)

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

### **Step 1: Start MCP Server**

```bash
cd mcp-server
source venv/bin/activate
python server.py
```

Verify it's running:
```bash
curl http://localhost:3000/health
```

### **Step 2: Start VS Code Extension**

1. Open VS Code with the PostgreSQL MCP extension installed
2. Ensure the extension is active (check status bar)
3. The extension automatically starts the Copilot proxy on port 9000

Verify Copilot proxy:
```bash
curl http://localhost:9000/health
```

### **Step 3: Start Web Chatbot**

```bash
cd web-chatbot
npm install  # First time only
npm start
```

### **Step 4: Access the Chatbot**

Open your browser:
```
http://localhost:8080
```

Select your AI provider (GitHub Copilot or ChatGPT) and start chatting!

---

## 🤖 AI Providers

### **GitHub Copilot (Recommended)**

- ✅ **No API keys needed**
- ✅ **Uses VS Code authentication**
- ✅ **Works immediately**
- Requires: VS Code extension running with active Copilot subscription

### **ChatGPT (Optional)**

- ⚙️ **Requires OpenAI API key**
- Get your key: [OpenAI API Keys](https://platform.openai.com/api-keys)
- Add to `.env`: `OPENAI_API_KEY=your_key_here`

### **Microsoft Teams / Azure OpenAI (Disabled)**

- 🔒 **Shown as disabled option**
- Requires Azure OpenAI resource and API key
- See [AZURE_OPENAI_SETUP.md](../docs/web-chatbot/AZURE_OPENAI_SETUP.md) for setup instructions
- Note: MS Teams Copilot has no public API - use Azure OpenAI instead

---

## 💡 Usage Examples

### **Natural Language Queries**

```
Show all tables in the database
What's the minimum salary of employees?
Create a table for storing products
Show top 10 customers by revenue this year
Find employees who haven't had a raise in 2 years
```

### **Direct SQL**

You can also execute SQL directly:
```sql
SELECT * FROM employees WHERE salary > 70000
```

---

## ⚙️ Configuration

### **Environment Variables (.env)**

```bash
# Server Configuration
PORT=8080
MCP_SERVER_URL=http://localhost:3000
COPILOT_PROXY_URL=http://localhost:9000

# ChatGPT (Optional)
OPENAI_API_KEY=your_api_key_here
```

### **Server Configuration**

Edit `src/server.js` to customize:
- Port numbers
- Session settings
- Timeout values

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

# Add to package.json scripts:
"dev": "nodemon src/server.js"

# Start in dev mode
npm run dev
```

### **Project Structure**

```
web-chatbot/
├── package.json          # Dependencies
├── .env                  # Configuration
├── src/
│   └── server.js        # Express server
├── public/
│   ├── index.html       # Chat interface
│   ├── index-simple.html # Provider selection
│   ├── styles.css       # Styling
│   └── app.js           # Client JavaScript
└── README.md            # This file
```

---

## 🐛 Troubleshooting

### **"VS Code Copilot proxy not running"**

**Solutions:**
1. Ensure VS Code is open with PostgreSQL MCP extension
2. Check Copilot is active (status bar icon)
3. Verify proxy: `curl http://localhost:9000/health`
4. Reload VS Code extension

### **"Connection refused" to MCP server**

**Solutions:**
1. Start MCP server: `cd mcp-server && python server.py`
2. Check MCP health: `curl http://localhost:3000/health`
3. Verify database connection in MCP `.env`

### **"ChatGPT Not Configured"**

**Solutions:**
1. Add `OPENAI_API_KEY` to `.env`
2. Get key from: https://platform.openai.com/api-keys
3. Restart server after adding key

### **Port already in use**

**Solutions:**
1. Check port: `lsof -i :8080`
2. Kill process or use different port
3. Set custom port: `PORT=8081 npm start`

---

## 🎯 Architecture

<p align="center">
  <img src="https://raw.githubusercontent.com/syedmajidraza/mcp-postgres/main/docs/images/provider-llm.png" alt="AI Provider Architecture" width="900">
  <br>
  <em>Complete architecture showing all AI provider options and data flow</em>
</p>

### Architecture Overview

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
     │ AI API               │ MCP API
     ▼                      ▼
┌──────────────────┐  ┌───────────────────────┐
│  VS Code Ext     │  │  MCP Server           │
│  Port: 9000      │  │  Port: 3000           │
│  (Copilot Proxy) │  │  (PostgreSQL)         │
└──────────────────┘  └───────────────────────┘
```

---

## 🔒 Security Considerations

### **Production Deployment**

1. **Enable HTTPS** - Use SSL/TLS certificates
2. **Strong Sessions** - Use secure session secrets
3. **Environment Variables** - Never commit `.env` to git
4. **Rate Limiting** - Implement API rate limits
5. **Input Validation** - Sanitize all user inputs

---

## 📝 Requirements Summary

### **Runtime Requirements**
- ✅ Node.js 18+
- ✅ MCP Server running (port 3000)
- ✅ VS Code with PostgreSQL MCP extension
- ✅ PostgreSQL database

### **User Requirements**
- ❌ **NO** GitHub account needed
- ❌ **NO** Copilot subscription needed (uses VS Code auth)
- ❌ **NO** VS Code needed (only server-side)
- ✅ Just a web browser!

---

## 🎉 Summary

**What You Get:**
- 🌐 Beautiful web interface
- 🤖 AI-powered SQL generation (3 provider options)
- 📊 Real-time query results
- 💬 Chat-style interaction
- 📱 Mobile responsive
- ⚡ Zero OAuth configuration (for GitHub Copilot)

**AI Provider Options:**
- ✅ GitHub Copilot - Works immediately
- ⚙️ ChatGPT - Simple API key setup
- 🔒 Azure OpenAI - Enterprise option (disabled by default)

**Perfect For:**
- Teams where not everyone uses VS Code
- Non-technical users who need database access
- Quick database queries via web browser
- Demonstrating database capabilities

---

## 📚 Documentation

Comprehensive documentation is available in the main [/docs](../docs/) folder:

### **Setup & Configuration**
- [AZURE_OPENAI_SETUP.md](../docs/web-chatbot/AZURE_OPENAI_SETUP.md) - Azure OpenAI setup guide (enterprise option)
- [CHANGELOG.md](../docs/web-chatbot/CHANGELOG.md) - Version history and changes

### **Architecture & Technical**
- [TECHNICAL_ARCHITECTURE_EXPLAINED.md](../docs/web-chatbot/TECHNICAL_ARCHITECTURE_EXPLAINED.md) - In-depth technical architecture explanation
  - Why GitHub Copilot works without API key (localhost proxy)
  - Why Azure OpenAI requires API key (cloud service)
  - Authentication flows and security models
  - Perfect for team briefings and technical discussions
- [FINAL_STATE.md](../docs/web-chatbot/FINAL_STATE.md) - Production-ready state documentation

### **Migration & Guides**
- [UPGRADE_GUIDE.md](../docs/web-chatbot/UPGRADE_GUIDE.md) - Migration guide for upgrades
- [POPUP_CHATBOT_CHANGES.md](../docs/web-chatbot/POPUP_CHATBOT_CHANGES.md) - Popup chatbot feature details
- [SCREENSHOT_GUIDE.md](../docs/web-chatbot/SCREENSHOT_GUIDE.md) - Visual guide and screenshots
- [CLEANUP_SUMMARY.md](../docs/web-chatbot/CLEANUP_SUMMARY.md) - Codebase cleanup summary

**See**: [Complete Documentation Index](../docs/README.md)

---

**Made with ❤️ by Syed Majid Raza**

**Part of PostgreSQL MCP Project**
