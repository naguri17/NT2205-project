#!/bin/bash
# =============================================
# NT2205 - Let's Encrypt SSL Setup Script
# =============================================
# Chạy script này trên EC2 instance
# Yêu cầu: DNS đã trỏ 4 subdomain về IP của EC2
# =============================================

set -e

# Configuration
DOMAINS=(app.lapisweb.online admin.lapisweb.online api.lapisweb.online auth.lapisweb.online)
EMAIL="admin@lapisweb.online"  # Thay bằng email của bạn
STAGING=0  # Set 1 để test trước (tránh rate limit)
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  NT2205 - Let's Encrypt SSL Setup${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo -e "${YELLOW}Script đang chạy không phải root, sẽ dùng sudo nếu cần${NC}"
fi

cd "$PROJECT_DIR"
echo -e "${GREEN}Working directory: $PROJECT_DIR${NC}"

# Step 1: Create required directories
echo ""
echo -e "${GREEN}[1/6] Creating directories...${NC}"
mkdir -p certbot/www
mkdir -p certbot/conf

# Step 2: Check DNS propagation
echo ""
echo -e "${GREEN}[2/6] Checking DNS records...${NC}"
for domain in "${DOMAINS[@]}"; do
    ip=$(dig +short "$domain" 2>/dev/null || echo "")
    if [ -z "$ip" ]; then
        echo -e "${RED}✗ $domain - DNS not resolved!${NC}"
        echo -e "${YELLOW}  Please add A record in GoDaddy and wait for DNS propagation${NC}"
        exit 1
    else
        echo -e "${GREEN}✓ $domain -> $ip${NC}"
    fi
done

# Step 3: Backup current nginx config and use init config
echo ""
echo -e "${GREEN}[3/6] Setting up temporary NGINX config...${NC}"
if [ -f docker/nginx/conf.d/default.conf ]; then
    cp docker/nginx/conf.d/default.conf docker/nginx/conf.d/default.conf.backup
fi
cp docker/nginx/conf.d/default.conf.init docker/nginx/conf.d/default.conf

# Step 4: Start NGINX with HTTP only
echo ""
echo -e "${GREEN}[4/6] Starting NGINX (HTTP only)...${NC}"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d nginx

# Wait for NGINX to be ready
sleep 5

# Verify NGINX is running
if ! docker ps | grep -q nt2205-nginx; then
    echo -e "${RED}✗ NGINX failed to start!${NC}"
    docker logs nt2205-nginx
    exit 1
fi
echo -e "${GREEN}✓ NGINX is running${NC}"

# Step 5: Request certificates
echo ""
echo -e "${GREEN}[5/6] Requesting Let's Encrypt certificates...${NC}"

# Build domain arguments
DOMAIN_ARGS=""
for domain in "${DOMAINS[@]}"; do
    DOMAIN_ARGS="$DOMAIN_ARGS -d $domain"
done

# Staging or production
if [ $STAGING -eq 1 ]; then
    STAGING_ARG="--staging"
    echo -e "${YELLOW}Using staging environment (for testing)${NC}"
else
    STAGING_ARG=""
    echo -e "${GREEN}Using production environment${NC}"
fi

# Run certbot
docker run --rm \
    -v "$PROJECT_DIR/certbot/www:/var/www/certbot" \
    -v "$PROJECT_DIR/certbot/conf:/etc/letsencrypt" \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    $STAGING_ARG \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    $DOMAIN_ARGS

# Check if certificates were created
if [ ! -f "certbot/conf/live/app.lapisweb.online/fullchain.pem" ]; then
    echo -e "${RED}✗ Certificate generation failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Certificates generated successfully!${NC}"

# Step 6: Switch to HTTPS config
echo ""
echo -e "${GREEN}[6/6] Switching to HTTPS configuration...${NC}"
cp docker/nginx/conf.d/default.conf.letsencrypt docker/nginx/conf.d/default.conf

# Restart NGINX with SSL
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d nginx
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d certbot

# Wait and verify
sleep 5

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  ✓ SSL Setup Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${GREEN}Your sites are now available at:${NC}"
for domain in "${DOMAINS[@]}"; do
    echo -e "  • https://$domain"
done
echo ""
echo -e "${YELLOW}Notes:${NC}"
echo "  • Certificates auto-renew via certbot container"
echo "  • Renewal runs every 12 hours"
echo "  • Certificates valid for 90 days"
echo ""
echo -e "${GREEN}To verify SSL:${NC}"
echo "  curl -I https://app.lapisweb.online"
echo ""

