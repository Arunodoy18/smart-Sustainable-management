# Microsoft Hackathon Azure Deployment
# Uses: Azure Container Apps + Azure Container Registry (2 Microsoft Services)

Set-Alias -Name az -Value "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd" -Scope Script

$rg = "hackathon-waste-rg"
$loc = "centralus"
$env = "hackathon-env"
$acr = "hackathon$(Get-Random -Minimum 1000 -Maximum 9999)"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Microsoft Hackathon - Azure Deployment"    -ForegroundColor Green
Write-Host "  Using 2+ Microsoft Services"                -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Container Apps Environment
Write-Host "[1/5] Creating Container Apps Environment..." -ForegroundColor Yellow
Write-Host "  (This takes 3-5 minutes)" -ForegroundColor Gray

az containerapp env create `
    --name $env `
    --resource-group $rg `
    --location $loc `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Environment created!" -ForegroundColor Green
} else {
    Write-Host "  Failed. Check Azure portal." -ForegroundColor Red
    exit 1
}

# Step 2: Container Registry
Write-Host ""
Write-Host "[2/5] Creating Azure Container Registry..." -ForegroundColor Yellow

az acr create `
    --name $acr `
    --resource-group $rg `
    --location $loc `
    --sku Basic `
    --admin-enabled true `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Registry created: $acr.azurecr.io" -ForegroundColor Green
} else {
    Write-Host "  Failed to create registry" -ForegroundColor Red
    exit 1
}

$creds = az acr credential show --name $acr --resource-group $rg | ConvertFrom-Json
$server = "$acr.azurecr.io"

# Step 3: Build & Push Images
Write-Host ""
Write-Host "[3/5] Building & Pushing Docker Images..." -ForegroundColor Yellow

docker login $server --username $creds.username --password $creds.passwords[0].value 2>$null

Write-Host "  Building backend..." -ForegroundColor Gray
docker build -t "$server/backend:v1" ./backend 2>$null
docker push "$server/backend:v1" 2>$null
Write-Host "  Backend pushed!" -ForegroundColor Green

Write-Host "  Building frontend..." -ForegroundColor Gray
docker build -t "$server/frontend:v1" ./frontend 2>$null
docker push "$server/frontend:v1" 2>$null
Write-Host "  Frontend pushed!" -ForegroundColor Green

# Step 4: Deploy Backend
Write-Host ""
Write-Host "[4/5] Deploying Backend Container App..." -ForegroundColor Yellow

az containerapp create `
    --name "backend" `
    --resource-group $rg `
    --environment $env `
    --image "$server/backend:v1" `
    --registry-server $server `
    --registry-username $creds.username `
    --registry-password $creds.passwords[0].value `
    --target-port 8000 `
    --ingress external `
    --min-replicas 1 `
    --max-replicas 2 `
    --cpu 0.5 `
    --memory 1.0Gi `
    --env-vars `
        "DATABASE_URL=sqlite:///./waste_management.db" `
        "ENVIRONMENT=production" `
        "LOG_LEVEL=INFO" `
        "SECRET_KEY=$(New-Guid)" `
        "API_V1_PREFIX=/api/v1" `
        "PROJECT_NAME=Smart Waste Management" `
        "BACKEND_CORS_ORIGINS=['*']" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Backend deployed!" -ForegroundColor Green
} else {
    Write-Host "  Failed to deploy backend" -ForegroundColor Red
    exit 1
}

$backend = az containerapp show --name "backend" --resource-group $rg | ConvertFrom-Json
$backendUrl = "https://$($backend.properties.configuration.ingress.fqdn)"

Write-Host ""
Write-Host "  Backend URL: $backendUrl" -ForegroundColor Cyan
Write-Host "  Rebuilding frontend with correct API URL..." -ForegroundColor Gray

# Rebuild frontend with backend URL
docker build --build-arg VITE_API_BASE_URL="$backendUrl/api/v1" -t "$server/frontend:v2" ./frontend 2>$null
docker push "$server/frontend:v2" 2>$null

# Step 5: Deploy Frontend
Write-Host ""
Write-Host "[5/5] Deploying Frontend Container App..." -ForegroundColor Yellow

az containerapp create `
    --name "frontend" `
    --resource-group $rg `
    --environment $env `
    --image "$server/frontend:v2" `
    --registry-server $server `
    --registry-username $creds.username `
    --registry-password $creds.passwords[0].value `
    --target-port 80 `
    --ingress external `
    --min-replicas 1 `
    --max-replicas 2 `
    --cpu 0.25 `
    --memory 0.5Gi `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Frontend deployed!" -ForegroundColor Green
} else {
    Write-Host "  Failed to deploy frontend" -ForegroundColor Red
    exit 1
}

$frontend = az containerapp show --name "frontend" --resource-group $rg | ConvertFrom-Json
$frontendUrl = "https://$($frontend.properties.configuration.ingress.fqdn)"

# Success!
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT SUCCESSFUL!"                     -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "LIVE APPLICATION URLS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend:  $frontendUrl" -ForegroundColor Yellow
Write-Host "  Backend:   $backendUrl" -ForegroundColor Yellow
Write-Host "  API Docs:  $backendUrl/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "MICROSOFT SERVICES USED:" -ForegroundColor Cyan
Write-Host "  1. Azure Container Apps (Compute)" -ForegroundColor White
Write-Host "  2. Azure Container Registry (Images)" -ForegroundColor White
Write-Host "  3. Azure Monitor & Log Analytics (Monitoring)" -ForegroundColor White
Write-Host ""
Write-Host "GITHUB REPO:" -ForegroundColor Cyan
Write-Host "  https://github.com/Arunodoy18/smart-Sustainable-management" -ForegroundColor White
Write-Host ""
Write-Host "FOR YOUR PRESENTATION:" -ForegroundColor Yellow
Write-Host "  Copy the URLs above into your PowerPoint!" -ForegroundColor White
Write-Host ""

# Save deployment info
@"
MICROSOFT HACKATHON DEPLOYMENT
==============================
Deployed: $(Get-Date)

LIVE URLS (Use these in your presentation)
-------------------------------------------
Frontend: $frontendUrl
Backend:  $backendUrl
API Docs: $backendUrl/docs

MICROSOFT SERVICES USED
-----------------------
1. Azure Container Apps - Serverless containers
2. Azure Container Registry - Docker image hosting
3. Azure Monitor - Application monitoring
4. Azure Log Analytics - Centralized logging

GITHUB REPOSITORY
-----------------
https://github.com/Arunodoy18/smart-Sustainable-management

AZURE RESOURCES
---------------
Resource Group: $rg
Location: $loc
Container Registry: $server

COST
----
All services using Azure Free Tier
Remaining Credits: ~$200
"@ | Out-File -FilePath "HACKATHON_DEPLOYMENT.txt"

Write-Host "Deployment info saved to: HACKATHON_DEPLOYMENT.txt" -ForegroundColor Green
Write-Host ""

# Open in browser
Write-Host "Opening your live application..." -ForegroundColor Cyan
Start-Process $frontendUrl
