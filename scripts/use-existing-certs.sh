#!/bin/bash
# Use existing Let's Encrypt certificates if available
# Usage: bash scripts/use-existing-certs.sh

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "=========================================="
echo "  Use Existing Let's Encrypt Certificates"
echo "=========================================="
echo ""

CERT_DIR="certbot/conf/live/app.lapisweb.online"

if [ ! -f "$CERT_DIR/fullchain.pem" ] || [ ! -f "$CERT_DIR/privkey.pem" ]; then
  echo "❌ Let's Encrypt certificates not found"
  echo "   Expected: $CERT_DIR/fullchain.pem"
  echo ""
  echo "💡 Run: bash scripts/check-letsencrypt-certs.sh"
  exit 1
fi

echo "✅ Found Let's Encrypt certificates"
echo ""

# Check if certificates are valid
EXPIRY=$(sudo openssl x509 -in "$CERT_DIR/fullchain.pem" -noout -enddate 2>/dev/null | cut -d= -f2)
if [ $? -ne 0 ]; then
  echo "⚠️  Could not verify certificate (may need sudo)"
  echo "   Proceeding anyway..."
else
  EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$EXPIRY" +%s 2>/dev/null)
  NOW_EPOCH=$(date +%s)
  DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))
  
  if [ $DAYS_LEFT -le 0 ]; then
    echo "❌ Certificate expired! ($EXPIRY)"
    echo "   Cannot use expired certificate"
    exit 1
  fi
  
  echo "✅ Certificate valid for $DAYS_LEFT more days"
  echo "   Expires: $EXPIRY"
fi

echo ""
echo "📋 Switching to Let's Encrypt configuration..."

# Backup current config
if [ -f docker/nginx/conf.d/default.conf ]; then
  cp docker/nginx/conf.d/default.conf docker/nginx/conf.d/default.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

# Use Let's Encrypt config
if [ -f docker/nginx/conf.d/default.conf.letsencrypt ]; then
  cp docker/nginx/conf.d/default.conf.letsencrypt docker/nginx/conf.d/default.conf
  echo "✅ Switched to Let's Encrypt nginx config"
else
  echo "⚠️  default.conf.letsencrypt not found"
  echo "   You may need to manually update nginx config to use Let's Encrypt certificates"
fi

# Restart nginx
echo ""
echo "🔄 Restarting nginx..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production restart nginx

sleep 3

# Verify
if docker ps | grep -q nt2205-nginx; then
  echo "✅ Nginx restarted successfully"
  echo ""
  echo "🌐 Test your sites:"
  echo "   curl -I https://app.lapisweb.online"
  echo "   curl -I https://admin.lapisweb.online"
else
  echo "❌ Nginx failed to start"
  echo "   Check logs: docker logs nt2205-nginx"
  exit 1
fi

echo ""
echo "✅ Done! Your sites should now use Let's Encrypt certificates"

