# Microsoft Teams Integration Plan
## PostgreSQL MCP Extension - Dual AI Provider Support

**Date:** December 20, 2025
**Objective:** Enable users to choose between GitHub Copilot or Microsoft Teams Chat for AI-powered SQL assistance

---

## Executive Summary

This plan outlines the implementation of:
1. **VSCode Extension Enhancement**: Add MS Teams Chat as an alternative AI provider alongside GitHub Copilot
2. **Teams Message Extension**: Create a standalone Teams app for postgres querying directly in Teams conversations

---

## Part 1: VSCode Extension - Dual AI Provider Support

### Current Architecture Analysis

**Existing Integration Points (9 locations in [extension.ts](vscode-extension/src/extension.ts)):**
- Line 104-111: Copilot Proxy Server
- Line 534-545: Main LLM selection for query generation
- Line 1075-1103: Inline completion for stored procedures
- Line 1140-1167: Inline completion for table creation
- Additional inline completion contexts

**Current Pattern:**
```typescript
const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
const model = models[0];
const messages = [vscode.LanguageModelChatMessage.User(systemPrompt)];
const chatResponse = await model.sendRequest(messages, {});
```

### Implementation Strategy

#### Option 1: Use VSCode Language Model Chat Provider API (RECOMMENDED)

**Benefits:**
- Uses VS Code's official extensible Language Model API (v1.104+)
- Follows the "Bring Your Own Key" (BYOK) pattern
- Can integrate ANY model provider (Azure OpenAI, Anthropic, local models, etc.)
- Future-proof and standards-compliant

**Implementation:**
1. Create a custom Language Model Chat Provider extension
2. Register the provider using: `vscode.lm.registerLanguageModelChatProvider()`
3. Users select the provider through VSCode settings
4. Your postgres-mcp extension queries available models dynamically

**Code Structure:**
```typescript
// New interface
interface AIProvider {
  name: string;
  vendor: string;
  authenticate(): Promise<boolean>;
  selectModel(): Promise<vscode.LanguageModelChat | null>;
}

// GitHub Copilot Provider
class CopilotProvider implements AIProvider {
  name = 'GitHub Copilot';
  vendor = 'copilot';

  async authenticate(): Promise<boolean> {
    // Check if GitHub Copilot is active
    const models = await vscode.lm.selectChatModels({ vendor: this.vendor });
    return models.length > 0;
  }

  async selectModel(): Promise<vscode.LanguageModelChat | null> {
    const models = await vscode.lm.selectChatModels({ vendor: this.vendor });
    return models[0] || null;
  }
}

// Custom Model Provider (Azure OpenAI, Anthropic, etc.)
class CustomModelProvider implements AIProvider {
  name = 'Azure OpenAI / Claude / Other';
  vendor = 'custom';

  async authenticate(): Promise<boolean> {
    // Check if custom provider extension is installed
    const models = await vscode.lm.selectChatModels({ family: 'gpt-4' });
    return models.length > 0;
  }

  async selectModel(): Promise<vscode.LanguageModelChat | null> {
    // Allow user to select from available models
    const allModels = await vscode.lm.selectChatModels();
    // Filter to preferred model family
    return allModels[0] || null;
  }
}

// Provider Manager
class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    this.providers.set('copilot', new CopilotProvider());
    this.providers.set('custom', new CustomModelProvider());
  }

  async getActiveProvider(): Promise<AIProvider> {
    const config = vscode.workspace.getConfiguration('postgresMcp');
    const selectedProvider = config.get('ai.provider', 'copilot');
    return this.providers.get(selectedProvider) || this.providers.get('copilot')!;
  }

  async getModel(): Promise<vscode.LanguageModelChat | null> {
    const provider = await this.getActiveProvider();
    const isAuthenticated = await provider.authenticate();

    if (!isAuthenticated) {
      throw new Error(`${provider.name} is not available. Please install and authenticate.`);
    }

    return await provider.selectModel();
  }
}
```

#### Option 2: Direct Teams Bot Integration (NOT RECOMMENDED for VSCode)

**Why NOT recommended:**
- Microsoft Teams doesn't provide a Language Model Chat Provider for VSCode
- Teams Chat is designed for the Teams app, not IDE integration
- Would require custom HTTP API integration (non-standard)

**However**, we CAN use Azure OpenAI (which powers Microsoft 365 Copilot) through the Language Model API with BYOK.

---

### Configuration Changes

**New Settings in [package.json](vscode-extension/package.json):**

