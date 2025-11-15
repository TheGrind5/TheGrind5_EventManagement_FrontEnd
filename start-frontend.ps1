# Script khởi động Frontend Server
Write-Host "Đang khởi động Frontend Server..." -ForegroundColor Green

# Chuyển đến thư mục frontend
Set-Location $PSScriptRoot

# Kiểm tra node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "Đang cài đặt dependencies..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
}

# Tạo file .env nếu chưa có
if (-not (Test-Path ".env")) {
    Set-Content -Path ".env" -Value "BROWSER=none"
} else {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -notmatch "BROWSER") {
        Add-Content -Path ".env" -Value "`nBROWSER=none"
    }
}

# Kiểm tra port 3000 có đang được sử dụng không
$portInUse = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "Port 3000 đang được sử dụng. Đang đóng process..." -ForegroundColor Yellow
    $processId = ($portInUse | Select-Object -First 1).OwningProcess
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host "Khởi động server trên http://localhost:3000..." -ForegroundColor Green
npm start

