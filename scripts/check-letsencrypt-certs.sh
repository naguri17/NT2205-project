#!/bin/bash
# Check Let's Encrypt certificates status
# Usage: bash scripts/check-letsencrypt-certs.sh

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "=========================================="
echo "  Let's Encrypt Certificates Status"
echo "=========================================="
echo ""

CERT_DIR="certbot/conf/live/app.lapisweb.online"

if [ ! -d "$CERT_DIR" ]; then
  echo "❌ No Let's Encrypt certificates found"
  echo "   Directory: $CERT_DIR"
  echo ""
  echo "💡 Options:"
  echo "   1. Đợi rate limit reset: 2025-12-25 13:42:41 UTC"
  echo "   2. Revoke certificates cũ không cần thiết"
  echo "   3. Dùng commercial SSL certificate"
  exit 1
fi

echo "✅ Certificates found in: $CERT_DIR"
echo ""

# Check certificate details
if [ -f "$CERT_DIR/fullchain.pem" ]; then
  echo "📋 Certificate Details:"
  echo ""
  
  # Get certificate info
  CERT_INFO=$(sudo openssl x509 -in "$CERT_DIR/fullchain.pem" -noout -dates -subject -issuer 2>/dev/null)
  
  if [ $? -eq 0 ]; then
    echo "$CERT_INFO" | while IFS= read -r line; do
      echo "   $line"
    done
    echo ""
    
    # Check expiration
    EXPIRY=$(sudo openssl x509 -in "$CERT_DIR/fullchain.pem" -noout -enddate 2>/dev/null | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$EXPIRY" +%s 2>/dev/null)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))
    
    if [ $DAYS_LEFT -gt 0 ]; then
      echo "   ✅ Certificate valid for $DAYS_LEFT more days"
    else
      echo "   ❌ Certificate expired!"
    fi
  else
    echo "   ⚠️  Could not read certificate details (may need sudo)"
  fi
else
  echo "❌ fullchain.pem not found"
fi

echo ""
echo "📊 Rate Limit Status:"
echo "   Let's Encrypt allows 5 certificates per exact set of domains per 168 hours"
echo "   Current limit: 5/5 (reached)"
echo "   Reset time: 2025-12-25 13:42:41 UTC"
echo ""

# List all certificates
echo "📁 All certificates in archive:"
if [ -d "certbot/conf/archive" ]; then
  sudo ls -la certbot/conf/archive/ 2>/dev/null || ls -la certbot/conf/archive/
else
  echo "   No archive directory found"
fi

echo ""
echo "💡 Next Steps:"
echo "   1. Nếu có certificates hợp lệ → Dùng luôn (xem scripts/use-existing-certs.sh)"
echo "   2. Nếu không → Đợi rate limit reset hoặc revoke certificates cũ"

