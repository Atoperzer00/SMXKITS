@echo off
echo ========================================
echo   SMX KITS Server with Upload Support
echo ========================================
echo.
echo Installing dependencies...
call npm install
echo.
echo Starting server with upload functionality...
echo Server will be available at: http://localhost:8080
echo Upload endpoint: http://localhost:8080/upload
echo Stream upload endpoint: http://localhost:8080/stream/upload
echo.
echo Press Ctrl+C to stop the server
echo.
node server-with-upload.js
pause