```json
{
  "postgresMcp.ai.provider": {
    "type": "string",
    "default": "copilot",
    "enum": ["copilot", "custom"],
    "enumDescriptions": [
      "Use GitHub Copilot (requires GitHub Copilot subscription)",
      "Use custom language model (Azure OpenAI, Claude, local models via BYOK extensions)"
    ],
    "description": "Select the AI provider for SQL generation and completions"
  },
  "postgresMcp.ai.modelFamily": {
    "type": "string",
    "default": "gpt-4",
    "description": "Preferred model family when using custom provider (e.g., 'gpt-4', 'claude-3', 'llama')"
  },
  "postgresMcp.ai.fallbackEnabled": {
    "type": "boolean",
    "default": true,
    "description": "Fallback to GitHub Copilot if custom provider is unavailable"
  }
}
```

**Configuration UI Command:**
```typescript
vscode.commands.registerCommand('postgres-mcp.selectAIProvider', async () => {
  const providers = await getAvailableProviders();
  const selected = await vscode.window.showQuickPick(providers, {
    placeHolder: 'Select AI provider for SQL assistance'
  });

  if (selected) {
    await vscode.workspace.getConfiguration('postgresMcp')
      .update('ai.provider', selected.id, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`AI provider set to: ${selected.label}`);
  }
});
```

---

### Code Changes Required

**1. Create Provider Abstraction ([vscode-extension/src/providers/ai-provider.ts](vscode-extension/src/providers/ai-provider.ts)):**
- New file with `AIProvider` interface
- `CopilotProvider` class
- `CustomModelProvider` class
- `AIProviderManager` class

**2. Update Main Extension ([vscode-extension/src/extension.ts](vscode-extension/src/extension.ts)):**

**Lines to modify:**
- Line 104-111: Replace direct Copilot call with `providerManager.getModel()`
- Line 534-545: Same replacement
- Line 1075-1103: Same replacement
- Line 1140-1167: Same replacement
- All 9 total locations

**Before:**
```typescript
const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
if (models.length === 0) {
    throw new Error('GitHub Copilot is not available');
}
const model = models[0];
```

**After:**
```typescript
const providerManager = new AIProviderManager();
const model = await providerManager.getModel();
if (!model) {
    throw new Error('No AI provider is available');
}
```

**3. Add Status Bar Indicator:**
```typescript
// Show active provider in status bar
const aiProviderStatusBar = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Right,
  100
);
aiProviderStatusBar.text = "$(sparkle) AI: GitHub Copilot";
aiProviderStatusBar.command = 'postgres-mcp.selectAIProvider';
aiProviderStatusBar.show();
```

---

## Part 2: Teams Message Extension

### Architecture

```
Microsoft Teams Client
    ↓ (Bot Framework messaging)
    ↓
Azure Bot Service
    ↓ (HTTPS webhook)
    ↓
Your Message Extension Backend (Node.js/Python)
    ↓ (HTTP requests)
    ↓
PostgreSQL MCP Server (FastAPI)
    ↓ (SQL queries)
    ↓
PostgreSQL Database
```

### Implementation Approach

**Option 1: API-Based Message Extension (RECOMMENDED)**

**Benefits:**
- Simpler architecture
- No bot hosting required for basic scenarios
- Direct REST API integration
- OAuth 2.0 / SSO authentication

**Structure:**
```typescript
// manifest.json (Teams app manifest)
{
  "manifestVersion": "1.17",
  "version": "1.0.0",
  "id": "postgres-mcp-teams-extension",
  "name": {
    "short": "PostgreSQL MCP",
    "full": "PostgreSQL MCP Query Assistant"
  },
  "composeExtensions": [{
    "botId": "YOUR_BOT_ID",
    "commands": [{
      "id": "queryDatabase",
      "type": "query",
      "title": "Query Database",
      "description": "Execute SQL queries on PostgreSQL",
      "parameters": [{
        "name": "query",
        "title": "SQL Query",
        "description": "Enter your SQL query or natural language question"
      }]
    }, {
      "id": "listTables",
      "type": "action",
      "title": "List Tables",
      "description": "Show all database tables"
    }, {
      "id": "describeTable",
      "type": "query",
      "title": "Describe Table",
      "description": "Get schema for a table",
      "parameters": [{
        "name": "tableName",
        "title": "Table Name"
      }]
    }],
    "messageHandlers": [{
      "type": "link",
      "value": {
        "domains": ["*.yourdomain.com"]
      }
    }]
  }],
  "authorization": {
    "authType": "OAuth",
    "oAuthClientRegistrationId": "YOUR_OAUTH_CLIENT_ID"
  }
}
```

**Backend Implementation (Python FastAPI):**

