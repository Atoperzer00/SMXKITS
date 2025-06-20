
async function InitMap(mapInfos) {
    console.log('🚀 InitMap called with configuration:', mapInfos);
    
    // Initialize tile detector if available
    let detectedTileInfo = null;
    if (typeof TileDetector !== 'undefined') {
        console.log('🔍 TileDetector available, detecting tiles...');
        const detector = new TileDetector(mapInfos.tilePattern.split('/')[0]); // Extract base path
        
        try {
            detectedTileInfo = await detector.detectAvailableTiles(mapInfos.maxZoom);
            console.log('✅ Tile detection completed:', detectedTileInfo);
            
            // Update map configuration with detected bounds and zoom levels
            if (detectedTileInfo.detectedBounds) {
                mapInfos.bounds = detectedTileInfo.detectedBounds;
                console.log('📐 Updated bounds to:', mapInfos.bounds);
            }
            
            if (detectedTileInfo.recommendedCenter) {
                mapInfos.center = detectedTileInfo.recommendedCenter;
                console.log('📍 Updated center to:', mapInfos.center);
            }
            
            if (detectedTileInfo.recommendedZoom) {
                mapInfos.defaultZoom = detectedTileInfo.recommendedZoom;
                console.log('🔍 Updated default zoom to:', mapInfos.defaultZoom);
            }
            
            // Constrain zoom levels to detected ones
            if (detectedTileInfo.detectedZoomLevels.length > 0) {
                mapInfos.minZoom = Math.min(...detectedTileInfo.detectedZoomLevels);
                mapInfos.maxZoom = Math.max(...detectedTileInfo.detectedZoomLevels);
                console.log('📊 Updated zoom range to:', mapInfos.minZoom, '-', mapInfos.maxZoom);
            }
            
        } catch (error) {
            console.warn('⚠️ Tile detection failed, using default configuration:', error);
        }
    } else {
        console.log('ℹ️ TileDetector not available, using default configuration');
    }

    $(function () {
        console.log('🗺️ Creating Leaflet map...');

        var map = L.map('map', {
            minZoom: mapInfos.minZoom,
            maxZoom: mapInfos.maxZoom,
            crs: mapInfos.CRS,
            maxBounds: mapInfos.bounds, // Restrict panning to tile bounds
            maxBoundsViscosity: 1.0, // Make bounds strict
            noWrap: true, // Prevent world wrapping
            bounceAtZoomLimits: false // Prevent bouncing at zoom limits
        });

        // Enhanced tile layer with better error handling
        var tileLayer = L.tileLayer(mapInfos.tilePattern, {
            attribution: mapInfos.attribution,
            tileSize: mapInfos.tileSize,
            errorTileUrl: generateErrorTile(), // Generate dynamic error tile
            bounds: mapInfos.bounds, // Limit tile loading to defined bounds
            keepBuffer: 2, // Keep tiles in buffer for smoother panning
            updateWhenZooming: false, // Reduce tile requests during zoom
            updateInterval: 200 // Throttle tile updates
        });
        
        // Enhanced error handling for missing tiles
        let tileErrorCount = 0;
        let errorTileCoords = new Set();
        
        tileLayer.on('tileerror', function(error) {
            const coords = error.coords;
            const coordKey = `${coords.z}/${coords.x}/${coords.y}`;
            
            if (!errorTileCoords.has(coordKey)) {
                errorTileCoords.add(coordKey);
                tileErrorCount++;
                
                // Only log first few errors to avoid console spam
                if (tileErrorCount <= 10) {
                    console.warn(`❌ Tile not found (${tileErrorCount}): ${coordKey}`);
                    if (tileErrorCount === 10) {
                        console.warn('⚠️ Further tile errors will be suppressed to avoid console spam.');
                    }
                }
                
                // Replace with placeholder tile
                if (typeof TileDetector !== 'undefined') {
                    const detector = new TileDetector();
                    error.tile.src = detector.generatePlaceholderTile(coords.x, coords.y, coords.z);
                }
            }
        });
        
        tileLayer.on('tileload', function(event) {
            // Log successful tile loads (only first few)
            if (tileErrorCount < 5) {
                console.log('✅ Tile loaded successfully:', event.coords);
            }
        });
        
        tileLayer.addTo(map);

        // Set initial view with bounds checking
        try {
            map.setView(mapInfos.center, mapInfos.defaultZoom);
            console.log('📍 Map centered at:', mapInfos.center, 'zoom:', mapInfos.defaultZoom);
        } catch (error) {
            console.warn('⚠️ Failed to set initial view, using fallback:', error);
            map.setView([32, 32], 2);
        }

        // Add map controls
        L.latlngGraticule().addTo(map);
        L.control.scale({ maxWidth: 200, imperial: false }).addTo(map);
        L.control.gridMousePosition().addTo(map);
        
        // Add zoom constraint handler
        map.on('zoomend', function() {
            const currentZoom = map.getZoom();
            console.log('🔍 Zoom changed to:', currentZoom);
            
            // Check if current zoom level has tiles
            if (detectedTileInfo && detectedTileInfo.detectedZoomLevels.length > 0) {
                if (!detectedTileInfo.detectedZoomLevels.includes(currentZoom)) {
                    console.warn('⚠️ Current zoom level may not have tiles:', currentZoom);
                }
            }
        });
        
        // Add bounds constraint handler
        map.on('moveend', function() {
            const center = map.getCenter();
            const bounds = map.getBounds();
            console.log('📍 Map moved - Center:', [center.lat, center.lng], 'Bounds:', bounds);
        });
        
        // Add cities if requested
        if (window.location.hash == '#cities' && mapInfos.cities) {
            console.log('🏙️ Adding city markers...');
            $.each(mapInfos.cities, function(index, city){
                L.marker([city.y, city.x]).addTo(map).bindPopup(city.name);
            });
            console.log('✅ Added', mapInfos.cities.length, 'city markers');
        }
        
        // Make map globally accessible
        window.map = map;
        window.mapInfos = mapInfos; // Also store map configuration
        window.detectedTileInfo = detectedTileInfo; // Store detection results
        
        console.log('✅ Map initialization complete');
        
        // Fire custom event when map is ready
        $(document).trigger('mapReady', { map: map, mapInfos: mapInfos, detectedTileInfo: detectedTileInfo });
    });
}

/**
 * Generate a dynamic error tile as data URL
 * @returns {string} Data URL for error tile
 */
function generateErrorTile() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Dark background with subtle pattern
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 256, 256);
    
    // Grid pattern
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([5, 5]);
    
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
    
    // "No Tile" text
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No Tile', 128, 128);
    
    return canvas.toDataURL();
}