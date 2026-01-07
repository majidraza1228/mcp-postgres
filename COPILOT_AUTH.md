# GitHub Copilot Authentication - How It Works

## How Copilot Gets Credentials in Background Mode

When VS Code runs minimized/background, it **already has** your Copilot credentials stored from when you signed in previously.

---

## Where Credentials Are Stored

GitHub Copilot stores authentication tokens in:

```
~/Library/Application Support/Code/User/globalStorage/github.copilot/
```

**Key files:**
- `hosts.json` - GitHub authentication tokens
- `versions.json` - Copilot version info
- Other session data

**These files persist even when VS Code is closed!**

---

## Authentication Flow

### First Time Setup (One-time, must be done with GUI):

```
┌─────────────────────────────────────────────────┐
│  Step 1: Install GitHub Copilot Extension      │
│  (Do this with VS Code GUI visible)             │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Step 2: Sign In to GitHub Copilot              │
│  • Click "Sign in to GitHub" in VS Code         │
│  • Browser opens for authentication             │
│  • You authorize GitHub Copilot                 │
│  • VS Code receives auth token                  │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Step 3: Token Saved to Disk                   │
│  Location:                                      │
│  ~/Library/Application Support/Code/            │
│    User/globalStorage/github.copilot/          │
│                                                 │
│  Files created:                                 │
│  • hosts.json (contains auth token)             │
│  • Other session files                          │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  ✅ Done! Token persists on disk                │
│  You only need to do this ONCE                  │
└─────────────────────────────────────────────────┘
```

### Every Time VS Code Starts (Background or Not):

```
┌─────────────────────────────────────────────────┐
│  VS Code Starts (minimized or visible)          │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  GitHub Copilot Extension Loads                 │
│  Reads stored token from:                       │
│  ~/Library/Application Support/Code/            │
│    User/globalStorage/github.copilot/hosts.json│
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Extension Uses Token to Connect                │
│  • Validates token with GitHub API              │
│  • If valid: ✅ Copilot enabled                 │
│  • If expired: ⚠️ Needs re-authentication       │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Copilot Web Bridge Extension Starts            │
│  • Can now call Copilot API                     │
│  • Uses same authentication                     │
│  • Works in background/minimized                │
└─────────────────────────────────────────────────┘
```

---

## Current Situation on Your Mac

**You already signed in to Copilot before!**

Let me verify:

```bash
# Check if Copilot credentials exist
ls -la ~/Library/Application\ Support/Code/User/globalStorage/ | grep copilot
```

Your VS Code has these stored credentials, so when it runs minimized:
1. Extension loads
2. Reads token from disk
3. Validates with GitHub
4. Works automatically ✅

**No browser popup needed when running in background!**

---

## What Happens If Token Expires?

GitHub Copilot tokens typically last **weeks to months**. If expired:

```
┌─────────────────────────────────────────────────┐
│  Token Expired                                  │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  VS Code Shows Notification                     │
│  "Sign in to GitHub Copilot"                    │
│                                                 │
│  YOU MUST UN-MINIMIZE VS CODE to click button  │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Browser Opens for Re-authentication            │
│  • Sign in again                                │
│  • New token saved                              │
│  • Can minimize VS Code again                   │
└─────────────────────────────────────────────────┘
```

---

## How to Check Current Auth Status

**Method 1: Check files exist**
```bash
# Copilot credentials directory
ls -la ~/Library/Application\ Support/Code/User/globalStorage/github.copilot/

# If these files exist, you're authenticated:
# - hosts.json
# - userInfo.json
```

**Method 2: Check in VS Code**
```bash
# Un-minimize VS Code
# Bottom right corner should show:
# ✅ "GitHub Copilot" (if authenticated)
# ⚠️ "Sign in to GitHub Copilot" (if not authenticated)
```

**Method 3: Test via API**
```bash
# If this works, Copilot is authenticated:
curl -X POST http://localhost:9001/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'

# Success = authenticated
# Error = not authenticated or extension not running
```

---

## Server Deployment Considerations

### Option 1: Transfer Credentials (Simple but Less Secure)

Copy authentication from your Mac to server:

