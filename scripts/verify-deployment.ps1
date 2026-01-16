# Deployment Verification Script for Windows
# Run this after deployment to verify the production environment

param(
    [Parameter(Mandatory=$false)]
    [string]$BackendUrl = $env:BACKEND_URL,
    
    [Parameter(Mandatory=$false)]
    [string]$FrontendUrl = $env:FRONTEND_URL
)

$ErrorActionPreference = "Continue"

if (-not $BackendUrl) {
    Write-Host "Error: BackendUrl is required" -ForegroundColor Red
    Write-Host "Usage: .\verify-deployment.ps1 -BackendUrl <url> [-FrontendUrl <url>]"
    exit 1
}

Write-Host "========================================"
Write-Host "  Production Deployment Verification"
Write-Host "========================================"
Write-Host ""
Write-Host "Backend URL: $BackendUrl"
Write-Host "Frontend URL: $(if ($FrontendUrl) { $FrontendUrl } else { '(not provided)' })"
Write-Host ""

$failures = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$ExpectedCode,
        [string]$Method = "GET",
        [string]$Body = $null
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            UseBasicParsing = $true
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        $statusCode = $response.StatusCode
    }
    catch {
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        else {
            Write-Host "[X] $Name - Connection failed" -ForegroundColor Red
            return $false
        }
    }
    
    if ($statusCode -eq $ExpectedCode) {
        Write-Host "[OK] $Name (HTTP $statusCode)" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "[!] $Name (HTTP $statusCode, expected $ExpectedCode)" -ForegroundColor Yellow
        return $false
    }
}

Write-Host "--- Backend Health Checks ---"
if (-not (Test-Endpoint -Name "Root endpoint" -Url "$BackendUrl/" -ExpectedCode 200)) { $failures++ }
if (-not (Test-Endpoint -Name "Health endpoint" -Url "$BackendUrl/health" -ExpectedCode 200)) { $failures++ }
if (-not (Test-Endpoint -Name "API Health" -Url "$BackendUrl/api/v1/health" -ExpectedCode 200)) { $failures++ }

Write-Host ""
Write-Host "--- Auth Endpoints ---"
if (-not (Test-Endpoint -Name "Signup (validation)" -Url "$BackendUrl/api/v1/auth/signup" -ExpectedCode 422 -Method "POST" -Body "{}")) { $failures++ }
if (-not (Test-Endpoint -Name "Login (validation)" -Url "$BackendUrl/api/v1/auth/login/access-token" -ExpectedCode 422 -Method "POST")) { $failures++ }
if (-not (Test-Endpoint -Name "Me (auth required)" -Url "$BackendUrl/api/v1/auth/me" -ExpectedCode 401)) { $failures++ }

Write-Host ""
Write-Host "--- API Endpoints ---"
if (-not (Test-Endpoint -Name "Waste classify (auth)" -Url "$BackendUrl/api/v1/waste/classify" -ExpectedCode 401 -Method "POST")) { $failures++ }

if ($FrontendUrl) {
    Write-Host ""
    Write-Host "--- Frontend ---"
    if (-not (Test-Endpoint -Name "Frontend home" -Url "$FrontendUrl/" -ExpectedCode 200)) { $failures++ }
    if (-not (Test-Endpoint -Name "Frontend login" -Url "$FrontendUrl/login" -ExpectedCode 200)) { $failures++ }
}

Write-Host ""
Write-Host "========================================"
if ($failures -eq 0) {
    Write-Host "All checks passed!" -ForegroundColor Green
    Write-Host "========================================"
    exit 0
}
else {
    Write-Host "$failures check(s) failed" -ForegroundColor Red
    Write-Host "========================================"
    exit 1
}
