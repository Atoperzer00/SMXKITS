@echo off
echo 🎨 Generating Placeholder Tiles for TrackPoint
echo =============================================
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js found

REM Check if canvas module is installed
node -e "require('canvas')" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Canvas module not found. Installing...
    npm install canvas
    if %errorlevel% neq 0 (
        echo ❌ Failed to install canvas module
        echo 💡 Try running: npm install canvas --build-from-source
        pause
        exit /b 1
    )
)

echo ✅ Canvas module available

REM Run the tile generator
echo 🚀 Running tile generator...
node generate-placeholder-tiles.js

if %errorlevel% equ 0 (
    echo.
    echo ✅ Tile generation completed successfully!
    echo 💡 You can now test your map with the generated placeholder tiles
    echo 🔍 Use tile-diagnostics-enhanced.html to verify the results
) else (
    echo.
    echo ❌ Tile generation failed
)

echo.
pause