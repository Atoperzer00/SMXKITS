@echo off
echo ========================================
echo    SMX TrackPoint Server Startup
echo ========================================
echo.
echo This will start a local web server to serve the TrackPoint map tiles.
echo The map tiles MUST be served through a web server to work properly.
echo.
echo Choose your preferred server:
echo.
echo 1. Python HTTP Server (Recommended - usually pre-installed)
echo 2. Node.js Server (Requires Node.js installation)
echo.
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" goto python_server
if "%choice%"=="2" goto node_server
echo Invalid choice. Defaulting to Python server.

:python_server
echo.
echo Starting Python HTTP Server...
echo.
echo TrackPoint will be available at: http://localhost:8080/Trackpoint.html
echo Debug version available at: http://localhost:8080/fix-trackpoint-tiles.html
echo.
echo Press Ctrl+C to stop the server
echo.
python -m http.server 8080
goto end

:node_server
echo.
echo Starting Node.js Server...
echo.
echo TrackPoint will be available at: http://localhost:8080/Trackpoint.html
echo Debug version available at: http://localhost:8080/fix-trackpoint-tiles.html
echo.
echo Press Ctrl+C to stop the server
echo.
node server.js
goto end

:end
echo.
echo Server stopped.
pause