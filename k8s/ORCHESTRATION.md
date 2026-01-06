# Kubernetes Orchestration Guide

## Understanding Orchestration vs Microservices

### Current Situation (PM2-based)

**What you had before:**

- Backend services (product-service, order-service, payment-service) running with PM2
- PM2 manages processes at the **operating system level**
- Each service runs as a separate Node.js process
- Services are **not properly containerized or orchestrated**
- Manual process management, logging, and monitoring

**Why this isn't proper orchestration:**

1. **No Containerization**: Services run directly on the host OS, not in isolated containers
2. **No Auto-recovery**: Limited restart capabilities, no automatic health checks
3. **No Scaling**: Cannot easily scale services based on load
4. **No Resource Management**: No CPU/memory limits or isolation
5. **No Service Discovery**: Services communicate via hardcoded ports
6. **No Rolling Updates**: Cannot update services without downtime
7. **No Health Monitoring**: Basic process monitoring, not container health checks

### Proper Kubernetes Orchestration

**What you have now:**

- **Containerized Services**: Each service runs in its own container (Docker image)
- **Automatic Orchestration**: Kubernetes manages container lifecycle
- **Health Checks**: Liveness, Readiness, and Startup probes
- **Auto-scaling**: Horizontal Pod Autoscaler (HPA) can scale based on metrics
- **Resource Management**: CPU and memory limits per container
- **Service Discovery**: DNS-based service discovery within cluster
- **Rolling Updates**: Zero-downtime deployments
- **Self-healing**: Automatic pod restart on failure
- **Configuration Management**: ConfigMaps and Secrets for environment variables

**Key Difference:**

- **PM2**: Process manager running on a single host
- **Kubernetes**: Container orchestrator managing distributed services across a cluster

---

## Architecture Overview

