// Migration verification script
console.log('🔍 SMX KITS Migration Verification\n');

// Check if both servers are running by checking processes
const { exec } = require('child_process');

function checkPort(port, name) {
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (stdout && stdout.trim()) {
        console.log(`✅ ${name} is running on port ${port}`);
        resolve(true);
      } else {
        console.log(`❌ ${name} is NOT running on port ${port}`);
        resolve(false);
      }
    });
  });
}

async function verifyMigration() {
  console.log('Checking server status...\n');
  
  const backendRunning = await checkPort(3001, 'Backend API Server');
  const frontendRunning = await checkPort(5174, 'Frontend Proxy Server');
  
  console.log('\n📁 Checking file structure...');
  
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'backend/server.js',
    'backend/routes/auth.js',
    'backend/routes/users.js',
    'backend/routes/messages.js',
    'backend/routes/conversations.js',
    'backend/routes/stream.js',
    'backend/routes/callouts.js',
    'backend/socket/index.js',
    'backend/models/User.js',
    'backend/models/Class.js',
    'backend/models/Message.js',
    'backend/models/Callout.js',
    'proxy-server.js',
    'package.json',
    'backend/package.json'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, file))) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - MISSING`);
      allFilesExist = false;
    }
  });
  
  console.log('\n📊 Migration Summary:');
  console.log(`Backend Server: ${backendRunning ? '✅ Running' : '❌ Not Running'}`);
  console.log(`Frontend Proxy: ${frontendRunning ? '✅ Running' : '❌ Not Running'}`);
  console.log(`File Structure: ${allFilesExist ? '✅ Complete' : '❌ Incomplete'}`);
  
  if (backendRunning && frontendRunning && allFilesExist) {
    console.log('\n🎉 MIGRATION SUCCESSFUL!');
    console.log('\n🌐 Access your application at: http://localhost:5174');
    console.log('🔧 Backend API available at: http://localhost:3001');
    console.log('\n👤 Default login credentials:');
    console.log('   Admin: admin / admin123');
    console.log('   Instructor: instructor / instructor123');
    console.log('   Student: student / student123');
  } else {
    console.log('\n⚠️  Migration needs attention - check the issues above');
  }
}

verifyMigration();