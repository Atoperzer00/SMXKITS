# TrackPoint Tile Enhancement System

## Overview

This enhancement system solves the common issues with Leaflet.js tactical maps using custom CRS and local tile folders. It provides:

1. **Automatic Tile Detection** - Scans your tile directory and detects available tiles
2. **Dynamic Map Constraints** - Automatically sets `maxBounds` and zoom limits based on detected tiles
3. **Placeholder Tile Generation** - Creates missing tiles to fill gaps in your tile pyramid
4. **Enhanced Error Handling** - Better handling of missing tiles with visual placeholders
5. **Diagnostic Tools** - Comprehensive testing and analysis tools

## 🚀 Quick Start

### 1. Basic Integration

Your TrackPoint.html now includes the enhanced system. The key changes:

```html
<!-- New script includes -->
<script src="tileDetector.js"></script>
<script src="generatePlaceholderTiles.js"></script>
```

The map initialization is now automatic and includes tile detection.

### 2. Generate Missing Tiles

Run the tile generator to create placeholder tiles for smooth zooming:

```bash
# Windows
generate-tiles.bat

# Or manually with Node.js
node generate-placeholder-tiles.js
```

This creates a basic tile pyramid (zoom levels 0, 1, 2) with placeholder tiles.

### 3. Test Your Setup

Open `tile-diagnostics-enhanced.html` in your browser to:
- Detect available tiles
- Generate placeholder tiles
- Test map functionality
- Download diagnostic reports

## 📁 File Structure

```
public/
├── altis/                          # Your tile directory
│   ├── 0/0/0.png                  # Zoom level 0 tiles
│   ├── 1/0/0.png, 1/0/1.png, etc. # Zoom level 1 tiles
│   └── 2/0/0.png, 2/0/1.png, etc. # Zoom level 2 tiles
├── tileDetector.js                 # Core tile detection logic
├── generatePlaceholderTiles.js     # Client-side placeholder generation
├── tile-diagnostics-enhanced.html  # Testing and diagnostic interface
├── Trackpoint.html                 # Your enhanced map page
├── defaultMap.js                   # Enhanced map initialization
└── altis.js                        # Enhanced map configuration
```

## 🔧 How It Works

### Tile Detection Process

1. **Scanning**: The system attempts to load tiles from your `altis/{z}/{x}/{y}.png` pattern
2. **Analysis**: Determines which zoom levels have tiles and calculates coverage
3. **Optimization**: Recommends optimal center point, zoom level, and bounds
4. **Constraint**: Applies detected bounds to prevent panning to empty areas

### Map Initialization Flow

```javascript
// 1. Load configuration
const mapConfig = Arma3Map.Maps.altis;

// 2. Detect available tiles (if TileDetector is available)
const detector = new TileDetector('altis');
const tileInfo = await detector.detectAvailableTiles(6);

// 3. Update configuration with detected values
if (tileInfo.detectedBounds) {
    mapConfig.bounds = tileInfo.detectedBounds;
}

// 4. Create map with optimized settings
const map = L.map('map', {
    maxBounds: mapConfig.bounds,
    noWrap: true,
    bounceAtZoomLimits: false
});
```

## 🎛️ Configuration Options

### In altis.js

```javascript
Arma3Map.Maps.altis = {
    // Basic settings
    tilePattern: 'altis/{z}/{x}/{y}.png',
    
    // Detection settings
    tileDetectionEnabled: true,
    constrainToDetectedTiles: true,
    
    detectionSettings: {
        maxZoomToCheck: 6,
        maxTilesPerZoom: 200,
        timeoutPerTile: 2000
    },
    
    // Fallback if detection fails
    fallbackSettings: {
        center: [32, 32],
        defaultZoom: 2,
        bounds: [[0, 0], [64, 64]]
    }
};
```

## 🛠️ Advanced Usage

### Manual Tile Detection

```javascript
const detector = new TileDetector('altis');
const results = await detector.detectAvailableTiles(6);

console.log('Available tiles:', results.availableTiles);
console.log('Recommended center:', results.recommendedCenter);
console.log('Recommended zoom:', results.recommendedZoom);
console.log('Detected bounds:', results.detectedBounds);
```

