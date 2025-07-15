 /**
 * Altis Map Configuration for SMX Track Point
 * Based on Arma 3 Altis map tiles
 */

// Initialize Arma3Map if not already defined
if (typeof Arma3Map === 'undefined') {
    var Arma3Map = { Maps: {} };
}

// Altis map configuration with enhanced tile detection support
Arma3Map.Maps.altis = {
    minZoom: 0,
    maxZoom: 6, // Will be dynamically adjusted based on detected tiles
    CRS: L.extend({}, L.CRS.Simple, {
        transformation: new L.Transformation(1, 0, -1, 256)
    }), // Enhanced coordinate system for better tile alignment
    tilePattern: 'altis/{z}/{x}/{y}.png',
    attribution: 'Altis Map - Arma 3 | Enhanced with Tile Detection',
    tileSize: 256,
    center: [128, 128], // Default center, will be adjusted by tile detection
    defaultZoom: 2, // Default zoom, will be optimized by detection
    bounds: [[0, 0], [256, 256]], // Default bounds, will be constrained by detection
    
    // Enhanced configuration options
    tileDetectionEnabled: true, // Enable automatic tile detection
    constrainToDetectedTiles: true, // Constrain map to detected tile bounds
    generatePlaceholders: false, // Set to true to auto-generate missing tiles
    
    // Tile detection settings
    detectionSettings: {
        maxZoomToCheck: 6,
        maxTilesPerZoom: 200,
        timeoutPerTile: 2000
    },
    
    // Fallback settings if detection fails
    fallbackSettings: {
        center: [32, 32],
        defaultZoom: 2,
        bounds: [[0, 0], [64, 64]],
        minZoom: 0,
        maxZoom: 6
    },
    
    cities: [
        // Major cities on Altis (coordinates will be adjusted based on detected bounds)
        { name: "Kavala", x: 220, y: 176 },
        { name: "Pyrgos", x: 124, y: 140 },
        { name: "Sofia", x: 212, y: 180 },
        { name: "Athira", x: 112, y: 160 },
        { name: "Paros", x: 192, y: 136 },
        { name: "Zaros", x: 72, y: 132 },
        { name: "Poliakko", x: 100, y: 116 },
        { name: "Galati", x: 172, y: 112 }
    ],
    
    // Utility functions
    utils: {
        /**
         * Update configuration with detected tile information
         * @param {Object} detectedInfo - Results from tile detection
         */
        updateWithDetection: function(detectedInfo) {
            if (!detectedInfo) return;
            
            console.log('🔧 Updating Altis configuration with detected tile info...');
            
            if (detectedInfo.detectedBounds) {
                this.bounds = detectedInfo.detectedBounds;
                console.log('📐 Updated bounds:', this.bounds);
            }
            
            if (detectedInfo.recommendedCenter) {
                this.center = detectedInfo.recommendedCenter;
                console.log('📍 Updated center:', this.center);
            }
            
            if (detectedInfo.recommendedZoom) {
                this.defaultZoom = detectedInfo.recommendedZoom;
                console.log('🔍 Updated default zoom:', this.defaultZoom);
            }
            
            if (detectedInfo.detectedZoomLevels && detectedInfo.detectedZoomLevels.length > 0) {
                this.minZoom = Math.min(...detectedInfo.detectedZoomLevels);
                this.maxZoom = Math.max(...detectedInfo.detectedZoomLevels);
                console.log('📊 Updated zoom range:', this.minZoom, '-', this.maxZoom);
            }
        },
        
        /**
         * Reset to fallback settings
         */
        resetToFallback: function() {
            console.log('🔄 Resetting to fallback settings...');
            Object.assign(this, this.fallbackSettings);
        },
        
        /**
         * Get optimal tile layer options
         * @returns {Object} Tile layer options
         */
        getTileLayerOptions: function() {
            return {
                attribution: this.attribution,
                tileSize: this.tileSize,
                bounds: this.bounds,
                keepBuffer: 2,
                updateWhenZooming: false,
                updateInterval: 200,
                errorTileUrl: this.generateErrorTileUrl()
            };
        },
        
        /**
         * Generate error tile URL
         * @returns {string} Data URL for error tile
         */
        generateErrorTileUrl: function() {
            // This will be replaced by the actual error tile generator
            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDMyIDAgTCAwIDAgMCAzMiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC4zIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTExIi8+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==';
        }
    }
};