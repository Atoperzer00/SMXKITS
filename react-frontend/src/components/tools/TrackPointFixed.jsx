import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './TrackPointFixed.css';

const TrackPointFixed = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const mapBorderRef = useRef(null);
  const cityMarkersRef = useRef([]);

  const [citiesVisible, setCitiesVisible] = useState(false);
  const [borderVisible, setBorderVisible] = useState(true);
  const [debugVisible, setDebugVisible] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);
  const [isMapReady, setIsMapReady] = useState(false);

  // Altis configuration
  const AltisConfig = {
    minZoom: 0,
    maxZoom: 6,
    tilePattern: 'altis/{z}/{x}/{y}.png',
    attribution: 'Altis Map - Arma 3',
    tileSize: 256,
    center: [15360, 15360],
    defaultZoom: 2,
    cities: [
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

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || !role) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  // Debug logging function
  const debugLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { message, type, timestamp };
    
    setDebugLogs(prev => {
      const newLogs = [...prev, logEntry];
      // Keep only last 50 logs
      return newLogs.length > 50 ? newLogs.slice(-50) : newLogs;
    });
    
    // Also log to console with emoji
    const emoji = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    console.log(`${emoji[type]} [${timestamp}] ${message}`);
  };

  // Test tile accessibility
  const testTileAccess = () => {
    debugLog('Testing tile accessibility...', 'info');
    
    const testTiles = [
      'altis/0/0/0.png',
      'altis/1/0/0.png',
      'altis/2/0/0.png',
      'altis/6/16/9.png'
    ];
    
    let successCount = 0;
    let totalTests = testTiles.length;
    
    testTiles.forEach(tilePath => {
      const img = new Image();
      img.onload = function() {
        successCount++;
        debugLog(`Tile accessible: ${tilePath}`, 'success');
        
        if (successCount === totalTests) {
          debugLog('All test tiles accessible - proceeding with map initialization', 'success');
          initializeMap();
        }
      };
      
      img.onerror = function() {
        debugLog(`Tile NOT accessible: ${tilePath}`, 'error');
        totalTests--;
        
        if (successCount === totalTests) {
          if (successCount > 0) {
            debugLog(`${successCount} tiles accessible - proceeding with map initialization`, 'warning');
            initializeMap();
          } else {
            debugLog('No tiles accessible - check server configuration', 'error');
          }
        }
      };
      
      img.src = tilePath;
    });
  };

  // Initialize map
  const initializeMap = () => {
    if (!window.L || !mapRef.current) {
      debugLog('Leaflet not available or map container not ready', 'error');
      return;
    }

    debugLog('Initializing map with enhanced configuration...', 'info');
    
    try {
      // Create custom CRS
      const customCRS = window.L.extend({}, window.L.CRS.Simple, {
        transformation: new window.L.Transformation(1/256, 0, -1/256, 30720)
      });

      const map = window.L.map(mapRef.current, {
        minZoom: AltisConfig.minZoom,
        maxZoom: AltisConfig.maxZoom,
        crs: customCRS,
        zoomControl: true,
        attributionControl: true
      });

      debugLog('Map object created successfully', 'success');

      // Enhanced tile layer
      const AltisLayer = window.L.TileLayer.extend({
        getTileUrl: function (coords) {
          const url = AltisConfig.tilePattern
            .replace('{z}', coords.z)
            .replace('{x}', coords.x)
            .replace('{y}', coords.y);
          
          debugLog(`Requesting tile: ${url} (z=${coords.z}, x=${coords.x}, y=${coords.y})`, 'info');
          return url;
        }
      });

      const tileLayer = new AltisLayer('', {
        attribution: AltisConfig.attribution,
        tileSize: AltisConfig.tileSize,
        minZoom: AltisConfig.minZoom,
        maxZoom: AltisConfig.maxZoom,
        errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        bounds: [[-1000, -1000], [31000, 31000]]
      });

      // Enhanced tile event listeners
      let tilesLoaded = 0;
      let tilesErrored = 0;

      tileLayer.on('tileloadstart', function(e) {
        debugLog(`Tile loading: ${e.url}`, 'info');
      });

      tileLayer.on('tileload', function(e) {
        tilesLoaded++;
        debugLog(`Tile loaded: ${e.url} (${tilesLoaded} total)`, 'success');
      });

      tileLayer.on('tileerror', function(e) {
        tilesErrored++;
        debugLog(`Tile error: ${e.url} (${tilesErrored} errors)`, 'error');
        debugLog(`Error coords: z=${e.coords.z}, x=${e.coords.x}, y=${e.coords.y}`, 'error');
      });

      tileLayer.on('loading', function() {
        debugLog('Map tiles loading started...', 'info');
      });

      tileLayer.on('load', function() {
        debugLog(`All tiles loaded! Success: ${tilesLoaded}, Errors: ${tilesErrored}`, 'success');
      });

      tileLayer.addTo(map);
      map.setView(AltisConfig.center, AltisConfig.defaultZoom);

      // Add scale control
      window.L.control.scale({ maxWidth: 200, imperial: false }).addTo(map);

      // Store references
      mapInstanceRef.current = map;
      tileLayerRef.current = tileLayer;

      debugLog(`Map initialized at center: [${AltisConfig.center}], zoom: ${AltisConfig.defaultZoom}`, 'success');

      setIsMapReady(true);

      // Add border after map is ready
      setTimeout(() => {
        addMapBorder();
      }, 500);

    } catch (error) {
      debugLog(`Map initialization failed: ${error.message}`, 'error');
      console.error('Map initialization error:', error);
    }
  };

  // Add map border
  const addMapBorder = () => {
    if (!mapInstanceRef.current) {
      debugLog('Cannot add border - map not available', 'error');
      return;
    }

    try {
      const bounds = mapInstanceRef.current.getBounds();
      const mapBorder = window.L.rectangle(bounds, {
        color: '#ff0000',
        weight: 3,
        opacity: 0.8,
        fillOpacity: 0,
        dashArray: '10, 10'
      }).addTo(mapInstanceRef.current);

      mapBorderRef.current = mapBorder;
      debugLog('Map border added successfully', 'success');
    } catch (error) {
      debugLog(`Failed to add border: ${error.message}`, 'error');
    }
  };

  // Add cities
  const addCities = () => {
    if (!mapInstanceRef.current) {
      debugLog('Cannot add cities - map not available', 'error');
      return;
    }

    // Clear existing city markers
    cityMarkersRef.current.forEach(marker => mapInstanceRef.current.removeLayer(marker));
    cityMarkersRef.current = [];

    try {
      AltisConfig.cities.forEach(city => {
        const marker = window.L.marker([city.y, city.x]).addTo(mapInstanceRef.current);
        marker.bindPopup(`<b>${city.name}</b><br>Coords: [${city.x}, ${city.y}]`);
        cityMarkersRef.current.push(marker);
      });

      debugLog(`Added ${AltisConfig.cities.length} city markers`, 'success');
    } catch (error) {
      debugLog(`Failed to add cities: ${error.message}`, 'error');
    }
  };

  // Remove cities
  const removeCities = () => {
    if (!mapInstanceRef.current) return;
    
    cityMarkersRef.current.forEach(marker => mapInstanceRef.current.removeLayer(marker));
    cityMarkersRef.current = [];
    debugLog('Removed all city markers', 'info');
  };

  // Toggle cities
  const toggleCities = () => {
    if (citiesVisible) {
      removeCities();
      setCitiesVisible(false);
      debugLog('Cities hidden', 'info');
    } else {
      addCities();
      setCitiesVisible(true);
      debugLog('Cities shown', 'info');
    }
  };

  // Center map
  const centerMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(AltisConfig.center, AltisConfig.defaultZoom);
      debugLog(`Map centered at [${AltisConfig.center}], zoom: ${AltisConfig.defaultZoom}`, 'info');
    }
  };

  // Toggle border
  const toggleBorder = () => {
    if (!mapBorderRef.current || !mapInstanceRef.current) return;

    if (borderVisible) {
      mapInstanceRef.current.removeLayer(mapBorderRef.current);
      setBorderVisible(false);
      debugLog('Map border hidden', 'info');
    } else {
      mapBorderRef.current.addTo(mapInstanceRef.current);
      setBorderVisible(true);
      debugLog('Map border shown', 'info');
    }
  };

  // Toggle debug panel
  const toggleDebug = () => {
    setDebugVisible(!debugVisible);
  };

  // Go back
  const goBack = () => {
    if (window.confirm('Are you sure you want to leave TrackPoint?')) {
      navigate('/admin-dashboard');
    }
  };

  // Initialize when component mounts
  useEffect(() => {
    // Load Leaflet if not already loaded
    if (!window.L) {
      const leafletCSS = document.createElement('link');
      leafletCSS.rel = 'stylesheet';
      leafletCSS.href = 'https://unpkg.com/leaflet@1.6.0/dist/leaflet.css';
      document.head.appendChild(leafletCSS);

      const leafletJS = document.createElement('script');
      leafletJS.src = 'https://unpkg.com/leaflet@1.6.0/dist/leaflet.js';
      leafletJS.onload = () => {
        debugLog('DOM ready - starting TrackPoint initialization', 'info');
        debugLog(`Current URL: ${window.location.href}`, 'info');
        debugLog(`Leaflet version: ${window.L.version}`, 'info');
        
        // Start tile testing and map initialization
        testTileAccess();
      };
      document.head.appendChild(leafletJS);
    } else {
      debugLog('DOM ready - starting TrackPoint initialization', 'info');
      debugLog(`Leaflet version: ${window.L.version}`, 'info');
      
      // Start tile testing and map initialization
      testTileAccess();
    }

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  return (
    <div className="trackpoint-fixed-layout">
      {/* Header */}
      <div className="trackpoint-header">
        <h1>🗺️ TrackPoint - Altis Tactical Map (Fixed)</h1>
        <div className="header-controls">
          <button 
            className={`btn ${citiesVisible ? 'cities active' : 'cities'}`} 
            onClick={toggleCities}
          >
            Toggle Cities
          </button>
          <button className="btn" onClick={toggleBorder}>
            Toggle Border
          </button>
          <button className="btn" onClick={centerMap}>
            Center Map
          </button>
          <button 
            className={`btn debug ${debugVisible ? 'active' : ''}`} 
            onClick={toggleDebug}
          >
            Debug Panel
          </button>
          <button className="btn danger" onClick={goBack}>
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Debug Panel */}
      {debugVisible && (
        <div className="debug-panel visible">
          <h3>🔍 Debug Information</h3>
          <div className="debug-content">
            {debugLogs.slice().reverse().map((log, index) => (
              <div key={index} className={`debug-log ${log.type}`}>
                [{log.timestamp}] {log.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="map-container">
        <div ref={mapRef} id="map" className="map"></div>
        {!isMapReady && (
          <div className="map-loading">
            <div className="loading-spinner"></div>
            <p>Loading TrackPoint Map...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackPointFixed;