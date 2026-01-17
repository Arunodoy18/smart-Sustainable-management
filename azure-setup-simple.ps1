# Simple Azure Deployment Setup
# Smart Waste Management System

param(
    [string]$ResourceGroup = "waste-management-rg",
    [string]$Location = "eastus",
    [string]$RegistryName = "wastemanagementacr",
    [string]$Environment = "waste-env",
    [string]$BackendApp = "waste-backend",
    [string]$FrontendApp = "waste-frontend"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AZURE AUTO-DEPLOY SETUP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check Azure CLI
Write-Host "[1/12] Checking Azure CLI..." -ForegroundColor Green
if (!(Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Azure CLI not found" -ForegroundColor Red
    exit 1
}

$subscription = az account show --query name -o tsv
Write-Host "   Using: $subscription`n" -ForegroundColor White

# Create Resource Group
Write-Host "[2/12] Creating resource group..." -ForegroundColor Green
az group create --name $ResourceGroup --location $Location --output none
Write-Host "   Resource group: $ResourceGroup`n" -ForegroundColor White

# Create Container Registry
Write-Host "[3/12] Creating container registry..." -ForegroundColor Green
$acrExists = az acr show --name $RegistryName --resource-group $ResourceGroup 2>$null
if (!$acrExists) {
    az acr create --resource-group $ResourceGroup --name $RegistryName --sku Basic --admin-enabled true --output none
}
Write-Host "   Registry: $RegistryName.azurecr.io`n" -ForegroundColor White

# Get Registry Credentials
Write-Host "[4/12] Getting registry credentials..." -ForegroundColor Green
$registryServer = "$RegistryName.azurecr.io"
$registryUsername = az acr credential show --name $RegistryName --query username -o tsv
$registryPassword = az acr credential show --name $RegistryName --query passwords[0].value -o tsv
Write-Host "   Username: $registryUsername`n" -ForegroundColor White

# Install Container Apps Extension
Write-Host "[5/12] Installing Container Apps extension..." -ForegroundColor Green
az extension add --name containerapp --upgrade --output none 2>$null
Write-Host "   Extension ready`n" -ForegroundColor White

# Create Container Apps Environment
Write-Host "[6/12] Creating Container Apps environment..." -ForegroundColor Green
$envExists = az containerapp env show --name $Environment --resource-group $ResourceGroup 2>$null
if (!$envExists) {
    az containerapp env create --name $Environment --resource-group $ResourceGroup --location $Location --output none
}
Write-Host "   Environment: $Environment`n" -ForegroundColor White

# Get environment variables
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "  CONFIGURATION" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

$supabaseUrl = Read-Host "Enter Supabase URL"
$supabaseKey = Read-Host "Enter Supabase Service Role Key"
$supabaseAnonKey = Read-Host "Enter Supabase Anon Key"
$jwtSecret = Read-Host "Enter JWT Secret (press Enter to generate)"

if (!$jwtSecret) {
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Write-Host "Generated JWT Secret: $jwtSecret" -ForegroundColor Cyan
}

# Build and Push Images
Write-Host "`n[7/12] Building Docker images (5-10 minutes)..." -ForegroundColor Green
az acr login --name $RegistryName

Write-Host "   Building backend..." -ForegroundColor White
docker build -t ${registryServer}/waste-backend:latest ./backend
docker push ${registryServer}/waste-backend:latest

Write-Host "   Building frontend..." -ForegroundColor White
docker build -t ${registryServer}/waste-frontend:latest ./web
docker push ${registryServer}/waste-frontend:latest

# Deploy Backend
Write-Host "`n[8/12] Deploying backend..." -ForegroundColor Green
$backendExists = az containerapp show --name $BackendApp --resource-group $ResourceGroup 2>$null
if (!$backendExists) {
    az containerapp create `
        --name $BackendApp `
        --resource-group $ResourceGroup `
        --environment $Environment `
        --image ${registryServer}/waste-backend:latest `
        --target-port 8080 `
        --ingress external `
        --registry-server $registryServer `
        --registry-username $registryUsername `
        --registry-password $registryPassword `
        --cpu 1.0 --memory 2.0Gi `
        --min-replicas 1 --max-replicas 3 `
        --env-vars `
            ENVIRONMENT=production `
            DATABASE_URL="$supabaseUrl" `
            SUPABASE_URL="$supabaseUrl" `
            SUPABASE_KEY="$supabaseKey" `
            SECRET_KEY="$jwtSecret" `
        --output none
} else {
    az containerapp update --name $BackendApp --resource-group $ResourceGroup --image ${registryServer}/waste-backend:latest --output none
}

$backendUrl = az containerapp show --name $BackendApp --resource-group $ResourceGroup --query properties.configuration.ingress.fqdn -o tsv
$backendUrl = "https://$backendUrl"
Write-Host "   Backend URL: $backendUrl`n" -ForegroundColor White

# Deploy Frontend
Write-Host "[9/12] Deploying frontend..." -ForegroundColor Green
$frontendExists = az containerapp show --name $FrontendApp --resource-group $ResourceGroup 2>$null
if (!$frontendExists) {
    az containerapp create `
        --name $FrontendApp `
        --resource-group $ResourceGroup `
        --environment $Environment `
        --image ${registryServer}/waste-frontend:latest `
        --target-port 3000 `
        --ingress external `
        --registry-server $registryServer `
        --registry-username $registryUsername `
        --registry-password $registryPassword `
        --cpu 0.5 --memory 1.0Gi `
        --min-replicas 1 --max-replicas 2 `
        --env-vars `
            NEXT_PUBLIC_API_URL=$backendUrl `
            NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl `
            NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabaseAnonKey `
        --output none
} else {
    az containerapp update --name $FrontendApp --resource-group $ResourceGroup --image ${registryServer}/waste-frontend:latest --output none
}

$frontendUrl = az containerapp show --name $FrontendApp --resource-group $ResourceGroup --query properties.configuration.ingress.fqdn -o tsv
$frontendUrl = "https://$frontendUrl"
Write-Host "   Frontend URL: $frontendUrl`n" -ForegroundColor White

# Create Service Principal
Write-Host "[10/12] Creating service principal for GitHub Actions..." -ForegroundColor Green
$subscriptionId = az account show --query id -o tsv
$spName = "github-waste-management-$(Get-Random -Maximum 9999)"
$sp = az ad sp create-for-rbac --name $spName --role contributor --scopes /subscriptions/$subscriptionId/resourceGroups/$ResourceGroup --sdk-auth 2>$null
Write-Host "   Service principal: $spName`n" -ForegroundColor White

# Display Results
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "LIVE URLS:" -ForegroundColor Cyan
Write-Host "  Frontend: $frontendUrl" -ForegroundColor White
Write-Host "  Backend:  $backendUrl" -ForegroundColor White
Write-Host "  API Docs: $backendUrl/docs`n" -ForegroundColor White

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  GITHUB SECRETS TO ADD" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

Write-Host "Go to: https://github.com/Arunodoy18/smart-Sustainable-management/settings/secrets/actions`n" -ForegroundColor Cyan

Write-Host "1. AZURE_CREDENTIALS" -ForegroundColor Green
Write-Host $sp -ForegroundColor DarkGray

Write-Host "`n2. REGISTRY_LOGIN_SERVER" -ForegroundColor Green
Write-Host $registryServer -ForegroundColor White

Write-Host "`n3. REGISTRY_USERNAME" -ForegroundColor Green
Write-Host $registryUsername -ForegroundColor White

Write-Host "`n4. REGISTRY_PASSWORD" -ForegroundColor Green
Write-Host $registryPassword -ForegroundColor White

Write-Host "`n5. NEXT_PUBLIC_API_URL" -ForegroundColor Green
Write-Host $backendUrl -ForegroundColor White

Write-Host "`n6. NEXT_PUBLIC_WS_URL" -ForegroundColor Green
Write-Host $backendUrl -ForegroundColor White

Write-Host "`n7. NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Green
Write-Host $supabaseUrl -ForegroundColor White

Write-Host "`n8. NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Green
Write-Host $supabaseAnonKey -ForegroundColor White

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  NEXT STEPS" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "1. Add the above secrets to GitHub" -ForegroundColor White
Write-Host "2. Push code: git push origin main" -ForegroundColor White
Write-Host "3. Watch auto-deploy at: https://github.com/Arunodoy18/smart-Sustainable-management/actions" -ForegroundColor White
Write-Host "4. Your app will be live in 5-10 minutes!`n" -ForegroundColor White

Write-Host "Setup complete!" -ForegroundColor Green