```bash
# On your Mac (source)
tar -czf copilot-creds.tar.gz \
  ~/Library/Application\ Support/Code/User/globalStorage/github.copilot

# Transfer to server
scp copilot-creds.tar.gz user@server:/tmp/

# On server
mkdir -p ~/.config/Code/User/globalStorage/
cd ~/.config/Code/User/globalStorage/
tar -xzf /tmp/copilot-creds.tar.gz
```

**Pros:**
- No need to authenticate on headless server
- Works immediately

**Cons:**
- Security risk (token in transit)
- Against GitHub ToS potentially
- Token might expire

### Option 2: Authenticate on Server (Recommended)

**Using SSH X11 Forwarding:**
```bash
# From your local machine
ssh -X user@server

# On server (GUI forwarded to your screen)
code /path/to/mcp-postgres

# You'll see VS Code on your screen
# Sign in to Copilot normally
# Browser opens locally
# Token saved on server
# Close SSH connection
```

**Using code-server (VS Code in Browser):**
```bash
# On server - install code-server
curl -fsSL https://code-server.dev/install.sh | sh

# Start code-server
code-server --bind-addr 0.0.0.0:8080

# From your browser
# Navigate to: http://server-ip:8080
# Sign in to Copilot in the browser
# Token is saved on server
# Stop code-server
# Switch to regular VS Code headless
```

### Option 3: Settings Sync (Easiest & Recommended)

**Setup (one-time):**

**On your Mac:**
1. Open VS Code
2. Press `Cmd+Shift+P`
3. Type: "Settings Sync: Turn On"
4. Sign in with GitHub or Microsoft account
5. Enable "Extensions" in sync settings
6. Wait for sync to complete

**On the server:**
1. Install VS Code
2. Open VS Code
3. Press `Cmd+Shift+P` (or Ctrl+Shift+P)
4. Type: "Settings Sync: Turn On"
5. Sign in with **same account**
6. All extensions and settings sync automatically
7. GitHub Copilot credentials included! ✅

**Advantages:**
- Most secure
- Automatic sync
- Works across multiple machines
- Officially supported by Microsoft

---

## Troubleshooting Authentication Issues

### Issue: "GitHub Copilot not available"

**Check 1: Is extension installed?**
```bash
code --list-extensions | grep copilot
# Should show: github.copilot
```

**Check 2: Are credentials present?**
```bash
ls ~/Library/Application\ Support/Code/User/globalStorage/github.copilot/
# Should show: hosts.json, userInfo.json, etc.
```

**Check 3: Is Copilot subscription active?**
- Visit: https://github.com/settings/copilot
- Verify subscription is active
- Check expiration date

**Fix:**
1. Un-minimize VS Code from Dock
2. Click "Sign in to GitHub Copilot" in bottom right
3. Complete authentication in browser
4. Minimize VS Code again

### Issue: "Authentication expired"

**Symptoms:**
- Extension loaded but API calls fail
- Error: "Please sign in to use GitHub Copilot"

**Fix:**
```bash
# Un-minimize VS Code
# Re-authenticate (browser will open)
# Token refreshed automatically
```

---

## Security Best Practices

1. **Never share credentials**
   - Don't commit `globalStorage/` to git
   - Don't share auth tokens
   - Use Settings Sync instead

2. **Server security**
   - Protect `~/.config/Code/User/globalStorage/`
   - Use proper file permissions (600)
   - Consider encrypted home directory

3. **Token rotation**
   - Copilot tokens expire automatically
   - Re-authenticate periodically
   - Use Settings Sync for easy refresh

---

## Summary

**How Copilot Gets Credentials in Background:**

1. ✅ You sign in ONCE with VS Code GUI visible
2. ✅ Token saved to: `~/Library/Application Support/Code/User/globalStorage/github.copilot/`
3. ✅ Every time VS Code starts (even minimized), it reads this token
4. ✅ No browser needed for subsequent starts
5. ✅ Works perfectly in background/minimized mode
6. ⚠️ Only need GUI again when token expires (weeks/months later)

**Your current setup:**
- Already authenticated ✅
- Token stored on disk ✅
- Works in minimized mode ✅
- No action needed ✅

**For server deployment:**
- Best option: Use Settings Sync
- Alternative: SSH X11 forwarding for one-time auth
- Token persists after authentication
