// Debug environment variables loading
console.log('=== Environment Debug ===');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

// Try loading dotenv
try {
  require('dotenv').config();
  console.log('✅ dotenv loaded successfully');
} catch (err) {
  console.log('❌ dotenv loading failed:', err.message);
}

console.log('\n=== Environment Variables ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('MONGO_URI value:', process.env.MONGO_URI);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

console.log('\n=== File System Check ===');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
console.log('Looking for .env at:', envPath);
console.log('.env file exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('.env file content:');
  console.log(envContent);
}