### Generate Custom Placeholders

```javascript
const generator = new PlaceholderTileGenerator();

// Generate tiles for specific zoom level
const tiles = generator.generateTilesForZoom(2);

// Generate basic pyramid (zoom 0-2)
const pyramid = generator.generateBasicTilePyramid();

// Create preview
generator.createTilePreview(tiles, 'preview-container');
```

### Server-Side Tile Generation

```javascript
const ServerTileGenerator = require('./generate-placeholder-tiles.js');
const generator = new ServerTileGenerator('./public/altis');

// Analyze existing structure
const analysis = generator.analyzeTileStructure();

// Generate missing tiles
await generator.generatePlaceholderTiles([0, 1, 2]);
```

## 🔍 Diagnostic Tools

### tile-diagnostics-enhanced.html Features

- **Tile Detection**: Scan and analyze your tile directory
- **Statistics**: View coverage, zoom levels, and recommendations
- **Test Map**: Interactive map with detected constraints
- **Placeholder Generation**: Create missing tiles on-demand
- **Report Export**: Download detailed analysis reports

### Console Debugging

The system provides detailed console logging:

```
🚀 TrackPoint initializing with enhanced tile detection...
🔍 TileDetector available, detecting tiles...
✅ Found tile: altis/2/0/0.png
✅ Found tile: altis/2/0/1.png
📊 Zoom 2: Found 4 tiles
📐 Updated bounds to: [[0, 0], [128, 128]]
📍 Updated center to: [64, 64]
🔍 Updated default zoom to: 2
✅ Map initialization complete
```

## 🚨 Troubleshooting

### Common Issues

1. **No tiles detected**
   - Check tile path pattern in `altis.js`
   - Verify tiles exist in `public/altis/` directory
   - Check browser console for CORS errors

2. **Map shows only one tile**
   - Run tile detection to set proper bounds
   - Generate placeholder tiles for missing zoom levels
   - Check `maxBounds` and `noWrap` settings

3. **Tiles not loading**
   - Verify tile server is running
   - Check tile file permissions
   - Test individual tile URLs in browser

### Debug Steps

1. Open browser developer tools
2. Check console for error messages
3. Use `tile-diagnostics-enhanced.html` for analysis
4. Verify tile URLs manually: `http://localhost:8000/altis/2/0/0.png`

## 📊 Performance Optimization

### Tile Detection Settings

```javascript
// Faster detection (less accurate)
detectionSettings: {
    maxZoomToCheck: 4,
    maxTilesPerZoom: 50,
    timeoutPerTile: 1000
}

// More thorough detection (slower)
detectionSettings: {
    maxZoomToCheck: 6,
    maxTilesPerZoom: 500,
    timeoutPerTile: 3000
}
```

### Map Performance

```javascript
// Optimized tile layer settings
const tileLayer = L.tileLayer(pattern, {
    keepBuffer: 2,           // Keep tiles in buffer
    updateWhenZooming: false, // Reduce requests during zoom
    updateInterval: 200,      // Throttle updates
    bounds: detectedBounds    // Limit tile loading area
});
```

## 🔄 Migration Guide

### From Basic Setup

1. Add new script includes to your HTML
2. Update `InitMap()` calls to be async: `await InitMap(config)`
3. Replace hardcoded bounds with detected bounds
4. Generate placeholder tiles for missing zoom levels

### Preserving Custom Settings

Your existing city markers, custom controls, and styling are preserved. The enhancement only affects:
- Tile loading and bounds detection
- Map initialization process
- Error handling for missing tiles

## 📈 Future Enhancements

Planned improvements:
- Automatic tile optimization and compression
- Real-time tile generation from source images
- Advanced caching strategies
- Multi-resolution tile support
- Integration with popular tile servers

## 🤝 Support

For issues or questions:
1. Check the diagnostic tools first
2. Review console logs for errors
3. Test with the enhanced diagnostic page
4. Verify tile structure and permissions

The system is designed to be backward-compatible and fail gracefully, so your existing setup should continue working even if the enhancements encounter issues.