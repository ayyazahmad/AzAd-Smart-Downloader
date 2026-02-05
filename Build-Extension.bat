@echo off
REM AzAd Smart Downloader - Quick Build Script
REM This batch file runs the PowerShell build script

setlocal enabledelayedexpansion

echo.
echo Building AzAd Smart Downloader Extension...
echo.

REM Run PowerShell script
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Build-Extension.ps1"

if %ERRORLEVEL% equ 0 (
    echo.
    echo Success! The zip file is ready.
    pause
) else (
    echo.
    echo Error occurred during build.
    pause
)
