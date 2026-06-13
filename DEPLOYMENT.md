# A4K — Production Deployment Guide

## Folder Structure

```
A4K/
├── Dockerfile.frontend              # Multi-stage React/Vite → Nginx image
├── Dockerfile.backend               # Multi-stage FastAPI image
├── docker-compose.production.yml    # All production services
├── docker-compose.monitoring.yml    # Prometheus + Grafana stack
├── .env.example                     # Template for all env vars
├── .github/
│   └── workflows/
│       ├── build-frontend.yml       # Build + push frontend to GHCR
│       ├── build-backend.yml        # Build + push backend to GHCR
│       └── deploy.yml               # SSH deploy to Ubuntu server
├── nginx/
│   ├── nginx.conf                   # Main reverse proxy config
│   ├── spa.conf                     # SPA config inside frontend container
│   └── snippets/
│       ├── ssl-params.conf          # TLS hardening
│       └── proxy-params.conf        # Upstream proxy headers
├── monitoring/
│   └── prometheus.yml               # Prometheus scrape config
├── scripts/
│   ├── deployment.sh                # First-time server setup
│   ├── backup.sh                    # Daily PostgreSQL backup (cron)
│   └── restore.sh                   # Point-in-time restore
├── frontend/
│   └── .dockerignore
└── backend/
    └── .dockerignore
```

---

## First-Time Deployment

### 1. Prepare the server (Ubuntu 22.04)

```bash
# As root on the production server
export REPO_URL=git@github.com:your_org/a4k.git
export IMAGE_TAG=v1.0.0
curl -fsSL https://raw.githubusercontent.com/your_org/a4k/main/scripts/deployment.sh | bash
```

The script:
- Installs Docker, UFW, fail2ban
- Locks down ports (22, 80, 443 only)
- Clones the repo to `/opt/a4k`
- Issues SSL certificates via Let's Encrypt
- Pulls images and starts all services

### 2. Configure secrets

```bash
cp /opt/a4k/.env.example /opt/a4k/production.env
nano /opt/a4k/production.env   # Fill in all values
```

**Required secrets to set:**
| Variable | Description |
|---|---|
| `POSTGRES_PASSWORD` | Strong random password |
| `JWT_SECRET` | Min 64 chars, random |
| `CLOUDINARY_*` | From cloudinary.com dashboard |
| `IMAGE_TAG` | e.g. `v1.0.0` |
| `GITHUB_REPOSITORY` | e.g. `your_org/a4k` |

### 3. Add GitHub Actions secrets

In your repo → Settings → Secrets → Actions:

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | Server IP / hostname |
| `DEPLOY_USER` | `ubuntu` or deploy user |
| `DEPLOY_SSH_KEY` | Private key (Ed25519 recommended) |

---

## Releasing a New Version

```bash
# Tag triggers both build workflows automatically
git tag v1.0.1
git push origin v1.0.1
```

Workflow:
1. `build-frontend.yml` builds + pushes `ghcr.io/org/a4k/frontend:v1.0.1`
2. `build-backend.yml` builds + pushes `ghcr.io/org/a4k/backend:v1.0.1`
3. `deploy.yml` SSHes into server, updates `IMAGE_TAG`, pulls + restarts

---

## Rollback Guide

```bash
cd /opt/a4k

# Set the previous known-good tag
sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=v1.0.0/' production.env

# Pull that specific version
docker compose -f docker-compose.production.yml --env-file production.env \
    pull backend frontend

# Restart only the app containers (zero-downtime)
docker compose -f docker-compose.production.yml --env-file production.env \
    up -d --no-deps backend frontend
```

Rollback takes ~30 seconds.

---

## Backup & Restore

### Setup daily backup cron

```bash
# On the server
echo "0 2 * * * /opt/a4k/scripts/backup.sh >> /var/log/a4k-backup.log 2>&1" | crontab -
```

Backups are stored in `/opt/a4k/backups/` and retained for 30 days.

### Restore from backup

```bash
# List available backups
ls -lh /opt/a4k/backups/

# Restore (will prompt before overwriting)
/opt/a4k/scripts/restore.sh /opt/a4k/backups/postgres_20240101_020000.sql.gz
```

---

## Monitoring

```bash
cd /opt/a4k
docker compose -f docker-compose.monitoring.yml --env-file production.env up -d
```

- Prometheus: `http://localhost:9090` (internal only)
- Grafana: `http://localhost:3000` (internal only — tunnel via SSH or proxy behind auth)

```bash
# Access Grafana via SSH tunnel from your machine
ssh -L 3000:localhost:3000 ubuntu@your_server_ip
# Then open http://localhost:3000
```

---

## Disaster Recovery

### Scenario: Server is lost entirely

1. Provision a new Ubuntu 22.04 server
2. Point DNS (`app.a4k.com`, `api.a4k.com`) to the new IP
3. Run `deployment.sh` as above
4. Copy the latest backup from S3/off-site storage to `/opt/a4k/backups/`
5. Run `restore.sh` with the latest backup file
6. Verify health: `docker compose -f docker-compose.production.yml ps`

RTO target: ~30 minutes with a recent backup.
RPO target: 24 hours (daily backup), or better with streaming replication.

### Scenario: Database corruption

```bash
# Stop writes immediately
docker compose -f docker-compose.production.yml stop backend

# Restore last good backup
/opt/a4k/scripts/restore.sh /opt/a4k/backups/postgres_YYYYMMDD_HHMMSS.sql.gz
```

---

## Security Checklist

- [x] Non-root containers (frontend: `appuser`, backend: `appuser`)
- [x] Read-only filesystem on backend and frontend containers
- [x] PostgreSQL not exposed on host network
- [x] Redis not exposed on host network
- [x] TLS 1.2/1.3 only, HSTS enabled
- [x] Security headers: X-Frame-Options, X-Content-Type-Options, CSP, Referrer-Policy
- [x] Rate limiting: `/api/` 30 req/min, `/api/v1/auth/` 10 req/min
- [x] Gzip compression enabled
- [x] UFW firewall: only ports 22, 80, 443 open
- [x] fail2ban enabled for SSH brute-force protection
- [x] Secrets in env file, not in image or repository
- [x] Image versions pinned — never `latest` in production
- [x] SSL certificates auto-renewed via certbot container
- [x] Docker Swagger/ReDoc disabled (`/docs` returns 403 in production)
- [ ] Rotate `JWT_SECRET` and `POSTGRES_PASSWORD` every 90 days
- [ ] Enable PostgreSQL audit logging for compliance
- [ ] Store backups off-server (S3, Backblaze, etc.)
- [ ] Set up alerting in Grafana for error rate / p99 latency
