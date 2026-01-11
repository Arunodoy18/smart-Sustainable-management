# Azure Container Apps Deployment Script

param(
    [string]$ResourceGroup = "waste-management-rg",
    [string]$Location = "eastus"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Azure Container Apps Deployment" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Set Azure CLI path
Set-Alias -Name az -Value "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd" -Scope Script

# Check if logged in
Write-Host "Checking Azure login status..." -ForegroundColor Yellow
$account = az account show 2>&1 | ConvertFrom-Json
if ($account) {
    Write-Host "Logged in as: $($account.user.name)" -ForegroundColor Green
    Write-Host "Subscription: $($account.name)" -ForegroundColor Green
} else {
    Write-Host "Not logged in to Azure" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Deployment Configuration:" -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor White
Write-Host "Location: $Location" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Continue with deployment? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Deployment cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Step 1: Creating Resource Group..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location --output none
if ($LASTEXITCODE -eq 0) {
    Write-Host "Resource group created" -ForegroundColor Green
} else {
    Write-Host "Failed to create resource group" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Creating Container Apps Environment..." -ForegroundColor Yellow
Write-Host "This may take 3-5 minutes..." -ForegroundColor Gray
$envName = "waste-mgmt-env"
az containerapp env create `
    --name $envName `
    --resource-group $ResourceGroup `
    --location $Location `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "Container Apps environment created" -ForegroundColor Green
} else {
    Write-Host "Failed to create environment" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Creating PostgreSQL Database..." -ForegroundColor Yellow
Write-Host "This may take 5-10 minutes..." -ForegroundColor Gray
$dbName = "waste-mgmt-db-$(Get-Random -Minimum 1000 -Maximum 9999)"
$dbPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
$dbPassword += "!@#"

az postgres flexible-server create `
    --name $dbName `
    --resource-group $ResourceGroup `
    --location $Location `
    --admin-user pgadmin `
    --admin-password $dbPassword `
    --sku-name Standard_B1ms `
    --tier Burstable `
    --version 15 `
    --storage-size 32 `
    --public-access 0.0.0.0-255.255.255.255 `
    --yes `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "PostgreSQL server created" -ForegroundColor Green
} else {
    Write-Host "Failed to create database" -ForegroundColor Red
    exit 1
}

# Create database
az postgres flexible-server db create `
    --resource-group $ResourceGroup `
    --server-name $dbName `
    --database-name waste_management `
    --output none

$dbHost = "$dbName.postgres.database.azure.com"
$dbConnectionString = "postgresql://pgadmin:$dbPassword@$dbHost:5432/waste_management?sslmode=require"

Write-Host ""
Write-Host "Step 4: Creating Container Registry..." -ForegroundColor Yellow
$acrName = "wastemgmtacr$(Get-Random -Minimum 1000 -Maximum 9999)"
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

# Get ACR credentials
$acrCreds = az acr credential show --name $acrName --resource-group $ResourceGroup | ConvertFrom-Json
$acrServer = "$acrName.azurecr.io"

Write-Host ""
Write-Host "Step 5: Building and Pushing Images..." -ForegroundColor Yellow
docker login $acrServer --username $acrCreds.username --password $acrCreds.passwords[0].value

Write-Host "Building backend image..." -ForegroundColor Gray
docker build -t "$acrServer/waste-backend:latest" ./backend
docker push "$acrServer/waste-backend:latest"
Write-Host "Backend image pushed" -ForegroundColor Green

Write-Host "Building frontend image..." -ForegroundColor Gray
docker build -t "$acrServer/waste-frontend:latest" ./frontend
docker push "$acrServer/waste-frontend:latest"
Write-Host "Frontend image pushed" -ForegroundColor Green

Write-Host ""
Write-Host "Step 6: Deploying Backend Container App..." -ForegroundColor Yellow
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
    --max-replicas 3 `
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
    Write-Host "Backend deployed" -ForegroundColor Green
} else {
    Write-Host "Failed to deploy backend" -ForegroundColor Red
    exit 1
}

# Get backend URL
$backendApp = az containerapp show --name $backendName --resource-group $ResourceGroup | ConvertFrom-Json
$backendUrl = "https://$($backendApp.properties.configuration.ingress.fqdn)"

Write-Host ""
Write-Host "Step 7: Deploying Frontend Container App..." -ForegroundColor Yellow
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
    --max-replicas 3 `
    --cpu 0.25 `
    --memory 0.5Gi `
    --env-vars `
        "VITE_API_URL=$backendUrl" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "Frontend deployed" -ForegroundColor Green
} else {
    Write-Host "Failed to deploy frontend" -ForegroundColor Red
    exit 1
}

# Get frontend URL
$frontendApp = az containerapp show --name $frontendName --resource-group $ResourceGroup | ConvertFrom-Json
$frontendUrl = "https://$($frontendApp.properties.configuration.ingress.fqdn)"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Application URLs:" -ForegroundColor Cyan
Write-Host "Frontend:  $frontendUrl" -ForegroundColor White
Write-Host "Backend:   $backendUrl" -ForegroundColor White
Write-Host "API Docs:  $backendUrl/docs" -ForegroundColor White
Write-Host ""
Write-Host "Database:" -ForegroundColor Cyan
Write-Host "Server:    $dbHost" -ForegroundColor White
Write-Host "Database:  waste_management" -ForegroundColor White
Write-Host "Username:  pgadmin" -ForegroundColor White
Write-Host "Password:  $dbPassword" -ForegroundColor Yellow
Write-Host ""
Write-Host "Container Registry:" -ForegroundColor Cyan
Write-Host "Registry:  $acrServer" -ForegroundColor White
Write-Host ""

# Save deployment info
$deploymentInfo = @"
# Azure Deployment Information
Deployment Date: $(Get-Date)

## Application URLs
Frontend: $frontendUrl
Backend: $backendUrl
API Docs: $backendUrl/docs

## Database
Server: $dbHost
Database: waste_management
Username: pgadmin
Password: $dbPassword

## Container Registry
Registry: $acrServer
Username: $($acrCreds.username)
Password: $($acrCreds.passwords[0].value)

## Resource Group
Name: $ResourceGroup
Location: $Location
"@

Set-Content -Path 'AZURE_DEPLOYMENT_INFO.txt' -Value $deploymentInfo
Write-Host "Deployment info saved to AZURE_DEPLOYMENT_INFO.txt" -ForegroundColor Green
Write-Host ""
