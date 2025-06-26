# SMX KITS Server Instructions

## Starting the Server

To view the course content with images properly, you need to run a local web server:

### Option 1: Using the batch file
1. Double-click `start-server.bat`
2. The server will start at http://localhost:8080/

### Option 2: Using Node.js directly
1. Open command prompt in the public folder
2. Run: `node server.js`
3. Access at http://localhost:8080/

## Accessing Course Content

Once the server is running:
- Dashboard: http://localhost:8080/dashboard.html
- Course Content: http://localhost:8080/course-content.html
- Test Images: http://localhost:8080/test-image.html

## Troubleshooting Images

If images are not loading:
1. Make sure the server is running
2. Check browser console (F12) for error messages
3. Verify folder structure:
   - `INTRODUCTION TO FMV/SLIDE 1.jpg`
   - `F3EAD/F3EAD/SLIDE 1.jpg`

## Note

Images may not load when opening HTML files directly in the browser due to CORS restrictions. Always use the local server.