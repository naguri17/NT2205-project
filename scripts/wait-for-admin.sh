#!/bin/bash
# Wait for admin app to be ready before starting nginx
# Usage: ./scripts/wait-for-admin.sh

ADMIN_URL="http://localhost:3001/api/health"
MAX_ATTEMPTS=30
ATTEMPT=0
SLEEP_INTERVAL=2

echo "⏳ Waiting for admin app to be ready at $ADMIN_URL..."

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -f -s "$ADMIN_URL" > /dev/null 2>&1; then
    echo "✅ Admin app is ready!"
    exit 0
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
  echo "   Attempt $ATTEMPT/$MAX_ATTEMPTS - Admin app not ready yet, waiting ${SLEEP_INTERVAL}s..."
  sleep $SLEEP_INTERVAL
done

echo "❌ Timeout: Admin app did not become ready after $((MAX_ATTEMPTS * SLEEP_INTERVAL))s"
echo "⚠️  Continuing anyway - nginx will retry requests..."
exit 0  # Don't fail deployment, nginx will handle retries

