# Running Kubernetes in Production - Orchestrated Deployment

This guide covers deploying the **properly orchestrated** Kubernetes cluster in production on AWS EC2 or similar cloud infrastructure using K3s.

---

## Understanding Production Orchestration

### What This Guide Provides

This production setup provides **enterprise-grade Kubernetes orchestration**:

- ✅ **Containerized Services**: All services run in Docker containers
- ✅ **Automatic Orchestration**: Kubernetes manages container lifecycle
- ✅ **Health Checks**: Production-grade liveness, readiness, and startup probes
- ✅ **Auto-recovery**: Automatic pod restart on failure (self-healing)
- ✅ **Resource Management**: CPU and memory limits per service
- ✅ **Service Discovery**: DNS-based service discovery within cluster
- ✅ **High Availability**: Multiple replicas per service
- ✅ **Rolling Updates**: Zero-downtime deployments
- ✅ **Scaling**: Horizontal pod autoscaling support
- ✅ **Monitoring**: Production monitoring and alerting

### Why Orchestration Matters in Production

**Key Philosophy:**
> **Proper orchestration (Kubernetes) > Microservices architecture**
>
> You don't need full microservices for production. Proper orchestration provides
> enterprise-grade capabilities (scalability, reliability, zero-downtime updates)
> without microservices complexity.

This production setup provides **proper orchestration** - not just running containers, but managing them with enterprise-grade features for production workloads.

---

## Prerequisites

- **AWS EC2 instance** (t3.medium or larger recommended)
- **SSH access** to EC2 instance
- **Domain name** (optional, for Ingress with SSL)
- **Container registry** (Docker Hub, AWS ECR, or private registry)
- **Basic knowledge** of AWS, Linux, and Kubernetes

---

## Step 1: Prepare EC2 Instance

### Instance Requirements

- **Instance Type**: t3.medium or larger (2+ vCPUs, 4+ GB RAM)
- **OS**: Ubuntu 22.04 LTS or Amazon Linux 2023
- **Storage**: 20+ GB (SSD recommended)
- **Security Group**: Allow ports:
  - **22** (SSH)
  - **30080** (Kong NodePort - if using NodePort)
  - **80** (HTTP - if using Ingress)
  - **443** (HTTPS - if using Ingress)

### Connect to EC2

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Update System

```bash
# Ubuntu
sudo apt update && sudo apt upgrade -y

# Amazon Linux
sudo yum update -y
```

### Install Docker (for building/pushing images)

```bash
# Ubuntu
sudo apt install docker.io -y
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# Amazon Linux
sudo yum install docker -y
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

---

## Step 2: Install Kubernetes (K3s)

K3s is recommended for single-node production deployments due to its lightweight nature and ease of setup. **It provides full Kubernetes orchestration capabilities.**

### Install K3s

```bash
# Install K3s
curl -sfL https://get.k3s.io | sh -

# Verify installation
sudo k3s kubectl get nodes
```

### Configure kubectl

```bash
# Create kubeconfig for non-root user
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
chmod 600 ~/.kube/config

# Update server URL to use EC2 private IP (for remote access)
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)
sed -i "s/127.0.0.1/$EC2_IP/g" ~/.kube/config

# Verify
kubectl get nodes
```

### Verify Storage Class

```bash
# Check storage class
kubectl get storageclass

# Should show: local-path (default)
# If not available, install:
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.24/deploy/local-path-storage.yaml
```

**Orchestration Feature**: Storage classes enable persistent volumes for stateful services (database).

---

## Step 3: Set Up Container Registry

You need a container registry to store your images. **Containerization is essential for orchestration.**

### Option A: Docker Hub (Easiest)

```bash
# Login to Docker Hub
docker login

# Tag and push images
docker tag product-service:latest your-dockerhub-username/product-service:v1.0.0
docker push your-dockerhub-username/product-service:v1.0.0

# Repeat for order-service and payment-service
```

### Option B: AWS ECR (Recommended for AWS)

```bash
# Install AWS CLI
sudo apt install awscli -y  # Ubuntu
# or
sudo yum install aws-cli -y  # Amazon Linux

# Configure AWS credentials
aws configure

# Set region
export AWS_REGION=ap-southeast-2  # Change to your region

# Create ECR repositories
aws ecr create-repository --repository-name product-service --region $AWS_REGION
aws ecr create-repository --repository-name order-service --region $AWS_REGION
aws ecr create-repository --repository-name payment-service --region $AWS_REGION

