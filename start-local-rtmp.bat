@echo off
echo 🚀 Starting Local RTMP Server for SMXKITS Testing
echo.
echo 📋 This will start a simple RTMP server on your machine
echo 🎬 OBS Configuration:
echo    Service: Custom
echo    Server: rtmp://localhost/live  
echo    Stream Key: test-stream
echo.
echo 📺 View Stream: http://localhost:5000/SMXStream-new.html?classId=test-stream
echo.

REM Try to start with Docker first
docker --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Docker found, starting RTMP server...
    docker run -d --name smx-rtmp-test -p 1935:1935 -p 8888:8080 tiangolo/nginx-rtmp
    if %errorlevel% == 0 (
        echo ✅ RTMP Server started successfully!
        echo 📡 RTMP: rtmp://localhost/live
        echo 🌐 HLS: http://localhost:8888/hls/
        goto :end
    )
)

echo ⚠️  Docker not available or failed to start
echo 💡 Alternative: Use YouTube Live for testing
echo    1. Go to https://studio.youtube.com
echo    2. Click "Go Live"
echo    3. Copy Stream URL and Key to OBS
echo.

:end
pause