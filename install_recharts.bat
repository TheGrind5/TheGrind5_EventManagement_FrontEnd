@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Cai dat Recharts cho Host Dashboard
echo ========================================
echo.

cd /d "%~dp0"
echo Dang o thu muc: %CD%
echo.

REM Kiem tra xem co package.json khong
if not exist "package.json" (
    echo LOI: Khong tim thay package.json!
    echo Vui long chay file nay trong thu muc TheGrind5_EventManagement_FrontEnd
    echo.
    pause
    exit /b 1
)

echo Dang cai dat recharts...
echo.

REM Chay npm install recharts
call npm install recharts --save
set INSTALL_RESULT=%ERRORLEVEL%

REM Kiem tra xem package.json co chua recharts khong
findstr /C:"recharts" package.json >nul 2>&1
set FOUND_RECHARTS=%ERRORLEVEL%

echo.

if !INSTALL_RESULT! EQU 0 (
    if !FOUND_RECHARTS! EQU 0 (
        echo ========================================
        echo Cai dat thanh cong!
        echo ========================================
        echo.
        echo Recharts da duoc them vao package.json
        echo.
        echo Buoc tiep theo:
        echo 1. Mo file: src\components\host\SalesChart.jsx
        echo 2. Uncomment dong import recharts (dong 12-16)
        echo 3. Doi RECCHARTS_INSTALLED = false thanh true (dong 26)
        echo 4. Uncomment phan code chart (dong 273-343)
        echo 5. Khoi dong lai ung dung: npm start
        echo.
        echo Chu y: Neu co thong bao ve vulnerabilities, ban co the bo qua hoac chay:
        echo   npm audit fix
        echo.
    ) else (
        echo ========================================
        echo Canh bao: Cai dat co the thanh cong nhung khong tim thay recharts trong package.json
        echo ========================================
        echo Vui long kiem tra lai thu muc node_modules hoac chay lai: npm install recharts
        echo.
    )
) else (
    echo ========================================
    echo Cai dat that bai! (Exit code: !INSTALL_RESULT!)
    echo ========================================
    echo.
    echo Kiem tra:
    echo - Co ket noi internet khong?
    echo - Da cai dat Node.js va npm chua?
    echo - Co quyen ghi vao thu muc nay khong?
    echo.
    echo Thu chay lai thu cong: npm install recharts
    echo.
)

pause
exit /b %INSTALL_RESULT%

