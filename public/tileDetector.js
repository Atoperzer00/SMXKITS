/**
 * Tile Detection and Map Bounds Utility
 * Automatically detects available tiles and constrains Leaflet map accordingly
 */

class TileDetector {
    constructor(tileBasePath = 'altis') {
        this.tileBasePath = tileBasePath;
        this.availableTiles = new Map(); // Map<zoomLevel, Set<"x,y">>
        this.detectedBounds = null;
        this.detectedZoomLevels = [];
    }

    /**
     * Detect available tiles by attempting to load them
     * @param {number} maxZoom - Maximum zoom level to check
     * @param {number} maxTilesPerZoom - Maximum tiles to check per zoom level (for performance)
     * @returns {Promise<Object>} Detection results
     */
    async detectAvailableTiles(maxZoom = 6, maxTilesPerZoom = 100) {
        console.log('🔍 Starting tile detection...');
        
        for (let z = 0; z <= maxZoom; z++) {
            console.log(`🔍 Checking zoom level ${z}...`);
            const tilesAtZoom = new Set();
            
            // Calculate expected grid size for this zoom level
            const gridSize = Math.pow(2, z);
            let tilesChecked = 0;
            
            for (let x = 0; x < gridSize && tilesChecked < maxTilesPerZoom; x++) {
                for (let y = 0; y < gridSize && tilesChecked < maxTilesPerZoom; y++) {
                    const tileUrl = `${this.tileBasePath}/${z}/${x}/${y}.png`;
                    
                    try {
                        const exists = await this.checkTileExists(tileUrl);
                        if (exists) {
                            tilesAtZoom.add(`${x},${y}`);
                            console.log(`✅ Found tile: ${tileUrl}`);
                        }
                        tilesChecked++;
                    } catch (error) {
                        // Tile doesn't exist, continue
                        tilesChecked++;
                    }
                }
            }
            
            if (tilesAtZoom.size > 0) {
                this.availableTiles.set(z, tilesAtZoom);
                this.detectedZoomLevels.push(z);
                console.log(`📊 Zoom ${z}: Found ${tilesAtZoom.size} tiles`);
            }
        }
        
        this.calculateOptimalBounds();
        
        const result = {
            availableTiles: this.availableTiles,
            detectedBounds: this.detectedBounds,
            detectedZoomLevels: this.detectedZoomLevels,
            recommendedZoom: this.getRecommendedZoom(),
            recommendedCenter: this.getRecommendedCenter()
        };
        
        console.log('🎯 Tile detection complete:', result);
        return result;
    }

    /**
     * Check if a tile exists by attempting to load it
     * @param {string} tileUrl - URL of the tile to check
     * @returns {Promise<boolean>} Whether the tile exists
     */
    checkTileExists(tileUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = tileUrl;
            
            // Timeout after 2 seconds
            setTimeout(() => resolve(false), 2000);
        });
    }

    /**
     * Calculate optimal map bounds based on detected tiles
     */
    calculateOptimalBounds() {
        if (this.availableTiles.size === 0) {
            this.detectedBounds = [[0, 0], [64, 64]]; // Default fallback
            return;
        }

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        // Use the highest zoom level for most accurate bounds
        const highestZoom = Math.max(...this.detectedZoomLevels);
        const tilesAtHighestZoom = this.availableTiles.get(highestZoom);

        if (tilesAtHighestZoom) {
            for (const tileCoord of tilesAtHighestZoom) {
                const [x, y] = tileCoord.split(',').map(Number);
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }

            // Convert tile coordinates to map bounds
            // For Simple CRS, tile coordinates roughly correspond to map coordinates
            const tileSize = 256;
            const scale = Math.pow(2, highestZoom);
            
            this.detectedBounds = [
                [minY * tileSize / scale, minX * tileSize / scale],
                [(maxY + 1) * tileSize / scale, (maxX + 1) * tileSize / scale]
            ];
        } else {
            this.detectedBounds = [[0, 0], [64, 64]]; // Fallback
        }
    }

    /**
     * Get recommended zoom level based on available tiles
     * @returns {number} Recommended zoom level
     */
    getRecommendedZoom() {
        if (this.detectedZoomLevels.length === 0) return 2;
        
        // Find zoom level with reasonable number of tiles (not too sparse, not too dense)
        for (const zoom of this.detectedZoomLevels.sort((a, b) => a - b)) {
            const tileCount = this.availableTiles.get(zoom).size;
            if (tileCount >= 4 && tileCount <= 16) {
                return zoom;
            }
        }
        
        // Fallback to middle zoom level
        return this.detectedZoomLevels[Math.floor(this.detectedZoomLevels.length / 2)] || 2;
    }

    /**
     * Get recommended center point based on detected tiles
     * @returns {Array} [lat, lng] center coordinates
     */
    getRecommendedCenter() {
        if (!this.detectedBounds) return [32, 32];
        
        const [[minLat, minLng], [maxLat, maxLng]] = this.detectedBounds;
        return [
            (minLat + maxLat) / 2,
            (minLng + maxLng) / 2
        ];
    }

    /**
     * Create placeholder tiles for missing zoom levels
     * @param {number} targetZoom - Zoom level to create placeholders for
     * @returns {Promise<void>}
     */
    async createPlaceholderTiles(targetZoom = 2) {
        console.log(`🎨 Creating placeholder tiles for zoom level ${targetZoom}...`);
        
        const gridSize = Math.pow(2, targetZoom);
        const placeholders = [];
        
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                const tileUrl = `${this.tileBasePath}/${targetZoom}/${x}/${y}.png`;
                const exists = await this.checkTileExists(tileUrl);
                
                if (!exists) {
                    placeholders.push({ x, y, zoom: targetZoom });
                }
            }
        }
        
        if (placeholders.length > 0) {
            console.log(`📝 Need to create ${placeholders.length} placeholder tiles`);
            console.log('💡 Placeholder tiles needed:', placeholders);
            
            // Note: Actual file creation would require server-side implementation
            // For now, we'll just log what's needed
            return placeholders;
        }
        
        return [];
    }

    /**
     * Generate a data URL for a placeholder tile
     * @param {number} x - Tile X coordinate
     * @param {number} y - Tile Y coordinate
     * @param {number} z - Zoom level
     * @returns {string} Data URL for placeholder tile
     */
    generatePlaceholderTile(x, y, z) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Dark background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 256, 256);
        
        // Grid pattern
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 256; i += 32) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 256);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(256, i);
            ctx.stroke();
        }
        
        // Tile coordinates text
        ctx.fillStyle = '#666';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${z}/${x}/${y}`, 128, 128);
        
        return canvas.toDataURL();
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TileDetector;
} else {
    window.TileDetector = TileDetector;
}