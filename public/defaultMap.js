
function InitMap(mapInfos) {
    $(function () {

        var map = L.map('map', {
            minZoom: mapInfos.minZoom,
            maxZoom: mapInfos.maxZoom,
            crs: mapInfos.CRS
        });

        var tileLayer = L.tileLayer(mapInfos.tilePattern, {
            attribution: mapInfos.attribution,
            tileSize: mapInfos.tileSize,
            errorTileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDMyIDAgTCAwIDAgMCAzMiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC4zIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTExIi8+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==', // Dark grid pattern for missing tiles
            bounds: mapInfos.bounds // Limit tile loading to defined bounds
        });
        
        // Add error handling for missing tiles
        tileLayer.on('tileerror', function(error) {
            // Silently handle missing tiles to reduce console spam
            console.debug('Tile not found:', error.tile.src);
        });
        
        tileLayer.addTo(map);

        map.setView(mapInfos.center, mapInfos.defaultZoom);

        L.latlngGraticule().addTo(map);

        L.control.scale({ maxWidth: 200, imperial: false }).addTo(map);

        L.control.gridMousePosition().addTo(map);
        
        if (window.location.hash == '#cities' ) 
        {
            $.each(mapInfos.cities, function(index, city){
                
                L.marker([city.y, city.x]).addTo(map).bindPopup(city.name);
            });
        }
        
        // Make map globally accessible
        window.map = map;
    });
}