# Get ECR login token
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Tag and push
docker tag product-service:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/product-service:v1.0.0
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/product-service:v1.0.0
```

### Option C: Private Registry on EC2

```bash
# Run Docker registry
docker run -d -p 5000:5000 --restart=always --name registry registry:2

# Tag and push
docker tag product-service:latest localhost:5000/product-service:v1.0.0
docker push localhost:5000/product-service:v1.0.0
```

---

## Step 4: Build and Push Images

### On Your Local Machine or CI/CD

```bash
# Navigate to project root (adjust path as needed)
cd /path/to/NT2205-project

# Build images
docker build -t product-service:latest -f apps/product-service/Dockerfile .
docker build -t order-service:latest -f apps/order-service/Dockerfile .
docker build -t payment-service:latest -f apps/payment-service/Dockerfile .

# Tag for registry (replace with your registry)
REGISTRY="your-registry"  # e.g., docker.io/username or ECR URL
VERSION="v1.0.0"

docker tag product-service:latest $REGISTRY/product-service:$VERSION
docker tag order-service:latest $REGISTRY/order-service:$VERSION
docker tag payment-service:latest $REGISTRY/payment-service:$VERSION

# Push to registry
docker push $REGISTRY/product-service:$VERSION
docker push $REGISTRY/order-service:$VERSION
docker push $REGISTRY/payment-service:$VERSION
```

---

## Step 5: Update Production Manifests

### Update Image References

Edit deployment files to use production images:

```bash
cd k8s/backend

# Set your registry and version
REGISTRY="your-registry"  # e.g., docker.io/username or ECR URL
VERSION="v1.0.0"

# Update product-service-deployment.yaml
sed -i "s|image: product-service:latest|image: $REGISTRY/product-service:$VERSION|g" product-service-deployment.yaml
sed -i 's|imagePullPolicy: Never|imagePullPolicy: Always|g' product-service-deployment.yaml

# Update order-service-deployment.yaml
sed -i "s|image: order-service:latest|image: $REGISTRY/order-service:$VERSION|g" order-service-deployment.yaml
sed -i 's|imagePullPolicy: Never|imagePullPolicy: Always|g' order-service-deployment.yaml

# Update payment-service-deployment.yaml
sed -i "s|image: payment-service:latest|image: $REGISTRY/payment-service:$VERSION|g" payment-service-deployment.yaml
sed -i 's|imagePullPolicy: Never|imagePullPolicy: Always|g' payment-service-deployment.yaml
```

**Orchestration Feature**: `imagePullPolicy: Always` ensures Kubernetes pulls the latest image on each deployment.

### Update Secrets

**IMPORTANT**: Update all secrets with production values!

```bash
# Edit secrets
vim database/postgres-secret.yaml
vim auth/keycloak-secret.yaml
vim backend/product-service-secret.yaml
vim backend/order-service-secret.yaml
vim backend/payment-service-secret.yaml
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
  POSTGRES_PASSWORD: "your-secure-password-here"  # CHANGE THIS!
  POSTGRES_DB: products
```

**Generate secure passwords:**

```bash
# Generate secure password
openssl rand -base64 32
```

**Orchestration Feature**: Kubernetes Secrets provide secure configuration management.

### Update ConfigMaps

Update configuration for production:

```bash
# Edit ConfigMaps
vim backend/product-service-configmap.yaml
vim backend/order-service-configmap.yaml
vim backend/payment-service-configmap.yaml
```

**Example updates:**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: product-service-config
  namespace: backend
data:
  NODE_ENV: "production"
  PORT: "8000"
  DATABASE_URL: "postgresql://admin:secure-password@postgres.database.svc.cluster.local:5432/products"
  # Update CORS origins for production domains
  CORS_ORIGINS: "https://app.lapisweb.online,https://admin.lapisweb.online"
  KAFKA_BROKERS: "kafka:9092"  # If using Kafka
```

**Orchestration Feature**: ConfigMaps enable centralized configuration management.

### Update Kong Configuration

```bash
vim gateway/kong-configmap.yaml
```

Ensure Kong routes use Kubernetes service DNS and update CORS origins for production domains.

---

## Step 6: Set Up Image Pull Secrets (If Using Private Registry)

If using a private registry, create image pull secrets:

### For Docker Hub

```bash
kubectl create secret docker-registry dockerhub-secret \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=your-username \
  --docker-password=your-password \
  --docker-email=your-email \
  -n backend

# Also create for other namespaces if needed
kubectl create secret docker-registry dockerhub-secret \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=your-username \
  --docker-password=your-password \
  --docker-email=your-email \
  -n gateway
```

