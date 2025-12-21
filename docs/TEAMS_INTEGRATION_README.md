# PostgreSQL MCP with Multi-Provider AI Support

## Overview

This project now supports **dual AI provider integration**, giving users the choice between:

1. **GitHub Copilot** - Premium AI assistant with GitHub integration
2. **Custom Models via BYOK** - Azure OpenAI, Anthropic Claude, local models, or any VS Code Language Model provider

Additionally, we've created a **Microsoft Teams Message Extension** to query PostgreSQL databases directly from Teams conversations.

---

## 🎯 Key Features

### VSCode Extension Enhancements

- ✅ **AI Provider Abstraction**: Switch between GitHub Copilot and custom models seamlessly
- ✅ **Fallback Support**: Automatically fall back to GitHub Copilot if custom provider fails
- ✅ **Provider Selection UI**: Easy command palette interface to choose your AI provider
- ✅ **Custom Model Support**: Use any model through VS Code's BYOK extensions
  - Azure OpenAI (GPT-4, GPT-4o, etc.)
  - Anthropic Claude (3.5 Sonnet, etc.)
  - Local models (Llama, Mistral, etc.)
  - Any provider implementing VS Code Language Model API

### Teams Message Extension

- ✅ **Query Database**: Execute SQL queries from Teams
- ✅ **List Tables**: Browse database schema
- ✅ **Describe Tables**: Get detailed table information
- ✅ **Adaptive Cards**: Rich, interactive result display
- ✅ **OAuth Authentication**: Secure access control

---

## 📁 Project Structure

```
postgres-mcp/
├── vscode-extension/           # VSCode extension with multi-provider AI
│   ├── src/
│   │   ├── extension.ts        # Main extension (updated for multi-provider)
│   │   └── providers/
│   │       └── ai-provider.ts  # NEW: AI provider abstraction layer
│   └── package.json            # Updated with new settings
│
├── teams-message-extension/    # NEW: Microsoft Teams integration
│   ├── src/
│   │   └── index.ts           # Bot Framework server
│   ├── manifest/
│   │   └── manifest.json      # Teams app manifest
│   ├── package.json
│   └── README.md
│
├── mcp-server/                 # Existing MCP FastAPI server
│   └── server.py
│
├── TEAMS_INTEGRATION_PLAN.md   # Detailed implementation plan
└── TEAMS_INTEGRATION_README.md # This file
```

---

## 🚀 Quick Start

### 1. VSCode Extension with Multi-Provider AI

#### Installation

The VSCode extension is already installed if you were using it before. The new AI provider features are now available.

#### Configuration

1. **Open VSCode Settings** (`Cmd+,` or `Ctrl+,`)
2. Search for `PostgreSQL MCP`
3. Configure AI provider settings:

**Available Settings:**

```json
{
  "postgresMcp.ai.provider": "copilot",  // or "custom"
  "postgresMcp.ai.modelFamily": "gpt-4", // for custom provider
  "postgresMcp.ai.fallbackEnabled": true // auto-fallback to Copilot
}
```

#### Switching AI Providers

**Method 1: Command Palette**
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type: `PostgreSQL MCP: Select AI Provider`
3. Choose from available providers:
   - GitHub Copilot
   - Custom Model (BYOK)

**Method 2: Settings UI**
1. Open Settings
2. Navigate to `PostgreSQL MCP > AI > Provider`
3. Select from dropdown

#### Using Custom Models

To use custom models (Azure OpenAI, Claude, etc.), you need to install a BYOK extension:

**Recommended Extensions:**

1. **Azure AI Toolkit** - For Azure OpenAI models
   ```bash
   code --install-extension ms-windows-ai-studio.windows-ai-studio
   ```

2. **Hugging Face Provider** - For Hugging Face models
   ```bash
   code --install-extension huggingface.huggingface-vscode
   ```

3. **Continue** - For local models and multiple providers
   ```bash
   code --install-extension continue.continue
   ```

After installing a BYOK extension:
1. Configure the extension's API keys/settings
2. Select "Custom Model" in PostgreSQL MCP settings
3. Specify preferred model family (e.g., "gpt-4", "claude-3")

---

### 2. Microsoft Teams Message Extension

#### Prerequisites

- Azure subscription
- Node.js 18+
- Teams admin rights (for deployment)

#### Setup Steps

1. **Navigate to Teams extension directory**
   ```bash
   cd teams-message-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create Azure Bot** (see [Teams Extension README](teams-message-extension/README.md))

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Azure Bot credentials
   ```

5. **Start the server**
   ```bash
   npm run dev  # Development mode
   # OR
   npm run build && npm start  # Production mode
   ```

6. **Deploy to Teams** (see detailed instructions in [Teams Extension README](teams-message-extension/README.md))

