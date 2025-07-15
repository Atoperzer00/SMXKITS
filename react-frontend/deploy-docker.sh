#!/bin/bash
echo "🚀 Building Docker image..."

# Build Docker image
docker build -t smx-kits-react .

# Run container
echo "Starting container..."
docker run -d -p 80:80 --name smx-kits-app smx-kits-react

echo "✅ Application running at http://localhost"
echo "📱 Student Portal: http://localhost"
echo "👨‍💼 Admin Portal: http://localhost/admin.html"
echo "👨‍🏫 Instructor Portal: http://localhost/instructor.html"