### For AWS ECR

```bash
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=ap-southeast-2

kubectl create secret docker-registry ecr-secret \
  --docker-server=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password --region $AWS_REGION) \
  -n backend

# Update deployments to use secret
# Add to deployment spec:
# spec:
#   template:
#     spec:
#       imagePullSecrets:
#       - name: ecr-secret  # or dockerhub-secret
```

Update deployment files to reference the secret:

```bash
# Add imagePullSecrets to deployments
# Edit each deployment file and add:
# spec:
#   template:
#     spec:
#       imagePullSecrets:
#       - name: dockerhub-secret  # or ecr-secret
```

---

## Step 7: Upload Manifests to EC2

### Option 1: SCP from Local Machine

```bash
# From local machine
scp -r k8s ubuntu@your-ec2-ip:~/

# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip
cd ~/k8s
```

### Option 2: Clone from Git

```bash
# On EC2
ssh ubuntu@your-ec2-ip
git clone your-repo-url
cd your-repo/k8s
```

### Option 3: Create Manifests Directly

```bash
# On EC2, create manifests directly
mkdir -p ~/k8s
# Copy manifests from your local machine or create them
```

---

## Step 8: Deploy to Production

### Automated Deployment

```bash
cd k8s
chmod +x deploy.sh
./deploy.sh
```

**Orchestration Feature**: The deployment script orchestrates services in the correct order with health checks.

### Manual Deployment

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

**Orchestration Feature**: `kubectl wait` ensures services are ready before proceeding (dependency management).

---

## Step 9: Set Up External Access

### Option A: NodePort (Simple)

Kong is already exposed via NodePort (30080). Set up:

1. **Security Group**: Allow port 30080
2. **Access**: `http://<ec2-public-ip>:30080`

```bash
# Get EC2 public IP
curl http://169.254.169.254/latest/meta-data/public-ipv4

# Test
curl http://<ec2-public-ip>:30080/health
```

### Option B: Load Balancer

#### Using AWS ELB

```bash
# Install AWS Load Balancer Controller (for EKS)
# For K3s, you can use MetalLB or configure AWS ELB manually
```

#### Using MetalLB (for on-premise or bare metal)

```bash
# Install MetalLB
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.13.12/config/manifests/metallb-native.yaml

# Wait for MetalLB to be ready
kubectl wait --namespace metallb-system \
  --for=condition=ready pod \
  --selector=app=metallb \
  --timeout=90s

# Configure IP address pool (update with your IP range)
cat <<EOF | kubectl apply -f -
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: default-pool
  namespace: metallb-system
spec:
  addresses:
  - 192.168.1.100-192.168.1.200
EOF
```

Update Kong service:

```yaml
# gateway/kong-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: kong
  namespace: gateway
spec:
  type: LoadBalancer  # Change from NodePort
  ports:
  - port: 80
    targetPort: 9000
    protocol: TCP
    name: proxy
  - port: 443
    targetPort: 9000
    protocol: TCP
    name: proxy-https
  selector:
    app: kong
```

### Option C: Ingress with NGINX (Recommended for Production)

#### Install NGINX Ingress Controller

```bash
# Install NGINX Ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# Wait for ingress controller
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s

# Get external IP
kubectl get svc -n ingress-nginx
```

#### Create Ingress Resource

```yaml
# gateway/kong-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: kong-ingress
  namespace: gateway
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - api.lapisweb.online
    secretName: api-tls-secret
  rules:
  - host: api.lapisweb.online
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: kong
            port:
              number: 9000
```

Apply:

```bash
kubectl apply -f gateway/kong-ingress.yaml
```

#### Get Ingress IP

```bash
kubectl get ingress -n gateway

# Get EXTERNAL-IP and point your domain to it
# Update DNS A record: api.lapisweb.online -> <EXTERNAL-IP>
```

**Orchestration Feature**: Ingress provides intelligent routing and load balancing.

---

## Step 10: Set Up SSL/TLS

### Option A: Cert-Manager with Let's Encrypt (Recommended)

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Wait for cert-manager
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=90s

# Create ClusterIssuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com  # CHANGE THIS
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

The certificate will be automatically issued when you create the Ingress resource.

**Orchestration Feature**: Cert-manager automates certificate management.

### Option B: Manual Certificate

```bash
# Create TLS secret
kubectl create secret tls api-tls-secret \
  --cert=path/to/cert.pem \
  --key=path/to/key.pem \
  -n gateway
```

