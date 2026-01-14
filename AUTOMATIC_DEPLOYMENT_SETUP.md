# 🔄 Automatic Deployment Setup Guide

## Current Status
✅ GitHub Actions CI/CD pipeline configured  
✅ Local development running  
⏳ **Need to configure Azure secrets for automatic deployment**

---

## 🚀 How It Works

Your workflow automatically:
1. **Validates** code (linting, tests) on every push
2. **Builds** Docker images when pushing to `main` branch
3. **Deploys** to Azure Container Apps automatically
4. Changes are **LIVE** within 5-10 minutes!

---

## 📋 Step-by-Step Setup

### Step 1: Create Azure Resources

```powershell
# Login to Azure
az login

# Create Resource Group
az group create --name waste-management-rg --location eastus

# Create Container Registry
az acr create --resource-group waste-management-rg `
  --name wastemanagementacr --sku Basic --admin-enabled

# Get registry credentials
az acr credential show --name wastemanagementacr
```

### Step 2: Create Azure Service Principal

```powershell
# Create service principal for GitHub Actions
az ad sp create-for-rbac --name "github-waste-management" `
  --role contributor `
  --scopes /subscriptions/{subscription-id}/resourceGroups/waste-management-rg `
  --sdk-auth
```

**Copy the entire JSON output** - you'll need it for GitHub secrets.

### Step 3: Set Up GitHub Secrets

Go to: **Your GitHub Repo → Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `AZURE_CREDENTIALS` | JSON from Step 2 | Service principal JSON output |
| `REGISTRY_LOGIN_SERVER` | `wastemanagementacr.azurecr.io` | From ACR creation |
| `REGISTRY_USERNAME` | ACR username | `az acr credential show --name wastemanagementacr` |
| `REGISTRY_PASSWORD` | ACR password | `az acr credential show --name wastemanagementacr` |
| `NEXT_PUBLIC_API_URL` | Your backend URL | Will be available after first deploy |
| `NEXT_PUBLIC_WS_URL` | Your websocket URL | Usually same as API URL with `/ws` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Your Maps key | From Google Cloud Console |

### Step 4: Create Container Apps Environment

```powershell
# Install Container Apps extension
az extension add --name containerapp --upgrade

# Create environment
az containerapp env create `
  --name waste-env `
  --resource-group waste-management-rg `
  --location eastus

# Create PostgreSQL (if needed)
# Or use your existing Supabase connection
```

### Step 5: Initial Deploy (One-time Setup)

```powershell
# Get ACR credentials
az acr login --name wastemanagementacr

# Build and push initial images
docker build -t wastemanagementacr.azurecr.io/waste-backend:latest ./backend
docker push wastemanagementacr.azurecr.io/waste-backend:latest

docker build -t wastemanagementacr.azurecr.io/waste-frontend:latest ./web
docker push wastemanagementacr.azurecr.io/waste-frontend:latest

# Create backend container app
az containerapp create `
  --name waste-backend `
  --resource-group waste-management-rg `
  --environment waste-env `
  --image wastemanagementacr.azurecr.io/waste-backend:latest `
  --target-port 8000 `
  --ingress external `
  --registry-server wastemanagementacr.azurecr.io `
  --registry-username {username} `
  --registry-password {password} `
  --cpu 1.0 --memory 2.0Gi `
  --min-replicas 1 --max-replicas 3 `
  --env-vars `
    ENVIRONMENT=production `
    DATABASE_URL="{your-supabase-url}" `
    SUPABASE_URL="{your-supabase-url}" `
    SUPABASE_KEY="{your-supabase-key}" `
    SECRET_KEY="{generate-secure-key}"

# Create frontend container app
az containerapp create `
  --name waste-frontend `
  --resource-group waste-management-rg `
  --environment waste-env `
  --image wastemanagementacr.azurecr.io/waste-frontend:latest `
  --target-port 3000 `
  --ingress external `
  --registry-server wastemanagementacr.azurecr.io `
  --registry-username {username} `
  --registry-password {password} `
  --cpu 0.5 --memory 1.0Gi `
  --min-replicas 1 --max-replicas 2 `
  --env-vars `
    NEXT_PUBLIC_API_URL="https://waste-backend.{your-region}.azurecontainerapps.io" `
    NEXT_PUBLIC_SUPABASE_URL="{your-supabase-url}" `
    NEXT_PUBLIC_SUPABASE_ANON_KEY="{your-supabase-anon-key}"

