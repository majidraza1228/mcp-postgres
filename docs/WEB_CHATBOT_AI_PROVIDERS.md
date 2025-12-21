# Web Chatbot with Multiple AI Providers
## User Login with GitHub Copilot or Microsoft Teams (No API Keys Required)

---

## Current Status

Your existing web chatbot (**web-chatbot/**) currently works like this:

1. User opens http://localhost:8080
2. Web chatbot calls VSCode extension's Copilot proxy (port 9000)
3. VSCode extension uses **its configured AI provider** (GitHub Copilot or Azure OpenAI)
4. SQL is generated and returned to web chatbot

**Current Limitation**: All users share the same AI provider (configured in VSCode extension).

---

## What You Want

You want users to be able to:
1. **Login with their own GitHub account** → Uses their GitHub Copilot subscription
2. **Login with their Microsoft 365 account** → Uses their Microsoft Teams Copilot / Azure OpenAI

**Key Requirement**: No API keys - just OAuth login!

---

## What's Technically Possible

### ✅ Option 1: GitHub Copilot OAuth (POSSIBLE)

**What works**:
- Users log in with GitHub OAuth
- Web chatbot gets access token
- Calls GitHub Copilot API directly with user's token
- Uses user's own GitHub Copilot subscription

**Implementation**:
```
User clicks "Login with GitHub"
    ↓
OAuth flow → GitHub
    ↓
User authorizes app
    ↓
Returns with access token
    ↓
Web chatbot calls GitHub Copilot Completions API
    ↓
Uses user's Copilot subscription
```

**API Endpoint**:
```javascript
// GitHub Copilot Completions API (public beta)
const response = await fetch('https://api.githubcopilot.com/chat/completions', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${userGitHubToken}`,
        'Editor-Version': 'WebApp/1.0'
    },
    body: JSON.stringify({
        messages: [
            { role: 'user', content: 'Generate SQL for: show all employees' }
        ]
    })
});
```

**Status**: ✅ **This works today!**

### ❌ Option 2: Microsoft 365 Copilot OAuth (NOT POSSIBLE)

**Problem**: Microsoft 365 Copilot **does NOT have a public API** for third-party applications.

**What doesn't work**:
- No API to call Microsoft 365 Copilot from custom apps
- M365 Copilot is only available in Office apps (Teams, Word, Excel, etc.)
- Cannot use user's M365 Copilot subscription from web chatbot

**Alternative**: Use **Azure OpenAI** instead (same GPT-4 models):

```
User clicks "Login with Microsoft"
    ↓
OAuth flow → Microsoft/Azure AD
    ↓
User authorizes app
    ↓
Returns with Azure AD token
    ↓
Web chatbot calls Azure OpenAI API
    ↓
Uses organization's Azure OpenAI deployment
```

**API Endpoint**:
```javascript
// Azure OpenAI API
const response = await fetch(
    `https://YOUR-RESOURCE.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2024-02-15-preview`,
    {
        method: 'POST',
        headers: {
            'api-key': azureOpenAIKey, // From org's Azure subscription
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: [
                { role: 'user', content: 'Generate SQL for: show all employees' }
            ]
        })
    }
);
```

**Status**: ✅ **This works, but uses Azure OpenAI, not M365 Copilot directly**

---

## Recommended Implementation

### Best Approach: Support Both Options

1. **GitHub Copilot Login** (for GitHub users)
2. **Azure OpenAI** (for Microsoft users - same models as M365 Copilot)

---

## Implementation Plan

### Architecture

```
┌──────────────────────────────────────────┐
│     Web Chatbot (http://localhost:8080)   │
│                                           │
│  ┌─────────────────┐ ┌─────────────────┐ │
│  │ Login with      │ │ Login with      │ │
│  │ GitHub          │ │ Microsoft       │ │
│  └────────┬────────┘ └────────┬────────┘ │
└───────────┼───────────────────┼──────────┘
            ↓                   ↓
    ┌───────────────┐   ┌──────────────────┐
    │ GitHub OAuth  │   │ Microsoft OAuth  │
    │               │   │ (Azure AD)       │
    └───────┬───────┘   └──────┬───────────┘
            ↓                   ↓
            │                   │
            ↓                   ↓
    ┌───────────────────┐  ┌────────────────────┐
    │ GitHub Copilot API│  │ Azure OpenAI API   │
    │ (User's sub)      │  │ (Org's deployment) │
    └───────┬───────────┘  └────────┬───────────┘
            ↓                       ↓
            └───────────┬───────────┘
                        ↓
                  SQL Generated
```

---

## Code Changes Needed

### Step 1: Update `web-chatbot/src/server.js`

Add OAuth routes:

```javascript
const express = require('express');
const session = require('express-session');
const axios = require('axios');

const app = express();

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'change-this-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // 1 hour
}));

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK_URL = 'http://localhost:8080/auth/github/callback';

// Microsoft OAuth configuration
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;
const AZURE_CALLBACK_URL = 'http://localhost:8080/auth/microsoft/callback';

// GitHub OAuth routes
app.get('/auth/github', (req, res) => {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
        `client_id=${GITHUB_CLIENT_ID}&` +
        `redirect_uri=${GITHUB_CALLBACK_URL}&` +
        `scope=user copilot`;  // Request Copilot access

    res.redirect(githubAuthUrl);
});

app.get('/auth/github/callback', async (req, res) => {
    const { code } = req.query;

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code
            },
            {
                headers: { 'Accept': 'application/json' }
            }
        );

        const { access_token } = tokenResponse.data;

        // Store token in session
        req.session.githubToken = access_token;
        req.session.provider = 'github';

        // Get user info
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });

        req.session.user = userResponse.data;

        res.redirect('/');
    } catch (error) {
        console.error('GitHub OAuth error:', error);
        res.redirect('/?error=auth_failed');
    }
});

// Microsoft OAuth routes
app.get('/auth/microsoft', (req, res) => {
    const msAuthUrl = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/authorize?` +
        `client_id=${AZURE_CLIENT_ID}&` +
        `response_type=code&` +
        `redirect_uri=${AZURE_CALLBACK_URL}&` +
        `scope=openid profile User.Read&` +
        `response_mode=query`;

    res.redirect(msAuthUrl);
});

app.get('/auth/microsoft/callback', async (req, res) => {
    const { code } = req.query;

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post(
            `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`,
            new URLSearchParams({
                client_id: AZURE_CLIENT_ID,
                client_secret: AZURE_CLIENT_SECRET,
                code,
                redirect_uri: AZURE_CALLBACK_URL,
                grant_type: 'authorization_code'
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );

        const { access_token } = tokenResponse.data;

        // Store token in session
        req.session.azureToken = access_token;
        req.session.provider = 'azure';

        // Get user info
        const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });

        req.session.user = userResponse.data;

        res.redirect('/');
    } catch (error) {
        console.error('Microsoft OAuth error:', error);
        res.redirect('/?error=auth_failed');
    }
});

// Logout
app.get('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Check auth status
app.get('/api/auth/status', (req, res) => {
    if (req.session.user) {
        res.json({
            authenticated: true,
            provider: req.session.provider,
            user: {
                name: req.session.user.name || req.session.user.login,
                email: req.session.user.email
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Generate SQL using appropriate AI provider
app.post('/api/generate-sql', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { query, schema } = req.body;

    try {
        let sqlResult;

        if (req.session.provider === 'github') {
            // Use GitHub Copilot API
            sqlResult = await generateSQLWithGitHubCopilot(
                req.session.githubToken,
                query,
                schema
            );
        } else if (req.session.provider === 'azure') {
            // Use Azure OpenAI API
            sqlResult = await generateSQLWithAzureOpenAI(
                query,
                schema
            );
        }

        res.json({ sql: sqlResult });

    } catch (error) {
        console.error('SQL generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GitHub Copilot SQL generation
async function generateSQLWithGitHubCopilot(token, query, schema) {
    const prompt = `You are a PostgreSQL expert. Convert this natural language to SQL.

Database Schema:
${schema}

User request: ${query}

Return only the SQL query, no explanations.`;

    const response = await axios.post(
        'https://api.githubcopilot.com/chat/completions',
        {
            messages: [
                { role: 'system', content: 'You are a PostgreSQL expert assistant.' },
                { role: 'user', content: prompt }
            ],
            model: 'gpt-4',
            max_tokens: 500
        },
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Editor-Version': 'WebApp/1.0',
                'Content-Type': 'application/json'
            }
        }
    );

    return response.data.choices[0].message.content.trim();
}

// Azure OpenAI SQL generation
async function generateSQLWithAzureOpenAI(query, schema) {
    const prompt = `You are a PostgreSQL expert. Convert this natural language to SQL.

Database Schema:
${schema}

User request: ${query}

Return only the SQL query, no explanations.`;

    const response = await axios.post(
        `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-02-15-preview`,
        {
            messages: [
                { role: 'system', content: 'You are a PostgreSQL expert assistant.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 500
        },
        {
            headers: {
                'api-key': process.env.AZURE_OPENAI_KEY,
                'Content-Type': 'application/json'
            }
        }
    );

    return response.data.choices[0].message.content.trim();
}
```

### Step 2: Update Frontend (`web-chatbot/public/index.html`)

Add login buttons:

```html
<!-- Add to HTML -->
<div id="loginSection" style="display: none;">
    <h2>Login to PostgreSQL MCP Chat</h2>
    <button onclick="loginWithGitHub()" class="login-button github">
        <svg><!-- GitHub icon --></svg>
        Login with GitHub Copilot
    </button>
    <button onclick="loginWithMicrosoft()" class="login-button microsoft">
        <svg><!-- Microsoft icon --></svg>
        Login with Microsoft
    </button>
</div>

<div id="chatSection" style="display: none;">
    <!-- Existing chat UI -->
    <div id="userInfo"></div>
    <button onclick="logout()">Logout</button>
</div>

<script>
async function checkAuthStatus() {
    const response = await fetch('/api/auth/status');
    const data = await response.json();

    if (data.authenticated) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('chatSection').style.display = 'block';
        document.getElementById('userInfo').textContent =
            `Logged in as ${data.user.name} (${data.provider})`;
    } else {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('chatSection').style.display = 'none';
    }
}

function loginWithGitHub() {
    window.location.href = '/auth/github';
}

function loginWithMicrosoft() {
    window.location.href = '/auth/microsoft';
}

function logout() {
    window.location.href = '/auth/logout';
}

// Check auth on page load
checkAuthStatus();
</script>
```

### Step 3: Update `.env` Configuration

Create `web-chatbot/.env`:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_app_client_id
GITHUB_CLIENT_SECRET=your_github_app_secret

# Azure/Microsoft OAuth
AZURE_CLIENT_ID=your_azure_app_client_id
AZURE_CLIENT_SECRET=your_azure_app_secret
AZURE_TENANT_ID=your_azure_tenant_id

# Azure OpenAI (for Microsoft users)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_KEY=your_azure_openai_key
AZURE_OPENAI_DEPLOYMENT=gpt-4-deployment-name

# Session
SESSION_SECRET=change-this-to-random-secret

# Server
PORT=8080
```

---

## Setup Instructions

### For GitHub Copilot OAuth

1. **Create GitHub OAuth App**:
   - Go to https://github.com/settings/developers
   - Click "New OAuth App"
   - **Application name**: PostgreSQL MCP Chat
   - **Homepage URL**: http://localhost:8080
   - **Authorization callback URL**: http://localhost:8080/auth/github/callback
   - Note your Client ID and create a Client Secret

2. **Add to .env**:
   ```
   GITHUB_CLIENT_ID=your_id
   GITHUB_CLIENT_SECRET=your_secret
   ```

### For Microsoft/Azure OpenAI

1. **Create Azure AD App**:
   - Go to Azure Portal → Azure Active Directory
   - Create app registration
   - Add redirect URI: http://localhost:8080/auth/microsoft/callback

2. **Create Azure OpenAI Resource**:
   - Create Azure OpenAI resource
   - Deploy GPT-4 model
   - Get API key and endpoint

3. **Add to .env**:
   ```
   AZURE_CLIENT_ID=your_id
   AZURE_CLIENT_SECRET=your_secret
   AZURE_TENANT_ID=your_tenant
   AZURE_OPENAI_ENDPOINT=https://...
   AZURE_OPENAI_KEY=your_key
   AZURE_OPENAI_DEPLOYMENT=gpt-4
   ```

---

## How It Works

### User Flow

1. User opens http://localhost:8080
2. Sees login page with 2 options:
   - "Login with GitHub Copilot"
   - "Login with Microsoft"
3. User clicks their preferred option
4. OAuth flow:
   - Redirects to GitHub/Microsoft
   - User authorizes
   - Returns to chatbot
5. User is logged in
6. When user asks a question:
   - If GitHub: Uses their GitHub Copilot subscription
   - If Microsoft: Uses organization's Azure OpenAI deployment
7. SQL is generated and displayed

---

## Benefits

✅ **No API Keys Required**: Users just login with their account
✅ **Uses User's Own Subscription**: GitHub users use their Copilot, Microsoft users use org's Azure OpenAI
✅ **Secure**: OAuth 2.0 standard flow
✅ **Flexible**: Support both GitHub and Microsoft users
✅ **Transparent**: User sees which provider they're using

---

## Limitations

❌ **Microsoft 365 Copilot**: Cannot use M365 Copilot API directly (not available)
- **Workaround**: Use Azure OpenAI which has the same GPT-4 models

❌ **GitHub Copilot API**: Currently in beta, may have usage limits

---

## Next Steps

1. Would you like me to implement the OAuth login system for your web chatbot?
2. Do you have GitHub OAuth app and/or Azure AD app set up?
3. Do you want both options (GitHub + Microsoft) or just one?

Let me know and I can create the complete implementation!
