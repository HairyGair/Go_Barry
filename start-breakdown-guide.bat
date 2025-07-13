@echo off
REM Auto-start Breakdown Guide for Go BARRY integration (Windows)
echo 🚀 Starting Breakdown Guide for Go BARRY...

REM Check if Python 3 is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python 3 is required but not found
    echo Please install Python 3 from https://www.python.org/
    pause
    exit /b 1
)

echo 🔄 Starting Breakdown Guide server...
cd "Breakdown Guide\src"
start /b python -m http.server 8080
echo ✅ Breakdown Guide started on http://localhost:8080

echo.
echo 📋 Usage:
echo 1. The Breakdown Guide will open automatically when you click the card in Go BARRY
echo 2. If it doesn't open, manually visit: http://localhost:8080
echo.
echo 🛑 To stop the breakdown guide server, close this window or press Ctrl+C
pause