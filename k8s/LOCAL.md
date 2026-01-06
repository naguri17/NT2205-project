# Running Kubernetes Locally - Orchestrated Development

This guide covers setting up and running the **properly orchestrated** Kubernetes cluster locally for development and testing using K3s.

---

## Understanding Orchestration

### What This Guide Provides

This setup gives you **proper Kubernetes orchestration** for your backend services:

- ✅ **Containerized Services**: All services run in Docker containers
- ✅ **Automatic Orchestration**: Kubernetes manages container lifecycle
- ✅ **Health Checks**: Liveness, readiness, and startup probes
- ✅ **Auto-recovery**: Automatic pod restart on failure
- ✅ **Resource Management**: CPU and memory limits per service
- ✅ **Service Discovery**: DNS-based service discovery within cluster
- ✅ **Scaling**: Easy horizontal scaling
- ✅ **Rolling Updates**: Zero-downtime deployments

### Why Orchestration Matters

**Key Philosophy:**
> **Proper orchestration (Kubernetes) > Microservices architecture**
>
> You don't need full microservices. Proper orchestration provides enterprise-grade
> capabilities (scalability, reliability, updates) without microservices complexity.

This setup provides **proper orchestration** - not just running processes, but managing containers with enterprise-grade features.

---

## Prerequisites

- **Linux/macOS/Windows with WSL2**
- **Docker** installed and running
- **At least 4GB RAM** available
- **Internet connection** for downloading images
- **kubectl** (will be installed with K3s)

---

## Step 1: Install Kubernetes (K3s)

K3s is a lightweight, certified Kubernetes distribution perfect for local development and **proper orchestration**.

### Installation

#### Linux/macOS

```bash
# Install K3s
curl -sfL https://get.k3s.io | sh -

# Verify installation
sudo k3s kubectl get nodes
```

#### Windows (WSL2)

```bash
# In WSL2, same as Linux
curl -sfL https://get.k3s.io | sh -
```

### Configure kubectl

```bash
# Create kubeconfig directory
mkdir -p ~/.kube

# Copy kubeconfig (requires sudo)
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
chmod 600 ~/.kube/config

# Update server URL to use localhost
sed -i 's/127.0.0.1/localhost/g' ~/.kube/config

# Verify kubectl access
kubectl get nodes
```

**Note**: If you get permission errors, reinstall K3s with proper permissions:

```bash
# Uninstall current K3s
sudo /usr/local/bin/k3s-uninstall.sh

# Reinstall with write-kubeconfig-mode flag
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--write-kubeconfig-mode 644" sh -

# Then copy to user directory
mkdir -p ~/.kube
cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
chmod 600 ~/.kube/config
```

### Verify Storage Class

K3s comes with local-path provisioner for PersistentVolumes (required for database orchestration):

```bash
# Check storage class
kubectl get storageclass

# Should show: local-path (default)
```

If not available, install it:

```bash
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.24/deploy/local-path-storage.yaml
```

---

## Step 2: Build Container Images

Before deploying to Kubernetes, you need to build Docker images for your backend services. **Containerization is essential for proper orchestration.**

### Verify Dockerfiles Exist

Check that Dockerfiles exist for each service:

```bash
# Check Dockerfiles
ls -la apps/*/Dockerfile

# Should show:
# apps/order-service/Dockerfile
# apps/payment-service/Dockerfile
# apps/product-service/Dockerfile
```

### Build Images

From the project root directory:

```bash
# Navigate to project root
cd /home/hoitq/Documents/NT2205-project

# Build product service
docker build -t product-service:latest -f apps/product-service/Dockerfile .

# Build order service
docker build -t order-service:latest -f apps/order-service/Dockerfile .

# Build payment service
docker build -t payment-service:latest -f apps/payment-service/Dockerfile .

# Verify images
docker images | grep -E "product-service|order-service|payment-service"
```

**Or use the npm script:**

```bash
pnpm k8s:build
```

---

## Step 3: Load Images into K3s

K3s uses containerd, so we need to import Docker images into K3s for orchestration.

### Option 1: Using LOAD-IMAGES.sh Script

