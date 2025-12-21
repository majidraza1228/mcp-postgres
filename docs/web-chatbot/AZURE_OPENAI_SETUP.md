# Azure OpenAI Setup (Optional)

The web chatbot includes a **disabled** Microsoft Teams / Azure OpenAI option. This is shown to developers to indicate that Azure OpenAI integration is possible but requires additional setup.

---

## Why is MS Teams Disabled?

**Microsoft Teams Copilot has NO public API** - it cannot be accessed programmatically for third-party applications.

However, you can use **Azure OpenAI** which provides the same GPT-4 models that power Microsoft Teams Copilot.

---

## How to Enable Azure OpenAI

### **Step 1: Create Azure OpenAI Resource**

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new **Azure OpenAI** resource
3. Deploy a GPT-4 model (e.g., `gpt-4` or `gpt-35-turbo`)
4. Note your:
   - API Endpoint (e.g., `https://your-resource.openai.azure.com`)
   - API Key
   - Deployment Name

### **Step 2: Update Environment Variables**

Add to your `.env` file:

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_KEY=your_api_key_here
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

### **Step 3: Update Server Code**

Uncomment/add the Azure OpenAI provider code in `src/server.js`:

```javascript
// Add Azure OpenAI configuration at top
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';

// Add route handler
app.get('/auth/azure', (req, res) => {
    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_KEY) {
        return res.status(500).send('Azure OpenAI not configured');
    }

    req.session.user = {
        name: 'Azure OpenAI User',
        email: 'user@azure.com',
        avatar_url: 'https://ui-avatars.com/api/?name=Azure&background=0078d4&color=fff'
    };
    req.session.provider = 'azure';
    req.session.authenticated = true;

    req.session.save((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to save session' });
        }
        res.redirect('/');
    });
});

// Add SQL generation function
async function generateSQLWithAzureOpenAI(query, schema) {
    const prompt = `You are a PostgreSQL expert assistant. Convert the following natural language query into a valid PostgreSQL SQL statement.

**Available Database Schema:**
${schema || 'No schema provided'}

**Instructions:**
- Return ONLY the SQL statement, no explanations or markdown
- Use proper PostgreSQL syntax
- For queries returning data, use SELECT
- Add appropriate JOINs if multiple tables are needed
- Add LIMIT clauses for safety when selecting large datasets

**User Request:** ${query}

**SQL:**`;

    try {
        const response = await axios.post(
            `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-02-15-preview`,
            {
                messages: [
                    { role: 'system', content: 'You are a PostgreSQL expert assistant.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 500,
                temperature: 0.3
            },
            {
                headers: {
                    'api-key': AZURE_OPENAI_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const sqlText = response.data.choices[0].message.content.trim();
        return cleanSQL(sqlText);

    } catch (error) {
        throw new Error(`Azure OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
    }
}

// Update chat endpoint to include azure provider
if (req.session.provider === 'github') {
    sqlQuery = await generateSQLWithGitHubCopilot(req.session.githubToken, message, schema);
} else if (req.session.provider === 'chatgpt') {
    sqlQuery = await generateSQLWithChatGPT(message, schema);
} else if (req.session.provider === 'azure') {
    sqlQuery = await generateSQLWithAzureOpenAI(message, schema);
}
```

### **Step 4: Enable in UI**

Update `public/index-simple.html` to enable the MS Teams option:

```html
<!-- Change from disabled to enabled -->
<label class="radio-option" id="msTeamsOption">
    <input type="radio" name="provider" value="azure">
    <!-- ... rest of the option ... -->
</label>
```

Update the JavaScript routing:

```javascript
function startChat() {
    const selectedProvider = document.querySelector('input[name="provider"]:checked').value;
    sessionStorage.setItem('selectedProvider', selectedProvider);

    if (selectedProvider === 'github') {
        window.location.href = '/auth/github';
    } else if (selectedProvider === 'azure') {
        window.location.href = '/auth/azure';
    } else if (selectedProvider === 'chatgpt') {
        window.location.href = '/auth/chatgpt';
    }
}
```

### **Step 5: Restart Server**

```bash
npm start
```

---

## Cost Considerations

Azure OpenAI is a **paid service**:
- Pay-per-token pricing
- Costs vary by model (GPT-4 is more expensive than GPT-3.5-Turbo)
- Check [Azure OpenAI Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/)

---

## Alternative: Use ChatGPT Instead

If you don't want to set up Azure OpenAI, the **ChatGPT option** is simpler:

1. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to `.env`: `OPENAI_API_KEY=your_key_here`
3. Select ChatGPT in the web interface

Both Azure OpenAI and ChatGPT use the same GPT-4 models!

---

## Summary

- **GitHub Copilot**: ✅ Works immediately (via VS Code proxy)
- **ChatGPT**: ⚙️ Requires OpenAI API key (simple setup)
- **Azure OpenAI / MS Teams**: 🔒 Requires Azure setup (more complex, enterprise option)

Choose the option that best fits your needs!
