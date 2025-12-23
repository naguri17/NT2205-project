#!/bin/bash

# =============================================
# SELF-SIGNED SSL CERTIFICATE GENERATOR
# =============================================
# Môn: Mật mã và ứng dụng (NT2205)
# Tạo chứng chỉ SSL tự ký cho domain lapisweb.online
# =============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="lapisweb.online"
SSL_DIR="$(dirname "$0")/../docker/nginx/ssl"
DAYS_VALID=365
KEY_SIZE=4096  # RSA key size (2048 hoặc 4096)

# Subject fields
COUNTRY="VN"
STATE="Ho Chi Minh"
LOCALITY="Thu Duc"
ORGANIZATION="NT2205 E-Commerce Project"
ORG_UNIT="Development Team"
COMMON_NAME="*.${DOMAIN}"
EMAIL="admin@${DOMAIN}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   SSL CERTIFICATE GENERATOR          ${NC}"
echo -e "${BLUE}   Môn: Mật mã và ứng dụng (NT2205)   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Create SSL directory
mkdir -p "$SSL_DIR"
cd "$SSL_DIR"

echo -e "${YELLOW}📁 Thư mục SSL: ${SSL_DIR}${NC}"
echo ""

# =============================================
# BƯỚC 1: Tạo Root CA (Certificate Authority)
# =============================================
echo -e "${GREEN}🔐 BƯỚC 1: Tạo Root Certificate Authority (CA)${NC}"

# Tạo private key cho CA
echo -e "  → Tạo CA Private Key (${KEY_SIZE} bits RSA)..."
openssl genrsa -out ca.key ${KEY_SIZE}

# Tạo CA certificate
echo -e "  → Tạo CA Certificate..."
openssl req -x509 -new -nodes \
    -key ca.key \
    -sha256 \
    -days ${DAYS_VALID} \
    -out ca.crt \
    -subj "/C=${COUNTRY}/ST=${STATE}/L=${LOCALITY}/O=${ORGANIZATION}/OU=${ORG_UNIT}/CN=NT2205 Root CA/emailAddress=${EMAIL}"

echo -e "${GREEN}  ✅ CA Certificate đã được tạo: ca.crt${NC}"
echo ""

# =============================================
# BƯỚC 2: Tạo Server Certificate
# =============================================
echo -e "${GREEN}🔐 BƯỚC 2: Tạo Server Certificate cho ${DOMAIN}${NC}"

# Tạo private key cho server
echo -e "  → Tạo Server Private Key..."
openssl genrsa -out ${DOMAIN}.key ${KEY_SIZE}

# Tạo Certificate Signing Request (CSR)
echo -e "  → Tạo Certificate Signing Request (CSR)..."

# Tạo file cấu hình cho CSR với Subject Alternative Names (SAN)
cat > ${DOMAIN}.cnf << EOF
[req]
default_bits = ${KEY_SIZE}
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[dn]
C = ${COUNTRY}
ST = ${STATE}
L = ${LOCALITY}
O = ${ORGANIZATION}
OU = ${ORG_UNIT}
CN = ${COMMON_NAME}
emailAddress = ${EMAIL}

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = ${DOMAIN}
DNS.2 = *.${DOMAIN}
DNS.3 = app.${DOMAIN}
DNS.4 = admin.${DOMAIN}
DNS.5 = api.${DOMAIN}
DNS.6 = auth.${DOMAIN}
DNS.7 = localhost
IP.1 = 127.0.0.1
IP.2 = 15.134.119.222
EOF

openssl req -new \
    -key ${DOMAIN}.key \
    -out ${DOMAIN}.csr \
    -config ${DOMAIN}.cnf

# Tạo file extension cho certificate
cat > ${DOMAIN}.ext << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = ${DOMAIN}
DNS.2 = *.${DOMAIN}
DNS.3 = app.${DOMAIN}
DNS.4 = admin.${DOMAIN}
DNS.5 = api.${DOMAIN}
DNS.6 = auth.${DOMAIN}
DNS.7 = localhost
IP.1 = 127.0.0.1
IP.2 = 15.134.119.222
EOF

# Ký certificate bằng CA
echo -e "  → Ký Certificate bằng CA..."
openssl x509 -req \
    -in ${DOMAIN}.csr \
    -CA ca.crt \
    -CAkey ca.key \
    -CAcreateserial \
    -out ${DOMAIN}.crt \
    -days ${DAYS_VALID} \
    -sha256 \
    -extfile ${DOMAIN}.ext

echo -e "${GREEN}  ✅ Server Certificate đã được tạo: ${DOMAIN}.crt${NC}"
echo ""

# =============================================
# BƯỚC 3: Tạo Full Chain Certificate
# =============================================
echo -e "${GREEN}🔐 BƯỚC 3: Tạo Full Chain Certificate${NC}"

cat ${DOMAIN}.crt ca.crt > ${DOMAIN}.fullchain.crt
echo -e "${GREEN}  ✅ Full Chain: ${DOMAIN}.fullchain.crt${NC}"
echo ""

# =============================================
# BƯỚC 4: Verification
# =============================================
echo -e "${GREEN}🔐 BƯỚC 4: Xác minh Certificate${NC}"

echo -e "  → Thông tin Certificate:"
openssl x509 -in ${DOMAIN}.crt -text -noout | grep -E "Subject:|Issuer:|Not Before:|Not After:|DNS:|IP Address:"

echo ""

# =============================================
# BƯỚC 5: Set permissions
# =============================================
echo -e "${GREEN}🔐 BƯỚC 5: Thiết lập quyền truy cập${NC}"
chmod 600 *.key
chmod 644 *.crt *.csr *.cnf *.ext 2>/dev/null || true

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ HOÀN TẤT TẠO SSL CERTIFICATES${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "📁 Files đã tạo trong ${SSL_DIR}:"
ls -la
echo ""
echo -e "${YELLOW}📋 HƯỚNG DẪN SỬ DỤNG:${NC}"
echo ""
echo -e "1. ${GREEN}Cho trình duyệt tin tưởng CA:${NC}"
echo -e "   - Import file ${BLUE}ca.crt${NC} vào trình duyệt (Chrome/Firefox/Safari)"
echo -e "   - Chrome: Settings → Privacy and Security → Security → Manage certificates → Authorities → Import"
echo -e "   - Firefox: Settings → Privacy & Security → Certificates → View Certificates → Authorities → Import"
echo ""
echo -e "2. ${GREEN}Cho macOS/Windows trust CA (optional):${NC}"
echo -e "   - macOS: ${BLUE}sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ca.crt${NC}"
echo -e "   - Windows: Import ca.crt vào 'Trusted Root Certification Authorities'"
echo ""
echo -e "3. ${GREEN}Cho Linux trust CA:${NC}"
echo -e "   - Ubuntu/Debian:"
echo -e "     ${BLUE}sudo cp ca.crt /usr/local/share/ca-certificates/nt2205-ca.crt${NC}"
echo -e "     ${BLUE}sudo update-ca-certificates${NC}"
echo ""
echo -e "${YELLOW}⚠️  LƯU Ý: Self-signed certificates sẽ hiện warning trên browser${NC}"
echo -e "${YELLOW}   nếu chưa import CA. Đây là bình thường cho môi trường development.${NC}"
echo ""

