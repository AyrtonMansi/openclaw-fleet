# OpenClaw Fleet - Deployment Guide

## Prerequisites

- A VPS with at least 2GB RAM (4GB recommended)
- Docker and Docker Compose installed (or use the setup script)
- A domain name pointing to your VPS
- Ports 80 and 443 open

## Step-by-Step Deployment

### 1. Provision VPS

Recommended providers: DigitalOcean, AWS, GCP, Hetzner

Minimum specs:
- 2 vCPUs
- 4GB RAM
- 40GB SSD
- Ubuntu 22.04 LTS or Debian 12

### 2. Configure DNS

Point your domain (e.g., `fleet.example.com`) to your VPS IP:

```
Type: A
Name: fleet
Value: YOUR_VPS_IP
TTL: 300
```

### 3. Run Setup Script

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Clone the repository
git clone https://github.com/your-org/openclaw-fleet.git /opt/openclaw-fleet
cd /opt/openclaw-fleet

# Run the setup script
sudo ./control-plane/infra/setup.sh fleet.example.com
```

This will:
- Install Docker and Docker Compose if missing
- Generate secure random passwords
- Obtain SSL certificate from Let's Encrypt
- Create the initial environment file

### 4. Review Configuration

```bash
cd /opt/openclaw-fleet

# View generated config
cat .env

# Edit if needed
nano .env
```

### 5. Start Services

```bash
docker-compose up -d
```

Wait for all services to start:
```bash
docker-compose ps
```

You should see all services showing `healthy` or `Up`.

### 6. Verify Deployment

```bash
# Check health
curl https://fleet.example.com/api/health

# Should return: {"status": "healthy", "version": "0.1.0"}
```

### 7. Get Admin Credentials

The setup script generates admin credentials automatically:

```bash
grep ADMIN .env
```

Login at `https://fleet.example.com` with these credentials.

**Important:** Change the admin password after first login!

## Installing Runners

### macOS

```bash
# On your Mac
cd openclaw-fleet/runner
sudo ./install.sh

# Edit config
sudo nano /opt/openclaw-runner/config.yaml

# Update with your control plane URL and token
# Get token from Fleet UI → Settings → Runner Tokens

# Start the service
sudo launchctl load /Library/LaunchDaemons/com.openclaw.runner.plist
sudo launchctl start com.openclaw.runner

# Check logs
tail -f /var/log/openclaw-runner.log
```

### Linux

```bash
# On the Linux machine
cd openclaw-fleet/runner
sudo ./install.sh

# Edit config
sudo nano /opt/openclaw-runner/config.yaml

# Update with your control plane URL and token

# Start the service
sudo systemctl start openclaw-runner

# Check status
sudo systemctl status openclaw-runner

# View logs
sudo journalctl -u openclaw-runner -f
```

### Windows (Manual)

1. Install Python 3.11+
2. `pip install -r requirements.txt`
3. Copy `config.example.yaml` to `config.yaml` and edit
4. Run `python runner.py`

Or use Windows Subsystem for Linux (WSL) and follow Linux instructions.

## Security Considerations

### 1. Firewall

```bash
# UFW (Ubuntu/Debian)
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2. Automatic Updates

Enable automatic security updates:

```bash
# Ubuntu/Debian
apt-get install unattended-upgrades
```

### 3. Backup

Set up automated backups:

```bash
# Create backup script
cat > /opt/backup-fleet.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# Database
docker exec openclaw-fleet-db-1 pg_dump -U postgres openclaw_fleet > $BACKUP_DIR/database.sql

# Configs
cp /opt/openclaw-fleet/.env $BACKUP_DIR/
cp -r /opt/openclaw-fleet/infra/certbot_data $BACKUP_DIR/ssl

# MinIO data (optional, can be large)
# tar czf $BACKUP_DIR/minio.tar.gz /var/lib/docker/volumes/openclaw-fleet_minio_data/

tar czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

# Keep only last 7 backups
ls -t /backups/*.tar.gz | tail -n +8 | xargs rm -f
EOF

chmod +x /opt/backup-fleet.sh

# Add to cron (daily at 3 AM)
echo "0 3 * * * /opt/backup-fleet.sh" | crontab -
```

## Scaling

### Horizontal Scaling (More Runners)

Simply install the runner on more machines. The control plane automatically:
- Discovers new machines
- Routes jobs based on tags and load
- Handles machine failures

### Vertical Scaling (More Resources)

Increase container resources in `docker-compose.yml`:

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

Then restart:
```bash
docker-compose up -d --force-recreate api
```

## Monitoring

### Basic Health Check

```bash
# Add to crontab for uptime monitoring
*/5 * * * * curl -sf https://fleet.example.com/api/health || echo "FLEET DOWN" | mail -s "Fleet Alert" admin@example.com
```

### Docker Stats

```bash
docker stats
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f runner  # on runner machine
```

## Updating

### Update Control Plane

```bash
cd /opt/openclaw-fleet

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Run migrations
docker-compose exec api alembic upgrade head
```

### Update Runners

```bash
# On each runner machine
cd /opt/openclaw-runner

# Pull latest runner.py
curl -o runner.py https://raw.githubusercontent.com/your-org/openclaw-fleet/main/runner/runner.py

# Restart service
# macOS:
sudo launchctl stop com.openclaw.runner
sudo launchctl start com.openclaw.runner

# Linux:
sudo systemctl restart openclaw-runner
```

## Troubleshooting Deployment

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed troubleshooting steps.

Common issues:
- **SSL errors**: Ensure DNS is pointing to the VPS before running setup
- **Port conflicts**: Stop other web servers (nginx, apache) before deploying
- **Out of memory**: Add swap space or upgrade VPS
- **Runner won't connect**: Check firewall allows outbound HTTPS

## Production Checklist

- [ ] SSL certificate obtained and auto-renewal configured
- [ ] Admin password changed from default
- [ ] Firewall configured (only 22, 80, 443 open)
- [ ] Automatic backups configured
- [ ] Monitoring/alerting set up
- [ ] Runner tokens created and secured
- [ ] Documentation shared with team
- [ ] Disaster recovery plan documented

## Support

- GitHub Issues: [link]
- Documentation: [link]
- Community Discord: [link]
