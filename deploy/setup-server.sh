#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 24.04 server (Hetzner CX23).
# Run as root:  bash setup-server.sh
set -euo pipefail

echo "==> System update"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get upgrade -y
apt-get install -y ca-certificates curl git ufw fail2ban unattended-upgrades

echo "==> Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

echo "==> Firewall (ufw, duplicates the Hetzner cloud firewall — defense in depth)"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> fail2ban (bans IPs that brute-force SSH)"
systemctl enable --now fail2ban

echo "==> Automatic security updates"
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "==> SSH hardening: key-only auth"
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl restart ssh

echo "==> App directory"
mkdir -p /opt/zilobook

cat <<'EOF'

DONE. Next steps:
  1. git clone <your-repo-url> /opt/zilobook/app   (or rsync the project there)
  2. cd /opt/zilobook/app
  3. cp deploy/.env.example .env   && nano .env    (fill POSTGRES_PASSWORD, JWT_SECRET)
  4. docker compose -f docker-compose.prod.yml up -d --build
  5. Set up the backup cron:
       chmod +x deploy/backup-db.sh
       (crontab -l 2>/dev/null; echo "30 3 * * * /opt/zilobook/app/deploy/backup-db.sh >> /var/log/zilobook-backup.log 2>&1") | crontab -
EOF
