# Saan Voice App Launcher Controller

$nodeDir = "$PSScriptRoot\node-bin\node-v20.12.2-win-x64"
if (Test-Path $nodeDir) {
    $env:PATH = "$nodeDir;" + $env:PATH
    Write-Output "Local Node.js path configured successfully for this session."
} else {
    Write-Warning "Local Node.js path not found at $nodeDir. Using system defaults."
}

Write-Output ""
Write-Output "=================================================="
Write-Output "       SAAN VOICE - DECENTRALIZED PLATFORM       "
Write-Output "=================================================="
Write-Output "1. Install Frontend Dependencies (npm install)"
Write-Output "2. Start React Dev Server (Vite on Port 3000)"
Write-Output "3. Start Backend FastAPI Server (Port 8000)"
Write-Output "4. Exit"
Write-Output "=================================================="
Write-Output ""

$choice = Read-Host "Select an option (1-4)"

if ($choice -eq "1") {
    Write-Output "Installing React client dependencies..."
    Set-Location -Path "$PSScriptRoot\frontend"
    npm install
} elseif ($choice -eq "2") {
    Write-Output "Starting React development server..."
    Set-Location -Path "$PSScriptRoot\frontend"
    npm run dev
} elseif ($choice -eq "3") {
    Write-Output "Starting FastAPI backend server..."
    Set-Location -Path "$PSScriptRoot\backend"
    if (Get-Command "python" -ErrorAction SilentlyContinue) {
        python -m uvicorn app.main:app --reload --port 8000
    } else {
        Write-Error "Python is not installed or not in your system PATH. Please install Python to run the FastAPI backend."
    }
}
