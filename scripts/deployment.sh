#!/usr/bin/env bash
# deployment.sh — Initial server setup + deploy
set -euo pipefail

APP_DIR="/opt/a4k"
REPO_URL="${REPO_URL:-git@github.com:your_org/a4k.git}"
IMAGE_TAG="${IMAGE_TAG:-v1.0.0}"
DOMAIN_APP="app.a4k.com"
DOMAIN_API="api.a4k.com"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# ── 1. System dependencies ────────────────────────────────────────────────────
log "Installing Docker & dependencies..."
apt-get update -qq
apt-get install -y --no-install-recommends \
    curl git docker.io docker-compose-plugin ufw fail2ban

systemctl enable --now docker

# ── 2. Firewall ───────────────────────────────────────────────────────────────
log "Configuring UFW..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ── 3. App directory ──────────────────────────────────────────────────────────
log "Setting up app directory..."
mkdir -p "$APP_DIR"
cd "$APP_DIR"

if [ ! -d ".git" ]; then
    git clone "$REPO_URL" .
else
    git pull origin main
fi

# ── 4. Environment ────────────────────────────────────────────────────────────
if [ ! -f production.env ]; then
    cp .env.example production.env
    log "⚠️  Edit $APP_DIR/production.env before continuing!"
    exit 1
fi

sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=${IMAGE_TAG}/" production.env

# ── 5. SSL — initial certificate issue ───────────────────────────────────────
log "Obtaining SSL certificates..."
# Temporarily start nginx on port 80 only for ACME challenge
docker run --rm -p 80:80 \
    -v /opt/a4k/nginx/certbot_www:/var/www/certbot \
    nginx:1.27-alpine nginx -c /etc/nginx/nginx.conf &
NGINX_PID=$!
sleep 3

docker run --rm \
    -v certbot_certs:/etc/letsencrypt \
    -v certbot_www:/var/www/certbot \
    certbot/certbot certonly \
    --webroot -w /var/www/certbot \
    --non-interactive --agree-tos \
    -m "admin@a4k.com" \
    -d "$DOMAIN_APP" -d "$DOMAIN_API"

kill $NGINX_PID 2>/dev/null || true

# ── 6. Pull images & start ────────────────────────────────────────────────────
log "Pulling images (tag: ${IMAGE_TAG})..."
docker compose -f docker-compose.production.yml --env-file production.env pull

log "Starting services..."
docker compose -f docker-compose.production.yml --env-file production.env up -d

# ── 7. Health check ───────────────────────────────────────────────────────────
log "Waiting for services to be healthy..."
sleep 20
docker compose -f docker-compose.production.yml ps

log "✅ Deployment complete. App: https://${DOMAIN_APP}  API: https://${DOMAIN_API}"
