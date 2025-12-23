# Quick Setup - Get LLM Working in 2 Minutes!

Since you have GitHub Copilot subscription, here's the **easiest way** to get started:

## Option 1: Use OpenAI (Easiest - 2 minutes)

GitHub Copilot uses OpenAI GPT-4 under the hood anyway!

### Step 1: Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-...`)

### Step 2: Create `.env` file

```bash
cd /Users/syedraza/postgres-mcp/GithubCopilot-agent
cat > .env << 'EOF'
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...paste-your-key-here...
OPENAI_MODEL=gpt-4o-mini
PORT=8080
EOF
```

### Step 3: Install and Run

```bash
npm install
npm run build
npm run start:server
```

Done! The agent will now use GPT-4 to help with SQL queries!

## Option 2: Use Ollama (Free, No API Key Needed!)

If you don't want to pay for API calls:

### Step 1: Install Ollama

```bash
# macOS
brew install ollama

# Or download from https://ollama.ai/
```

### Step 2: Start Ollama and Pull Model

```bash
ollama serve  # In one terminal

# In another terminal:
ollama pull llama2
```

### Step 3: Create `.env` file

```bash
cat > .env << 'EOF'
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama2
OLLAMA_BASE_URL=http://localhost:11434
PORT=8080
EOF
```

### Step 4: Run

```bash
npm run start:server
```

## What This Gives You

With LLM enabled, your chatbot can:

✅ **Natural Language to SQL**
- You: "Show me all employees hired in 2023"
- LLM: Generates `SELECT * FROM employees WHERE hire_date >= '2023-01-01'`
- Executes and shows results

✅ **Smart Query Generation**
- You: "What's the average salary by department?"
- LLM: Creates proper GROUP BY query with AVG()

✅ **Explain Results**
- Shows query results
- LLM explains what the data means in plain English

✅ **Database Chat**
- Ask questions about your data
- Get insights and recommendations

## Cost

- **OpenAI GPT-4o-mini**: ~$0.15 per 1M tokens (~1000 requests)
- **Ollama**: **FREE!** (Runs locally)

## Test It

After setup, open the chatbot and try:

```
Show me the top 5 employees by salary
```

The LLM will generate the SQL, execute it via your MCP server, and show the results!

## Architecture

```
You type in chatbot
    ↓
"Show me top 5 employees"
    ↓
Agent Server (port 8080)
    ↓
LLM (GPT-4 or Llama2)
    ↓
Generates: SELECT * FROM employees ORDER BY salary DESC LIMIT 5
    ↓
Calls PostgreSQL MCP Server (port 3000)
    ↓
Executes query
    ↓
Returns results to chatbot
    ↓
LLM explains the results
```

## Next Steps

1. Choose Option 1 (OpenAI) or Option 2 (Ollama)
2. Create `.env` file
3. Run `npm install && npm run build && npm run start:server`
4. Open the chatbot
5. Try natural language queries!

**Need help?** Check [CONFIG.md](CONFIG.md) for more details.