### Orchestrated System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Namespace: backend (Orchestrated Services)          │  │
│  │                                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │  │
│  │  │ Product Svc  │  │ Order Svc    │  │ Payment    │ │  │
│  │  │              │  │              │  │ Svc        │ │  │
│  │  │ Deployment   │  │ Deployment   │  │ Deployment │ │  │
│  │  │ (2 replicas) │  │ (2 replicas) │  │ (2 replicas│ │  │
│  │  │              │  │              │  │            │ │  │
│  │  │ Features:    │  │ Features:    │  │ Features:  │ │  │
│  │  │ ✓ Auto-restart│  │ ✓ Auto-restart│ │ ✓ Auto-restart│ │
│  │  │ ✓ Health checks│ │ ✓ Health checks│ │ ✓ Health checks│ │
│  │  │ ✓ Resource limits││ ✓ Resource limits││ ✓ Resource limits│ │
│  │  │ ✓ Rolling updates││ ✓ Rolling updates││ ✓ Rolling updates│ │
│  │  │ ✓ Service DNS  │  │ ✓ Service DNS  │  │ ✓ Service DNS │  │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Namespace: gateway (API Gateway)                    │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │ Kong Gateway (Orchestrated)                    │ │  │
│  │  │ - Routes to backend services                   │ │  │
│  │  │ - Load balancing                               │ │  │
│  │  │ - Authentication                               │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Namespace: database (Stateful Services)            │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │ PostgreSQL (StatefulSet)                       │ │  │
│  │  │ - Persistent storage                           │ │  │
│  │  │ - Data persistence                             │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Namespace: auth (Authentication)                   │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │ Keycloak (Deployment)                          │ │  │
│  │  │ - Identity management                          │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Orchestration Features

### 1. Health Checks

Each service has three types of health probes:

```yaml
livenessProbe:     # Is the container running?
readinessProbe:    # Is the container ready to receive traffic?
startupProbe:      # Is the container starting up?
```

**Benefits:**

- Automatic restart on failure (liveness)
- Traffic routing only to healthy pods (readiness)
- Graceful startup handling (startup)

### 2. Resource Management

```yaml
resources:
  requests:        # Guaranteed resources
    memory: "256Mi"
    cpu: "250m"
  limits:          # Maximum resources
    memory: "512Mi"
    cpu: "500m"
```

**Benefits:**

- Prevents resource starvation
- Enables better resource planning
- Allows overcommitment with limits

### 3. Replication & High Availability

```yaml
replicas: 2  # Multiple instances for redundancy
```

**Benefits:**

- Zero-downtime during updates
- Automatic failover on pod failure
- Load distribution

### 4. Service Discovery

Services communicate via DNS:

```
product-service.backend.svc.cluster.local:8000
order-service.backend.svc.cluster.local:8001
payment-service.backend.svc.cluster.local:8002
```

**Benefits:**

- No hardcoded IPs
- Automatic load balancing
- Internal cluster networking

### 5. Rolling Updates

Kubernetes supports zero-downtime deployments:

```bash
kubectl set image deployment/product-service \
  product-service=product-service:v2.0.0 \
  -n backend

kubectl rollout status deployment/product-service -n backend
```

**Benefits:**

- No service interruption
- Automatic rollback on failure
- Gradual traffic migration

### 6. Self-Healing

Kubernetes automatically:

- Restarts failed containers
- Reschedules pods on failed nodes
- Maintains desired replica count

---

## Migration from PM2 to Kubernetes

### Before (PM2)

```bash
# Start services with PM2
pm2 start ecosystem.config.cjs

# Manual management
pm2 restart product-service
pm2 logs product-service
pm2 monit
```

### After (Kubernetes)

```bash
# Deploy with Kubernetes
kubectl apply -f k8s/

# Automatic management
kubectl get pods -n backend
kubectl logs -f deployment/product-service -n backend
kubectl describe pod <pod-name> -n backend

# Scaling
kubectl scale deployment/product-service --replicas=3 -n backend

# Updates
kubectl set image deployment/product-service \
  product-service=product-service:v2.0.0 -n backend
```

---

## Why You Don't Need "True Microservices"

### Microservices Architecture (Complex)

**Characteristics:**

- Each service has its own database
- Services communicate via APIs/events
- Independent deployment pipelines
- Complex service mesh (Istio, Linkerd)
- Distributed tracing
- Event-driven architecture

**When you need it:**

- Large-scale systems (100+ services)
- Multiple teams (team per service)
- Independent scaling requirements
- Technology diversity per service

### Orchestrated Monolith/Modular Monolith (Your Current Approach)

**Characteristics:**

- Shared database (or service-specific)
- Services in same cluster
- Centralized deployment
- API Gateway for routing
- Unified logging/monitoring

**Why this works for you:**

- **Proper orchestration** handles:
  - Service lifecycle management
  - Health checks and auto-recovery
  - Resource management
  - Scaling and updates
- Simpler to manage
- Easier to debug
- Lower operational overhead

**Key Insight:**
> **Orchestration > Microservices**
>
> Proper orchestration with Kubernetes gives you most benefits of microservices
> (scalability, reliability, updates) without the complexity.

---

## Deployment Commands

### Deploy All Services

```bash
# Deploy everything
cd k8s
./deploy.sh

# Or manually
kubectl apply -f namespaces/
kubectl apply -f database/
kubectl apply -f auth/
kubectl apply -f backend/
kubectl apply -f gateway/
```

### Check Status

```bash
# View all pods
kubectl get pods --all-namespaces

# View services
kubectl get services --all-namespaces

# View deployments
kubectl get deployments --all-namespaces

# View events
kubectl get events --all-namespaces --sort-by='.lastTimestamp'
```

### View Logs

```bash
# Logs for a deployment
kubectl logs -f deployment/product-service -n backend

# Logs for a specific pod
kubectl logs -f <pod-name> -n backend

# Logs for all pods in namespace
kubectl logs -f -l tier=backend -n backend
```

### Scale Services

```bash
# Scale a service
kubectl scale deployment/product-service --replicas=3 -n backend

# Auto-scaling (requires metrics server)
kubectl autoscale deployment/product-service \
  --min=2 --max=5 --cpu-percent=80 -n backend
```

### Update Services

```bash
# Update image
kubectl set image deployment/product-service \
  product-service=product-service:v2.0.0 -n backend

# Check rollout status
kubectl rollout status deployment/product-service -n backend

# Rollback
kubectl rollout undo deployment/product-service -n backend

# View rollout history
kubectl rollout history deployment/product-service -n backend
```

---

## Troubleshooting

### Pod Not Starting

```bash
# Describe pod for events
kubectl describe pod <pod-name> -n backend

# Check logs
kubectl logs <pod-name> -n backend

# Check events
kubectl get events -n backend --sort-by='.lastTimestamp'
```

### Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints -n backend

# Test from within cluster
kubectl run -it --rm debug --image=busybox --restart=Never -- sh
# Inside pod: wget -O- http://product-service.backend.svc.cluster.local:8000/health
```

### Health Check Failures

```bash
# Check probe status
kubectl describe pod <pod-name> -n backend | grep -A 10 "Liveness\|Readiness"

# Test health endpoint manually
kubectl exec -it <pod-name> -n backend -- curl http://localhost:8000/health
```

---

## Best Practices

1. **Always use health checks** - Enable liveness, readiness, and startup probes
2. **Set resource limits** - Prevent resource exhaustion
3. **Use multiple replicas** - Ensure high availability
4. **Use ConfigMaps/Secrets** - Don't hardcode configuration
5. **Monitor resource usage** - Use `kubectl top` commands
6. **Test rolling updates** - Verify zero-downtime deployments
7. **Use namespaces** - Organize services logically
8. **Enable logging** - Centralize logs for debugging

---

## Next Steps

1. ✅ Services are containerized and orchestrated
2. ✅ Health checks are configured
3. ✅ Resource limits are set
4. ⬜ Set up monitoring (Prometheus/Grafana)
5. ⬜ Configure auto-scaling (HPA)
6. ⬜ Set up centralized logging
7. ⬜ Implement backup strategies
8. ⬜ Configure network policies for security

---

## Summary

**You've migrated from:**

- PM2 process management → Kubernetes orchestration
- Manual process control → Automated container orchestration
- Single-host deployment → Cluster-based deployment

**Key Benefits Achieved:**

- ✅ Containerization
- ✅ Automatic health checks and recovery
- ✅ Resource management
- ✅ Service discovery
- ✅ Rolling updates
- ✅ High availability
- ✅ Scalability

**Remember:** Proper orchestration is more important than microservices architecture. Kubernetes gives you enterprise-grade orchestration capabilities without needing full microservices complexity.
