# Simplified Azure Deployment - Use existing resources

Set-Alias -Name az -Value "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd" -Scope Script

$ResourceGroup = "waste-management-rg"
$Location = "eastus"
$envName = "waste-mgmt-env"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Smart Waste Management - Azure Deployment" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Using existing Container Apps Environment..." -ForegroundColor Green
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor White
Write-Host "Environment: $envName" -ForegroundColor White
Write-Host ""

# For hackathon demo, we'll use SQLite in the container
# In production, you'd use Azure SQL or PostgreSQL
$dbConnectionString = "sqlite:///./waste_management.db"

Write-Host "Step 1: Creating Container Registry..." -ForegroundColor Yellow
$acrName = "wastemgmt$(Get-Random -Minimum 1000 -Maximum 9999)"
az acr create `
    --name $acrName `
    --resource-group $ResourceGroup `
    --location $Location `
    --sku Basic `
    --admin-enabled true `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "Container Registry created: $acrName" -ForegroundColor Green
} else {
    Write-Host "Failed to create registry" -ForegroundColor Red
    exit 1
}

$acrCreds = az acr credential show --name $acrName --resource-group $ResourceGroup | ConvertFrom-Json
$acrServer = "$acrName.azurecr.io"

Write-Host ""
Write-Host "Step 2: Building and Pushing Docker Images..." -ForegroundColor Yellow
docker login $acrServer --username $acrCreds.username --password $acrCreds.passwords[0].value

Write-Host "Building backend..." -ForegroundColor Gray
docker build -t "$acrServer/waste-backend:latest" ./backend
if ($LASTEXITCODE -eq 0) {
    Write-Host "Pushing backend..." -ForegroundColor Gray
    docker push "$acrServer/waste-backend:latest"
    Write-Host "Backend image ready" -ForegroundColor Green
}

Write-Host "Building frontend..." -ForegroundColor Gray
docker build -t "$acrServer/waste-frontend:latest" ./frontend
if ($LASTEXITCODE -eq 0) {
    Write-Host "Pushing frontend..." -ForegroundColor Gray
    docker push "$acrServer/waste-frontend:latest"
    Write-Host "Frontend image ready" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 3: Deploying Backend Container App..." -ForegroundColor Yellow
$backendName = "waste-backend"
az containerapp create `
    --name $backendName `
    --resource-group $ResourceGroup `
    --environment $envName `
    --image "$acrServer/waste-backend:latest" `
    --registry-server $acrServer `
    --registry-username $acrCreds.username `
    --registry-password $acrCreds.passwords[0].value `
    --target-port 8000 `
    --ingress external `
    --min-replicas 1 `
    --max-replicas 2 `
    --cpu 0.5 `
    --memory 1.0Gi `
    --env-vars `
        "DATABASE_URL=$dbConnectionString" `
        "ENVIRONMENT=production" `
        "LOG_LEVEL=INFO" `
        "SECRET_KEY=$(New-Guid)" `
        "API_V1_PREFIX=/api/v1" `
        "PROJECT_NAME=Smart Waste Management System" `
        "BACKEND_CORS_ORIGINS=['*']" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backend deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed to deploy backend" -ForegroundColor Red
    exit 1
}

$backendApp = az containerapp show --name $backendName --resource-group $ResourceGroup | ConvertFrom-Json
$backendUrl = "https://$($backendApp.properties.configuration.ingress.fqdn)"

Write-Host ""
Write-Host "Step 4: Deploying Frontend Container App..." -ForegroundColor Yellow
$frontendName = "waste-frontend"
az containerapp create `
    --name $frontendName `
    --resource-group $ResourceGroup `
    --environment $envName `
    --image "$acrServer/waste-frontend:latest" `
    --registry-server $acrServer `
    --registry-username $acrCreds.username `
    --registry-password $acrCreds.passwords[0].value `
    --target-port 80 `
    --ingress external `
    --min-replicas 1 `
    --max-replicas 2 `
    --cpu 0.25 `
    --memory 0.5Gi `
    --env-vars `
        "VITE_API_URL=$backendUrl" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "Frontend deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed to deploy frontend" -ForegroundColor Red
    exit 1
}

$frontendApp = az containerapp show --name $frontendName --resource-group $ResourceGroup | ConvertFrom-Json
$frontendUrl = "https://$($frontendApp.properties.configuration.ingress.fqdn)"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your Smart Waste Management System is LIVE!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Application URLs:" -ForegroundColor Yellow
Write-Host "  Frontend:  $frontendUrl" -ForegroundColor White
Write-Host "  Backend:   $backendUrl" -ForegroundColor White
Write-Host "  API Docs:  $backendUrl/docs" -ForegroundColor White
Write-Host ""
Write-Host "Container Registry:" -ForegroundColor Yellow
Write-Host "  Registry:  $acrServer" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open your browser to: $frontendUrl" -ForegroundColor White
Write-Host "2. Test the waste classification feature" -ForegroundColor White
Write-Host "3. Add these URLs to your hackathon submission!" -ForegroundColor White
Write-Host ""

# Save deployment info
$deploymentInfo = @"
Smart Waste Management System - Azure Deployment
Deployed: $(Get-Date)

LIVE APPLICATION URLS
=====================
Frontend: $frontendUrl
Backend:  $backendUrl
API Docs: $backendUrl/docs

AZURE RESOURCES
===============
Resource Group: $ResourceGroup
Location: $Location
Container Registry: $acrServer

HACKATHON SUBMISSION
====================
Use these URLs in your presentation!
GitHub: https://github.com/Arunodoy18/smart-Sustainable-management
"@

Set-Content -Path 'AZURE_DEPLOYMENT.txt' -Value $deploymentInfo
Write-Host "Deployment info saved to: AZURE_DEPLOYMENT.txt" -ForegroundColor Green
Write-Host ""

# Open the frontend in browser
Start-Process $frontendUrl
