# SMX Track Point - Altis Map

This is a full-screen interactive map of the Arma 3 Altis island with track point functionality.

## Features

- Full-screen Altis map with high-resolution PNG tiles
- Interactive zoom and pan controls
- Grid coordinate system (MGRS)
- Scale control
- Mouse position display
- City markers (when using #cities hash)

## How to Run

The map requires a local HTTP server to properly load the PNG tile images due to browser security restrictions.

### Option 1: Node.js Server (Recommended)
1. Make sure Node.js is installed on your system
2. Double-click `start-server.bat` or run:
   ```
   node server.js
   ```
3. Open your browser and go to: http://localhost:8080/

### Option 2: Python Server
1. Make sure Python is installed on your system
2. Double-click `start-python-server.bat` or run:
   ```
   python -m http.server 8080
   ```
3. Open your browser and go to: http://localhost:8080/

## Files Structure

- `index.html` / `track-point.html` - Main HTML file with full-screen map
- `altis.js` - Altis map configuration and city data
- `defaultMap.js` - Map initialization and controls
- `mapUtils.js` - Utility functions for grid system and mouse position
- `mapUtils.css` - Styling for map controls
- `altis/` - Directory containing PNG map tiles organized by zoom level
- `server.js` - Node.js HTTP server for serving files
- `start-server.bat` - Windows batch file to start Node.js server
- `start-python-server.bat` - Windows batch file to start Python server

## Map Controls

- **Zoom**: Use mouse wheel or zoom controls
- **Pan**: Click and drag to move around the map
- **Grid**: Coordinate grid is displayed automatically
- **Scale**: Scale indicator in bottom-left corner
- **Mouse Position**: Current coordinates shown in top-right corner

## City Markers

To show city markers on the map, add `#cities` to the URL:
http://localhost:8080/#cities

## Technical Details

- Uses Leaflet.js for map rendering
- Custom MGRS coordinate system for Arma 3 compatibility
- Tile structure: `altis/{z}/{x}/{y}.png`
- Zoom levels: 0-6
- Map center: [15360, 15360]
- Tile size: 256x256 pixels

## Troubleshooting

If the map tiles don't load:
1. Make sure you're running a local HTTP server (not opening the HTML file directly)
2. Check that all PNG files are present in the `altis/` directory
3. Verify the server is running on port 8080
4. Check browser console for any error messages