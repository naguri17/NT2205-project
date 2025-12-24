#!/bin/bash
# =============================================
# NT2205 - SSL Certificate Renewal Script
# =============================================
# Chạy thủ công nếu cần renew certificate
# Certbot container tự động renew mỗi 12h
# =============================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "Renewing SSL certificates..."

# Run certbot renew
docker run --rm \
    -v "$PROJECT_DIR/certbot/www:/var/www/certbot" \
    -v "$PROJECT_DIR/certbot/conf:/etc/letsencrypt" \
    certbot/certbot renew

# Reload NGINX to pick up new certificates
docker exec nt2205-nginx nginx -s reload

echo "✓ SSL certificates renewed and NGINX reloaded!"

