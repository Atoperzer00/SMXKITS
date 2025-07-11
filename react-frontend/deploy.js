#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 SMX KITS React Deployment Setup\n');

// Create deployment configurations
const deploymentConfigs = {
  netlify: {
    name: 'Netlify',
    config: `# Netlify Configuration
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/admin.html"
  to = "/admin.html"
  status = 200

[[redirects]]
  from = "/instructor.html"
  to = "/instructor.html"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"`,
    filename: 'netlify.toml'
  },

  vercel: {
    name: 'Vercel',
    config: `{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/admin.html",
      "dest": "/admin.html"
    },
    {
      "src": "/instructor.html", 
      "dest": "/instructor.html"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "buildCommand": "npm run build"
}`,
    filename: 'vercel.json'
  },

  docker: {
    name: 'Docker',
    config: `# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]`,
    filename: 'Dockerfile'
  },

  nginx: {
    name: 'Nginx Configuration',
    config: `server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Handle admin portal
    location /admin.html {
        try_files $uri /admin.html;
    }

    # Handle instructor portal
    location /instructor.html {
        try_files $uri /instructor.html;
    }

    # Static assets
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}`,
    filename: 'nginx.conf'
  }
};

// Create deployment files
console.log('📝 Creating deployment configuration files...\n');

Object.entries(deploymentConfigs).forEach(([platform, config]) => {
  const filePath = path.join(__dirname, config.filename);
  fs.writeFileSync(filePath, config.config);
  console.log(`✅ Created ${config.filename} for ${config.name}`);
});

// Create deployment scripts
const deploymentScripts = {
  'deploy-netlify.sh': `#!/bin/bash
echo "🚀 Deploying to Netlify..."

# Build the application
npm run build

# Install Netlify CLI if not present
if ! command -v netlify &> /dev/null; then
    echo "Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Deploy to Netlify
echo "Deploying to Netlify..."
netlify deploy --prod --dir=dist

echo "✅ Deployment complete!"`,

  'deploy-vercel.sh': `#!/bin/bash
echo "🚀 Deploying to Vercel..."

# Build the application
npm run build

# Install Vercel CLI if not present
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"`,

  'deploy-docker.sh': `#!/bin/bash
echo "🚀 Building Docker image..."

# Build Docker image
docker build -t smx-kits-react .

# Run container
echo "Starting container..."
docker run -d -p 80:80 --name smx-kits-app smx-kits-react

echo "✅ Application running at http://localhost"
echo "📱 Student Portal: http://localhost"
echo "👨‍💼 Admin Portal: http://localhost/admin.html"
echo "👨‍🏫 Instructor Portal: http://localhost/instructor.html"`
};

console.log('\n📜 Creating deployment scripts...\n');

Object.entries(deploymentScripts).forEach(([filename, script]) => {
  const filePath = path.join(__dirname, filename);
  fs.writeFileSync(filePath, script);
  console.log(`✅ Created ${filename}`);
});

// Update package.json with deployment scripts
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

packageJson.scripts = {
  ...packageJson.scripts,
  'deploy:netlify': 'bash deploy-netlify.sh',
  'deploy:vercel': 'bash deploy-vercel.sh',
  'deploy:docker': 'bash deploy-docker.sh',
  'build:analyze': 'npm run build && npx vite-bundle-analyzer dist'
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json with deployment scripts');

// Create environment configuration
const envExample = `# Environment Variables for SMX KITS React App

# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_API_TIMEOUT=10000

# Authentication
VITE_JWT_SECRET=your-jwt-secret-here
VITE_SESSION_TIMEOUT=3600000

# Features
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=false

# Deployment
VITE_APP_VERSION=1.0.0
VITE_BUILD_DATE=\${new Date().toISOString()}`;

fs.writeFileSync(path.join(__dirname, '.env.example'), envExample);
console.log('✅ Created .env.example');

// Create production environment
const envProduction = `# Production Environment Variables
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false`;

fs.writeFileSync(path.join(__dirname, '.env.production'), envProduction);
console.log('✅ Created .env.production');

console.log('\n🎯 DEPLOYMENT OPTIONS READY!\n');

console.log('📋 Available Deployment Methods:');
console.log('1. 🌐 Netlify (Recommended for static hosting)');
console.log('2. ⚡ Vercel (Excellent for React apps)');
console.log('3. 🐳 Docker (For containerized deployment)');
console.log('4. 🖥️  Traditional Web Server (Apache/Nginx)');

console.log('\n🚀 Quick Deploy Commands:');
console.log('• Netlify: npm run deploy:netlify');
console.log('• Vercel:  npm run deploy:vercel');
console.log('• Docker:  npm run deploy:docker');

console.log('\n📁 Files Created:');
console.log('• netlify.toml - Netlify configuration');
console.log('• vercel.json - Vercel configuration');
console.log('• Dockerfile - Docker configuration');
console.log('• nginx.conf - Nginx configuration');
console.log('• deploy-*.sh - Deployment scripts');
console.log('• .env.example - Environment variables template');

console.log('\n🔧 Next Steps:');
console.log('1. Choose your deployment platform');
console.log('2. Configure environment variables');
console.log('3. Run the appropriate deploy command');
console.log('4. Test all three portals after deployment');

console.log('\n✨ Ready for deployment! ✨');