#!/bin/bash
# Revoke Let's Encrypt certificate to free up rate limit
# WARNING: Only revoke if you're sure you don't need the certificate
# Usage: bash scripts/revoke-cert.sh [domain]

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

DOMAIN="${1:-app.lapisweb.online}"

echo "=========================================="
echo "  Revoke Let's Encrypt Certificate"
echo "=========================================="
echo ""
echo "⚠️  WARNING: This will permanently revoke the certificate!"
echo "   Domain: $DOMAIN"
echo ""
read -p "Are you sure you want to revoke this certificate? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Cancelled"
  exit 0
fi

CERT_PATH="certbot/conf/live/$DOMAIN/fullchain.pem"

if [ ! -f "$CERT_PATH" ]; then
  echo "❌ Certificate not found: $CERT_PATH"
  exit 1
fi

echo ""
echo "🔄 Revoking certificate..."

docker run --rm \
  -v "$PROJECT_DIR/certbot/www:/var/www/certbot" \
  -v "$PROJECT_DIR/certbot/conf:/etc/letsencrypt" \
  certbot/certbot revoke \
  --cert-path "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" \
  --delete-after-revoke

if [ $? -eq 0 ]; then
  echo "✅ Certificate revoked successfully"
  echo ""
  echo "💡 You can now request a new certificate (after rate limit reset)"
else
  echo "❌ Failed to revoke certificate"
  exit 1
fi

