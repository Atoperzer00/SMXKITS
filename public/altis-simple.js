/**
 * Simplified Altis Map Configuration for Testing
 * Uses standard Leaflet coordinate system for debugging
 */

// Initialize Arma3Map if not already defined
if (typeof Arma3Map === 'undefined') {
    var Arma3Map = { Maps: {} };
}

// Simplified Altis map configuration for testing
Arma3Map.Maps.altisSimple = {
    minZoom: 0,
    maxZoom: 6,
    CRS: L.CRS.Simple, // Use simple coordinate system for testing
    tilePattern: './altis/{z}/{x}/{y}.png',
    attribution: 'Altis Map - Arma 3 (Test Mode)',
    tileSize: 256,
    center: [128, 128], // Simplified center coordinates
    defaultZoom: 2,
    cities: [
        // Simplified city coordinates
        { name: "Kavala", x: 200, y: 150 },
        { name: "Pyrgos", x: 120, y: 130 },
        { name: "Sofia", x: 190, y: 160 }
    ]
};

// Also create a version with bounds
Arma3Map.Maps.altisBounded = {
    minZoom: 0,
    maxZoom: 6,
    CRS: L.CRS.Simple,
    tilePattern: './altis/{z}/{x}/{y}.png',
    attribution: 'Altis Map - Arma 3 (Bounded)',
    tileSize: 256,
    center: [128, 128],
    defaultZoom: 2,
    bounds: [[0, 0], [256, 256]], // Define explicit bounds
    cities: []
};