
function InitMap(mapInfos) {
    $(function () {

        var map = L.map('map', {
            minZoom: mapInfos.minZoom,
            maxZoom: mapInfos.maxZoom,
            crs: mapInfos.CRS
        });

        // Create custom tile layer to ensure proper URL generation
        var AltisLayer = L.TileLayer.extend({
            getTileUrl: function (coords) {
                var url = mapInfos.tilePattern.replace('{z}', coords.z).replace('{x}', coords.x).replace('{y}', coords.y);
                console.log('🔗 Requesting tile: ' + url + ' | Coords: z=' + coords.z + ' x=' + coords.x + ' y=' + coords.y);
                return url;
            }
        });

        var tileLayer = new AltisLayer('', {
            attribution: mapInfos.attribution,
            tileSize: mapInfos.tileSize,
            minZoom: mapInfos.minZoom,
            maxZoom: mapInfos.maxZoom,
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        });

        // Add debugging for tile loading
        tileLayer.on('tileload', function(e) {
            console.log('✅ Tile loaded:', e.url);
        });

        tileLayer.on('tileerror', function(e) {
            console.error('❌ Tile error:', e.url);
            console.error('Tile coords:', e.coords);
        });

        tileLayer.on('tileloadstart', function(e) {
            console.log('🔄 Tile loading started:', e.url);
        });

        tileLayer.on('loading', function() {
            console.log('🔄 Map tiles loading...');
        });

        tileLayer.on('load', function() {
            console.log('✅ All map tiles loaded');
        });

        tileLayer.addTo(map);
        console.log('Tile layer added with pattern:', mapInfos.tilePattern);
        console.log('Map bounds:', map.getBounds());
        console.log('Map center:', map.getCenter());
        console.log('Map zoom:', map.getZoom());

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