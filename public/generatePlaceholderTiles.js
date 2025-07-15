/**
 * Placeholder Tile Generator
 * Creates missing tiles for zoom levels to ensure smooth map navigation
 */

class PlaceholderTileGenerator {
    constructor(tileBasePath = 'altis') {
        this.tileBasePath = tileBasePath;
    }

    /**
     * Generate placeholder tiles for a specific zoom level
     * @param {number} zoomLevel - Zoom level to generate tiles for
     * @param {string} outputPath - Path to save generated tiles (server-side only)
     * @returns {Array} Array of generated tile data URLs
     */
    generateTilesForZoom(zoomLevel, outputPath = null) {
        const gridSize = Math.pow(2, zoomLevel);
        const tiles = [];
        
        console.log(`🎨 Generating ${gridSize}x${gridSize} placeholder tiles for zoom level ${zoomLevel}`);
        
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                const tileData = this.generateTile(x, y, zoomLevel);
                tiles.push({
                    x: x,
                    y: y,
                    z: zoomLevel,
                    dataUrl: tileData,
                    filename: `${zoomLevel}/${x}/${y}.png`
                });
            }
        }
        
        console.log(`✅ Generated ${tiles.length} placeholder tiles for zoom ${zoomLevel}`);
        return tiles;
    }

    /**
     * Generate a single placeholder tile
     * @param {number} x - Tile X coordinate
     * @param {number} y - Tile Y coordinate
     * @param {number} z - Zoom level
     * @param {Object} options - Customization options
     * @returns {string} Data URL of the generated tile
     */
    generateTile(x, y, z, options = {}) {
        const {
            tileSize = 256,
            backgroundColor = '#1a1a1a',
            gridColor = '#333',
            textColor = '#666',
            borderColor = '#555',
            showCoordinates = true,
            showGrid = true,
            showBorder = true
        } = options;

        const canvas = document.createElement('canvas');
        canvas.width = tileSize;
        canvas.height = tileSize;
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, tileSize, tileSize);
        
        // Border
        if (showBorder) {
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, tileSize - 2, tileSize - 2);
        }
        
        // Grid pattern
        if (showGrid) {
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 0.5;
            ctx.setLineDash([5, 5]);
            
            const gridSpacing = tileSize / 8; // 8x8 grid
            for (let i = 0; i <= tileSize; i += gridSpacing) {
                // Vertical lines
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, tileSize);
                ctx.stroke();
                
                // Horizontal lines
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(tileSize, i);
                ctx.stroke();
            }
            ctx.setLineDash([]); // Reset line dash
        }
        
        // Coordinate text
        if (showCoordinates) {
            ctx.fillStyle = textColor;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Main coordinates
            ctx.fillText(`${z}/${x}/${y}`, tileSize / 2, tileSize / 2);
            
            // Smaller text with additional info
            ctx.font = '10px Arial';
            ctx.fillText(`Placeholder Tile`, tileSize / 2, tileSize / 2 + 20);
            
            // Corner markers
            ctx.font = '8px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`(${x},${y})`, 5, 15);
            ctx.textAlign = 'right';
            ctx.fillText(`Z${z}`, tileSize - 5, 15);
        }
        
        return canvas.toDataURL('image/png');
    }

    /**
     * Generate a complete set of placeholder tiles for zoom levels 0-2
     * This creates a basic tile pyramid for smooth zooming
     * @returns {Array} Array of all generated tiles
     */
    generateBasicTilePyramid() {
        const allTiles = [];
        
        // Generate tiles for zoom levels 0, 1, and 2
        for (let zoom = 0; zoom <= 2; zoom++) {
            const tilesForZoom = this.generateTilesForZoom(zoom);
            allTiles.push(...tilesForZoom);
        }
        
        console.log(`🏗️ Generated complete tile pyramid: ${allTiles.length} total tiles`);
        return allTiles;
    }

    /**
     * Download generated tiles as a ZIP file (client-side)
     * Note: This requires JSZip library to be loaded
     * @param {Array} tiles - Array of tile objects with dataUrl
     * @param {string} filename - Name of the ZIP file
     */
    async downloadTilesAsZip(tiles, filename = 'placeholder-tiles.zip') {
        if (typeof JSZip === 'undefined') {
            console.error('❌ JSZip library not loaded. Cannot create ZIP file.');
            return;
        }

        const zip = new JSZip();
        
        for (const tile of tiles) {
            // Convert data URL to blob
            const response = await fetch(tile.dataUrl);
            const blob = await response.blob();
            
            // Add to ZIP with proper folder structure
            zip.file(tile.filename, blob);
        }
        
        // Generate and download ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`📦 Downloaded ${tiles.length} tiles as ${filename}`);
    }

    /**
     * Create a visual preview of generated tiles
     * @param {Array} tiles - Array of tile objects
     * @param {string} containerId - ID of container element to show preview
     */
    createTilePreview(tiles, containerId = 'tile-preview') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`❌ Container element '${containerId}' not found`);
            return;
        }
        
        container.innerHTML = '<h3>Generated Placeholder Tiles</h3>';
        
        // Group tiles by zoom level
        const tilesByZoom = {};
        tiles.forEach(tile => {
            if (!tilesByZoom[tile.z]) {
                tilesByZoom[tile.z] = [];
            }
            tilesByZoom[tile.z].push(tile);
        });
        
        // Create preview for each zoom level
        Object.keys(tilesByZoom).sort((a, b) => a - b).forEach(zoom => {
            const zoomDiv = document.createElement('div');
            zoomDiv.innerHTML = `<h4>Zoom Level ${zoom}</h4>`;
            zoomDiv.style.marginBottom = '20px';
            
            const tilesDiv = document.createElement('div');
            tilesDiv.style.display = 'flex';
            tilesDiv.style.flexWrap = 'wrap';
            tilesDiv.style.gap = '5px';
            
            tilesByZoom[zoom].forEach(tile => {
                const img = document.createElement('img');
                img.src = tile.dataUrl;
                img.style.width = '64px';
                img.style.height = '64px';
                img.style.border = '1px solid #ccc';
                img.title = `${tile.z}/${tile.x}/${tile.y}`;
                tilesDiv.appendChild(img);
            });
            
            zoomDiv.appendChild(tilesDiv);
            container.appendChild(zoomDiv);
        });
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlaceholderTileGenerator;
} else {
    window.PlaceholderTileGenerator = PlaceholderTileGenerator;
}

// Utility function to quickly generate basic tiles
window.generateBasicPlaceholderTiles = function() {
    const generator = new PlaceholderTileGenerator();
    return generator.generateBasicTilePyramid();
};