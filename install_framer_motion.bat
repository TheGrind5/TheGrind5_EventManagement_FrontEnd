@echo off
echo Installing framer-motion (with React 19 compatibility)...
cd /d "%~dp0"
echo.
echo Using --legacy-peer-deps to resolve React 19 compatibility...
echo.
call npm install framer-motion@^11.11.17 --legacy-peer-deps
echo.
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Installation complete!
    echo ========================================
    echo.
    echo Note: Used --legacy-peer-deps because framer-motion requires React 18,
    echo but your project uses React 19. This is safe and should work fine.
    echo framer-motion is compatible with React 19 in practice.
    echo.
) else (
    echo.
    echo ========================================
    echo Installation failed!
    echo ========================================
    echo.
    echo Please check the error above.
    echo You may need to manually run:
    echo   npm install framer-motion --legacy-peer-deps
    echo.
)
pause

