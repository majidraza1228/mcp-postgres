# LLM Configuration Guide

To enable LLM capabilities in the GitHub Copilot Agent, you need to configure an LLM provider.

## Option 1: OpenAI (Recommended - Easiest)

1. Get an API key from https://platform.openai.com/api-keys

2. Create `.env` file:
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...your-key-here...
OPENAI_MODEL=gpt-4o-mini  # or gpt-4, gpt-3.5-turbo
```

3. Start the agent:
```bash
npm run start:server
```

## Option 2: Anthropic Claude

1. Get an API key from https://console.anthropic.com/

2. Create `.env` file:
```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...your-key-here...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

## Option 3: Azure OpenAI

1. Get Azure OpenAI credentials

2. Create `.env` file:
```bash
LLM_PROVIDER=azure
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=your-deployment-name
```

## Option 4: GitHub Copilot (If you have access)

**Note:** GitHub Copilot API access is limited. Most users should use OpenAI instead.

1. Get GitHub token with Copilot access

2. Create `.env` file:
```bash
LLM_PROVIDER=github
GITHUB_TOKEN=ghp_...your-token...
```

## Option 5: Ollama (Free, Local)

1. Install Ollama: https://ollama.ai/

2. Pull a model:
```bash
ollama pull llama2
```

3. Create `.env` file:
```bash
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama2
OLLAMA_BASE_URL=http://localhost:11434
```

## Architecture with LLM

```
Web Chatbot
     ↓ HTTP/WebSocket
GitHub Copilot Agent
     ↓                ↓
   LLM API      PostgreSQL MCP Server
(GPT-4, etc.)         ↓
                  PostgreSQL DB
```

The agent will:
1. Use LLM to understand natural language requests
2. Generate SQL queries using LLM
3. Call PostgreSQL MCP server to execute queries
4. Use LLM to explain results

## Example Queries

With LLM enabled, you can ask:

- "Show me all employees hired in 2023"
  → LLM generates SQL → Executes → Returns results

- "What's the average salary by department?"
  → LLM generates SQL → Executes → Explains results

- "Find customers who haven't ordered in 6 months"
  → LLM generates complex SQL → Executes → Analyzes

## Cost Considerations

- **OpenAI GPT-4**: ~$0.01 per request
- **OpenAI GPT-3.5**: ~$0.001 per request
- **Anthropic Claude**: ~$0.015 per request
- **Ollama (Local)**: Free!

For testing, start with OpenAI GPT-3.5-turbo (cheap and fast).
