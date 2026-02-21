# OpenClaw Fleet

## Quick Start

### 1. Deploy Control Plane

```bash
cd control-plane/infra
sudo ./setup.sh fleet.yourdomain.com

# Edit .env
nano .env

# Start services
docker-compose up -d

# Create admin user
docker-compose exec api python seed_admin.py admin@yourdomain.com 'secure-password'
```

### 2. Install Runner

```bash
cd runner
sudo ./install.sh

# Edit config
sudo nano /opt/openclaw-runner/config.yaml

# Start service
# macOS:
sudo launchctl start com.openclaw.runner

# Linux:
sudo systemctl start openclaw-runner
```

### 3. Access UI

Navigate to `https://fleet.yourdomain.com`

Login with your admin credentials.

## Architecture

- **Next.js UI** - React frontend with real-time updates
- **FastAPI** - Python backend with async/await
- **Postgres** - Primary database for state
- **Redis** - Job queue and caching
- **MinIO** - S3-compatible artifact storage

## Features

✅ Authentication & RBAC  
✅ Machine & Agent Fleet Management  
✅ Job Queue with Priority Scheduling  
✅ Lease-based Job Execution  
✅ Live Log Streaming  
✅ Artifact Upload/Download  
✅ Audit Logging  

## API

See full documentation at `/docs` on your deployed instance.
