@echo off
echo 🚀 Running Frontend Tests for Buy Ticket Flow...
echo.

echo 📁 Running React tests with coverage...
npm run test:coverage
if %errorlevel% neq 0 (
    echo ❌ Frontend tests failed!
    pause
    exit /b 1
)
echo ✅ Frontend tests completed successfully!
echo.

echo 📊 Test Results:
echo - Coverage report: src/__tests__/coverage/lcov-report/index.html
echo - Open in browser to view detailed coverage
echo.
echo 💡 Other commands:
echo   npm test          - Run tests in watch mode
echo   npm test -- --watchAll=false - Run tests once
echo.
pause
