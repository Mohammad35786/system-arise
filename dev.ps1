# PowerShell script to run dev server with execution policy bypass
Set-Location $PSScriptRoot
powershell -ExecutionPolicy Bypass -Command "npm run dev"