---

## 🎨 Usage Examples

### VSCode Extension

#### Example 1: Using GitHub Copilot (Default)

```sql
-- In a .sql file, start typing:
SELECT * FROM employees WHERE

-- GitHub Copilot suggests completions based on your schema
-- Press Tab to accept
```

#### Example 2: Switching to Azure OpenAI

1. Install Azure AI Toolkit extension
2. Configure your Azure OpenAI API key
3. Run command: `PostgreSQL MCP: Select AI Provider`
4. Choose "Custom Model (BYOK)"
5. Set model family in settings: `"postgresMcp.ai.modelFamily": "gpt-4"`

Now your SQL completions will use Azure OpenAI instead of Copilot!

#### Example 3: Using Chat with Custom Provider

```
@postgres /query

User: "Show me all orders from last month"

AI (using selected provider): Generates SQL query based on your schema
```

### Teams Message Extension

#### Example 1: Query from Teams

1. In any Teams chat, type: `@PostgreSQL MCP`
2. Select "Query Database"
3. Enter: `SELECT * FROM customers LIMIT 10`
4. Results appear as an Adaptive Card

#### Example 2: List Tables

1. Type: `@PostgreSQL MCP`
2. Select "List Tables"
3. See all tables in a formatted card

---

## 🔧 Configuration Reference

### VSCode Extension Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `postgresMcp.ai.provider` | string | `"copilot"` | AI provider: "copilot" or "custom" |
| `postgresMcp.ai.modelFamily` | string | `"gpt-4"` | Preferred model family for custom provider |
| `postgresMcp.ai.fallbackEnabled` | boolean | `true` | Fallback to Copilot if custom fails |
| `postgresMcp.database.host` | string | `"localhost"` | Database host |
| `postgresMcp.database.port` | number | `5431` | Database port |
| `postgresMcp.database.name` | string | `"AdventureWorks"` | Database name |
| `postgresMcp.inline.enabled` | boolean | `true` | Enable inline completions |

### Teams Extension Environment Variables

