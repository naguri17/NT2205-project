# Kubernetes Architecture Documentation

## System Architecture Overview

This document provides a detailed explanation of the Kubernetes-based architecture for the NT2205 project.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS (Port 443)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Load Balancer                        │
│                    (Optional: AWS ELB, Nginx)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                            │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Namespace: gateway                                        │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  Kong Gateway                                        │ │  │
│  │  │  - Deployment (2 replicas)                           │ │  │
│  │  │  - Service: NodePort (30080)                         │ │  │
│  │  │  - ConfigMap: kong-config                            │ │  │
│  │  │  - Routes: /api/products, /api/orders, /api/payments│ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             │ Service DNS                        │
│                             │                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Namespace: auth                                          │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  Keycloak                                           │ │  │
│  │  │  - Deployment (1 replica)                           │ │  │
│  │  │  - Service: ClusterIP (internal)                     │ │  │
│  │  │  - Secret: keycloak-secret                          │ │  │
│  │  │  - ConfigMap: keycloak-config                        │ │  │
│  │  │  - DNS: keycloak.auth.svc.cluster.local:8080        │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             │ Service DNS                        │
│                             │                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Namespace: backend                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │ Product Svc  │  │ Order Svc    │  │ Payment Svc  │    │  │
│  │  │ Deployment   │  │ Deployment   │  │ Deployment   │    │  │
│  │  │ (2 replicas) │  │ (2 replicas) │  │ (2 replicas) │    │  │
│  │  │              │  │              │  │              │    │  │
│  │  │ Service:     │  │ Service:     │  │ Service:     │    │  │
│  │  │ ClusterIP    │  │ ClusterIP    │  │ ClusterIP    │    │  │
│  │  │              │  │              │  │              │    │  │
│  │  │ DNS:         │  │ DNS:         │  │ DNS:         │    │  │
│  │  │ product-     │  │ order-       │  │ payment-     │    │  │
│  │  │ service.     │  │ service.     │  │ service.     │    │  │
│  │  │ backend.     │  │ backend.     │  │ backend.     │    │  │
│  │  │ svc.cluster. │  │ svc.cluster. │  │ svc.cluster. │    │  │
│  │  │ local:8000   │  │ local:8001   │  │ local:8002   │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             │ Service DNS                        │
│                             │                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Namespace: database                                       │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  PostgreSQL                                         │ │  │
│  │  │  - StatefulSet (1 replica)                           │ │  │
│  │  │  - Service: ClusterIP (internal)                     │ │  │
│  │  │  - PersistentVolumeClaim: postgres-pvc               │ │  │
│  │  │  - Secret: postgres-secret                           │ │  │
│  │  │  - ConfigMap: postgres-config                        │ │  │
│  │  │  - DNS: postgres.database.svc.cluster.local:5432     │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Gateway Namespace

**Purpose**: API Gateway layer - only component exposed externally

**Components**:

- **Kong Gateway**: API Gateway with routing, rate limiting, CORS
- **Service Type**: NodePort (port 30080) - can be changed to LoadBalancer or Ingress
- **Replicas**: 2 (for high availability)
- **Configuration**: ConfigMap containing `kong.yaml`

**Key Features**:

- Routes external traffic to backend services
- Handles CORS, rate limiting, authentication
- Health check endpoint at `/health`

**Service Discovery**:

- Routes to backend services using Kubernetes DNS:
  - `product-service.backend.svc.cluster.local:8000`
  - `order-service.backend.svc.cluster.local:8001`
  - `payment-service.backend.svc.cluster.local:8002`
  - `keycloak.auth.svc.cluster.local:8080`

---

### 2. Auth Namespace

**Purpose**: Authentication and authorization

**Components**:

- **Keycloak**: Identity and Access Management
- **Service Type**: ClusterIP (internal only)
- **Replicas**: 1 (can be scaled for production)
- **Configuration**: ConfigMap and Secret

**Key Features**:

- OAuth2/OpenID Connect provider
- User management and authentication
- JWT token generation and validation

**Access**:

- Internal: `keycloak.auth.svc.cluster.local:8080`
- External: Via Kong Gateway (if configured) or direct NodePort/Ingress

---

### 3. Backend Namespace

**Purpose**: Business logic microservices

**Components**:

- **Product Service**: Product and category management
- **Order Service**: Order processing
- **Payment Service**: Payment processing

**Common Characteristics**:

- **Service Type**: ClusterIP (internal only)
- **Replicas**: 2 per service (for high availability and load distribution)
- **Health Checks**: Liveness, Readiness, and Startup probes
- **Resource Limits**: CPU and memory limits defined

**Service Discovery**:
Each service is accessible via Kubernetes DNS:

- `product-service.backend.svc.cluster.local:8000`
- `order-service.backend.svc.cluster.local:8001`
- `payment-service.backend.svc.cluster.local:8002`

**Load Balancing**:

- Kubernetes Service automatically load balances across all pod replicas
- Round-robin distribution by default

---

### 4. Database Namespace

**Purpose**: Data persistence layer

**Components**:

