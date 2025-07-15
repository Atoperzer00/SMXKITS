#!/bin/bash
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

echo "✅ Deployment complete!"