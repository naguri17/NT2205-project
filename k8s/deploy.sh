#!/bin/bash

# Kubernetes Deployment Script
# This script deploys all components in the correct order

set -e

echo "=========================================="
echo "Kubernetes Deployment Script"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed or not in PATH"
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo "Error: Cannot connect to Kubernetes cluster"
    exit 1
fi

echo -e "${GREEN}✓${NC} Kubernetes cluster is accessible"

# Step 1: Create namespaces
echo ""
echo "Step 1: Creating namespaces..."
kubectl apply -f namespaces/
echo -e "${GREEN}✓${NC} Namespaces created"

# Step 2: Deploy database
echo ""
echo "Step 2: Deploying database..."
kubectl apply -f database/
echo -e "${GREEN}✓${NC} Database manifests applied"
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=postgres -n database --timeout=120s
echo -e "${GREEN}✓${NC} PostgreSQL is ready"

# Step 3: Deploy authentication
echo ""
echo "Step 3: Deploying authentication (Keycloak)..."
kubectl apply -f auth/
echo -e "${GREEN}✓${NC} Keycloak manifests applied"
echo -e "${YELLOW}Waiting for Keycloak to be ready (this may take a few minutes)...${NC}"
kubectl wait --for=condition=ready pod -l app=keycloak -n auth --timeout=300s
echo -e "${GREEN}✓${NC} Keycloak is ready"

# Step 4: Deploy backend services
echo ""
echo "Step 4: Deploying backend services..."
kubectl apply -f backend/
echo -e "${GREEN}✓${NC} Backend service manifests applied"
echo -e "${YELLOW}Waiting for backend services to be ready...${NC}"
kubectl wait --for=condition=ready pod -l tier=backend -n backend --timeout=120s
echo -e "${GREEN}✓${NC} Backend services are ready"

# Step 5: Deploy API Gateway
echo ""
echo "Step 5: Deploying API Gateway (Kong)..."
kubectl apply -f gateway/
echo -e "${GREEN}✓${NC} Kong Gateway manifests applied"
echo -e "${YELLOW}Waiting for Kong Gateway to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=kong -n gateway --timeout=120s
echo -e "${GREEN}✓${NC} Kong Gateway is ready"

# Summary
echo ""
echo "=========================================="
echo "Deployment Summary"
echo "=========================================="
echo ""
echo "Namespaces:"
kubectl get namespaces | grep -E "gateway|auth|backend|database"
echo ""
echo "Services:"
kubectl get services --all-namespaces | grep -E "NAMESPACE|gateway|auth|backend|database"
echo ""
echo "Pods:"
kubectl get pods --all-namespaces | grep -E "NAMESPACE|gateway|auth|backend|database"
echo ""
echo "=========================================="
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
echo "Access points:"
echo "  - Kong Gateway (NodePort): <node-ip>:30080"
echo "  - Kong Admin (NodePort): <node-ip>:30081"
echo ""
echo "To get node IP:"
echo "  kubectl get nodes -o wide"
echo ""
echo "To check service status:"
echo "  kubectl get pods --all-namespaces"
echo "  kubectl get services --all-namespaces"