# Get the URLs
az containerapp show --name waste-backend --resource-group waste-management-rg --query properties.configuration.ingress.fqdn
az containerapp show --name waste-frontend --resource-group waste-management-rg --query properties.configuration.ingress.fqdn
```

---

## 🔄 Automatic Deployment Flow

### After Initial Setup:

1. **Make changes** to your code locally
2. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin main
   ```
3. **GitHub Actions automatically**:
   - ✅ Validates code (linting)
   - ✅ Builds Docker images
   - ✅ Pushes to Azure Container Registry
   - ✅ Deploys to Azure Container Apps
   - ✅ **Changes are LIVE!**

### Monitor Deployment:
- Go to: **GitHub Repo → Actions** tab
- Watch the workflow in real-time
- See deployment status and logs

### Access Your Live App:
```
Frontend: https://waste-frontend.{your-region}.azurecontainerapps.io
Backend:  https://waste-backend.{your-region}.azurecontainerapps.io
API Docs: https://waste-backend.{your-region}.azurecontainerapps.io/docs
```

---

## ⚡ Quick Deploy Commands

### Using PowerShell Script:
```powershell
# I'll create an automated setup script for you
.\setup-azure-automatic-deployment.ps1
```

---

## 🎯 Testing the Automatic Deployment

1. Make a small change:
   ```bash
   # Edit a file, e.g., README.md
   echo "Testing automatic deployment" >> README.md
   ```

2. Push to GitHub:
   ```bash
   git add .
   git commit -m "test: verify automatic deployment"
   git push origin main
   ```

3. Watch it deploy:
   - Go to GitHub → Actions tab
   - See the workflow run automatically
   - Wait 5-10 minutes
   - Refresh your live URL - changes are there!

---

## 🔧 Troubleshooting

### Pipeline Not Running?
- Check: GitHub Secrets are set correctly
- Check: AZURE_CREDENTIALS is valid JSON
- Check: Service principal has contributor role

### Build Failing?
- Check: Docker builds locally first
- Check: All environment variables are set
- View logs in GitHub Actions

### Deployment Failing?
- Check: Container Apps exist
- Check: Registry credentials are correct
- Check: Resource group exists

### App Not Loading?
- Check: Container app logs: `az containerapp logs show`
- Check: Environment variables are set
- Check: Database connection string is correct

---

## 📊 Monitoring

### View Container Logs:
```powershell
# Backend logs
az containerapp logs show --name waste-backend --resource-group waste-management-rg --follow

# Frontend logs
az containerapp logs show --name waste-frontend --resource-group waste-management-rg --follow
```

### View Metrics:
```powershell
az monitor metrics list --resource /subscriptions/{sub-id}/resourceGroups/waste-management-rg/providers/Microsoft.App/containerApps/waste-backend
```

---

## 🎉 Success!

Once configured, **every push to main automatically deploys to production**!

**Deployment Time:** 5-10 minutes  
**Zero Downtime:** Rolling updates  
**Auto Scaling:** Based on traffic  
**Cost:** Pay only for what you use

---

## 💡 Pro Tips

1. **Use branches** for development:
   ```bash
   git checkout -b feature/new-feature
   # Make changes, test locally
   git push origin feature/new-feature
   # Create Pull Request - tests run but doesn't deploy
   # Merge to main - automatically deploys!
   ```

2. **Environment-specific deployments**:
   - Create separate workflows for staging/production
   - Use different Azure resource groups

3. **Rollback if needed**:
   ```powershell
   az containerapp revision list --name waste-backend --resource-group waste-management-rg
   az containerapp revision activate --name waste-backend --resource-group waste-management-rg --revision {previous-revision}
   ```

---

## 🚀 Next Steps

Run the automated setup script I'll create for you, or follow the manual steps above!
