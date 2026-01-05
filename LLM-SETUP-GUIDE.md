# LLM Configuration Guide for PostgreSQL Chatbot

## Why Do You Need an LLM?

The architecture works like this:

```
┌─────────────────────────────────────────────────────────────┐
│  You: "Show me all employees"                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│  LLM (GPT-4/Claude/Ollama)                                  │
│  - Understands natural language                             │
│  - Converts to tool calls                                   │
│  - Decides: "Use query_database tool with                   │
│              SELECT * FROM employees"                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│  GitHub Copilot Agent                                       │
│  - Receives tool call from LLM                              │
│  - Forwards to MCP server                                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│  MCP Server                                                 │
│  - Executes: SELECT * FROM employees                        │
│  - Returns results                                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│  PostgreSQL Database                                        │
│  - Adventureworks database                                  │
└─────────────────────────────────────────────────────────────┘
```

**Without LLM**: You can only use direct tool calls (technical)
**With LLM**: You can use natural language (user-friendly)

## LLM Options

### Option 1: OpenAI (GPT-4) ⭐ Recommended

**Pros:**
- ✅ Most powerful
- ✅ Best at understanding natural language
- ✅ Fast responses
- ✅ Easy to set up

**Cons:**
- ❌ Costs money (~$0.03 per query)
- ❌ Requires API key
- ❌ Data sent to OpenAI

**Setup:**

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)

2. Edit `.env` file:
```bash
cd /Users/syedraza/postgres-mcp/GithubCopilot-agent
code .env
```

3. Set your API key:
```env
PORT=8080

LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

4. Restart the agent:
```bash
./stop-chatbot.sh
./start-chatbot.sh
```

**Cost Estimate:**
- ~1000 queries = $30
- Each query: ~$0.03

### Option 2: Anthropic (Claude)

**Pros:**
- ✅ Very powerful (similar to GPT-4)
- ✅ Good at structured data
- ✅ Longer context window

**Cons:**
- ❌ Costs money (~$0.025 per query)
- ❌ Requires API key
- ❌ Data sent to Anthropic

**Setup:**

1. Get an API key from [Anthropic](https://console.anthropic.com/)

2. Edit `.env`:
```env
PORT=8080

LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

3. Restart the agent

### Option 3: Ollama (Local LLM) 🆓 Free!

**Pros:**
- ✅ Completely free
- ✅ Runs on your computer
- ✅ No data sent to cloud
- ✅ Unlimited queries
- ✅ Works offline

**Cons:**
- ❌ Slower than cloud LLMs
- ❌ Requires powerful computer (8GB+ RAM)
- ❌ Less accurate than GPT-4
- ❌ Requires additional setup

**Setup:**

1. **Install Ollama:**
```bash
# macOS
brew install ollama

# Or download from https://ollama.ai
```

2. **Start Ollama:**
```bash
ollama serve
```

3. **Download a model:**
```bash
# Recommended: Llama 3 (4GB)
ollama pull llama3

# Or smaller: Phi-3 (2.3GB)
ollama pull phi3

# Or larger: Mixtral (26GB)
ollama pull mixtral
```

4. **Configure agent `.env`:**
```env
PORT=8080

LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

5. **Restart the agent**

**System Requirements:**
- **8GB RAM minimum** (16GB+ recommended)
- **5GB+ free disk space**
- **macOS, Linux, or Windows**

## Quick Setup (Recommended Path)

### For Quick Testing: Use OpenAI

```bash
# 1. Get OpenAI API key from https://platform.openai.com/api-keys

# 2. Edit .env file
cd /Users/syedraza/postgres-mcp/GithubCopilot-agent
nano .env

# Add:
# LLM_PROVIDER=openai
# OPENAI_API_KEY=sk-proj-your-key-here

# 3. Restart
cd /Users/syedraza/postgres-mcp
./stop-chatbot.sh
./start-chatbot.sh
```

### For Free Solution: Use Ollama

```bash
# 1. Install Ollama
brew install ollama

# 2. Start Ollama (in a separate terminal)
ollama serve

# 3. Download model (in another terminal)
ollama pull llama3

# 4. Edit .env
cd /Users/syedraza/postgres-mcp/GithubCopilot-agent
nano .env

# Add:
# LLM_PROVIDER=ollama
# OLLAMA_URL=http://localhost:11434
# OLLAMA_MODEL=llama3

# 5. Restart
cd /Users/syedraza/postgres-mcp
./stop-chatbot.sh
./start-chatbot.sh
```

## Without LLM (Current Setup)

You can still use the chatbot WITHOUT an LLM, but you need to use specific queries:

### Works WITHOUT LLM:
```
List all tables
SELECT * FROM employees
Describe employees table
```

These work because the chatbot routes them directly to MCP tools.

### Requires LLM:
```
Show me all employees
Who works in the engineering department?
What tables do I have?
```

These require natural language understanding.

## Verifying LLM Configuration

After setting up, test it:

```bash
# Check agent health
curl http://localhost:8080/agent/info

# Should show:
# {
#   "llmEnabled": true,  ← Should be true!
#   ...
# }
```

## Troubleshooting

### "LLM not configured" error

**Cause:** No LLM provider set in `.env`

**Fix:**
```bash
cd /Users/syedraza/postgres-mcp/GithubCopilot-agent
cat .env  # Check current config

# Add LLM configuration
echo "LLM_PROVIDER=openai" >> .env
echo "OPENAI_API_KEY=your-key" >> .env

# Restart
cd /Users/syedraza/postgres-mcp
./stop-chatbot.sh
./start-chatbot.sh
```

### "Invalid API key" error

**OpenAI:**
- Verify key starts with `sk-proj-` or `sk-`
- Check at https://platform.openai.com/api-keys
- Ensure billing is set up

**Anthropic:**
- Verify key starts with `sk-ant-`
- Check at https://console.anthropic.com/

### Ollama not connecting

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Should return JSON with models

# If not, start Ollama:
ollama serve
```

### Ollama model not found

```bash
# List available models
ollama list

# Pull the model you want
ollama pull llama3
```

## Cost Comparison

| Provider | Cost per 1000 queries | Free Tier | Speed |
|----------|----------------------|-----------|-------|
| OpenAI (GPT-4) | $30 | $5 credit | Fast ⚡⚡⚡ |
| Anthropic (Claude) | $25 | $5 credit | Fast ⚡⚡⚡ |
| Ollama (Llama 3) | $0 | ∞ Free | Medium ⚡⚡ |

## Recommended Configuration

### For Production Use:
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-xxxxx
```

### For Development/Testing:
```env
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

### For Maximum Privacy:
```env
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

## Environment Variables Reference

```env
# Required
PORT=8080

# OpenAI Configuration
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-xxxxx
OPENAI_MODEL=gpt-4-turbo-preview  # Optional, defaults to gpt-4

# Anthropic Configuration
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx
ANTHROPIC_MODEL=claude-3-opus-20240229  # Optional

# Ollama Configuration
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

## Next Steps

1. **Choose your LLM provider** (OpenAI recommended for best results)
2. **Get API key** or **install Ollama**
3. **Update `.env` file**
4. **Restart chatbot** with `./start-chatbot.sh`
5. **Test natural language queries** in the chatbot

## Example .env Files

### Production (OpenAI):
```env
PORT=8080
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234
MCP_SERVER_URL=http://localhost:3000
```

### Development (Ollama):
```env
PORT=8080
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3
MCP_SERVER_URL=http://localhost:3000
```

---

**Need Help?**
- OpenAI API: https://platform.openai.com/docs
- Anthropic API: https://docs.anthropic.com
- Ollama: https://ollama.ai
