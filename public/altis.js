 /**
 * Altis Map Configuration for SMX Track Point
 * Based on Arma 3 Altis map tiles
 */

// Initialize Arma3Map if not already defined
if (typeof Arma3Map === 'undefined') {
    var Arma3Map = { Maps: {} };
}

// Altis map configuration
Arma3Map.Maps.altis = {
    minZoom: 0,
    maxZoom: 6, // Updated to match available tile structure
    CRS: L.extend({}, L.CRS.Simple, {
        transformation: new L.Transformation(1, 0, -1, 64)
    }), // Fixed coordinate system to match 64x64 tile grid
    tilePattern: 'altis/{z}/{x}/{y}.png',
    attribution: 'Altis Map - Arma 3',
    tileSize: 256,
    center: [32, 32], // Center of 64x64 tile grid
    defaultZoom: 2, // Start with a reasonable zoom level
    bounds: [[0, 0], [64, 64]], // Define map bounds to match tile structure
    cities: [
        // Major cities on Altis (coordinates adjusted for 64x64 tile grid)
        { name: "Kavala", x: 55, y: 44 },
        { name: "Pyrgos", x: 31, y: 35 },
        { name: "Sofia", x: 53, y: 45 },
        { name: "Athira", x: 28, y: 40 },
        { name: "Paros", x: 48, y: 34 },
        { name: "Zaros", x: 18, y: 33 },
        { name: "Poliakko", x: 25, y: 29 },
        { name: "Galati", x: 43, y: 28 }
    ]
};