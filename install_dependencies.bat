@echo off
echo Installing dependencies...
cd /d "%~dp0"
call npm install
echo.
echo Dependencies installed successfully!
echo You can now run: npm start
pause

