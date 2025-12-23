# GitHub Copilot Setup Guide

Since you have a GitHub Copilot subscription, you can use GitHub's AI models!

## Step 1: Get GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: `Copilot Agent`
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `read:user` (Read user profile data)
5. Click "Generate token"
6. **Copy the token** (starts with `ghp_...`) - you won't see it again!

## Step 2: Create `.env` File

```bash
cd /Users/syedraza/postgres-mcp/GithubCopilot-agent

cat > .env << 'EOF'
# GitHub Copilot LLM Configuration
LLM_PROVIDER=github
GITHUB_TOKEN=ghp_...paste-your-token-here...
GITHUB_MODEL=gpt-4o

# Server Port (use 8080 since 3000 is taken by your MCP server)
PORT=8080
EOF
```

**Important:** Replace `ghp_...paste-your-token-here...` with your actual token!

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Build the Project

```bash
npm run build
```

## Step 5: Start the Agent

```bash
npm run start:server
```

You should see:
```
LLM Provider: github
LLM Model: gpt-4o
╔════════════════════════════════════════════════════════╗
║       GitHub Copilot Agent Server Started             ║
╠════════════════════════════════════════════════════════╣
║  HTTP Server:      http://localhost:8080              ║
║  WebSocket:        ws://localhost:8080                ║
...
```

## Architecture

```
Web Chatbot (Browser)
         ↓
GitHub Copilot Agent (port 8080)
    ↙          ↘
GitHub        PostgreSQL
Models        MCP Server
(GPT-4)      (port 3000)
                ↓
           PostgreSQL DB
```

## How It Works

1. **You type**: "Show me all employees hired in 2023"
2. **Agent** sends to **GitHub Models (GPT-4)**
3. **GPT-4** generates: `SELECT * FROM employees WHERE hire_date >= '2023-01-01'`
4. **Agent** calls **PostgreSQL MCP Server** at `http://localhost:3000/mcp/v1/tools/call`
5. **MCP Server** executes query on database
6. **Results** returned to chatbot
7. **GPT-4** explains the results in plain English

## Available Models

GitHub Models gives you access to:

- `gpt-4o` - Latest GPT-4 (recommended)
- `gpt-4o-mini` - Faster, cheaper
- `gpt-4-turbo` - Previous generation
- `gpt-3.5-turbo` - Fast and cheap

## Update the Chatbot

Your current chatbot connects directly to port 3000 (MCP server).
Now you need to update it to connect to port 8080 (Agent with LLM).

Let me create an updated chatbot for you...

## Test Without Chatbot

You can test the API directly:

```bash
# Test LLM query generation
curl -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me the top 5 employees by salary"}'
```

The agent will:
1. Use GitHub's GPT-4 to generate SQL
2. Execute it on your PostgreSQL
3. Return the results

## Troubleshooting

### "GitHub Models API error: 401"

Your token is invalid or doesn't have Copilot access.
- Make sure you have an active GitHub Copilot subscription
- Check the token has the right scopes

### "Connection refused on port 8080"

The agent isn't running. Start it with:
```bash
npm run start:server
```

### "No LLM provider configured"

Make sure `.env` file exists and has:
```
LLM_PROVIDER=github
GITHUB_TOKEN=ghp_...
```

## Cost

With GitHub Copilot subscription, you get:
- ✅ **Free** access to GitHub Models (within limits)
- ✅ No per-request charges (unlike OpenAI)
- ✅ Rate limits apply (60 requests/minute typically)

## Next Steps

1. Verify agent is running on port 8080
2. I'll update the chatbot to use the agent
3. Test natural language queries!
