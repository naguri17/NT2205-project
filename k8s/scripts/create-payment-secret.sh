#!/bin/bash

# Script to create payment-service-secret from environment variables or setup-env.js
# Usage: ./k8s/scripts/create-payment-secret.sh
# 
# This script will:
# 1. Try to read from environment variables first
# 2. If not set, try to extract from setup-env.js
# 3. Create the Kubernetes secret

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SETUP_ENV_FILE="$PROJECT_ROOT/setup-env.js"

echo "=========================================="
echo "Creating payment-service-secret"
echo "=========================================="

# Function to extract value from setup-env.js
extract_from_setup_env() {
    local key=$1
    # Extract the value from CONFIG object in setup-env.js
    # Handles both formats:
    #   STRIPE_SECRET_KEY:\n    "value",  (multi-line)
    #   STRIPE_WEBHOOK_SECRET: "value",    (single-line)
    
    # Use Node.js to properly parse the JavaScript file
    local result=$(node -e "
        const fs = require('fs');
        const content = fs.readFileSync('$SETUP_ENV_FILE', 'utf8');
        
        // Find the CONFIG object section
        const configMatch = content.match(/const CONFIG = \{([\s\S]*?)\};/);
        if (!configMatch) {
            process.exit(1);
        }
        
        const configContent = configMatch[1];
        const key = '$key';
        
        // Pattern 1: key:\n    \"value\" (multi-line with indentation)
        // Example: STRIPE_SECRET_KEY:\n    \"sk_test_...\"
        const pattern1 = new RegExp(key + '\\s*:\\s*\\n\\s*\"([^\"]+)\"', 'm');
        let match = configContent.match(pattern1);
        if (match && match[1]) {
            console.log(match[1].trim());
            process.exit(0);
        }
        
        // Pattern 2: key: \"value\" (single line)
        // Example: STRIPE_WEBHOOK_SECRET: \"whsec_...\"
        const pattern2 = new RegExp(key + '\\s*:\\s*\"([^\"]+)\"', 'm');
        match = configContent.match(pattern2);
        if (match && match[1]) {
            console.log(match[1].trim());
            process.exit(0);
        }
        
        process.exit(1);
    " 2>/dev/null)
    
    if [ -n "$result" ]; then
        echo "$result"
        return 0
    fi
    
    # Fallback: use grep/sed - look for key: then get quoted value
    # This handles both single-line and multi-line formats
    local value=$(grep -A 2 "^[[:space:]]*$key:" "$SETUP_ENV_FILE" 2>/dev/null | grep -o '"[^"]*"' | head -1 | sed 's/"//g')
    if [ -n "$value" ]; then
        echo "$value"
        return 0
    fi
    
    return 1
}

# Try to get STRIPE_SECRET_KEY from environment or setup-env.js
if [ -z "$STRIPE_SECRET_KEY" ]; then
    if [ -f "$SETUP_ENV_FILE" ]; then
        echo -e "${BLUE}Reading STRIPE_SECRET_KEY from setup-env.js...${NC}"
        STRIPE_SECRET_KEY=$(extract_from_setup_env "STRIPE_SECRET_KEY")
        if [ -z "$STRIPE_SECRET_KEY" ]; then
            echo -e "${RED}Error: Could not find STRIPE_SECRET_KEY in setup-env.js${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Error: STRIPE_SECRET_KEY environment variable is not set and setup-env.js not found${NC}"
        echo "Please set it using: export STRIPE_SECRET_KEY=\"your-stripe-secret-key\""
        exit 1
    fi
else
    echo -e "${GREEN}Using STRIPE_SECRET_KEY from environment variable${NC}"
fi

# Try to get STRIPE_WEBHOOK_SECRET from environment or setup-env.js
if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    if [ -f "$SETUP_ENV_FILE" ]; then
        echo -e "${BLUE}Reading STRIPE_WEBHOOK_SECRET from setup-env.js...${NC}"
        STRIPE_WEBHOOK_SECRET=$(extract_from_setup_env "STRIPE_WEBHOOK_SECRET")
        if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
            echo -e "${RED}Error: Could not find STRIPE_WEBHOOK_SECRET in setup-env.js${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Error: STRIPE_WEBHOOK_SECRET environment variable is not set and setup-env.js not found${NC}"
        echo "Please set it using: export STRIPE_WEBHOOK_SECRET=\"your-webhook-secret\""
        exit 1
    fi
else
    echo -e "${GREEN}Using STRIPE_WEBHOOK_SECRET from environment variable${NC}"
fi

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed or not in PATH${NC}"
    exit 1
fi

# Check if namespace exists
if ! kubectl get namespace backend &> /dev/null; then
    echo -e "${YELLOW}Warning: 'backend' namespace does not exist. Creating it...${NC}"
    kubectl create namespace backend
fi

# Create the secret
echo "Creating secret from environment variables..."
kubectl create secret generic payment-service-secret \
    --from-literal=STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY}" \
    --from-literal=STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET}" \
    --namespace=backend \
    --dry-run=client -o yaml | kubectl apply -f -

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Secret 'payment-service-secret' created/updated successfully in namespace 'backend'"
else
    echo -e "${RED}Error: Failed to create secret${NC}"
    exit 1
fi

echo ""
echo "To verify the secret was created:"
echo "  kubectl get secret payment-service-secret -n backend"
echo ""
echo "To view the secret (base64 encoded):"
echo "  kubectl get secret payment-service-secret -n backend -o yaml"

