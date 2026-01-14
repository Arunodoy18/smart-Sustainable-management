#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Quick Azure Web Apps deployment with GitHub Actions auto-deploy
.DESCRIPTION
    Simplest way to get automatic deployment - uses Azure App Service with GitHub integration
.EXAMPLE
    .\quick-deploy-azure.ps1
#>

Write-Host @"

╔════════════════════════════════════════════════════════════╗
║     ⚡ QUICK AZURE DEPLOY - AUTOMATIC DEPLOYMENT         ║
║          Fastest way to go live in 10 minutes!            ║
╚════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Yellow

# Configuration
$resourceGroup = "waste-rg-$(Get-Random -Maximum 999)"
$location = "eastus"
$backendApp = "waste-backend-$(Get-Random -Maximum 9999)"
$frontendApp = "waste-frontend-$(Get-Random -Maximum 9999)"

Write-Host "`n✓ Checking Azure CLI..." -ForegroundColor Green
if (!(Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "✗ Azure CLI not found. Install from: https://aka.ms/install-azure-cli" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Logging into Azure..." -ForegroundColor Green
$account = az account show 2>$null
if (!$account) {
    az login
}

Write-Host "`n📋 Enter your configuration:" -ForegroundColor Cyan
$supabaseUrl = Read-Host "Supabase URL"
$supabaseKey = Read-Host "Supabase Service Key" -AsSecureString
$supabaseKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($supabaseKey))
$githubRepo = Read-Host "GitHub repository (format: username/repo-name)"

Write-Host "`n🚀 Creating Azure resources..." -ForegroundColor Green

# Create resource group
az group create --name $resourceGroup --location $location --output none

# Create backend app
Write-Host "   Creating backend app service..." -ForegroundColor Cyan
az webapp create `
    --name $backendApp `
    --resource-group $resourceGroup `
    --plan $backendApp-plan `
    --runtime "PYTHON:3.11" `
    --sku B1 `
    --output none

# Configure backend
az webapp config appsettings set `
    --name $backendApp `
    --resource-group $resourceGroup `
    --settings `
        SUPABASE_URL=$supabaseUrl `
        SUPABASE_KEY=$supabaseKeyPlain `
        ENVIRONMENT=production `
        SCM_DO_BUILD_DURING_DEPLOYMENT=true `
    --output none

# Enable GitHub Actions deployment
Write-Host "   Connecting backend to GitHub..." -ForegroundColor Cyan
az webapp deployment github-actions add `
    --name $backendApp `
    --resource-group $resourceGroup `
    --repo "https://github.com/$githubRepo" `
    --branch main `
    --runtime python `
    --runtime-version 3.11

# Create frontend app  
Write-Host "   Creating frontend app service..." -ForegroundColor Cyan
az webapp create `
    --name $frontendApp `
    --resource-group $resourceGroup `
    --plan $frontendApp-plan `
    --runtime "NODE:18-lts" `
    --sku B1 `
    --output none

# Get backend URL
$backendUrl = "https://${backendApp}.azurewebsites.net"

# Configure frontend
az webapp config appsettings set `
    --name $frontendApp `
    --resource-group $resourceGroup `
    --settings `
        NEXT_PUBLIC_API_URL=$backendUrl `
        NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl `
        SCM_DO_BUILD_DURING_DEPLOYMENT=true `
    --output none

# Enable GitHub Actions deployment for frontend
Write-Host "   Connecting frontend to GitHub..." -ForegroundColor Cyan
az webapp deployment github-actions add `
    --name $frontendApp `
    --resource-group $resourceGroup `
    --repo "https://github.com/$githubRepo" `
    --branch main `
    --runtime node `
    --runtime-version 18

$frontendUrl = "https://${frontendApp}.azurewebsites.net"

Write-Host @"

╔════════════════════════════════════════════════════════════╗
║                    🎉 DEPLOY COMPLETE!                    ║
╚════════════════════════════════════════════════════════════╝

📱 YOUR LIVE URLS:
   Frontend: $frontendUrl
   Backend:  $backendUrl
   API Docs: $backendUrl/docs

🔄 AUTOMATIC DEPLOYMENT IS NOW ACTIVE!

Every time you push to the 'main' branch:
1. GitHub Actions will automatically trigger
2. Code will build and deploy to Azure
3. Changes will be LIVE in 3-5 minutes!

💡 Try it now:
   1. Make a small change to any file
   2. git add . && git commit -m "test deploy" && git push
   3. Watch it deploy at: https://github.com/$githubRepo/actions
   4. Refresh $frontendUrl in 5 minutes!

✅ Setup complete - Your app auto-deploys on every push!

"@ -ForegroundColor Green
