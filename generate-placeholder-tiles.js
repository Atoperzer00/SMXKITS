/**
 * Server-side Placeholder Tile Generator
 * Creates actual PNG files for missing tiles
 * 
 * Usage: node generate-placeholder-tiles.js
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

class ServerTileGenerator {
    constructor(outputDir = './public/altis') {
        this.outputDir = outputDir;
    }

    /**
     * Generate placeholder tiles for missing zoom levels
     * @param {Array} zoomLevels - Array of zoom levels to generate (default: [0, 1, 2])
     */
    async generatePlaceholderTiles(zoomLevels = [0, 1, 2]) {
        console.log('🎨 Starting placeholder tile generation...');
        
        for (const zoom of zoomLevels) {
            await this.generateTilesForZoom(zoom);
        }
        
        console.log('✅ Placeholder tile generation complete!');
    }

    /**
     * Generate tiles for a specific zoom level
     * @param {number} zoomLevel - Zoom level to generate
     */
    async generateTilesForZoom(zoomLevel) {
        const gridSize = Math.pow(2, zoomLevel);
        console.log(`📊 Generating ${gridSize}x${gridSize} tiles for zoom level ${zoomLevel}`);
        
        // Create directory structure
        const zoomDir = path.join(this.outputDir, zoomLevel.toString());
        if (!fs.existsSync(zoomDir)) {
            fs.mkdirSync(zoomDir, { recursive: true });
        }
        
        let generated = 0;
        let skipped = 0;
        
        for (let x = 0; x < gridSize; x++) {
            const xDir = path.join(zoomDir, x.toString());
            if (!fs.existsSync(xDir)) {
                fs.mkdirSync(xDir, { recursive: true });
            }
            
            for (let y = 0; y < gridSize; y++) {
                const tilePath = path.join(xDir, `${y}.png`);
                
                // Skip if tile already exists
                if (fs.existsSync(tilePath)) {
                    skipped++;
                    continue;
                }
                
                // Generate placeholder tile
                const tileBuffer = this.generateTile(x, y, zoomLevel);
                fs.writeFileSync(tilePath, tileBuffer);
                generated++;
            }
        }
        
        console.log(`✅ Zoom ${zoomLevel}: Generated ${generated} tiles, skipped ${skipped} existing tiles`);
    }

    /**
     * Generate a single placeholder tile
     * @param {number} x - Tile X coordinate
     * @param {number} y - Tile Y coordinate
     * @param {number} z - Zoom level
     * @returns {Buffer} PNG image buffer
     */
    generateTile(x, y, z) {
        const tileSize = 256;
        const canvas = createCanvas(tileSize, tileSize);
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, tileSize, tileSize);
        
        // Border
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, tileSize - 2, tileSize - 2);
        
        // Grid pattern
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([5, 5]);
        
        const gridSpacing = tileSize / 8;
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
        ctx.setLineDash([]);
        
        // Text
        ctx.fillStyle = '#666';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Main coordinates
        ctx.fillText(`${z}/${x}/${y}`, tileSize / 2, tileSize / 2);
        
        // Additional info
        ctx.font = '10px Arial';
        ctx.fillText('Placeholder', tileSize / 2, tileSize / 2 + 20);
        
        // Corner info
        ctx.font = '8px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`(${x},${y})`, 5, 15);
        ctx.textAlign = 'right';
        ctx.fillText(`Z${z}`, tileSize - 5, 15);
        
        return canvas.toBuffer('image/png');
    }

    /**
     * Analyze existing tiles and report what's missing
     * @returns {Object} Analysis results
     */
    analyzeTileStructure() {
        console.log('🔍 Analyzing existing tile structure...');
        
        const analysis = {
            existingTiles: new Map(),
            missingTiles: new Map(),
            zoomLevels: []
        };
        
        // Check zoom levels 0-6
        for (let z = 0; z <= 6; z++) {
            const zoomDir = path.join(this.outputDir, z.toString());
            
            if (!fs.existsSync(zoomDir)) {
                console.log(`📁 Zoom level ${z}: Directory doesn't exist`);
                continue;
            }
            
            analysis.zoomLevels.push(z);
            const gridSize = Math.pow(2, z);
            let existing = 0;
            let missing = 0;
            
            for (let x = 0; x < gridSize; x++) {
                const xDir = path.join(zoomDir, x.toString());
                
                for (let y = 0; y < gridSize; y++) {
                    const tilePath = path.join(xDir, `${y}.png`);
                    
                    if (fs.existsSync(tilePath)) {
                        existing++;
                        if (!analysis.existingTiles.has(z)) {
                            analysis.existingTiles.set(z, []);
                        }
                        analysis.existingTiles.get(z).push({ x, y });
                    } else {
                        missing++;
                        if (!analysis.missingTiles.has(z)) {
                            analysis.missingTiles.set(z, []);
                        }
                        analysis.missingTiles.get(z).push({ x, y });
                    }
                }
            }
            
            console.log(`📊 Zoom ${z}: ${existing} existing, ${missing} missing (${gridSize}x${gridSize} grid)`);
        }
        
        return analysis;
    }
}

// Main execution
async function main() {
    console.log('🚀 Server-side Placeholder Tile Generator');
    console.log('==========================================');
    
    const generator = new ServerTileGenerator();
    
    // Analyze current structure
    const analysis = generator.analyzeTileStructure();
    
    // Generate missing tiles for zoom levels 0-2 (basic pyramid)
    if (analysis.missingTiles.size > 0) {
        console.log('\n🎨 Generating missing placeholder tiles...');
        await generator.generatePlaceholderTiles([0, 1, 2]);
    } else {
        console.log('\n✅ All basic tiles already exist!');
    }
    
    console.log('\n📋 Generation Summary:');
    console.log('- Placeholder tiles created for zoom levels 0, 1, 2');
    console.log('- These provide a basic tile pyramid for smooth zooming');
    console.log('- Existing tiles were preserved (not overwritten)');
    console.log('\n💡 Next steps:');
    console.log('1. Test your map with the new placeholder tiles');
    console.log('2. Use the tile diagnostics page to verify coverage');
    console.log('3. Replace placeholders with actual map tiles as needed');
}

// Check if canvas module is available
try {
    require('canvas');
    
    // Run if called directly
    if (require.main === module) {
        main().catch(console.error);
    }
    
    module.exports = ServerTileGenerator;
    
} catch (error) {
    console.error('❌ Canvas module not found. Install it with: npm install canvas');
    console.error('   This is required for server-side image generation.');
    process.exit(1);
}