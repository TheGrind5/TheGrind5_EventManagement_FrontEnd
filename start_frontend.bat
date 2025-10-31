@echo off
echo ========================================
echo TheGrind5 Event Management System
echo Starting Frontend (React)...
echo ========================================

cd /d "%~dp0"
if not exist "package.json" (
    echo ERROR: Frontend project not found!
    pause
    exit /b 1
)

echo.
echo Starting frontend on http://localhost:3000...
npm start
echo.
echo ========================================
echo ✅ Frontend process finished.
echo ========================================
pause > nul

