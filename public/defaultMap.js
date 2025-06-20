
function InitMap(mapInfos) {
    console.log('🚀 InitMap called with:', mapInfos);
    
    $(function () {
        console.log('📋 jQuery ready, creating map...');
        console.log('🎯 Map container exists:', document.getElementById('map') !== null);

        var map = L.map('map', {
            minZoom: mapInfos.minZoom,
            maxZoom: mapInfos.maxZoom,
            crs: mapInfos.CRS
        });
        
        console.log('✅ Map object created:', map);

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

        // Add graticule if available
        if (typeof L.latlngGraticule === 'function') {
            L.latlngGraticule().addTo(map);
            console.log('✅ Graticule added');
        } else {
            console.log('⚠️ Graticule not available');
        }

        // Add scale control
        L.control.scale({ maxWidth: 200, imperial: false }).addTo(map);
        console.log('✅ Scale control added');

        // Add grid mouse position if available
        if (typeof L.control.gridMousePosition === 'function') {
            L.control.gridMousePosition().addTo(map);
            console.log('✅ Grid mouse position added');
        } else {
            console.log('⚠️ Grid mouse position not available');
        }
		
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