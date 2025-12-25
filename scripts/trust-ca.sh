#!/bin/bash
# Script to help trust the self-signed CA certificate
# Usage: bash scripts/trust-ca.sh

CA_CERT_PATH="./docker/nginx/ssl/ca.crt"

echo "=========================================="
echo "  Trust Self-Signed CA Certificate"
echo "=========================================="
echo ""

if [ ! -f "$CA_CERT_PATH" ]; then
  echo "❌ CA certificate not found at: $CA_CERT_PATH"
  echo "   Please run: pnpm setup:ssl"
  exit 1
fi

echo "✅ CA certificate found: $CA_CERT_PATH"
echo ""
echo "📋 Hướng dẫn trust CA certificate:"
echo ""
echo "1️⃣  Download CA certificate:"
echo "   scp ubuntu@15.134.119.222:~/NT2205-project/docker/nginx/ssl/ca.crt ./ca.crt"
echo ""
echo "2️⃣  Trust CA trên browser:"
echo ""
echo "   🌐 Chrome/Edge:"
echo "      - Settings → Privacy and Security → Security"
echo "      - Manage certificates → Authorities → Import"
echo "      - Chọn file ca.crt → Trust this certificate"
echo ""
echo "   🦊 Firefox:"
echo "      - Settings → Privacy & Security → Certificates"
echo "      - View Certificates → Authorities → Import"
echo "      - Chọn file ca.crt → Trust this CA"
echo ""
echo "   🍎 Safari (macOS):"
echo "      - Keychain Access → System"
echo "      - File → Import Items → Chọn ca.crt"
echo "      - Double-click certificate → Trust → Always Trust"
echo ""
echo "3️⃣  Restart browser sau khi trust"
echo ""
echo "📁 CA certificate location: $CA_CERT_PATH"
echo ""

