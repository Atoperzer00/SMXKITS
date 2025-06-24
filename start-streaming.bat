@echo off
echo 🎬 Starting SMXKITS Streaming Infrastructure
echo ============================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Start streaming services
echo 🚀 Starting streaming services...
docker-compose -f docker-compose.streaming.yml up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check service status
echo 📊 Service Status:
docker-compose -f docker-compose.streaming.yml ps

echo.
echo ✅ Streaming infrastructure is ready!
echo.
echo 📋 Next Steps:
echo 1. Configure OBS Studio:
echo    - Install OBS WebSocket plugin
echo    - Set WebSocket server to localhost:4455
echo    - Configure RTMP output to rtmp://localhost:1935/live
echo.
echo 2. Access streaming interface:
echo    - Instructor: http://localhost:3000/Stream%%20Mode.html
echo    - Students: http://localhost:3000/SMXStream-new.html?classId=YOUR_CLASS_ID
echo.
echo 3. Monitor streams:
echo    - HLS streams: http://localhost:8888/hls/
echo    - RTMP stats: http://localhost:8888/stat
echo.
echo 🔧 Useful commands:
echo    npm run logs:streaming  - View logs
echo    npm run stop:streaming  - Stop services
echo.
pause
