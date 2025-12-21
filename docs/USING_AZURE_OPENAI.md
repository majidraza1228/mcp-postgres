# Using Azure OpenAI as Your AI Provider
## Access the Same Models as Microsoft 365 Copilot

Microsoft 365 Copilot uses Azure OpenAI (GPT-4) under the hood. You can access these same models in your PostgreSQL MCP extension using Azure OpenAI BYOK (Bring Your Own Key).

---

## Why Use Azure OpenAI Instead of MS 365 Copilot?

| Feature | Microsoft 365 Copilot | Azure OpenAI BYOK |
|---------|----------------------|-------------------|
| **Available in VSCode** | ❌ No | ✅ Yes |
| **Same GPT-4 Models** | ✅ Yes | ✅ Yes |
| **Your Azure Tenant** | ✅ Yes | ✅ Yes |
| **Data Residency Control** | ✅ Yes | ✅ Yes |
| **Cost** | Part of M365 license | Pay-per-token |
| **API Access** | Limited | Full control |

**Bottom Line**: Azure OpenAI gives you access to the same GPT-4 models that power MS 365 Copilot, but with full API control.

---

## Setup Guide: Azure OpenAI as Your AI Provider

### Prerequisites

1. **Azure Subscription**: Active Azure account
2. **Azure OpenAI Access**: Request access at https://aka.ms/oai/access
3. **VSCode**: Version 1.104 or higher

---

### Step 1: Create Azure OpenAI Resource

1. **Go to Azure Portal**: https://portal.azure.com

2. **Create Azure OpenAI Service**:
   ```bash
   # Via Azure CLI
   az cognitiveservices account create \
     --name my-postgres-openai \
     --resource-group my-resource-group \
     --kind OpenAI \
     --sku S0 \
     --location eastus
   ```

   Or use the portal:
   - Search for "Azure OpenAI"
   - Click "Create"
   - Fill in details and create

3. **Deploy a Model**:
   - Go to your Azure OpenAI resource
   - Navigate to "Model deployments"
   - Click "Create new deployment"
   - Select model: **gpt-4** or **gpt-4-32k** or **gpt-4o**
   - Name it (e.g., "gpt4-deployment")

