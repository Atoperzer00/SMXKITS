
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
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        });

        // Add debugging for tile loading
        tileLayer.on('tileload', function(e) {
            console.log('✅ Tile loaded:', e.url);
        });

        tileLayer.on('tileerror', function(e) {
            console.error('❌ Tile error:', e.url);
        });

        tileLayer.addTo(map);
        console.log('Tile layer added with pattern:', mapInfos.tilePattern);

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