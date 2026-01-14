#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Automated Azure deployment setup for Smart Waste Management System
.DESCRIPTION
    Sets up Azure resources and configures automatic GitHub Actions deployment
.EXAMPLE
    .\setup-azure-automatic-deployment.ps1
#>

param(
    [string]$ResourceGroup = "waste-management-rg",
    [string]$Location = "eastus",
    [string]$RegistryName = "wastemanagementacr",
    [string]$Environment = "waste-env",
    [string]$BackendApp = "waste-backend",
    [string]$FrontendApp = "waste-frontend"
)

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Step($message) {
    Write-ColorOutput Green "`n✓ $message"
}

function Write-Info($message) {
    Write-ColorOutput Cyan "ℹ $message"
}

function Write-Error-Custom($message) {
    Write-ColorOutput Red "✗ $message"
}

Write-ColorOutput Yellow @"

╔════════════════════════════════════════════════════════════╗
║     🚀 SMART WASTE MANAGEMENT - AZURE AUTO-DEPLOY        ║
║          Automated Deployment Setup Script                 ║
╚════════════════════════════════════════════════════════════╝

"@

# Step 1: Check Azure CLI
Write-Step "Checking Azure CLI installation..."
if (!(Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Error-Custom "Azure CLI not found. Please install: https://aka.ms/install-azure-cli"
    exit 1
}
Write-Info "Azure CLI version: $(az version --query '\"azure-cli\"' -o tsv)"

# Step 2: Login to Azure
Write-Step "Logging into Azure..."
$loginStatus = az account show 2>$null
if (!$loginStatus) {
    Write-Info "Please log in to Azure..."
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Azure login failed"
        exit 1
    }
}

$subscription = az account show --query name -o tsv
Write-Info "Using subscription: $subscription"

# Step 3: Create Resource Group
Write-Step "Creating resource group..."
az group create --name $ResourceGroup --location $Location --output none
if ($LASTEXITCODE -eq 0) {
    Write-Info "Resource group '$ResourceGroup' ready"
} else {
    Write-Error-Custom "Failed to create resource group"
    exit 1
}

# Step 4: Create Container Registry
Write-Step "Creating Azure Container Registry..."
$acrExists = az acr show --name $RegistryName --resource-group $ResourceGroup 2>$null
if (!$acrExists) {
    az acr create `
        --resource-group $ResourceGroup `
        --name $RegistryName `
        --sku Basic `
        --admin-enabled true `
        --output none
    
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Container registry '$RegistryName' created"
    } else {
        Write-Error-Custom "Failed to create container registry"
        exit 1
    }
} else {
    Write-Info "Container registry '$RegistryName' already exists"
}

# Step 5: Get Registry Credentials
Write-Step "Retrieving registry credentials..."
$registryServer = "$RegistryName.azurecr.io"
$registryUsername = az acr credential show --name $RegistryName --query username -o tsv
$registryPassword = az acr credential show --name $RegistryName --query passwords[0].value -o tsv

Write-Info "Registry server: $registryServer"
Write-Info "Username: $registryUsername"

# Step 6: Install Container Apps Extension
Write-Step "Installing Azure Container Apps extension..."
az extension add --name containerapp --upgrade --output none 2>$null
Write-Info "Container Apps extension ready"

# Step 7: Create Container Apps Environment
Write-Step "Creating Container Apps environment..."
$envExists = az containerapp env show --name $Environment --resource-group $ResourceGroup 2>$null
if (!$envExists) {
    az containerapp env create `
        --name $Environment `
        --resource-group $ResourceGroup `
        --location $Location `
        --output none
    
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Environment '$Environment' created"
    } else {
        Write-Error-Custom "Failed to create environment"
        exit 1
    }
} else {
    Write-Info "Environment '$Environment' already exists"
}

# Step 8: Build and Push Docker Images
Write-Step "Building and pushing Docker images (this may take 5-10 minutes)..."

Write-Info "Logging into container registry..."
az acr login --name $RegistryName

Write-Info "Building backend image..."
docker build -t ${registryServer}/waste-backend:latest ./backend
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Backend build failed"
    exit 1
}

Write-Info "Pushing backend image..."
docker push ${registryServer}/waste-backend:latest

Write-Info "Building frontend image..."
docker build -t ${registryServer}/waste-frontend:latest ./web
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Frontend build failed"
    exit 1
}

Write-Info "Pushing frontend image..."
docker push ${registryServer}/waste-frontend:latest

Write-Step "Docker images built and pushed successfully!"

# Step 9: Get Environment Variables from User
Write-ColorOutput Yellow "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-ColorOutput Yellow "  📋 ENVIRONMENT CONFIGURATION"
Write-ColorOutput Yellow "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$supabaseUrl = Read-Host "`nEnter Supabase URL (from your Supabase dashboard)"
$supabaseKey = Read-Host "Enter Supabase Service Role Key (from Supabase dashboard)"
$supabaseAnonKey = Read-Host "Enter Supabase Anon Key (from Supabase dashboard)"
$jwtSecret = Read-Host "Enter JWT Secret (or press Enter to generate)"
$googleMapsKey = Read-Host "Enter Google Maps API Key - optional press Enter to skip"

if (!$jwtSecret) {
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Write-Info "Generated JWT Secret: $jwtSecret"
}

# Step 10: Deploy Backend Container App
Write-Step "Deploying backend container app..."
$backendExists = az containerapp show --name $BackendApp --resource-group $ResourceGroup 2>$null
if (!$backendExists) {
    az containerapp create `
        --name $BackendApp `
        --resource-group $ResourceGroup `
        --environment $Environment `
        --image ${registryServer}/waste-backend:latest `
        --target-port 8000 `
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
    
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Backend deployed successfully"
    } else {
        Write-Error-Custom "Backend deployment failed"
        exit 1
    }
} else {
    Write-Info "Updating existing backend container app..."
    az containerapp update `
        --name $BackendApp `
        --resource-group $ResourceGroup `
        --image ${registryServer}/waste-backend:latest `
        --output none
}