```bash
# Make script executable
chmod +x k8s/LOAD-IMAGES.sh

# Run the script (requires sudo)
sudo k8s/LOAD-IMAGES.sh
```

### Option 2: Manual Import

```bash
# Save images to temporary files and import
docker save product-service:latest -o /tmp/product-service.tar
sudo k3s ctr images import /tmp/product-service.tar
rm /tmp/product-service.tar

docker save order-service:latest -o /tmp/order-service.tar
sudo k3s ctr images import /tmp/order-service.tar
rm /tmp/order-service.tar

docker save payment-service:latest -o /tmp/payment-service.tar
sudo k3s ctr images import /tmp/payment-service.tar
rm /tmp/payment-service.tar

# Verify images are loaded
sudo k3s ctr images ls | grep -E "product-service|order-service|payment-service"
```

**Note**: Process substitution `<(...)` doesn't work reliably with `sudo`, so we use temporary files instead.

### Verify Image Pull Policy

The deployment manifests should have `imagePullPolicy: Never` for local development. Check:

```bash
# Verify imagePullPolicy in deployments
grep -r "imagePullPolicy" k8s/backend/*-deployment.yaml

# Should show: imagePullPolicy: Never
```

If not set, update the deployments:

```bash
cd k8s/backend
sed -i 's/imagePullPolicy: IfNotPresent/imagePullPolicy: Never/g' *-deployment.yaml
```

---

## Step 4: Configure Secrets and ConfigMaps

Before deploying, ensure secrets and configs are set up for local development. **Configuration management is part of proper orchestration.**

### Update Secrets

**⚠️ IMPORTANT**: Never commit real secrets to git. Secret YAML files contain placeholders. Use the helper scripts or `kubectl create secret` commands.

#### Payment Service Secret

**Use the helper script (Recommended)**:

```bash
# Create payment service secret from setup-env.js or environment variables
./k8s/scripts/create-payment-secret.sh
```

The script will automatically read from `setup-env.js` if environment variables are not set.

**Manual creation**:

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

#### Other Secrets (if needed)

Edit secret files with local development values:

```bash
# Edit secrets
vim k8s/database/postgres-secret.yaml
vim k8s/auth/keycloak-secret.yaml
vim k8s/backend/product-service-secret.yaml
vim k8s/backend/order-service-secret.yaml
```

**Example for postgres-secret.yaml:**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: database
type: Opaque
stringData:
  POSTGRES_USER: admin
  POSTGRES_PASSWORD: "dev-password"  # Change for local dev
  POSTGRES_DB: products
```

### Update ConfigMaps (if needed)

Check ConfigMaps for local development settings:

```bash
# Review ConfigMaps
cat k8s/backend/product-service-configmap.yaml
```

Ensure service URLs use Kubernetes DNS format (service discovery):

```yaml
data:
  DATABASE_URL: "postgresql://admin:dev-password@postgres.database.svc.cluster.local:5432/products"
  KAFKA_BROKERS: "kafka:9092"  # If using Kafka
```

**Note**: Kubernetes DNS (`service.namespace.svc.cluster.local`) is part of orchestration's service discovery.

---

## Step 5: Deploy to Kubernetes

### Option 1: Automated Deployment (Recommended)

Use the provided deployment script:

```bash
cd k8s
chmod +x deploy.sh
./deploy.sh
```

**Or use npm script:**

```bash
pnpm k8s:deploy
```

The script orchestrates deployment in the correct order:

1. Creates namespaces (logical isolation)
2. Deploys database and waits for it to be ready (health checks)
3. Deploys authentication (Keycloak) and waits for it to be ready
4. Deploys backend services and waits for them to be ready
5. Deploys API Gateway (Kong) and waits for it to be ready
6. Displays deployment summary

### Option 2: Manual Deployment

If you prefer manual control:

```bash
cd k8s

# 1. Create namespaces
kubectl apply -f namespaces/

# 2. Deploy database
kubectl apply -f database/
kubectl wait --for=condition=ready pod -l app=postgres -n database --timeout=120s

