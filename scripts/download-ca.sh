#!/bin/bash
# Download CA certificate from server
# Usage: bash scripts/download-ca.sh [server_user@server_ip]

SERVER="${1:-ubuntu@15.134.119.222}"
CA_REMOTE_PATH="~/NT2205-project/docker/nginx/ssl/ca.crt"
CA_LOCAL_PATH="./ca.crt"

echo "=========================================="
echo "  Download CA Certificate"
echo "=========================================="
echo ""
echo "📥 Downloading CA certificate from $SERVER..."
echo ""

if scp "$SERVER:$CA_REMOTE_PATH" "$CA_LOCAL_PATH" 2>/dev/null; then
  echo "✅ CA certificate downloaded to: $CA_LOCAL_PATH"
  echo ""
  echo "📋 Next steps:"
  echo "   1. Trust CA certificate trên browser (xem scripts/fix-ssl-issue.md)"
  echo "   2. Clear HSTS cache nếu cần"
  echo "   3. Restart browser"
  echo ""
else
  echo "❌ Failed to download CA certificate"
  echo ""
  echo "💡 Manual download:"
  echo "   scp $SERVER:$CA_REMOTE_PATH ./ca.crt"
  echo ""
  echo "   Hoặc copy nội dung từ server:"
  echo "   ssh $SERVER 'cat $CA_REMOTE_PATH' > ca.crt"
  exit 1
fi