---

## Step 11: Configure Firewall/Security Group

### AWS Security Group Rules

Allow:

- **Port 22**: SSH
- **Port 80**: HTTP (if using Ingress)
- **Port 443**: HTTPS (if using Ingress)
- **Port 30080**: Kong NodePort (if using NodePort)

### UFW (If using Ubuntu)

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 30080/tcp
sudo ufw enable
```

---

## Step 12: Verify Production Deployment

### Check All Components

```bash
# Check pods
kubectl get pods --all-namespaces

# Check services
kubectl get services --all-namespaces

# Check ingress
kubectl get ingress --all-namespaces

# Check events
kubectl get events --all-namespaces --sort-by='.lastTimestamp'
```

**Orchestration Verification**: All pods should be `Running` and `Ready`, indicating proper orchestration.

### Test Endpoints

```bash
# Health check (NodePort)
curl http://<ec2-ip>:30080/health

# API endpoints (NodePort)
curl http://<ec2-ip>:30080/api/products
curl http://<ec2-ip>:30080/api/orders

# With domain (if configured)
curl https://api.lapisweb.online/health
curl https://api.lapisweb.online/api/products
```

---

## Step 13: Production Best Practices

### 1. Resource Limits

Ensure resource limits are appropriate:

```bash
# Check resource usage
kubectl top pods --all-namespaces

# Adjust limits if needed
kubectl edit deployment product-service -n backend
```

**Orchestration Feature**: Resource limits prevent resource exhaustion and enable better planning.

### 2. Replica Counts

Consider increasing replicas for production (high availability):

```bash
# Scale services
kubectl scale deployment product-service -n backend --replicas=3
kubectl scale deployment order-service -n backend --replicas=3
kubectl scale deployment payment-service -n backend --replicas=3
kubectl scale deployment kong -n gateway --replicas=2
```

**Orchestration Feature**: Multiple replicas provide high availability and load distribution.

### 3. Health Checks

Verify health checks are working:

```bash
# Check probe status
kubectl describe pod <pod-name> -n <namespace> | grep -A 10 "Liveness\|Readiness"
```

**Orchestration Feature**: Health checks ensure only healthy pods receive traffic.

### 4. Secrets Management

Use external secret management (AWS Secrets Manager, HashiCorp Vault):

```bash
# Install External Secrets Operator
kubectl apply -f https://raw.githubusercontent.com/external-secrets/external-secrets/main/deploy/charts/external-secrets/templates/crds/crds.yaml
```

**Orchestration Feature**: External secrets integrate with Kubernetes orchestration.

### 5. Network Policies

Implement network policies for security:

```yaml
# Example: Only allow backend to access database
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: postgres-network-policy
  namespace: database
spec:
  podSelector:
    matchLabels:
      app: postgres
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: backend
    ports:
    - protocol: TCP
      port: 5432
```

**Orchestration Feature**: Network policies provide fine-grained network security.

### 6. Monitoring (Optional but Recommended)

Install Prometheus and Grafana:

```bash
# Add Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install kube-prometheus-stack
helm install prometheus prometheus-community/kube-prometheus-stack

# Access Grafana
kubectl port-forward svc/prometheus-grafana 3000:80 -n default
# Access: http://localhost:3000
# Default credentials: admin/prom-operator
```

**Orchestration Feature**: Monitoring provides visibility into orchestrated services.

### 7. Logging (Optional)

Install Loki and Promtail:

```bash
# Add Grafana Helm repo
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install Loki
helm install loki grafana/loki-stack
```

**Orchestration Feature**: Centralized logging for orchestrated services.

### 8. Backup Strategy

Create database backup job:

```bash
# Create backup CronJob
cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: database
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: postgres-backup
            image: postgres:15-alpine
            command:
            - /bin/sh
            - -c
            - |
              pg_dump -h postgres.database.svc.cluster.local -U admin -d products > /backup/backup-\$(date +%Y%m%d).sql
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_PASSWORD
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
EOF
```

**Orchestration Feature**: CronJobs automate scheduled tasks.

---

## Step 14: Maintenance

### Update Services

```bash
# Update image
kubectl set image deployment/product-service \
  product-service=your-registry/product-service:v1.1.0 \
  -n backend

# Monitor rollout
kubectl rollout status deployment/product-service -n backend

# Rollback if needed
kubectl rollout undo deployment/product-service -n backend