# 3. Deploy authentication
kubectl apply -f auth/
kubectl wait --for=condition=ready pod -l app=keycloak -n auth --timeout=300s

# 4. Deploy backend services
kubectl apply -f backend/
kubectl wait --for=condition=ready pod -l tier=backend -n backend --timeout=120s

# 5. Deploy API Gateway
kubectl apply -f gateway/
kubectl wait --for=condition=ready pod -l app=kong -n gateway --timeout=120s
```

---

## Step 6: Verify Orchestration

### Check Pod Status

```bash
# Check all pods
kubectl get pods --all-namespaces

# Or use npm script
pnpm k8s:status

# Expected output:
# NAMESPACE   NAME                              READY   STATUS    RESTARTS   AGE
# auth        keycloak-xxx                      1/1     Running   0          2m
# backend     order-service-xxx                 1/1     Running   0          1m
# backend     payment-service-xxx                1/1     Running   0          1m
# backend     product-service-xxx                1/1     Running   0          1m
# database    postgres-0                        1/1     Running   0          3m
# gateway     kong-xxx                          1/1     Running   0          30s
```

**What to look for:**

- All pods show `READY 1/1` (orchestration health checks passing)
- Status is `Running` (orchestration managing lifecycle)
- Multiple replicas per service (high availability)

### Check Services

```bash
# Check all services
kubectl get services --all-namespaces

# Expected output:
# NAMESPACE   NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)
# auth        keycloak          ClusterIP   10.43.x.x       <none>        8080/TCP
# backend     order-service     ClusterIP   10.43.x.x       <none>        8001/TCP
# backend     payment-service   ClusterIP   10.43.x.x       <none>        8002/TCP
# backend     product-service   ClusterIP   10.43.x.x       <none>        8000/TCP
# database    postgres          ClusterIP   10.43.x.x       <none>        5432/TCP
# gateway     kong              NodePort    10.43.x.x       <none>        9000:30080/TCP
```

**Service Discovery**: Services are accessible via DNS:

- `product-service.backend.svc.cluster.local:8000`
- `order-service.backend.svc.cluster.local:8001`
- `payment-service.backend.svc.cluster.local:8002`

### Check Deployments

```bash
# Check deployments
kubectl get deployments --all-namespaces

# All should show READY replicas (orchestration maintaining desired state)
```

### Verify Health Checks

```bash
# Check health probe status
kubectl describe pod <pod-name> -n backend | grep -A 10 "Liveness\|Readiness"

# Test health endpoint
kubectl exec -it <pod-name> -n backend -- curl http://localhost:8000/health
```

**Orchestration Feature**: Health checks ensure only healthy pods receive traffic.

---

## Step 7: Access Services Locally

### Option 1: Port Forwarding (Recommended for Local)

Port forwarding is the easiest way to access services locally:

```bash
# Kong Gateway (in one terminal)
kubectl port-forward svc/kong -n gateway 9000:9000
# Access: http://localhost:9000

# Keycloak (in another terminal)
kubectl port-forward svc/keycloak -n auth 8080:8080
# Access: http://localhost:8080

# PostgreSQL (for debugging, in another terminal)
kubectl port-forward svc/postgres -n database 5432:5432
# Access: localhost:5432
```

### Option 2: NodePort

Kong is exposed via NodePort on port 30080:

```bash
# Access Kong Gateway
curl http://localhost:30080/health

# Or in browser
# http://localhost:30080
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:9000/health

# Product service (via Kong)
curl http://localhost:9000/api/products

# Order service (via Kong)
curl http://localhost:9000/api/orders

# Payment service (via Kong)
curl http://localhost:9000/api/payments
```

---

## Step 8: View Logs

**Orchestration provides centralized logging:**

### View Pod Logs

```bash
# View logs for a specific pod
kubectl logs <pod-name> -n <namespace>

# Follow logs (real-time)
kubectl logs -f <pod-name> -n <namespace>

# View logs for all pods with a label
kubectl logs -l app=product-service -n backend

# View logs for all containers in a pod
kubectl logs <pod-name> -n <namespace> --all-containers=true
```

### Examples

```bash
# Product service logs
kubectl logs -l app=product-service -n backend

