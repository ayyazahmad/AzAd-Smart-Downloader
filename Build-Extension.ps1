# AzAd Smart Downloader - Extension Builder
# This script creates a zip file of the extension ready for Chrome Web Store upload

$ExtensionFolder = "AzAd_Smart_Downloader"
$ManifestPath = Join-Path -Path (Join-Path -Path $PSScriptRoot -ChildPath $ExtensionFolder) -ChildPath "manifest.json"

# Extract version from manifest.json
$manifest = Get-Content -Path $ManifestPath -Raw | ConvertFrom-Json
$version = $manifest.version

# Define output zip filename
$ZipFileName = "AzAd_Smart_Downloader_v$version.zip"
$ZipPath = Join-Path -Path $PSScriptRoot -ChildPath $ZipFileName

# Remove existing zip if it exists
if (Test-Path -Path $ZipPath) {
    Remove-Item -Path $ZipPath -Force
    Write-Host "Removed existing $ZipFileName" -ForegroundColor Yellow
}

# Create zip file with extension contents directly (no folder wrapper)
$ExtensionPath = Join-Path -Path $PSScriptRoot -ChildPath $ExtensionFolder

# Get all files and folders inside the extension folder
$items = Get-ChildItem -Path $ExtensionPath -Force

# Compress all items directly (Chrome Web Store requires this format)
Compress-Archive -Path $items.FullName -DestinationPath $ZipPath -Force

Write-Host "Extension zip created successfully!" -ForegroundColor Green
Write-Host "File: $ZipFileName" -ForegroundColor Cyan
Write-Host "Location: $ZipPath" -ForegroundColor Cyan
Write-Host "Size: $([math]::Round((Get-Item $ZipPath).Length / 1MB, 2)) MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ready to upload to Chrome Web Store!" -ForegroundColor Green
