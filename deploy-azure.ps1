# 🚀 Azure Container Apps Deployment Script

param(
    [string]$ResourceGroup = "waste-management-rg",
    [string]$Location = "eastus",
    [string]$EnvironmentName = "waste-mgmt-env",
    [string]$BackendAppName = "waste-backend",
    [string]$FrontendAppName = "waste-frontend",
    [string]$PostgresServerName = "waste-mgmt-db-$(Get-Random -Minimum 1000 -Maximum 9999)",
    [string]$AdminPassword = ""
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Azure Container Apps Deployment" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if logged in
Write-Host "Checking Azure login status..." -ForegroundColor Yellow
try {
    $account = az account show 2>$null | ConvertFrom-Json
    Write-Host "✓ Logged in as: $($account.user.name)" -ForegroundColor Green
    Write-Host "✓ Subscription: $($account.name)" -ForegroundColor Green
} catch {
    Write-Host "✗ Not logged in to Azure" -ForegroundColor Red
    Write-Host "Please run: az login" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Generate secure password if not provided
if ([string]::IsNullOrEmpty($AdminPassword)) {
    $AdminPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
    $AdminPassword += "!@#"
    Write-Host "Generated secure database password" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Deployment Configuration" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor White
Write-Host "Location: $Location" -ForegroundColor White
Write-Host "Environment: $EnvironmentName" -ForegroundColor White
Write-Host "Backend App: $BackendAppName" -ForegroundColor White
Write-Host "Frontend App: $FrontendAppName" -ForegroundColor White
Write-Host "Database: $PostgresServerName" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Continue with deployment? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Deployment cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Step 1: Resource Group" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "Creating resource group..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location --output none
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Resource group created" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to create resource group" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Step 2: Container Apps Environment" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "Creating Container Apps environment (this may take 3-5 minutes)..." -ForegroundColor Yellow
az containerapp env create `
    --name $EnvironmentName `
    --resource-group $ResourceGroup `
    --location $Location `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Container Apps environment created" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to create environment" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Step 3: PostgreSQL Database" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "Creating PostgreSQL Flexible Server (this may take 5-10 minutes)..." -ForegroundColor Yellow
az postgres flexible-server create `
    --name $PostgresServerName `
    --resource-group $ResourceGroup `
    --location $Location `
    --admin-user pgadmin `
    --admin-password $AdminPassword `
    --sku-name Standard_B1ms `
    --tier Burstable `
    --version 15 `
    --storage-size 32 `
    --public-access 0.0.0.0-255.255.255.255 `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ PostgreSQL server created" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to create database" -ForegroundColor Red
    exit 1
}

# Create database
Write-Host "Creating database..." -ForegroundColor Yellow
az postgres flexible-server db create `
    --resource-group $ResourceGroup `
    --server-name $PostgresServerName `
    --database-name waste_management `
    --output none

Write-Host "✓ Database created" -ForegroundColor Green

# Get database connection string
$dbHost = "$PostgresServerName.postgres.database.azure.com"
$dbConnectionString = "postgresql://pgadmin:$AdminPassword@$dbHost:5432/waste_management?sslmode=require"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Step 4: Build & Push Docker Images" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "Creating Azure Container Registry..." -ForegroundColor Yellow
$acrName = "wastemgmtacr$(Get-Random -Minimum 1000 -Maximum 9999)"
az acr create `
    --name $acrName `
    --resource-group $ResourceGroup `
    --location $Location `
    --sku Basic `
    --admin-enabled true `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Container Registry created: $acrName" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to create registry" -ForegroundColor Red
    exit 1
}

# Get ACR credentials
$acrCreds = az acr credential show --name $acrName --resource-group $ResourceGroup | ConvertFrom-Json
$acrUsername = $acrCreds.username
$acrPassword = $acrCreds.passwords[0].value
$acrServer = "$acrName.azurecr.io"

Write-Host "Building and pushing backend image..." -ForegroundColor Yellow
docker login $acrServer --username $acrUsername --password $acrPassword
docker build -t "$acrServer/waste-backend:latest" ./backend
docker push "$acrServer/waste-backend:latest"
Write-Host "✓ Backend image pushed" -ForegroundColor Green

Write-Host "Building and pushing frontend image..." -ForegroundColor Yellow
docker build -t "$acrServer/waste-frontend:latest" ./frontend
docker push "$acrServer/waste-frontend:latest"
Write-Host "✓ Frontend image pushed" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Step 5: Deploy Backend Container App" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "Deploying backend..." -ForegroundColor Yellow
az containerapp create `
    --name $BackendAppName `
    --resource-group $ResourceGroup `
    --environment $EnvironmentName `
    --image "$acrServer/waste-backend:latest" `
    --registry-server $acrServer `
    --registry-username $acrUsername `
    --registry-password $acrPassword `
    --target-port 8080 `
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
        "BACKEND_CORS_ORIGINS=[`"*`"]" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Backend deployed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to deploy backend" -ForegroundColor Red
    exit 1
}

# Get backend URL
$backendApp = az containerapp show --name $BackendAppName --resource-group $ResourceGroup | ConvertFrom-Json
$backendUrl = "https://$($backendApp.properties.configuration.ingress.fqdn)"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Step 6: Deploy Frontend Container App" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "Deploying frontend..." -ForegroundColor Yellow
az containerapp create `
    --name $FrontendAppName `
    --resource-group $ResourceGroup `
    --environment $EnvironmentName `
    --image "$acrServer/waste-frontend:latest" `
    --registry-server $acrServer `
    --registry-username $acrUsername `
    --registry-password $acrPassword `
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
    Write-Host "✓ Frontend deployed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to deploy frontend" -ForegroundColor Red
    exit 1
}

# Get frontend URL
$frontendApp = az containerapp show --name $FrontendAppName --resource-group $ResourceGroup | ConvertFrom-Json
$frontendUrl = "https://$($frontendApp.properties.configuration.ingress.fqdn)"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Application URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:  $frontendUrl" -ForegroundColor White
Write-Host "   Backend:   $backendUrl" -ForegroundColor White
Write-Host "   API Docs:  $backendUrl/docs" -ForegroundColor White
Write-Host ""
Write-Host "🗄️ Database:" -ForegroundColor Cyan
Write-Host "   Server:    $dbHost" -ForegroundColor White
Write-Host "   Database:  waste_management" -ForegroundColor White
Write-Host "   Username:  pgadmin" -ForegroundColor White
Write-Host "   Password:  $AdminPassword" -ForegroundColor Yellow
Write-Host ""
Write-Host "📦 Container Registry:" -ForegroundColor Cyan
Write-Host "   Registry:  $acrServer" -ForegroundColor White
Write-Host ""
Write-Host "💡 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Create a test user in the database"
Write-Host "2. Test the application at: $frontendUrl"
Write-Host "3. Set up custom domain (optional)"
Write-Host "4. Configure monitoring and alerts"
Write-Host ""
Write-Host "🔧 Management:" -ForegroundColor Cyan
Write-Host "   View in Azure Portal: https://portal.azure.com/#@/resource/subscriptions/$((az account show | ConvertFrom-Json).id)/resourceGroups/$ResourceGroup"
Write-Host ""
Write-Host "⚠️  Save these credentials securely!" -ForegroundColor Yellow
Write-Host ""

# Save deployment info to file
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
Password: $AdminPassword

## Container Registry
Registry: $acrServer
Username: $acrUsername
Password: $acrPassword

## Resource Group
Name: $ResourceGroup
Location: $Location
"@

Set-Content -Path 'AZURE_DEPLOYMENT_INFO.txt' -Value $deploymentInfo
Write-Host '✓ Deployment info saved to AZURE_DEPLOYMENT_INFO.txt' -ForegroundColor Green
Write-Host ''