| Variable | Description |
|----------|-------------|
| `BOT_ID` | Azure Bot App ID |
| `BOT_PASSWORD` | Azure Bot Client Secret |
| `MCP_SERVER_URL` | URL of MCP server (default: http://localhost:3000) |
| `PORT` | Server port (default: 3978) |
| `AZURE_AD_CLIENT_ID` | Azure AD App ID for OAuth |

---

## 🏗️ Architecture

### VSCode Extension Architecture

```
┌─────────────────────────────────────────────────────┐
│           VSCode Extension (Postgres MCP)           │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │      AI Provider Manager                      │ │
│  │  ┌─────────────┐     ┌──────────────────┐    │ │
│  │  │   Copilot   │     │  Custom Models   │    │ │
│  │  │   Provider  │     │  (BYOK Provider) │    │ │
│  │  └─────────────┘     └──────────────────┘    │ │
│  └───────────────────────────────────────────────┘ │
│                        ↓                            │
│              VS Code Language Model API             │
│                        ↓                            │
│       ┌────────────────┴────────────────┐          │
│       ↓                                  ↓          │
│  GitHub Copilot                   Azure OpenAI     │
│  (GPT-4, GPT-3.5, o1)           Claude, Local, etc │
└─────────────────────────────────────────────────────┘
                        ↓
                  MCP Server
                        ↓
                  PostgreSQL
```

### Teams Extension Architecture

```
┌──────────────────┐
│ Microsoft Teams  │
│   (User Interface)
└────────┬─────────┘
         ↓ Bot Framework Protocol
┌────────────────────────┐
│  Azure Bot Service     │
└────────┬───────────────┘
         ↓ HTTPS Webhook
┌──────────────────────────────────┐
│ Teams Message Extension (Node.js)│
│  - Bot Framework SDK             │
│  - Adaptive Cards                │
│  - Message Handlers              │
└────────┬─────────────────────────┘
         ↓ HTTP API
┌─────────────────────┐
│  MCP Server (FastAPI)
└────────┬────────────┘
         ↓ SQL
┌────────────────┐
│   PostgreSQL   │
└────────────────┘
```

---

## 🔐 Security Best Practices

### VSCode Extension

1. **Schema Only**: Only database schema (table/column names) is sent to AI providers, never actual data
2. **No Credentials**: Database credentials stay local, never sent to AI services
3. **Provider Choice**: Users control which AI provider to use
4. **Fallback Control**: Users can disable fallback to prevent unexpected provider usage

### Teams Extension

1. **OAuth Authentication**: Use Azure AD for user authentication
2. **Row-Level Security**: Implement in PostgreSQL based on Teams user
3. **Audit Logging**: Track all queries with user information
4. **Secret Management**: Use Azure Key Vault for credentials
5. **TLS Encryption**: Enable for all communications

---

## 📊 Cost Comparison

### AI Provider Costs

| Provider | Model | Cost per 1M tokens | Notes |
|----------|-------|-------------------|-------|
| **GitHub Copilot** | Various | $10-19/month | Flat monthly fee, unlimited usage |
| **Azure OpenAI** | GPT-4 Turbo | ~$10 input / $30 output | Pay per token |
| **Azure OpenAI** | GPT-4o | ~$2.50 input / $10 output | Cheaper alternative |
| **Anthropic Claude** | Claude 3.5 Sonnet | ~$3 input / $15 output | Via BYOK extension |
| **Local Models** | Llama 3, etc. | Free | Self-hosted |

### Teams Extension Costs

- **Azure Bot Service**: ~$0.50 per 1,000 messages
- **Azure App Service**: ~$13-54/month (Basic tier)
- **Azure AD**: Free for basic authentication

---

## 🐛 Troubleshooting

### VSCode Extension

**Issue**: AI provider not available

**Solution**:
1. Check if selected provider is installed and authenticated
2. For GitHub Copilot: Ensure active subscription
3. For custom models: Install BYOK extension and configure API keys
4. Enable fallback: `"postgresMcp.ai.fallbackEnabled": true`

**Issue**: Completions not working

**Solution**:
1. Check output channel: View → Output → PostgreSQL MCP
2. Verify MCP server is running: `PostgreSQL MCP: Show Server Status`
3. Check AI provider status: Run `PostgreSQL MCP: Select AI Provider`

### Teams Extension

**Issue**: Bot not responding

**Solution**:
1. Verify Azure Bot messaging endpoint
2. Check BOT_ID and BOT_PASSWORD in .env
3. Review Azure Bot Service logs

**Issue**: Database connection errors

**Solution**:
1. Ensure MCP server is running
2. Verify MCP_SERVER_URL in .env
3. Check network connectivity and firewall rules

---

## 🚢 Deployment

### VSCode Extension

The extension can be compiled and packaged:

```bash
cd vscode-extension
npm run compile
npm run package  # Creates .vsix file
```

Install the .vsix file:
```bash
code --install-extension postgres-mcp-copilot-1.0.0.vsix
```

### Teams Extension

See [Teams Extension Deployment Guide](teams-message-extension/README.md#deployment-options)

---

## 📚 Additional Resources

### Documentation

- [Implementation Plan](TEAMS_INTEGRATION_PLAN.md) - Detailed technical plan
- [VSCode Extension README](vscode-extension/README.md) - Extension documentation
- [Teams Extension README](teams-message-extension/README.md) - Teams bot documentation

### VS Code APIs

- [Language Model Chat Provider API](https://code.visualstudio.com/api/extension-guides/ai/language-model-chat-provider)
- [Bring Your Own Key in VS Code](https://code.visualstudio.com/blogs/2025/10/22/bring-your-own-key)
- [AI Language Models in VS Code](https://code.visualstudio.com/docs/copilot/customization/language-models)

### Teams Development

- [Build API-based Message Extension](https://learn.microsoft.com/en-us/microsoftteams/platform/messaging-extensions/create-api-message-extension)
- [Authentication for Message Extensions](https://learn.microsoft.com/en-us/microsoftteams/platform/messaging-extensions/how-to/add-authentication)
- [OAuth for API-based Message Extensions](https://learn.microsoft.com/en-us/microsoftteams/platform/messaging-extensions/api-based-oauth)

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📝 License

MIT License - See LICENSE file for details

---

## 💬 Support

For questions and issues:
- GitHub Issues: https://github.com/anthropics/claude-code/issues
- Review the troubleshooting section above
- Check the implementation plan for technical details

---

## 🎉 What's New

### Version 1.1.0 (Current)

- ✨ **Multi-Provider AI Support**: Choose between GitHub Copilot and custom models
- ✨ **Provider Abstraction Layer**: Clean architecture for adding more providers
- ✨ **Auto-Fallback**: Seamless fallback to GitHub Copilot if custom provider fails
- ✨ **Teams Message Extension**: Query PostgreSQL from Microsoft Teams
- ✨ **Adaptive Cards**: Rich, interactive results in Teams
- 📝 **Comprehensive Documentation**: Updated guides and examples

### Roadmap

- [ ] Support for more AI providers (Google Gemini, etc.)
- [ ] Enhanced natural language processing
- [ ] Query result caching
- [ ] Multi-database support in Teams
- [ ] Advanced analytics and visualization
- [ ] Slack integration (similar to Teams)

---

**Enjoy your multi-provider PostgreSQL assistant! 🚀**