- **PostgreSQL**: Relational database
- **Service Type**: ClusterIP (internal only)
- **Replicas**: 1 (StatefulSet for stateful data)
- **Storage**: PersistentVolumeClaim (10Gi)

**Key Features**:

- Persistent storage using PVC
- Health checks for database readiness
- Resource limits to prevent resource exhaustion

**Access**:

- Internal: `postgres.database.svc.cluster.local:5432`
- External: Not exposed (security best practice)

---

## Network Architecture

### Service Types

1. **NodePort** (Gateway only)
   - Exposed externally on node IP
   - Port: 30080 (configurable)
   - Accessible from outside cluster

2. **ClusterIP** (All other services)
   - Internal only
   - Accessible only within cluster
   - Automatic DNS resolution

### DNS Resolution

Kubernetes provides automatic DNS resolution:

- Format: `<service-name>.<namespace>.svc.cluster.local`
- Short form: `<service-name>` (within same namespace)

### Network Policies (Future Enhancement)

Can be implemented to:

- Restrict traffic between namespaces
- Enforce least privilege networking
- Isolate database from unauthorized access

---

## Security Model

### Network Isolation

1. **Only Gateway Exposed**
   - Kong Gateway is the only entry point
   - All other services are ClusterIP (internal)

2. **No Direct Database Access**
   - Database not exposed externally
   - Only accessible from backend namespace

3. **Secret Management**
   - Sensitive data stored in Kubernetes Secrets
   - Base64 encoded (not encrypted by default)
   - Can be encrypted at rest with encryption providers

### Authentication Flow

```
Client Request
    │
    ▼
Kong Gateway (validates JWT)
    │
    ▼
Backend Service (processes request)
    │
    ▼
Database (if needed)
```

---

## Scalability

### Horizontal Scaling

**Backend Services**:

- Current: 2 replicas per service
- Can scale manually: `kubectl scale deployment product-service -n backend --replicas=5`
- Can use HPA (Horizontal Pod Autoscaler) for automatic scaling

**Kong Gateway**:

- Current: 2 replicas
- Can scale based on traffic

### Vertical Scaling

Resource limits can be adjusted:

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

---

## High Availability

### Pod Distribution

- Multiple replicas ensure service availability
- If one pod fails, traffic routes to healthy pods
- Kubernetes automatically restarts failed pods

### Health Checks

1. **Liveness Probe**: Restarts container if unhealthy
2. **Readiness Probe**: Removes from service if not ready
3. **Startup Probe**: Waits for slow-starting containers

### Rolling Updates

- Zero-downtime deployments
- Old pods remain until new pods are ready
- Automatic rollback on failure

---

## Data Persistence

### PersistentVolumes

- **PostgreSQL**: Uses PVC for data persistence
- **Storage Class**: `local-path` (for K3s)
- **Size**: 10Gi (configurable)

### Backup Strategy

1. **Database Backups**: Regular pg_dump exports
2. **Volume Snapshots**: Kubernetes volume snapshots
3. **External Backups**: Cloud storage integration

---

## Monitoring and Observability

### Built-in Features

- **Logs**: `kubectl logs <pod-name>`
- **Events**: `kubectl get events`
- **Metrics**: Resource usage via `kubectl top`

### Future Enhancements

1. **Prometheus**: Metrics collection
2. **Grafana**: Visualization and dashboards
3. **Jaeger**: Distributed tracing
4. **ELK Stack**: Centralized logging

---

## Comparison: Docker Compose vs Kubernetes

| Feature | Docker Compose | Kubernetes |
|---------|---------------|------------|
| **Orchestration** | Manual | Automatic |
| **Scaling** | Single instance | Multiple replicas |
| **Service Discovery** | Docker DNS | Kubernetes DNS |
| **Health Checks** | Basic | Liveness/Readiness/Startup |
| **Rolling Updates** | Manual | Automatic |
| **Resource Management** | None | CPU/Memory limits |
| **High Availability** | Single point of failure | Multi-pod redundancy |
| **Self-Healing** | Manual restart | Automatic |
| **Network Policies** | Basic bridge | Advanced policies |
| **Secret Management** | Environment files | Kubernetes Secrets |
| **Configuration** | Environment files | ConfigMaps |

---

## Migration Benefits

1. **Automatic Recovery**: Pods restart automatically on failure
2. **Load Balancing**: Built-in service load balancing
3. **Resource Efficiency**: Better resource utilization
4. **Configuration Management**: ConfigMaps for non-sensitive config
5. **Secret Management**: Secure secret handling
6. **Observability**: Built-in logging and metrics
7. **Production Readiness**: Health checks and readiness gates
8. **Zero-Downtime Updates**: Rolling updates
9. **Scalability**: Easy horizontal and vertical scaling
10. **Multi-Environment**: Easy deployment to dev/staging/prod

---

## Next Steps

1. **Containerize Services**: Create Dockerfiles for all backend services
2. **Build Images**: Build and push to container registry
3. **Update Manifests**: Update image references in deployments
4. **Deploy**: Use deployment script or manual deployment
5. **Test**: Verify all services are working
6. **Monitor**: Set up monitoring and alerting
7. **Optimize**: Tune resource limits and scaling policies
