# Kubernetes Orchestration Setup

This directory contains Kubernetes manifests for orchestrating all backend services.

## Quick Start

### 0. Set Up Secrets (Required Before Deployment)

**Important**: Kubernetes secrets must be created before deploying services. The secret YAML files contain placeholders and should NOT be committed with real secrets.

```bash
# Create payment service secret from setup-env.js or environment variables
./k8s/scripts/create-payment-secret.sh
```

This script will:

- Read Stripe keys from `setup-env.js` (if available)
- Or use environment variables `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
- Create the Kubernetes secret in the `backend` namespace

**Alternative: Manual secret creation**:

```bash
# Set environment variables
export STRIPE_SECRET_KEY="your-stripe-secret-key"
export STRIPE_WEBHOOK_SECRET="your-webhook-secret"

# Create secret
kubectl create secret generic payment-service-secret \
  --from-literal=STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY}" \
  --from-literal=STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET}" \
  --namespace=backend
```

**Verify secret was created**:

```bash
kubectl get secret payment-service-secret -n backend
```

### 1. Build Container Images

```bash
# Build all service images
pnpm k8s:build

# Or manually
docker build -t product-service:latest -f apps/product-service/Dockerfile .
docker build -t order-service:latest -f apps/order-service/Dockerfile .
docker build -t payment-service:latest -f apps/payment-service/Dockerfile .
```

### 2. Deploy Everything

```bash
# Deploy all services
pnpm k8s:deploy

# Or manually
cd k8s
./deploy.sh
```

### 3. Check Status

```bash
# View all pods
pnpm k8s:status

# Or manually
kubectl get pods --all-namespaces
```

## Directory Structure

```
k8s/
├── README.md                    # This file
├── ORCHESTRATION.md            # Orchestration concepts and features
├── ARCHITECTURE.md             # System architecture details
├── PRODUCTION.md               # Production deployment guide
├── LOCAL.md                    # Local development guide
├── deploy.sh                   # Automated deployment script
├── namespaces/
│   └── namespaces.yaml        # Namespace definitions
├── database/
│   ├── postgres-deployment.yaml
│   ├── postgres-service.yaml
│   ├── postgres-secret.yaml
│   ├── postgres-configmap.yaml
│   └── postgres-pvc.yaml
├── auth/
│   ├── keycloak-deployment.yaml
│   ├── keycloak-service.yaml
│   ├── keycloak-secret.yaml
│   └── keycloak-configmap.yaml
├── backend/
│   ├── product-service-deployment.yaml
│   ├── product-service-service.yaml
│   ├── product-service-configmap.yaml
│   ├── product-service-secret.yaml
│   ├── order-service-deployment.yaml
│   ├── order-service-service.yaml
│   ├── order-service-configmap.yaml
│   ├── order-service-secret.yaml
│   ├── payment-service-deployment.yaml
│   ├── payment-service-service.yaml
│   ├── payment-service-configmap.yaml
│   └── payment-service-secret.yaml
└── gateway/
    ├── kong-deployment.yaml
    ├── kong-service.yaml
    ├── kong-ingress.yaml
    └── kong-configmap.yaml
```

## Common Commands

### View Logs

```bash
# All logs
pnpm k8s:logs

# Specific service
pnpm k8s:logs:product
pnpm k8s:logs:order
pnpm k8s:logs:payment

# Manual
kubectl logs -f deployment/product-service -n backend
```

### Restart Services

```bash
# Restart all backend services
kubectl rollout restart deployment -n backend

# Restart specific service
pnpm k8s:restart:product
kubectl rollout restart deployment/product-service -n backend
```

### Scale Services

```bash
# Scale to 3 replicas
kubectl scale deployment/product-service --replicas=3 -n backend

# Scale via pnpm (requires replicas argument)
kubectl scale deployment/product-service --replicas=3 -n backend
```

### Update Services

```bash
# Update image
kubectl set image deployment/product-service \
  product-service=product-service:v2.0.0 -n backend

# Check rollout status
kubectl rollout status deployment/product-service -n backend

# Rollback if needed
kubectl rollout undo deployment/product-service -n backend
```

### Troubleshooting

```bash
# Describe pod
kubectl describe pod <pod-name> -n backend

# View events
kubectl get events -n backend --sort-by='.lastTimestamp'

# Check service endpoints
kubectl get endpoints -n backend

# Port forward for testing
kubectl port-forward svc/product-service 8000:8000 -n backend
```

## Documentation

- **[ORCHESTRATION.md](./ORCHESTRATION.md)** - Understand orchestration vs microservices
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture details
- **[PRODUCTION.md](./PRODUCTION.md)** - Production deployment guide
- **[LOCAL.md](./LOCAL.md)** - Local development setup

## Key Concepts

### Orchestration Features

- ✅ **Containerization**: All services run in Docker containers
- ✅ **Health Checks**: Automatic liveness, readiness, and startup probes
- ✅ **Auto-recovery**: Kubernetes automatically restarts failed containers
- ✅ **Resource Management**: CPU and memory limits per service
- ✅ **Service Discovery**: DNS-based service discovery within cluster
- ✅ **Scaling**: Horizontal pod autoscaling support
- ✅ **Rolling Updates**: Zero-downtime deployments
- ✅ **High Availability**: Multiple replicas per service

### Why Orchestration > Microservices

You don't need full microservices architecture. Proper orchestration with Kubernetes provides:

- Service lifecycle management
- Health monitoring and auto-recovery
- Resource isolation
- Scalability
- Service discovery
- Rolling updates

All without the complexity of distributed microservices.

## Next Steps

1. Read [ORCHESTRATION.md](./ORCHESTRATION.md) to understand the concepts
2. Follow [PRODUCTION.md](./PRODUCTION.md) for production deployment
3. Use [LOCAL.md](./LOCAL.md) for local development
4. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for architecture details
