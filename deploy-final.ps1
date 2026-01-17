# Final Azure Deployment Script

Set-Alias -Name az -Value "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd" -Scope Script

$ResourceGroup = "smartwaste-rg"
$Location = "eastus"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Smart Waste Management - Azure Deploy" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create Container Apps Environment
Write-Host "[1/5] Creating Container Apps Environment..." -ForegroundColor Yellow
$envName = "smartwaste-env"
az containerapp env create `
    --name $envName `
    --resource-group $ResourceGroup `
    --location $Location `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "Environment created!" -ForegroundColor Green
} else {
    Write-Host "Failed" -ForegroundColor Red
    exit 1
}

# Step 2: Create Container Registry
Write-Host ""
Write-Host "[2/5] Creating Container Registry..." -ForegroundColor Yellow
$acrName = "smartwaste$(Get-Random -Minimum 1000 -Maximum 9999)"
az acr create `
    --name $acrName `
    --resource-group $ResourceGroup `
    --location $Location `
    --sku Basic `
    --admin-enabled true `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "Registry created: $acrName" -ForegroundColor Green
} else {
    Write-Host "Failed" -ForegroundColor Red
    exit 1
}

$acrCreds = az acr credential show --name $acrName --resource-group $ResourceGroup | ConvertFrom-Json
$acrServer = "$acrName.azurecr.io"

# Step 3: Build and Push Images
Write-Host ""
Write-Host "[3/5] Building Docker Images..." -ForegroundColor Yellow
docker login $acrServer --username $acrCreds.username --password $acrCreds.passwords[0].value 2>$null

Write-Host "  Building backend..." -ForegroundColor Gray
docker build -t "$acrServer/backend:v1" ./backend 2>$null
docker push "$acrServer/backend:v1" 2>$null
Write-Host "  Backend ready!" -ForegroundColor Green

Write-Host "  Building frontend..." -ForegroundColor Gray
docker build -t "$acrServer/frontend:v1" ./frontend 2>$null  
docker push "$acrServer/frontend:v1" 2>$null
Write-Host "  Frontend ready!" -ForegroundColor Green

# Step 4: Deploy Backend
Write-Host ""
Write-Host "[4/5] Deploying Backend..." -ForegroundColor Yellow
az containerapp create `
    --name "backend" `
    --resource-group $ResourceGroup `
    --environment $envName `
    --image "$acrServer/backend:v1" `
    --registry-server $acrServer `
    --registry-username $acrCreds.username `
    --registry-password $acrCreds.passwords[0].value `
    --target-port 8080 `
    --ingress external `
    --min-replicas 1 `
    --max-replicas 2 `
    --cpu 0.5 `
    --memory 1.0Gi `
    --env-vars "DATABASE_URL=sqlite:///./waste_management.db" "ENVIRONMENT=production" "LOG_LEVEL=INFO" "SECRET_KEY=$(New-Guid)" "API_V1_PREFIX=/api/v1" "PROJECT_NAME=Smart Waste Management" "BACKEND_CORS_ORIGINS=['*']" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backend deployed!" -ForegroundColor Green
} else {
    Write-Host "Failed" -ForegroundColor Red
    exit 1
}

$backend = az containerapp show --name "backend" --resource-group $ResourceGroup | ConvertFrom-Json
$backendUrl = "https://$($backend.properties.configuration.ingress.fqdn)"

# Step 5: Deploy Frontend
Write-Host ""
Write-Host "[5/5] Deploying Frontend..." -ForegroundColor Yellow
az containerapp create `
    --name "frontend" `
    --resource-group $ResourceGroup `
    --environment $envName `
    --image "$acrServer/frontend:v1" `
    --registry-server $acrServer `
    --registry-username $acrCreds.username `
    --registry-password $acrCreds.passwords[0].value `
    --target-port 80 `
    --ingress external `
    --min-replicas 1 `
    --max-replicas 2 `
    --cpu 0.25 `
    --memory 0.5Gi `
    --env-vars "VITE_API_URL=$backendUrl" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "Frontend deployed!" -ForegroundColor Green
} else {
    Write-Host "Failed" -ForegroundColor Red
    exit 1
}

$frontend = az containerapp show --name "frontend" --resource-group $ResourceGroup | ConvertFrom-Json
$frontendUrl = "https://$($frontend.properties.configuration.ingress.fqdn)"

# Success!
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "YOUR LIVE URLS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend:  $frontendUrl" -ForegroundColor Yellow
Write-Host "  Backend:   $backendUrl" -ForegroundColor Yellow
Write-Host "  API Docs:  $backendUrl/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "  1. Testing the app..." -ForegroundColor White
Write-Host "  2. Adding URLs to hackathon submission" -ForegroundColor White
Write-Host ""

# Save info
@"
SMART WASTE MANAGEMENT SYSTEM
==============================
Deployed: $(Get-Date)

LIVE URLS
---------
Frontend: $frontendUrl
Backend: $backendUrl
API Docs: $backendUrl/docs

GITHUB
------
https://github.com/Arunodoy18/smart-Sustainable-management

AZURE RESOURCES
---------------
Resource Group: $ResourceGroup
Registry: $acrServer
"@ | Out-File -FilePath "DEPLOYMENT_INFO.txt"

Write-Host "Info saved to DEPLOYMENT_INFO.txt" -ForegroundColor Green
Write-Host ""

# Open browser
Start-Process $frontendUrl
