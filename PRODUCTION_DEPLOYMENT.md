# 🚀 Production Deployment Guide

## Table of Contents
- [Docker Production Setup](#docker-production-setup)
- [Azure Deployment](#azure-deployment)
- [AWS Deployment](#aws-deployment)
- [Environment Configuration](#environment-configuration)
- [CI/CD Setup](#cicd-setup)

---

## Docker Production Setup

### Build Production Images

```bash
# Build backend
docker build -t waste-backend:prod ./backend

# Build frontend
docker build -t waste-frontend:prod ./frontend

# Tag for registry
docker tag waste-backend:prod <your-registry>/waste-backend:latest
docker tag waste-frontend:prod <your-registry>/waste-frontend:latest

# Push to registry
docker push <your-registry>/waste-backend:latest
docker push <your-registry>/waste-frontend:latest
```

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: waste-postgres-prod
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: waste_management
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - waste-network
    restart: always

  backend:
    image: <your-registry>/waste-backend:latest
    container_name: waste-backend-prod
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/waste_management
      - ENVIRONMENT=production
      - SECRET_KEY=${SECRET_KEY}
      - LOG_LEVEL=INFO
    depends_on:
      - postgres
    networks:
      - waste-network
    restart: always

  frontend:
    image: <your-registry>/waste-frontend:latest
    container_name: waste-frontend-prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    networks:
      - waste-network
    restart: always

volumes:
  postgres_data:

networks:
  waste-network:
    driver: bridge
```

---

## Azure Deployment

### Option 1: Azure Container Apps (Recommended)

#### Prerequisites
```bash
az login
az extension add --name containerapp
```

#### Deploy Steps

1. **Create Resource Group**
```bash
az group create --name waste-management-rg --location eastus
```

2. **Create Container Registry**
```bash
az acr create --resource-group waste-management-rg \
  --name wastemanagementacr --sku Basic
```

3. **Build and Push Images**
```bash
az acr build --registry wastemanagementacr \
  --image waste-backend:latest ./backend

az acr build --registry wastemanagementacr \
  --image waste-frontend:latest ./frontend
```

4. **Create PostgreSQL Database**
```bash
az postgres flexible-server create \
  --resource-group waste-management-rg \
  --name waste-db-server \
  --location eastus \
  --admin-user wasteadmin \
  --admin-password <your-secure-password> \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32
```

5. **Create Container Apps Environment**
```bash
az containerapp env create \
  --name waste-env \
  --resource-group waste-management-rg \
  --location eastus
```

6. **Deploy Backend**
```bash
az containerapp create \
  --name waste-backend \
  --resource-group waste-management-rg \
  --environment waste-env \
  --image wastemanagementacr.azurecr.io/waste-backend:latest \
  --target-port 8000 \
  --ingress external \
  --registry-server wastemanagementacr.azurecr.io \
  --env-vars \
    DATABASE_URL="postgresql://wasteadmin:<password>@waste-db-server.postgres.database.azure.com:5432/waste_management" \
    ENVIRONMENT=production \
    SECRET_KEY=<your-secret-key>
```

7. **Deploy Frontend**
```bash
az containerapp create \
  --name waste-frontend \
  --resource-group waste-management-rg \
  --environment waste-env \
  --image wastemanagementacr.azurecr.io/waste-frontend:latest \
  --target-port 80 \
  --ingress external \
  --registry-server wastemanagementacr.azurecr.io
```

### Option 2: Azure Kubernetes Service (AKS)

1. **Create AKS Cluster**
```bash
az aks create \
  --resource-group waste-management-rg \
  --name waste-aks-cluster \
  --node-count 2 \
  --enable-managed-identity \
  --generate-ssh-keys
```

2. **Connect to Cluster**
```bash
az aks get-credentials \
  --resource-group waste-management-rg \
  --name waste-aks-cluster
```

3. **Deploy Using Kubernetes Manifests**
```bash
kubectl apply -f k8s/deployment.yaml
```

---

## AWS Deployment

### Option 1: AWS ECS (Elastic Container Service)

#### Prerequisites
```bash
aws configure
```

#### Deploy Steps

1. **Create ECR Repositories**
```bash
aws ecr create-repository --repository-name waste-backend
aws ecr create-repository --repository-name waste-frontend
```

2. **Build and Push Images**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t waste-backend:latest ./backend
docker tag waste-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/waste-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/waste-backend:latest

docker build -t waste-frontend:latest ./frontend
docker tag waste-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/waste-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/waste-frontend:latest
```

3. **Create RDS PostgreSQL Instance**
```bash
aws rds create-db-instance \
  --db-instance-identifier waste-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username wasteadmin \
  --master-user-password <your-secure-password> \
  --allocated-storage 20
```

4. **Create ECS Cluster**
```bash
aws ecs create-cluster --cluster-name waste-cluster
```

5. **Create Task Definition** (see `aws-task-definition.json` below)

6. **Create Service**
```bash
aws ecs create-service \
  --cluster waste-cluster \
  --service-name waste-service \
  --task-definition waste-task \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}"
```

### Option 2: AWS EC2 with Docker

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t2.medium or larger
   - Security Group: Allow 80, 443, 8000

2. **SSH and Setup**
```bash
ssh -i your-key.pem ubuntu@<ec2-public-ip>

# Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu

# Clone repository
git clone <your-repo>
cd <your-repo>

# Run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

---

## Environment Configuration

### Production Environment Variables

Create `.env.production`:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/waste_management

# Application
ENVIRONMENT=production
SECRET_KEY=<generate-strong-random-key>
LOG_LEVEL=INFO

# API
API_V1_PREFIX=/api/v1
PROJECT_NAME=Smart Waste Management System

# CORS (update with your domains)
BACKEND_CORS_ORIGINS=["https://yourdomain.com","https://www.yourdomain.com"]

# AI Services (when ready)
OPENAI_API_KEY=<your-openai-key>
AZURE_VISION_KEY=<your-azure-vision-key>
AZURE_VISION_ENDPOINT=<your-endpoint>
```

### Generate Secret Key
```python
import secrets
print(secrets.token_urlsafe(32))
```

### SSL/TLS Configuration

For production, use Let's Encrypt:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Update nginx.conf:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Login to Docker Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ secrets.DOCKER_REGISTRY }}
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and Push Backend
      run: |
        docker build -t ${{ secrets.DOCKER_REGISTRY }}/waste-backend:${{ github.sha }} ./backend
        docker push ${{ secrets.DOCKER_REGISTRY }}/waste-backend:${{ github.sha }}
    
    - name: Build and Push Frontend
      run: |
        docker build -t ${{ secrets.DOCKER_REGISTRY }}/waste-frontend:${{ github.sha }} ./frontend
        docker push ${{ secrets.DOCKER_REGISTRY }}/waste-frontend:${{ github.sha }}
    
    - name: Deploy to Azure
      run: |
        az containerapp update \
          --name waste-backend \
          --resource-group waste-management-rg \
          --image ${{ secrets.DOCKER_REGISTRY }}/waste-backend:${{ github.sha }}
```

---

## Monitoring and Logging

### Application Insights (Azure)

Add to backend:
```python
from opencensus.ext.azure.log_exporter import AzureLogHandler
import logging

logger = logging.getLogger(__name__)
logger.addHandler(AzureLogHandler(
    connection_string='InstrumentationKey=<your-key>'
))
```

### CloudWatch (AWS)

Install CloudWatch agent:
```bash
aws configure
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json \
    -s
```

---

## Health Checks and Scaling

### Backend Health Check
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0"
    }
```

### Auto-scaling (Azure)
```bash
az containerapp update \
  --name waste-backend \
  --resource-group waste-management-rg \
  --min-replicas 2 \
  --max-replicas 10 \
  --scale-rule-name cpu-scale \
  --scale-rule-type cpu \
  --scale-rule-metadata type=Utilization value=70
```

---

## Database Migrations

### Using Alembic

```bash
# Generate migration
alembic revision --autogenerate -m "Initial migration"

# Apply migration
alembic upgrade head
```

Add to CI/CD:
```yaml
- name: Run Migrations
  run: |
    docker exec waste-backend alembic upgrade head
```

---

## Security Checklist

- [ ] Use HTTPS/TLS in production
- [ ] Rotate SECRET_KEY regularly
- [ ] Use environment variables for secrets
- [ ] Enable database SSL connections
- [ ] Implement rate limiting
- [ ] Set up WAF (Web Application Firewall)
- [ ] Regular security updates
- [ ] Backup database regularly
- [ ] Use private networks for inter-service communication
- [ ] Implement proper CORS policies

---

## Performance Optimization

### Database
- Enable connection pooling
- Add indexes on frequently queried fields
- Use read replicas for analytics

### Caching
```python
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis

@app.on_event("startup")
async def startup():
    redis = aioredis.from_url("redis://localhost")
    FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")
```

### CDN
Use Azure CDN or CloudFront for frontend assets.

---

## Cost Optimization

### Azure
- Use Azure Reserved Instances (40-60% savings)
- Enable auto-scaling to scale down during low usage
- Use Azure Spot Instances for non-critical workloads

### AWS
- Use AWS Savings Plans
- Enable ECS Fargate Spot
- Use S3 for static assets with CloudFront

---

## Support and Maintenance

### Backup Strategy
```bash
# Daily database backup
pg_dump -h <host> -U <user> waste_management > backup_$(date +%Y%m%d).sql

# Upload to cloud storage
az storage blob upload --file backup_$(date +%Y%m%d).sql --container backups
```

### Monitoring Alerts
Set up alerts for:
- High CPU/Memory usage
- Database connection failures
- API response time > 2s
- Error rate > 1%

---

## Quick Reference

### Production URLs
```
Frontend: https://yourdomain.com
Backend API: https://api.yourdomain.com
API Docs: https://api.yourdomain.com/docs
Health Check: https://api.yourdomain.com/health
```

### Common Commands
```bash
# View logs
docker-compose logs -f backend

# Restart service
docker-compose restart backend

# Database backup
docker exec waste-postgres pg_dump -U postgres waste_management > backup.sql

# Restore database
docker exec -i waste-postgres psql -U postgres waste_management < backup.sql

# Scale replicas (K8s)
kubectl scale deployment waste-backend --replicas=5
```

---

## Troubleshooting Production

### High Memory Usage
```bash
# Check container stats
docker stats

# Increase memory limits
docker-compose up -d --scale backend=2
```

### Slow API Responses
- Enable query logging
- Check database indexes
- Monitor network latency
- Enable caching

### Database Connection Pool Exhausted
Update SQLAlchemy settings:
```python
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True
)
```

---

## Success Criteria

Production deployment is successful when:
- [ ] All services are running and healthy
- [ ] SSL/TLS certificates are valid
- [ ] Database backups are automated
- [ ] Monitoring and alerts are configured
- [ ] CI/CD pipeline is working
- [ ] Load testing passes
- [ ] Security scan passes
- [ ] Documentation is updated
- [ ] Team has access and credentials
- [ ] Rollback plan is tested

---

## Next Steps

1. Set up monitoring dashboard
2. Configure automated backups
3. Run load tests
4. Security audit
5. Document incident response plan

**Your application is production-ready! 🚀**
