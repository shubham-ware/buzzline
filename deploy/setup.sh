#!/bin/bash
# Buzzline Production Setup Guide
# Run these steps on a fresh DigitalOcean Ubuntu 24.04 Droplet (2GB+ RAM)

set -e

echo "=== Step 1: Install Docker ==="
# https://docs.docker.com/engine/install/ubuntu/
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

echo "=== Step 2: Install Docker Compose ==="
apt-get install -y docker-compose-plugin

echo "=== Step 3: Clone repo ==="
# Replace with your actual repo URL
git clone git@github.com:shubham-ware/buzzline.git /opt/buzzline
cd /opt/buzzline

echo "=== Step 4: Create production .env ==="
cp .env.production.example .env.production
echo ">>> Edit .env.production with your actual values:"
echo ">>>   DATABASE_URL (from DigitalOcean Managed DB)"
echo ">>>   JWT_SECRET (generate with: openssl rand -hex 32)"
echo ""

echo "=== Step 5: Get SSL certificate (run AFTER DNS is pointed to this droplet) ==="
echo "Replace YOUR_DOMAIN with your actual domain"
echo ""
echo "  # First, update deploy/nginx/default.conf — replace YOUR_DOMAIN.dev with your domain"
echo "  # Then get the initial certificate:"
echo "  docker run --rm -v \$(pwd)/certbot/conf:/etc/letsencrypt -v \$(pwd)/certbot/www:/var/www/certbot \\"
echo "    certbot/certbot certonly --webroot --webroot-path=/var/www/certbot \\"
echo "    -d api.YOUR_DOMAIN.dev --email you@example.com --agree-tos --no-eff-email"
echo ""

echo "=== Step 6: Build and start ==="
echo "  docker compose up -d --build"
echo ""

echo "=== Step 7: Push schema to production DB ==="
echo "  docker compose exec api npx prisma db push"
echo ""

echo "=== Step 8: Verify ==="
echo "  curl https://api.YOUR_DOMAIN.dev/api/v1/health"
echo ""

echo "=== Done! ==="
echo ""
echo "Other useful commands:"
echo "  docker compose logs -f api        # Watch API logs"
echo "  docker compose restart api         # Restart API"
echo "  docker compose up -d --build api   # Rebuild and restart API"
echo "  docker compose exec api npx prisma studio  # Open Prisma Studio"