# Or use npm script
pnpm k8s:logs:product

# Kong Gateway logs
kubectl logs -l app=kong -n gateway

# PostgreSQL logs
kubectl logs -l app=postgres -n database

# Keycloak logs
kubectl logs -l app=keycloak -n auth
```

---

## Step 9: Debugging

### Inspect Pod Status

```bash
# Describe pod (detailed information)
kubectl describe pod <pod-name> -n <namespace>

# Check events
kubectl get events --all-namespaces --sort-by='.lastTimestamp'

# Check recent events
kubectl get events --all-namespaces --sort-by='.lastTimestamp' | tail -20
```

### Common Issues

#### 1. ImagePullBackOff

**Problem**: Cannot pull image

**Solution**:

```bash
# Check if image exists in K3s
sudo k3s ctr images ls | grep product-service

# If not found, import image
docker save product-service:latest -o /tmp/product-service.tar
sudo k3s ctr images import /tmp/product-service.tar
rm /tmp/product-service.tar

# Verify imagePullPolicy is set to Never
grep imagePullPolicy k8s/backend/product-service-deployment.yaml
```

#### 2. CrashLoopBackOff

**Problem**: Container keeps crashing

**Solution**:

```bash
# Check logs
kubectl logs <pod-name> -n <namespace>

# Check events
kubectl describe pod <pod-name> -n <namespace>

# Common causes:
# - Missing environment variables
# - Database connection issues
# - Port conflicts
# - Configuration errors
```

**Orchestration Feature**: Kubernetes automatically restarts failed containers (self-healing).

#### 3. Pending Pods

**Problem**: Pods stuck in Pending

**Solution**:

```bash
# Check why
kubectl describe pod <pod-name> -n <namespace>

# Common causes:
# - Insufficient resources (CPU/memory)
# - PVC not bound (for database)
# - Node not ready
# - Image pull issues
```

#### 4. Service Not Accessible

**Problem**: Cannot access service

**Solution**:

```bash
# Check service
kubectl get svc -n <namespace>

# Check endpoints
kubectl get endpoints -n <namespace>

# Test from within cluster (service discovery)
kubectl run -it --rm debug --image=busybox --restart=Never -- sh
# Then inside the pod:
# wget -O- http://product-service.backend.svc.cluster.local:8000/health
```

---

## Step 10: Update Configuration

**Orchestration provides configuration management:**

### Update ConfigMap

```bash
# Edit ConfigMap directly
kubectl edit configmap product-service-config -n backend

# Or apply updated YAML
kubectl apply -f backend/product-service-configmap.yaml

# Restart pods to pick up changes (rolling update)
kubectl rollout restart deployment/product-service -n backend
```

**Orchestration Feature**: Rolling updates ensure zero downtime.

### Update Secret

```bash
# Edit Secret directly
kubectl edit secret product-service-secret -n backend

# Or apply updated YAML
kubectl apply -f backend/product-service-secret.yaml

# Restart pods
kubectl rollout restart deployment/product-service -n backend
```

### Update Kong Configuration

```bash
# Edit Kong ConfigMap
kubectl edit configmap kong-config -n gateway

# Or apply updated YAML
kubectl apply -f gateway/kong-configmap.yaml

# Restart Kong pods (rolling update)
kubectl rollout restart deployment/kong -n gateway
```

---

## Step 11: Scale Services

**Orchestration provides easy scaling:**

### Scale Manually

```bash
# Scale product service to 3 replicas
kubectl scale deployment product-service -n backend --replicas=3

# Check scaling
kubectl get pods -n backend -l app=product-service

# Scale back down
kubectl scale deployment product-service -n backend --replicas=1
```

**Orchestration Feature**: Kubernetes automatically distributes traffic across replicas.

### Update Replicas in Deployment

```bash
# Edit deployment
kubectl edit deployment product-service -n backend