# View rollout history
kubectl rollout history deployment/product-service -n backend
```

**Orchestration Feature**: Rolling updates ensure zero-downtime deployments.

### Scale Services

```bash
# Scale up
kubectl scale deployment product-service -n backend --replicas=5

# Scale down
kubectl scale deployment product-service -n backend --replicas=2
```

**Orchestration Feature**: Easy horizontal scaling.

### Update Configuration

```bash
# Update ConfigMap
kubectl apply -f backend/product-service-configmap.yaml

# Restart to pick up changes
kubectl rollout restart deployment/product-service -n backend
```

**Orchestration Feature**: Configuration updates with rolling restarts.

---

## Troubleshooting Production Issues

### Pods Not Starting

```bash
# Check events
kubectl get events --all-namespaces --sort-by='.lastTimestamp'

# Check pod logs
kubectl logs <pod-name> -n <namespace>

# Describe pod
kubectl describe pod <pod-name> -n <namespace>
```

**Orchestration Feature**: Kubernetes automatically restarts failed pods (self-healing).

### Image Pull Errors

```bash
# Check image pull secrets
kubectl get secrets -n backend

# Test registry access
kubectl run test-pod --image=your-registry/product-service:v1.0.0 --rm -it --restart=Never -- /bin/sh

# Check image pull policy
kubectl get deployment product-service -n backend -o yaml | grep imagePullPolicy
```

### Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints -n <namespace>

# Test from within cluster
kubectl run -it --rm debug --image=busybox --restart=Never -- sh
# Then: wget -O- http://service-name.namespace.svc.cluster.local:port
```

**Orchestration Feature**: Service discovery via DNS.

### Database Connection Issues

```bash
# Check database pod
kubectl get pods -n database

# Check database logs
kubectl logs -l app=postgres -n database

# Test database connection from backend pod
kubectl exec -it <backend-pod> -n backend -- sh
# Then: psql -h postgres.database.svc.cluster.local -U admin -d products
```

---

## Security Checklist

- [ ] All secrets updated with production values
- [ ] Image pull secrets configured (if using private registry)
- [ ] Security group/firewall configured
- [ ] SSL/TLS certificates configured
- [ ] Resource limits set appropriately
- [ ] Network policies implemented (optional)
- [ ] Regular backups configured
- [ ] Monitoring and alerting set up
- [ ] Log aggregation configured
- [ ] RBAC configured (if using multiple users)
- [ ] Regular security updates scheduled

---

## Orchestration Features Summary

Your production setup provides these orchestration capabilities:

| Feature | Description | Production Benefit |
|---------|-------------|-------------------|
| **Containerization** | Services run in Docker containers | Isolation and portability |
| **Health Checks** | Production-grade probes | Automatic failure detection |
| **Auto-recovery** | Kubernetes restarts failed pods | Self-healing system |
| **Resource Management** | CPU/memory limits | Resource isolation and planning |
| **Service Discovery** | DNS-based communication | No hardcoded IPs |
| **High Availability** | Multiple replicas | Zero-downtime operations |
| **Rolling Updates** | Zero-downtime deployments | Continuous delivery |
| **Scaling** | Horizontal pod autoscaling | Handle production load |
| **Configuration Management** | ConfigMaps and Secrets | Centralized config |
| **Monitoring** | Prometheus/Grafana | Production visibility |

---

## Next Steps

1. **Set up CI/CD pipeline** for automated deployments
2. **Configure monitoring and alerting** (Prometheus, Grafana)
3. **Implement network policies** for enhanced security
4. **Set up automated backups** with retention policies
5. **Configure auto-scaling** (HPA) based on metrics
6. **Set up log aggregation** (ELK stack, Loki)
7. **Implement disaster recovery** plan
8. **Set up multi-region deployment** (if needed)

---

## Additional Resources

- [K3s Production Guide](https://docs.k3s.io/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/security/best-practices/)
- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Cert-Manager Documentation](https://cert-manager.io/docs/)

---

## Support

For issues and troubleshooting:

- Check `ORCHESTRATION.md` for orchestration concepts
- Review `ARCHITECTURE.md` for architecture details
- Check Kubernetes events: `kubectl get events --all-namespaces`

---

## Summary

This production setup provides **proper Kubernetes orchestration**:

- ✅ Enterprise-grade container orchestration
- ✅ Health checks and auto-recovery
- ✅ Resource management and scaling
- ✅ Service discovery and load balancing
- ✅ Zero-downtime rolling updates
- ✅ High availability with multiple replicas

**Remember**: Proper orchestration gives you enterprise-grade production capabilities without needing full microservices architecture.
