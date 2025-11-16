@echo off
echo ========================================
echo Fixing "bypasses" duplicate declaration error
echo ========================================
echo.

echo Step 1: Stopping any running processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Removing node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo - node_modules removed
) else (
    echo - node_modules already removed
)

echo Step 3: Removing package-lock.json...
if exist package-lock.json (
    del /f /q package-lock.json
    echo - package-lock.json removed
) else (
    echo - package-lock.json already removed
)

echo Step 4: Clearing npm cache...
call npm cache clean --force
echo - npm cache cleaned

echo Step 5: Clearing React build cache...
if exist .cache (
    rmdir /s /q .cache
    echo - .cache removed
)
if exist build (
    rmdir /s /q build
    echo - build removed
)

echo Step 6: Reinstalling dependencies...
call npm install
echo - Dependencies reinstalled

echo.
echo ========================================
echo Fix completed! Now you can run: npm start
echo ========================================
pause
