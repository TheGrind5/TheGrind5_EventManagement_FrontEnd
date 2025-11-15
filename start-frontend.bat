@echo off
echo ========================================
echo TheGrind5 Frontend Server
echo ========================================
echo.

REM Chuyển đến thư mục chứa script này
cd /d "%~dp0"

echo Current directory: %CD%
echo.

REM Kiểm tra node_modules
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install --legacy-peer-deps
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
    echo Dependencies installed successfully.
    echo.
)

REM Tạo file .env nếu chưa có
if not exist ".env" (
    echo BROWSER=none > .env
    echo Created .env file
    echo.
)

REM Kiểm tra port 3000
netstat -an | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo WARNING: Port 3000 is already in use!
    echo.
)

echo Starting server on http://localhost:3000...
echo Please wait for compilation...
echo.

REM Chạy npm start
call npm start

pause

