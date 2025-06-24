@echo off
echo 🚀 SMXKITS Final Deployment to DigitalOcean
echo ==========================================

set SERVER_IP=198.211.107.134
set SERVER_USER=root

echo 📦 Creating deployment package...
tar --exclude=node_modules --exclude=data --exclude=.git -czf smxkits-final.tar.gz .

echo 📤 Uploading to server...
scp smxkits-final.tar.gz %SERVER_USER%@%SERVER_IP%:/root/

echo 🚀 Setting up and starting services...
ssh %SERVER_USER%@%SERVER_IP% "cd /root && tar -xzf smxkits-final.tar.gz && cd smxkits-final && mkdir -p data/hls data/recordings data/redis && docker-compose -f docker-compose.streaming.yml up -d"

echo.
echo ✅ DEPLOYMENT COMPLETE!
echo.
echo 🔗 Your streaming system is now LIVE:
echo    👨‍🏫 Instructor: http://%SERVER_IP%:3000/Stream%%20Mode.html
echo    🎓 Students: http://%SERVER_IP%:3000/SMXStream-new.html?classId=YOUR_CLASS
echo.
echo 📡 OBS Settings:
echo    Server: rtmp://%SERVER_IP%:1935/live
echo    Stream Key: YOUR_CLASS_ID
echo.
echo 🎬 Ready to go live!
pause