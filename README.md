# OpenClaw Fleet

A centralized web control plane for managing distributed OpenClaw agents across multiple computers.

## Quick Start (5 minutes)

### 1. Deploy Control Plane

```bash
# Clone and enter directory
cd openclaw-fleet

# Set your domain
export DOMAIN=fleet.yourdomain.com

# Run setup (installs Docker, gets SSL cert, creates .env)
sudo ./control-plane/infra/setup.sh $DOMAIN

# Start services
cd /opt/openclaw-fleet && docker compose up -d

# Get admin credentials
cat .env | grep ADMIN
```

### 2. Install Runner on Your Machines

```bash
# On each machine that will run OpenClaw agents
cd openclaw-fleet/runner
sudo ./install.sh

# Edit config with your control plane URL and token
sudo nano /opt/openclaw-runner/config.yaml

# Start service
# macOS:
sudo launchctl start com.openclaw.runner

# Linux:
sudo systemctl start openclaw-runner
```

### 3. Create Runner Token

1. Open https://fleet.yourdomain.com
2. Login with admin credentials
3. Go to Settings → Runner Tokens
4. Click "Create Token"
5. Copy token to `/opt/openclaw-runner/config.yaml`
6. Restart runner

### 4. Run Your First Job

```bash
curl -X POST https://fleet.yourdomain.com/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Hello World",
    "priority": 5,
    "payload": {
      "type": "command",
      "command": ["echo", "Hello from OpenClaw Fleet!"]
    }
  }'
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTROL PLANE (VPS)                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Next.js │  │ FastAPI │  │Postgres │  │  Redis  │        │
│  │   UI    │──│   API   │──│ (truth) │  │ (queue) │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
│                                    │                        │
│                              ┌─────────┐                    │
│                              │  MinIO  │                    │
│                              │(artifacts)                   │
│                              └─────────┘                    │
└─────────────────────────────────────────────────────────────┘
                              │ HTTPS
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │ Runner  │          │ Runner  │          │ Runner  │
   │(Laptop) │          │(Server) │          │(Desktop)│
   └─────────┘          └─────────┘          └─────────┘
```

## Features

- **Authentication & RBAC**: JWT-based auth with Owner/Admin/Operator/Viewer roles
- **Fleet Visibility**: Real-time machine and agent status
- **Job Queue**: Priority-based scheduling with tag-based routing
- **Lease Management**: TTL-based job leasing with automatic requeue on failure
- **Live Logs**: Real-time log streaming via WebSocket
- **Artifacts**: S3-compatible storage with presigned upload/download URLs
- **Audit Logging**: Complete audit trail of all actions
- **TLS**: Automatic Let's Encrypt certificates

## Project Structure

```
openclaw-fleet/
├── control-plane/
│   ├── api/                    # FastAPI backend
│   │   ├── app/
│   │   │   ├── api/            # REST endpoints
│   │   │   ├── core/           # Config, DB, security
│   │   │   ├── models/         # SQLAlchemy models
│   │   │   └── services/       # Business logic
│   │   ├── tests/              # Unit tests
│   │   └── Dockerfile
│   │
│   ├── ui/                     # Next.js frontend
│   │   ├── app/                # Pages
│   │   ├── components/         # Shared components
│   │   └── Dockerfile
│   │
│   └── infra/                  # Docker Compose + Nginx
│       ├── docker-compose.yml
│       ├── nginx.conf
│       └── setup.sh
│
├── runner/                     # Python daemon
│   ├── runner.py               # Main daemon
│   ├── config.example.yaml
│   ├── install.sh
│   └── *.service *.plist       # System service configs
│
├── README.md                   # This file
├── QUICKSTART.md              # Quick reference
├── TROUBLESHOOTING.md         # Common issues
└── Makefile                   # Helper commands
```

## Configuration

### Control Plane (.env)

```bash
DOMAIN=fleet.yourdomain.com
POSTGRES_PASSWORD=secure-password
MINIO_ROOT_PASSWORD=secure-password
SECRET_KEY=$(openssl rand -base64 48)
```

### Runner (config.yaml)

```yaml
control_plane_url: https://fleet.yourdomain.com
runner_token: your-token-from-ui
agents:
  - name: default
    model: gpt-4
    tags: [general]
    max_concurrency: 2
```

## API Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/login` | POST | No | Get JWT token |
| `/auth/me` | GET | Yes | Current user |
| `/fleet/machines` | GET | Yes | List machines |
| `/fleet/agents` | GET | Yes | List agents |
| `/jobs` | GET | Yes | List jobs |
| `/jobs` | POST | Operator+ | Create job |
| `/jobs/{id}/action` | POST | Operator+ | Cancel/retry job |
| `/jobs/runs/{id}` | GET | Yes | Run details |
| `/tokens` | POST | Admin+ | Create runner token |
| `/ws/runs/{id}` | WS | Yes | Live logs |

Full API docs at `/docs` on your deployed instance.

## Development

```bash
# Run locally
make dev-api   # Terminal 1 - API
make dev-ui    # Terminal 2 - UI

# Run tests
make test

# Build and deploy
make build
make up
```

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues.

Quick checks:
```bash
# Check all services are running
docker-compose ps

# View logs
docker-compose logs -f

# Check runner connection
tail -f /var/log/openclaw-runner.log
```

## Security

- All communication over TLS (Let's Encrypt)
- Runner tokens are hashed in database
- Secrets are redacted from logs
- RBAC enforced on all endpoints
- Audit log for all actions

## License

MIT