# Change replicas in spec.replicas
```

---

## Step 12: Local Development Workflow

### 1. Make Code Changes

```bash
# Edit code in your IDE
vim apps/product-service/src/index.ts
```

### 2. Rebuild Image

```bash
# Build new image
docker build -t product-service:latest -f apps/product-service/Dockerfile .
```

### 3. Reload into K3s

```bash
# Import new image (using temporary file)
docker save product-service:latest -o /tmp/product-service.tar
sudo k3s ctr images import /tmp/product-service.tar
rm /tmp/product-service.tar

# Or use the script (recommended)
sudo k8s/LOAD-IMAGES.sh
```

### 4. Rolling Update

```bash
# Restart to use new image (rolling update)
kubectl rollout restart deployment/product-service -n backend

# Monitor rollout
kubectl rollout status deployment/product-service -n backend
```

**Orchestration Feature**: Rolling updates ensure zero downtime.

### 5. Verify Changes

```bash
# Check new pod
kubectl get pods -n backend -l app=product-service

# View logs
kubectl logs -f <new-pod-name> -n backend

# Test endpoint
curl http://localhost:9000/api/products
```

---

## Step 13: Clean Up

### Delete All Resources

```bash
cd k8s

# Delete in reverse order
kubectl delete -f gateway/
kubectl delete -f backend/
kubectl delete -f auth/
kubectl delete -f database/
kubectl delete -f namespaces/
```

### Stop K3s

```bash
# Stop K3s service
sudo systemctl stop k3s

# Or uninstall K3s (removes everything)
sudo /usr/local/bin/k3s-uninstall.sh
```

---

## Orchestration Features Summary

Your local setup provides these orchestration capabilities:

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Containerization** | Services run in Docker containers | Isolation and portability |
| **Health Checks** | Liveness, readiness, startup probes | Automatic failure detection |
| **Auto-recovery** | Kubernetes restarts failed pods | Self-healing system |
| **Resource Management** | CPU/memory limits per pod | Resource isolation |
| **Service Discovery** | DNS-based service communication | No hardcoded IPs |
| **Scaling** | Easy horizontal scaling | Handle load changes |
| **Rolling Updates** | Zero-downtime deployments | Continuous delivery |
| **Configuration Management** | ConfigMaps and Secrets | Centralized config |

---

## Tips for Local Development

1. **Use Port Forwarding**: Easier than NodePort for local access
2. **Watch Logs**: Use `kubectl logs -f` to follow logs in real-time
3. **Quick Restart**: Use `kubectl rollout restart` for quick updates
4. **Resource Limits**: Lower resource limits for local if needed
5. **Single Replica**: Use 1 replica for local to save resources
6. **Image Caching**: Rebuild only when code changes
7. **Namespace Isolation**: Each component in its own namespace
8. **Service Discovery**: Use Kubernetes DNS for service communication

---

## Troubleshooting Quick Reference

| Issue | Command |
| ----- | ------- |
| Check pod status | `kubectl get pods --all-namespaces` |
| View pod logs | `kubectl logs <pod-name> -n <namespace>` |
| Describe pod | `kubectl describe pod <pod-name> -n <namespace>` |
| Check services | `kubectl get svc --all-namespaces` |
| Check events | `kubectl get events --all-namespaces` |
| Restart deployment | `kubectl rollout restart deployment/<name> -n <namespace>` |
| Scale deployment | `kubectl scale deployment/<name> -n <namespace> --replicas=N` |
| Port forward | `kubectl port-forward svc/<name> -n <namespace> <local>:<remote>` |
| Exec into pod | `kubectl exec -it <pod-name> -n <namespace> -- /bin/sh` |

---

## Next Steps

- Read `ORCHESTRATION.md` to understand orchestration concepts
- Read `PRODUCTION.md` for production deployment guide
- Read `ARCHITECTURE.md` for architecture overview
- Read `README.md` for comprehensive documentation

---

## Additional Resources

- [K3s Documentation](https://k3s.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

---

## Summary

This local setup provides **proper Kubernetes orchestration** for your backend services:

- ✅ Containerized and orchestrated
- ✅ Health checks and auto-recovery
- ✅ Resource management
- ✅ Service discovery
- ✅ Scaling and rolling updates

**Remember**: Proper orchestration gives you enterprise-grade capabilities without needing full microservices architecture.
