@echo off
title Apex 3D Open World Car Simulator
echo ========================================================
echo   Apex 3D Open World Car Simulator - Game Launcher
echo ========================================================
echo.
echo Starting local high-performance WebGL server...
echo Launching simulator in your default browser...
echo.

cd /d "%~dp0"
start http://localhost:8080

python -m http.server 8080
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Trying alternative port or browser direct launch...
    start index.html
)
pause