```python
# teams_extension.py
from fastapi import FastAPI, Request, HTTPException
from botbuilder.schema import Activity
from botbuilder.core import TurnContext, BotAdapter
import httpx

app = FastAPI()

# Your existing MCP server endpoint
MCP_SERVER_URL = "http://localhost:3000"

@app.post("/api/messages")
async def messages_handler(request: Request):
    """Handle incoming Teams messages"""
    activity = Activity().deserialize(await request.json())

    if activity.type == "message":
        # Extract query from message
        user_query = activity.text

        # Call your MCP server
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{MCP_SERVER_URL}/mcp/v1/tools/call",
                json={
                    "name": "query_database",
                    "arguments": {"query": user_query}
                }
            )

        # Format response for Teams
        result_data = response.json()
        formatted_response = format_as_adaptive_card(result_data)

        return {
            "type": "message",
            "text": formatted_response
        }

    return {"status": "ok"}

def format_as_adaptive_card(data):
    """Format database results as Teams Adaptive Card"""
    return {
        "type": "AdaptiveCard",
        "version": "1.4",
        "body": [{
            "type": "TextBlock",
            "text": "Query Results",
            "weight": "bolder",
            "size": "large"
        }, {
            "type": "FactSet",
            "facts": [
                {"title": key, "value": str(value)}
                for key, value in data.items()
            ]
        }]
    }
```

### Authentication Setup

**OAuth 2.0 Flow:**
1. Register app in Azure AD
2. Configure OAuth scopes for database access
3. Store connection strings securely in Azure Key Vault
4. Use SSO for seamless authentication

**Security Considerations:**
- Never expose database credentials in Teams
- Use Azure AD authentication for postgres (recommended)
- Implement row-level security based on Teams user
- Audit all queries with user tracking

---

## Implementation Phases

### Phase 1: VSCode Extension Enhancement (Week 1-2)
1. Create AI provider abstraction layer
2. Implement provider switching logic
3. Add configuration UI
4. Update all 9 Copilot integration points
5. Test with GitHub Copilot (existing)
6. Test with Azure OpenAI BYOK extension

### Phase 2: Teams Message Extension (Week 3-4)
1. Set up Azure Bot Service
2. Create Teams app manifest
3. Implement message handlers
4. Integrate with existing MCP server
5. Design Adaptive Cards for results
6. Configure OAuth authentication

### Phase 3: Testing & Documentation (Week 5)
1. End-to-end testing both providers
2. Security audit
3. Performance testing
4. Update documentation
5. Create video tutorials

---

## Technical Dependencies

### VSCode Extension
- VS Code 1.104+ (for Language Model Chat Provider API)
- Node.js 18+
- TypeScript 5.0+
- BYOK extensions (optional): Azure AI Toolkit, Hugging Face Provider

### Teams Message Extension
- Azure subscription (for Bot Service)
- Bot Framework SDK 4.x
- Teams Toolkit for VS Code
- FastAPI (already in use)
- Azure AD app registration

---

## Cost Considerations

### VSCode Extension
- **GitHub Copilot**: $10-19/month per user (existing cost)
- **Azure OpenAI BYOK**: Pay-per-token (varies by model)
- **Other providers**: Varies (Anthropic Claude, local models are free)

### Teams Message Extension
- **Azure Bot Service**: ~$0.50 per 1,000 messages
- **Azure App Service**: ~$13-54/month (depending on tier)
- **Azure AD**: Free for basic authentication

---

## Security & Compliance

### Data Flow
1. **VSCode Extension**: Schema metadata only sent to AI (no data)
2. **Teams Extension**: Full query results sent to Teams (requires encryption)

### Requirements
- TLS 1.2+ for all communications
- Azure Key Vault for secrets
- Audit logging for all database access
- Compliance with SOC 2 / GDPR if applicable

---

## Next Steps

1. **Get Approval**: Review this plan with stakeholders
2. **Set Up Azure**: Create Azure subscription and Bot Service
3. **Start Phase 1**: Begin AI provider abstraction implementation
4. **Documentation**: Create user guides for both integrations

---

## Resources & Documentation

### VSCode Language Model API
- [Language Model Chat Provider API](https://code.visualstudio.com/api/extension-guides/ai/language-model-chat-provider)
- [Bring Your Own Key in VS Code](https://code.visualstudio.com/blogs/2025/10/22/bring-your-own-key)
- [AI Language Models in VS Code](https://code.visualstudio.com/docs/copilot/customization/language-models)

### Teams Message Extensions
- [Build API-based Message Extension](https://learn.microsoft.com/en-us/microsoftteams/platform/messaging-extensions/create-api-message-extension)
- [Authentication for Message Extensions](https://learn.microsoft.com/en-us/microsoftteams/platform/messaging-extensions/how-to/add-authentication)
- [OAuth for API-based Message Extensions](https://learn.microsoft.com/en-us/microsoftteams/platform/messaging-extensions/api-based-oauth)

### GitHub Copilot Integration
- [GitHub Copilot Extension for Teams Toolkit](https://devblogs.microsoft.com/microsoft365dev/preview-the-github-copilot-extension-for-teams-toolkit/)

---

## Contact & Questions

For questions about this implementation plan:
- Create an issue at: https://github.com/anthropics/claude-code/issues
- Review existing VSCode extension: [extension.ts](vscode-extension/src/extension.ts)
- Review MCP server: [server.py](mcp-server/server.py)
