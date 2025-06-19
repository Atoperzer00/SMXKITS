function InitMapSimple(mapInfos) {
    console.log('InitMapSimple called with:', mapInfos);
    
    // Clear any existing map
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.innerHTML = '';
    }

    try {
        var map = L.map('map', {
            minZoom: mapInfos.minZoom,
            maxZoom: mapInfos.maxZoom,
            crs: mapInfos.CRS
        });

        console.log('Map created with CRS:', mapInfos.CRS);

        var tileLayer = L.tileLayer(mapInfos.tilePattern, {
            attribution: mapInfos.attribution,
            tileSize: mapInfos.tileSize
        });
        
        console.log('Tile layer created with pattern:', mapInfos.tilePattern);
        
        tileLayer.addTo(map);

        map.setView(mapInfos.center, mapInfos.defaultZoom);
        
        console.log('Map view set to:', mapInfos.center, 'zoom:', mapInfos.defaultZoom);

        // Add graticule if available
        if (typeof L.latlngGraticule === 'function') {
            L.latlngGraticule().addTo(map);
            console.log('Graticule added');
        } else {
            console.log('Graticule not available');
        }

        // Add scale control
        L.control.scale({ maxWidth: 200, imperial: false }).addTo(map);

        // Add grid mouse position if available
        if (typeof L.control.gridMousePosition === 'function') {
            L.control.gridMousePosition().addTo(map);
            console.log('Grid mouse position added');
        } else {
            console.log('Grid mouse position not available');
        }
        
        // Add cities if hash is set
        if (window.location.hash == '#cities' && mapInfos.cities) {
            console.log('Adding cities:', mapInfos.cities.length);
            mapInfos.cities.forEach(function(city) {
                L.marker([city.y, city.x]).addTo(map).bindPopup(city.name);
            });
        }
        
        // Make map globally accessible
        window.map = map;
        
        console.log('Map initialization complete');
        return map;
        
    } catch (error) {
        console.error('Error in InitMapSimple:', error);
        throw error;
    }
}