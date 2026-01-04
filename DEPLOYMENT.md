# Deployment Guide

## 🚀 Quick Deploy - Docker Compose

### 1. Prerequisites
```bash
# Install Docker Desktop
# https://www.docker.com/products/docker-desktop

# Verify installation
docker --version
docker-compose --version
```

### 2. Clone and Deploy
```bash
git clone <your-repo>
cd Hackathon

# Copy environment file
copy .env.example .env

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database Admin**: http://localhost:8080

### 4. Stop Services
```bash
docker-compose down

# Remove volumes (reset database)
docker-compose down -v
```

---

## ☁️ Cloud Deployment

### Azure Deployment

#### Option 1: Azure Container Apps (Recommended)

```bash
# Install Azure CLI
az login

# Create resource group
az group create --name waste-mgmt-rg --location eastus

# Create Container Apps environment
az containerapp env create \
  --name waste-mgmt-env \
  --resource-group waste-mgmt-rg \
  --location eastus

# Create PostgreSQL
az postgres flexible-server create \
  --name waste-mgmt-db \
  --resource-group waste-mgmt-rg \
  --location eastus \
  --admin-user pgadmin \
  --admin-password <SecurePassword> \
  --sku-name Standard_B1ms

# Deploy backend
az containerapp create \
  --name waste-backend \
  --resource-group waste-mgmt-rg \
  --environment waste-mgmt-env \
  --image <your-registry>/waste-backend:latest \
  --target-port 8000 \
  --ingress external \
  --env-vars \
    POSTGRES_SERVER=<db-server>.postgres.database.azure.com \
    POSTGRES_USER=pgadmin \
    POSTGRES_PASSWORD=<SecurePassword>

# Deploy frontend
az containerapp create \
  --name waste-frontend \
  --resource-group waste-mgmt-rg \
  --environment waste-mgmt-env \
  --image <your-registry>/waste-frontend:latest \
  --target-port 80 \
  --ingress external
```

#### Option 2: Azure App Service

```bash
# Create App Service Plan
az appservice plan create \
  --name waste-mgmt-plan \
  --resource-group waste-mgmt-rg \
  --sku B1 \
  --is-linux

# Create Web Apps
az webapp create \
  --resource-group waste-mgmt-rg \
  --plan waste-mgmt-plan \
  --name waste-backend-app \
  --deployment-container-image <your-registry>/waste-backend:latest

az webapp create \
  --resource-group waste-mgmt-rg \
  --plan waste-mgmt-plan \
  --name waste-frontend-app \
  --deployment-container-image <your-registry>/waste-frontend:latest
```

---

### AWS Deployment (ECS)

```bash
# Install AWS CLI
aws configure

# Create ECR repositories
aws ecr create-repository --repository-name waste-backend
aws ecr create-repository --repository-name waste-frontend

# Build and push images
aws ecr get-login-password | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com

docker build -t waste-backend ./backend
docker tag waste-backend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/waste-backend:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/waste-backend:latest

# Create ECS cluster
aws ecs create-cluster --cluster-name waste-mgmt-cluster

# Create RDS PostgreSQL
aws rds create-db-instance \
  --db-instance-identifier waste-mgmt-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username pgadmin \
  --master-user-password <SecurePassword> \
  --allocated-storage 20

# Deploy using task definitions (see k8s/ directory for examples)
```

---

### Google Cloud Platform (GCP)

```bash
# Install gcloud CLI
gcloud init

# Create project
gcloud projects create waste-mgmt-project

# Enable services
gcloud services enable \
  container.googleapis.com \
  sqladmin.googleapis.com

# Create GKE cluster
gcloud container clusters create waste-mgmt-cluster \
  --num-nodes=2 \
  --zone=us-central1-a

# Create Cloud SQL
gcloud sql instances create waste-mgmt-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Deploy using kubectl
kubectl apply -f k8s/
```

---

## 🔧 Environment Variables

### Backend (.env)
```bash
# Database
POSTGRES_SERVER=your-db-server
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure-password
POSTGRES_DB=waste_management

# Security
SECRET_KEY=your-secret-key-min-32-chars

# AI (optional)
OPENAI_API_KEY=sk-your-key

# Storage
STORAGE_PATH=/app/storage
```

### Frontend (.env.production)
```bash
VITE_API_BASE_URL=https://your-backend-url.com/api/v1
```

---

## 📊 Health Checks

```bash
# Backend health
curl http://localhost:8000/api/v1/waste/health

# Database connection
docker exec waste-management-backend python -c "from app.db.session import engine; engine.connect()"

# Frontend build
curl http://localhost:3000
```

---

## 🔍 Monitoring

### Application Logs
```bash
# Backend logs
docker logs -f waste-management-backend

# Frontend logs
docker logs -f waste-management-frontend

# Database logs
docker logs -f waste-management-db
```

### Metrics (Production)
- Use **Prometheus** + **Grafana** for metrics
- Use **Azure Application Insights** or **AWS CloudWatch**
- Set up alerts for:
  - API response time > 1s
  - Error rate > 1%
  - Database connection failures

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build images
        run: |
          docker-compose build
      
      - name: Push to registry
        run: |
          docker push <registry>/waste-backend:latest
          docker push <registry>/waste-frontend:latest
      
      - name: Deploy to production
        run: |
          # Your deployment commands
```

---

## 🛡️ Production Checklist

- [ ] Change SECRET_KEY to secure random value
- [ ] Use HTTPS with SSL certificates
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable monitoring and alerts
- [ ] Configure rate limiting
- [ ] Add authentication middleware
- [ ] Review CORS settings
- [ ] Optimize database indices
- [ ] Set up CDN for frontend assets
- [ ] Configure log aggregation
- [ ] Test disaster recovery

---

## 🆘 Troubleshooting

### Database Connection Failed
```bash
# Check if database is running
docker ps | grep postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres

# Wait 10 seconds
docker-compose up backend
```

### Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :8000

# Kill process
taskkill /PID <pid> /F

# Or use different ports in docker-compose.yml
```

### Frontend Build Issues
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📞 Support

For deployment issues:
1. Check logs: `docker-compose logs`
2. Verify environment variables
3. Review security group/firewall rules
4. Contact: support@example.com
