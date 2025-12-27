# Deployment Guide

Step-by-step guide to deploy MCP Registry and distribute to your team.

---

## 🎯 Overview

1. **Deploy MCP Registry** (one-time setup)
2. **Publish PostgreSQL MCP Server** (one-time)
3. **Build VS Code Extension** (one-time)
4. **Distribute to Team** (ongoing)

---

## Step 1: Deploy MCP Registry

### On Server/Local Machine

```bash
cd mcp-registry

# Start registry with Docker
docker-compose up -d

# Verify running
docker ps
curl http://localhost:8000
```

**Registry URLs:**
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3001`

**For production:** Replace `localhost` with your server IP/domain.

---

## Step 2: Publish PostgreSQL MCP Server

```bash
cd mcp-server

# Package the server
tar -czf postgres-mcp-1.0.0.tar.gz server.py requirements.txt config.py README.md .env.example

# Publish to registry
curl -X POST http://localhost:8000/api/v1/publish \
  -F "package=@postgres-mcp-1.0.0.tar.gz" \
  -F "name=postgres-mcp" \
  -F "version=1.0.0" \
  -F "description=PostgreSQL database operations via MCP" \
  -F "author=Your Team" \
  -F "repository=https://github.com/yourorg/postgres-mcp" \
  -F "tags=database,postgresql,sql"

# Verify published
curl http://localhost:8000/api/v1/servers | jq
```

---

## Step 3: Build VS Code Extension

```bash
cd unified-mcp-extension

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package as VSIX
npm run package

# Output: mcp-server-manager-1.0.0.vsix
ls -lh mcp-server-manager-1.0.0.vsix
```

---

## Step 4: Distribute to Team

### Share Extension File

**Option A: File Share**
```bash
# Copy to shared drive
cp unified-mcp-extension/mcp-server-manager-1.0.0.vsix /shared/drive/
```

**Option B: Internal Package Registry**
```bash
# Upload to internal registry (npm, artifactory, etc.)
```

**Option C: Email/Slack**
- Attach `mcp-server-manager-1.0.0.vsix`
- Include installation instructions

### Installation Instructions for Team

Send this to developers:

```
📦 MCP Server Manager Extension

1. Download: mcp-server-manager-1.0.0.vsix
2. Open VS Code
3. Press Cmd+Shift+P
4. Type: "Extensions: Install from VSIX..."
5. Select downloaded file
6. Reload: Cmd+Shift+P → "Developer: Reload Window"
7. Click MCP Servers icon in sidebar
8. Install postgres-mcp from Registry panel
9. Configure and start!

Registry URL: http://your-registry-server:8000
```

---

## Step 5: Configure Workspace (Optional)

Create `.vscode/settings.json` in your project:

```json
{
  "mcpManager.registryUrl": "http://your-registry-server:8000",
  "mcpManager.autoStartServers": false,
  "extensions.recommendations": [
    "your-company.mcp-server-manager"
  ]
}
```

Commit to git → Team gets auto-configured!

---

## Production Deployment

### Registry on Internal Server

**Option A: Docker on VM**
```bash
# On server (Ubuntu example)
cd mcp-registry

# Update docker-compose.yml ports if needed
# 8000:8000 → 80:8000 (backend on port 80)
# 3001:80 → 443:80 (frontend on HTTPS)

docker-compose up -d

# Configure firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

**Option B: Kubernetes**
```yaml
# Deploy backend and frontend as separate services
# Mount storage volume for packages
# Use ingress for HTTPS
```

### HTTPS (Recommended)

Add nginx reverse proxy:

```nginx
server {
    listen 443 ssl;
    server_name mcp-registry.yourcompany.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3001;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
    }
}
```

Then update extension config:
```json
{
  "mcpManager.registryUrl": "https://mcp-registry.yourcompany.com"
}
```

---

## Maintenance

### Update MCP Server

```bash
# New version
cd mcp-server
tar -czf postgres-mcp-1.1.0.tar.gz .

# Publish
curl -X POST http://localhost:8000/api/v1/publish \
  -F "package=@postgres-mcp-1.1.0.tar.gz" \
  -F "name=postgres-mcp" \
  -F "version=1.1.0" \
  -F "description=..." \
  -F "author=..." \
  -F "tags=..."
```

Developers will see new version in Registry panel.

### Update Extension

```bash
# Make changes to extension
cd unified-mcp-extension

# Bump version in package.json
# "version": "1.1.0"

# Rebuild
npm run compile
npm run package

# Distribute new VSIX
```

### Backup Registry

```bash
# Backup storage volume
docker run --rm \
  -v mcp-registry_storage:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/mcp-registry-backup.tar.gz /data

# Restore
docker run --rm \
  -v mcp-registry_storage:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/mcp-registry-backup.tar.gz -C /
```

---

## Monitoring

### Check Registry Health

```bash
# API health
curl http://localhost:8000

# List servers
curl http://localhost:8000/api/v1/servers

# Stats
curl http://localhost:8000/api/v1/stats
```

### Docker Logs

```bash
# Backend logs
docker logs mcp-registry-backend

# Frontend logs
docker logs mcp-registry-frontend

# Follow logs
docker logs -f mcp-registry-backend
```

---

## Security

### Network Isolation

- Deploy registry on internal network only
- Use VPN for remote access
- Block ports 8000, 3001 from internet

### Authentication (Optional)

Add auth to backend API if needed:
```python
# In backend/main.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials

security = HTTPBasic()

@app.get("/api/v1/servers")
async def list_servers(credentials: HTTPBasicCredentials = Depends(security)):
    # Check credentials
    if credentials.username != "admin" or credentials.password != "secret":
        raise HTTPException(status_code=401)
    # ...
```

---

## Summary

✅ **Registry deployed** - Internal server hosting MCP servers
✅ **PostgreSQL MCP published** - Ready for team to install
✅ **Extension built** - VSIX file ready to distribute
✅ **Team instructions** - Simple install process
✅ **Production ready** - HTTPS, backups, monitoring

**Developers can now browse, install, and run MCP servers locally!** 🚀
