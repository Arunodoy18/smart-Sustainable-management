# PowerShell script to fix all enum case mismatches in the frontend

$files = @(
    "src\pages\admin\AdminDriversPage.tsx",
    "src\pages\admin\AdminUsersPage.tsx",
    "src\pages\dashboard\DashboardPage.tsx",
    "src\pages\dashboard\HistoryPage.tsx",
    "src\pages\dashboard\UploadPage.tsx",
    "src\pages\driver\DriverDashboardPage.tsx"
)

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    
    # Fix UserStatus enums
    $content = $content -replace "'\bactive\b'", "'ACTIVE'"
    $content = $content -replace '"\bactive\b"', '"ACTIVE"'
    $content = $content -replace "'\binactive\b'", "'INACTIVE'"
    $content = $content -replace '"\binactive\b"', '"INACTIVE"'
    $content = $content -replace "'\bsuspended\b'", "'SUSPENDED'"
    $content = $content -replace '"\bsuspended\b"', '"SUSPENDED"'
    $content = $content -replace "'\bpending\b'", "'PENDING'"
    $content = $content -replace '"\bpending\b"', '"PENDING"'
    $content = $content -replace "'\bdeleted\b'", "'DEACTIVATED'"
    $content = $content -replace '"\bdeleted\b"', '"DEACTIVATED"'
    
    # Fix UserRole enums
    $content = $content -replace "'\bcitizen\b'", "'CITIZEN'"
    $content = $content -replace '"\bcitizen\b"', '"CITIZEN"'
    $content = $content -replace "'\bdriver\b'", "'DRIVER'"
    $content = $content -replace '"\bdriver\b"', '"DRIVER"'
    $content = $content -replace "'\badmin\b'", "'ADMIN'"
    $content = $content -replace '"\badmin\b"', '"ADMIN"'
    
    # Fix WasteCategory enums
    $content = $content -replace "'\brecyclable\b'", "'RECYCLABLE'"
    $content = $content -replace '"\brecyclable\b"', '"RECYCLABLE"'
    $content = $content -replace "'\borganic\b'", "'ORGANIC'"
    $content = $content -replace '"\borganic\b"', '"ORGANIC"'
    $content = $content -replace "'\bhazardous\b'", "'HAZARDOUS'"
    $content = $content -replace '"\bhazardous\b"', '"HAZARDOUS"'
    $content = $content -replace "'\belectronic\b'", "'ELECTRONIC'"
    $content = $content -replace '"\belectronic\b"', '"ELECTRONIC"'
    $content = $content -replace "'\bgeneral\b'", "'GENERAL'"
    $content = $content -replace '"\bgeneral\b"', '"GENERAL"'
    
    # Fix ConfidenceTier enums
    $content = $content -replace "'\bhigh\b'", "'HIGH'"
    $content = $content -replace '"\bhigh\b"', '"HIGH"'
    $content = $content -replace "'\bmedium\b'", "'MEDIUM'"
    $content = $content -replace '"\bmedium\b"', '"MEDIUM"'
    $content = $content -replace "'\blow\b'", "'LOW'"
    $content = $content -replace '"\blow\b"', '"LOW"'
    
    # Fix PickupStatus enums
    $content = $content -replace "'\bin_progress\b'", "'EN_ROUTE'"
    $content = $content -replace '"\bin_progress\b"', '"EN_ROUTE"'
    $content = $content -replace "'\bscheduled\b'", "'ASSIGNED'"
    $content = $content -replace '"\bscheduled\b"', '"ASSIGNED"'
    $content = $content -replace "'\ben_route\b'", "'EN_ROUTE'"
    $content = $content -replace '"\ben_route\b"', '"EN_ROUTE"'
    $content = $content -replace "'\bcompleted\b'", "'COLLECTED'"
    $content = $content -replace '"\bcompleted\b"', '"COLLECTED"'
    
    Set-Content -Path $file -Value $content
    Write-Host "Fixed: $file"
}

Write-Host "All enums fixed!"
