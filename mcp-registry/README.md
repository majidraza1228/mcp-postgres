# MCP Registry

Internal registry for hosting MCP servers.

## Quick Start

### Start the registry

**Docker:**
```bash
docker-compose up -d
```

**Podman:**
```bash
podman-compose up -d
# OR with alias
alias docker=podman && alias docker-compose=podman-compose
docker-compose up -d
```

### Access

- **Frontend UI**: http://localhost:3001
- **Backend API**: http://localhost:8000

### Stop the registry

**Docker:**
```bash
docker-compose down
```

**Podman:**
```bash
podman-compose down
```

## Publish a Server

### Via Web UI
1. Go to http://localhost:3001
2. Click "Publish Server"
3. Fill in details and upload package (.tar.gz)
4. Click "Publish Server"

### Via API
```bash
cd /path/to/your-mcp-server
tar -czf your-server-1.0.0.tar.gz .

curl -X POST http://localhost:8000/api/v1/publish \
  -F "name=your-server" \
  -F "version=1.0.0" \
  -F "description=Your MCP server description" \
  -F "author=Your Name" \
  -F "tags=database,postgresql" \
  -F "package=@your-server-1.0.0.tar.gz"
```

## API Endpoints

- `GET /api/v1/servers` - List all servers
- `GET /api/v1/servers/search?q=query` - Search servers
- `GET /api/v1/servers/{name}/{version}/download` - Download server
- `POST /api/v1/publish` - Publish new server

## Directory Structure

```
mcp-registry/
├── backend/          # FastAPI backend
├── frontend/         # Web UI
├── storage/          # Server packages
└── docker-compose.yml
```

## Troubleshooting

### Check status

**Docker:**
```bash
docker ps
```

**Podman:**
```bash
podman ps
```

### View logs

**Docker:**
```bash
docker-compose logs backend
docker-compose logs frontend
```

**Podman:**
```bash
podman-compose logs backend
podman-compose logs frontend
```

### Restart

**Docker:**
```bash
docker-compose restart
```

**Podman:**
```bash
podman-compose restart
```

## Alternative Setup (Without podman-compose)

If you don't have `podman-compose` installed, here are three options:

### Option 1: Install podman-compose (Recommended)

```bash
# Install podman-compose
pip3 install podman-compose

# Verify installation
podman-compose --version
```

### Option 2: Use Docker Instead

If you have Docker installed, simply use Docker commands:

```bash
# Start services
docker-compose up -d

# Check status
docker ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 3: Run Containers Manually with Podman

If you want to use Podman without podman-compose:

```bash
# Create network
podman network create mcp-network

# Build and run backend
cd backend
podman build -t mcp-registry-backend .
podman run -d \
  --name mcp-registry-backend \
  --network mcp-network \
  -p 8000:8000 \
  -v $(pwd)/../storage:/storage/mcp-servers:Z \
  -v $(pwd):/app:Z \
  -e STORAGE_PATH=/storage/mcp-servers \
  --restart unless-stopped \
  mcp-registry-backend

# Build and run frontend
cd ../frontend
podman build -t mcp-registry-frontend .
podman run -d \
  --name mcp-registry-frontend \
  --network mcp-network \
  -p 3001:80 \
  --restart unless-stopped \
  mcp-registry-frontend

cd ..
```

**To stop manually run containers:**
```bash
podman stop mcp-registry-backend mcp-registry-frontend
podman rm mcp-registry-backend mcp-registry-frontend
podman network rm mcp-network
```

**To check status:**
```bash
podman ps
```

**To view logs:**
```bash
podman logs mcp-registry-backend
podman logs mcp-registry-frontend
```

### Option 4: Create Bash Aliases

Create aliases to use Docker commands with Podman:

```bash
# Add to ~/.bashrc or ~/.zshrc
echo "alias docker=podman" >> ~/.bashrc
echo "alias docker-compose=podman-compose" >> ~/.bashrc
source ~/.bashrc

# Now use docker commands normally
docker-compose up -d
docker ps
```