# Get backend URL
$backendUrl = az containerapp show --name $BackendApp --resource-group $ResourceGroup --query properties.configuration.ingress.fqdn -o tsv
$backendUrl = "https://$backendUrl"
Write-Info "Backend URL: $backendUrl"

# Step 11: Deploy Frontend Container App
Write-Step "Deploying frontend container app..."
$frontendExists = az containerapp show --name $FrontendApp --resource-group $ResourceGroup 2>$null
if (!$frontendExists) {
    $envVars = @(
        "NEXT_PUBLIC_API_URL=$backendUrl",
        "NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabaseAnonKey"
    )
    
    if ($googleMapsKey) {
        $envVars += "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$googleMapsKey"
    }
    
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
        --env-vars $envVars `
        --output none
    
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Frontend deployed successfully"
    } else {
        Write-Error-Custom "Frontend deployment failed"
        exit 1
    }
} else {
    Write-Info "Updating existing frontend container app..."
    az containerapp update `
        --name $FrontendApp `
        --resource-group $ResourceGroup `
        --image ${registryServer}/waste-frontend:latest `
        --output none
}

# Get frontend URL
$frontendUrl = az containerapp show --name $FrontendApp --resource-group $ResourceGroup --query properties.configuration.ingress.fqdn -o tsv
$frontendUrl = "https://$frontendUrl"
Write-Info "Frontend URL: $frontendUrl"

# Step 12: Create Service Principal for GitHub Actions
Write-Step "Creating service principal for GitHub Actions..."
$subscriptionId = az account show --query id -o tsv
$spName = "github-waste-management-$(Get-Random -Maximum 9999)"

$sp = az ad sp create-for-rbac `
    --name $spName `
    --role contributor `
    --scopes /subscriptions/$subscriptionId/resourceGroups/$ResourceGroup `
    --sdk-auth 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Info "Service principal created: $spName"
} else {
    Write-Error-Custom "Failed to create service principal"
    $sp = "{}"
}

# Step 13: Display GitHub Secrets
Write-ColorOutput Yellow "`n╔════════════════════════════════════════════════════════════╗"
Write-ColorOutput Yellow "║          🎉 DEPLOYMENT COMPLETE!                          ║"
Write-ColorOutput Yellow "╚════════════════════════════════════════════════════════════╝"

Write-ColorOutput Green "`n📱 YOUR LIVE URLS:"
Write-ColorOutput Cyan "   Frontend: $frontendUrl"
Write-ColorOutput Cyan "   Backend:  $backendUrl"
Write-ColorOutput Cyan "   API Docs: $backendUrl/docs"

Write-ColorOutput Yellow "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-ColorOutput Yellow "  🔐 GITHUB SECRETS CONFIGURATION"
Write-ColorOutput Yellow "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

Write-ColorOutput Cyan "`nGo to your GitHub repository:"
Write-ColorOutput Cyan "Settings → Secrets and variables → Actions → New repository secret"

Write-ColorOutput Green "`nAdd these secrets:"

Write-Host "`n1. AZURE_CREDENTIALS"
Write-Host "   Value: (copy the JSON below)"
Write-Host "   ─────────────────────────────────"
Write-ColorOutput DarkGray $sp

Write-Host "`n2. REGISTRY_LOGIN_SERVER"
Write-Host "   Value: $registryServer"

Write-Host "`n3. REGISTRY_USERNAME"
Write-Host "   Value: $registryUsername"

Write-Host "`n4. REGISTRY_PASSWORD"
Write-Host "   Value: $registryPassword"

Write-Host "`n5. NEXT_PUBLIC_API_URL"
Write-Host "   Value: $backendUrl"

Write-Host "`n6. NEXT_PUBLIC_WS_URL"
Write-Host "   Value: $backendUrl"

Write-Host "`n7. NEXT_PUBLIC_SUPABASE_URL"
Write-Host "   Value: $supabaseUrl"

Write-Host "`n8. NEXT_PUBLIC_SUPABASE_ANON_KEY"
Write-Host "   Value: $supabaseAnonKey"

if ($googleMapsKey) {
    Write-Host "`n9. NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
    Write-Host "   Value: $googleMapsKey"
}

Write-ColorOutput Yellow "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-ColorOutput Yellow "  🚀 AUTOMATIC DEPLOYMENT IS READY!"
Write-ColorOutput Yellow "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

Write-ColorOutput Green "`nNext steps:"
Write-ColorOutput Cyan "1. Add the GitHub secrets shown above"
Write-ColorOutput Cyan "2. Make any code change and commit:"
Write-ColorOutput DarkGray "   git add ."
Write-ColorOutput DarkGray "   git commit -m 'feat: update feature'"
Write-ColorOutput DarkGray "   git push origin main"
Write-ColorOutput Cyan "3. Watch GitHub Actions deploy automatically!"
Write-ColorOutput Cyan "4. Changes will be live in 5-10 minutes at: $frontendUrl"


Write-Host 'Pro Tip: Monitor deployments at https://github.com/YOUR-USERNAME/YOUR-REPO/actions' -ForegroundColor Yellow
Write-Host 'Setup complete - Your app is now live and auto-deploying' -ForegroundColor Green