4. **Get Your API Key**:
   - Go to "Keys and Endpoint"
   - Copy **KEY 1**
   - Copy **Endpoint URL** (e.g., https://my-postgres-openai.openai.azure.com/)

---

### Step 2: Install Azure AI Toolkit Extension

You need a BYOK extension to connect VSCode to Azure OpenAI:

#### Option A: Azure AI Toolkit (Recommended)

```bash
code --install-extension ms-windows-ai-studio.windows-ai-studio
```

**Configure the extension**:
1. Open VSCode
2. Press `Cmd+Shift+P` → Search "Azure AI"
3. Sign in with your Azure account
4. The extension will auto-discover your Azure OpenAI deployments

#### Option B: GitHub Copilot with Azure OpenAI (Enterprise BYOK)

If you have **GitHub Copilot Enterprise** with BYOK:

1. Your organization admin configures Azure OpenAI in GitHub Enterprise settings
2. GitHub Copilot will use your Azure OpenAI endpoint
3. No additional configuration needed

---

### Step 3: Configure PostgreSQL MCP Extension

1. **Open VSCode Settings** (`Cmd+,`)

2. **Set AI Provider to Custom**:
   ```json
   {
     "postgresMcp.ai.provider": "custom",
     "postgresMcp.ai.modelFamily": "gpt-4",
     "postgresMcp.ai.fallbackEnabled": true
   }
   ```

3. **Verify Connection**:
   - Press `Cmd+Shift+P`
   - Run: `PostgreSQL MCP: Select AI Provider`
   - You should see "Custom Model (BYOK)" with status "✓ Available"

---

### Step 4: Test It Out

1. **Open a .sql file** in your workspace

2. **Start typing**:
   ```sql
   SELECT * FROM employees WHERE
   ```

3. **AI completions** should now come from **Azure OpenAI** (your deployment) instead of GitHub Copilot!

4. **Use Chat**:
   - Open GitHub Copilot Chat (not the provider, just the UI)
   - Type: `@postgres /query`
   - Ask: "Show me all orders from last month"
   - The SQL generation will use your Azure OpenAI model

---

## Advanced Configuration

### Using Specific Azure OpenAI Endpoints

If the Azure AI Toolkit doesn't auto-detect your deployment, you can create a custom provider:

#### Create Custom Provider Extension (Advanced)

1. **Create a new VSCode extension**:

```typescript
// extension.ts
import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
    // Register your Azure OpenAI provider
    const provider = vscode.lm.registerLanguageModelChatProvider(
        'azure-openai-custom',
        new AzureOpenAIChatProvider()
    );
    context.subscriptions.push(provider);
}

class AzureOpenAIChatProvider implements vscode.LanguageModelChatProvider {
    async provideLanguageModelResponse(
        messages: vscode.LanguageModelChatMessage[],
        options: vscode.LanguageModelChatOptions,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelChatResponse> {

        const config = vscode.workspace.getConfiguration('azureOpenAI');
        const endpoint = config.get<string>('endpoint');
        const apiKey = config.get<string>('apiKey');
        const deployment = config.get<string>('deployment');

        // Call Azure OpenAI API
        const response = await axios.post(
            `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`,
            {
                messages: messages.map(m => ({
                    role: m.role === vscode.LanguageModelChatMessageRole.User ? 'user' : 'assistant',
                    content: m.content
                })),
                max_tokens: options.maxTokens || 2000,
                temperature: 0.7
            },
            {
                headers: {
                    'api-key': apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Stream response back to VSCode
        const stream = new vscode.LanguageModelChatResponseStream();
        const text = response.data.choices[0].message.content;

        stream.markdown(text);

        return {
            stream: stream
        };
    }
}
```

2. **Configure in settings.json**:
```json
{
  "azureOpenAI.endpoint": "https://my-postgres-openai.openai.azure.com",
  "azureOpenAI.apiKey": "YOUR_API_KEY",
  "azureOpenAI.deployment": "gpt4-deployment"
}
```

---

## Cost Comparison

### GitHub Copilot
- **Cost**: $10/month (Individual) or $19/month (Business)
- **Usage**: Unlimited
- **Model**: GitHub manages (GPT-4, GPT-3.5, etc.)

### Azure OpenAI BYOK
- **Cost**: Pay per token
  - GPT-4 Turbo: $10/1M input tokens, $30/1M output tokens
  - GPT-4o: $2.50/1M input tokens, $10/1M output tokens
- **Usage**: Depends on your volume
- **Model**: You choose and control

**Example Monthly Cost**:
- SQL generation: ~500 tokens per query × 1000 queries = 500K tokens
- Cost with GPT-4o: ~$1.25 input + $5 output = **~$6.25/month**
- Cost with GitHub Copilot: **$10/month** (flat)

**Break-even**: If you use more than ~2M tokens/month, Copilot is cheaper. Otherwise, Azure OpenAI BYOK is cheaper.

---

## Data Residency & Compliance

### Why Use Azure OpenAI for Enterprise

1. **Data Residency**:
   - Your data stays in your Azure region (EU, US, etc.)
   - Microsoft 365 Copilot also uses Azure OpenAI in your tenant

2. **Compliance**:
   - GDPR compliant
   - HIPAA compliant (with BAA)
   - SOC 2 certified
   - Your data is NOT used for training

3. **Enterprise Controls**:
   - Azure AD authentication
   - Network isolation (private endpoints)
   - Audit logging
   - Token usage monitoring

---

## Troubleshooting

### Issue: "Custom Model (BYOK)" shows "Not available"

**Solutions**:
1. Install Azure AI Toolkit extension
2. Sign in to your Azure account in VSCode
3. Ensure you have an Azure OpenAI deployment
4. Check Azure OpenAI resource is in allowed region

### Issue: Completions are slow

**Solutions**:
1. Use **GPT-4o** instead of GPT-4 (faster, cheaper)
2. Increase Azure OpenAI quota/TPM (Tokens Per Minute)
3. Enable caching in your deployment
4. Use streaming responses

### Issue: API key authentication fails

**Solutions**:
1. Verify API key is correct (from Azure Portal → Keys and Endpoint)
2. Check endpoint URL format: `https://<resource>.openai.azure.com/`
3. Ensure API version is current: `2024-02-15-preview`
4. Try regenerating the API key

---

## Microsoft 365 Copilot vs. Azure OpenAI

### Can I Use My M365 Copilot License for VSCode?

**No**, unfortunately:
- **Microsoft 365 Copilot** is licensed for Office apps (Teams, Word, Excel, Outlook)
- **GitHub Copilot** is licensed for development tools (VSCode, Visual Studio, GitHub)
- They are **separate products** with separate licensing

However:
- Both use Azure OpenAI models (GPT-4)
- Both can be configured to use your Azure tenant
- Both respect your data residency settings
- **GitHub Copilot Enterprise** can use your Azure OpenAI endpoint via BYOK

### GitHub Copilot Enterprise with Azure OpenAI BYOK

If you have **GitHub Copilot Enterprise**:

1. Your organization admin can configure BYOK
2. GitHub Copilot will use **your Azure OpenAI deployment**
3. This gives you:
   - Same models as M365 Copilot
   - Your Azure tenant (data residency)
   - Centralized control
   - Usage in both GitHub and VSCode

**Setup** (Admin):
```bash
# GitHub Enterprise Cloud → Settings → Copilot → Model configuration
# Select: "Bring your own key"
# Enter your Azure OpenAI endpoint details
```

---

## Summary

### To Use "MS Teams Chat Copilot" Models in VSCode:

1. **Use Azure OpenAI BYOK** (same models as M365 Copilot)
2. Install **Azure AI Toolkit** extension
3. Configure PostgreSQL MCP to use **"custom" provider**
4. Set model family to **"gpt-4"**

### You Get:
- ✅ Same GPT-4 models as Microsoft 365 Copilot
- ✅ Your Azure tenant (data residency)
- ✅ Pay-per-use pricing (potentially cheaper)
- ✅ Full API control
- ✅ Works in VSCode PostgreSQL MCP extension

### You Don't Get:
- ❌ Direct access to Microsoft 365 Copilot service
- ❌ M365 Copilot UI/features (those are Office-specific)

---

## Next Steps

1. **Request Azure OpenAI Access**: https://aka.ms/oai/access
2. **Create Azure OpenAI Resource**: https://portal.azure.com
3. **Install Azure AI Toolkit**: `code --install-extension ms-windows-ai-studio.windows-ai-studio`
4. **Configure PostgreSQL MCP**: Set `postgresMcp.ai.provider` to `"custom"`
5. **Start using Azure OpenAI** for SQL generation!

---

**Questions?** Check the troubleshooting section or review the implementation plan: [TEAMS_INTEGRATION_PLAN.md](TEAMS_INTEGRATION_PLAN.md)
