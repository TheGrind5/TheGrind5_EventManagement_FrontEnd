@echo off
echo Fixing frontend dependencies...
echo.

cd /d "%~dp0"

echo Step 1: Removing node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo [OK] Removed node_modules
) else (
    echo [INFO] node_modules not found
)

echo.
echo Step 2: Clearing npm cache...
call npm cache clean --force
echo [OK] Cache cleared

echo.
echo Step 3: Installing dependencies with legacy-peer-deps...
call npm install --legacy-peer-deps

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Dependencies installed successfully!
    echo You can now run: npm start
) else (
    echo.
    echo [ERROR] Failed to install dependencies
    echo Please check your Node.js version (recommended: v18 or v20)
)

pause

