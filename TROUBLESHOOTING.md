# Troubleshooting OpenClaw Fleet

## Runner Won't Connect

### Symptoms
- Machine doesn't appear in Fleet UI
- Runner logs show connection errors

### Solutions

1. **Check runner token**
```bash
# Verify token is valid (not revoked)
curl -H "X-Runner-Token: your-token" https://fleet.example.com/health
```

2. **Check network connectivity**
```bash
# From runner machine
curl -v https://fleet.example.com/health
telnet fleet.example.com 443
```

3. **Check runner logs**
```bash
# macOS
tail -f /var/log/openclaw-runner.log
tail -f /var/log/openclaw-runner.error.log

# Linux
journalctl -u openclaw-runner -f
```

4. **Verify config**
```bash
cat /opt/openclaw-runner/config.yaml
# Ensure control_plane_url uses HTTPS
# Ensure token is correct
```

## Jobs Stuck in Queued

### Symptoms
- Jobs show "queued" status but never start
- No runs are created

### Solutions

1. **Check agents are online**
- Go to Fleet → Agents
- Verify at least one agent shows "idle"

2. **Check agent tags match job routing**
```yaml
# runner config.yaml
agents:
  - name: my-agent
    tags:
      - general  # Job must require this tag or have no required_tags
```

3. **Check Redis**
```bash
docker-compose exec redis redis-cli ping
docker-compose exec redis redis-cli ZRANGE jobs:queue 0 -1
```

4. **Check lease reaper is running**
```bash
docker-compose logs api | grep -i lease
```

## Database Connection Errors

### Symptoms
- API returns 500 errors
- Logs show "connection refused" or "database does not exist"

### Solutions

1. **Check Postgres is running**
```bash
docker-compose ps db
docker-compose logs db
```

2. **Verify database exists**
```bash
docker-compose exec db psql -U postgres -l
```

3. **Run migrations**
```bash
docker-compose exec api alembic upgrade head
```

## SSL/Certificate Issues

### Symptoms
- Browser shows certificate warning
- HTTPS not working

### Solutions

1. **Check certificate exists**
```bash
ls -la infra/certbot_data/live/
```

2. **Renew certificate**
```bash
docker-compose run --rm certbot certonly --standalone -d yourdomain.com
```

3. **Check nginx config**
```bash
docker-compose exec nginx nginx -t
```

## Artifact Upload Fails

### Symptoms
- Artifacts show in UI but download fails
- Runner reports upload errors

### Solutions

1. **Check MinIO is running**
```bash
docker-compose ps minio
docker-compose logs minio
```

2. **Verify bucket exists**
```bash
docker-compose exec minio mc ls myminio/
```

3. **Check API can reach MinIO**
```bash
docker-compose exec api curl http://minio:9000/minio/health/live
```

## High Memory Usage

### Symptoms
- Container OOM killed
- System running slow

### Solutions

1. **Add swap space**
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

2. **Limit container memory**
```yaml
# docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 512M
```

## Debugging Commands

### View all logs
```bash
docker-compose logs -f
```

### View specific service logs
```bash
docker-compose logs -f api
docker-compose logs -f runner  # on runner machine
```

### Restart services
```bash
docker-compose restart api
docker-compose restart nginx
```

### Check running containers
```bash
docker-compose ps
```

### Database queries
```bash
# Connect to database
docker-compose exec db psql -U postgres -d openclaw_fleet

# Useful queries
\dt  # List tables
SELECT * FROM machines;
SELECT * FROM agents;
SELECT * FROM jobs ORDER BY created_at DESC LIMIT 10;
```

## Getting Help

If issues persist:

1. Check the logs: `docker-compose logs > logs.txt`
2. Verify versions: `docker --version`, `docker-compose --version`
3. Open an issue with logs and configuration (redact secrets!)
