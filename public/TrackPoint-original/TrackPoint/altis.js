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
    maxZoom: 6,
    CRS: MGRS_CRS(1/256, 1/256, 30720), // Arma 3 coordinate system
    tilePattern: 'altis/{z}/{x}/{y}.png',
    attribution: 'Altis Map - Arma 3',
    tileSize: 256,
    center: [15360, 15360], // Center of Altis map
    defaultZoom: 2,
    cities: [
        // Major cities on Altis
        { name: "Kavala", x: 26800, y: 21300 },
        { name: "Pyrgos", x: 15200, y: 17000 },
        { name: "Sofia", x: 25900, y: 21900 },
        { name: "Athira", x: 13400, y: 19600 },
        { name: "Paros", x: 23300, y: 16600 },
        { name: "Zaros", x: 8600, y: 15900 },
        { name: "Poliakko", x: 12200, y: 14200 },
        { name: "Galati", x: 20800, y: 13600 }
    ]
};