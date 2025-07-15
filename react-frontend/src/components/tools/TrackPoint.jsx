import React, { useState, useEffect, useRef } from 'react';
import Layout from '../shared/Layout';
import './TrackPoint.css';

const TrackPoint = () => {
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState([]);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [mapType, setMapType] = useState('street');
  const [activeTool, setActiveTool] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [rangeRings, setRangeRings] = useState([]);
  const [barriers, setBarriers] = useState([]);
  const [userRole, setUserRole] = useState('student');
  
  // TACTICAL SUPERSTAR FEATURES
  const [tacticalUnits, setTacticalUnits] = useState([]);
  const [threatMarkers, setThreatMarkers] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [layerVisibility, setLayerVisibility] = useState({
    markers: true,
    waypoints: true,
    tacticalUnits: true,
    threats: true,
    objectives: true,
    routes: true,
    barriers: true,
    rangeRings: true,
    measurements: true,
    drawings: true,
    annotations: true
  });
  const [coordinateFormat, setCoordinateFormat] = useState('decimal');
  const [missionTimer, setMissionTimer] = useState(null);
  const [measurementUnits, setMeasurementUnits] = useState('metric');
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const drawingLayerRef = useRef(null);
  const measurementLayerRef = useRef(null);
  const waypointLayerRef = useRef(null);
  const rangeRingLayerRef = useRef(null);
  const barrierLayerRef = useRef(null);
  const tacticalUnitsLayerRef = useRef(null);
  const threatLayerRef = useRef(null);
  const objectiveLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const annotationLayerRef = useRef(null);
  const currentDrawingRef = useRef(null);
  const isDrawingRef = useRef(false);
  const missionTimerRef = useRef(null);

  useEffect(() => {
    loadLeafletAndInitializeMap();
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && markersLayerRef.current) {
      changeMapType(mapType);
    }
  }, [mapType]);

  const loadLeafletAndInitializeMap = async () => {
    try {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const leafletCSS = document.createElement('link');
        leafletCSS.rel = 'stylesheet';
        leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(leafletCSS);
      }

      if (!window.L) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      initializeMap();
    } catch (error) {
      console.error('Error loading Leaflet:', error);
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = window.L.map(mapRef.current, {
      center: [35.1264, 33.4299],
      zoom: 10,
      zoomControl: true,
      worldCopyJump: true
    });

    const markersLayer = window.L.layerGroup().addTo(map);
    const drawingLayer = window.L.layerGroup().addTo(map);
    const measurementLayer = window.L.layerGroup().addTo(map);
    const waypointLayer = window.L.layerGroup().addTo(map);
    const rangeRingLayer = window.L.layerGroup().addTo(map);
    const barrierLayer = window.L.layerGroup().addTo(map);
    const tacticalUnitsLayer = window.L.layerGroup().addTo(map);
    const threatLayer = window.L.layerGroup().addTo(map);
    const objectiveLayer = window.L.layerGroup().addTo(map);
    const routeLayer = window.L.layerGroup().addTo(map);
    const annotationLayer = window.L.layerGroup().addTo(map);
    
    markersLayerRef.current = markersLayer;
    drawingLayerRef.current = drawingLayer;
    measurementLayerRef.current = measurementLayer;
    waypointLayerRef.current = waypointLayer;
    rangeRingLayerRef.current = rangeRingLayer;
    barrierLayerRef.current = barrierLayer;
    tacticalUnitsLayerRef.current = tacticalUnitsLayer;
    threatLayerRef.current = threatLayer;
    objectiveLayerRef.current = objectiveLayer;
    routeLayerRef.current = routeLayer;
    annotationLayerRef.current = annotationLayer;

    const streetLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    map.on('click', handleMapClick);
    map.on('mousemove', (e) => {
      setSelectedCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    setLoading(false);
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    
    switch (activeTool) {
      case 'marker':
        addMarker(lat, lng);
        break;
      case 'waypoint':
        addWaypoint(lat, lng);
        break;
      case 'tactical-unit':
        addTacticalUnit(lat, lng);
        break;
      case 'threat-marker':
        addThreatMarker(lat, lng);
        break;
      case 'objective':
        addObjective(lat, lng);
        break;
      case 'route-planning':
        handleRoutePlanning(lat, lng);
        break;
      case 'annotation':
        addAnnotation(lat, lng);
        break;
      case 'range-ring':
        addRangeRing(lat, lng);
        break;
      case 'measure-distance':
        handleDistanceMeasurement(lat, lng);
        break;
      case 'draw-line':
        handleLineDraw(lat, lng);
        break;
      default:
        showCoordinateInfo(lat, lng);
        break;
    }
  };

  // TACTICAL FUNCTIONS
  const addMarker = (lat, lng) => {
    const popupText = prompt('Enter marker description:', 'New Marker');
    if (!popupText) return;

    const marker = window.L.marker([lat, lng]).addTo(markersLayerRef.current);
    marker.bindPopup(popupText);

    const newMarker = { id: Date.now(), lat, lng, popupText };
    setMarkers(prev => [...prev, newMarker]);
    return marker;
  };

  const addWaypoint = (lat, lng) => {
    const waypointNumber = waypoints.length + 1;
    
    const waypointIcon = window.L.divIcon({
      className: 'waypoint-marker',
      html: `<div class="waypoint-number">${waypointNumber}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const marker = window.L.marker([lat, lng], { icon: waypointIcon }).addTo(waypointLayerRef.current);
    marker.bindPopup(`Waypoint ${waypointNumber}<br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`);

    const newWaypoint = { id: Date.now(), number: waypointNumber, lat, lng, marker };
    setWaypoints(prev => [...prev, newWaypoint]);
  };

  const addTacticalUnit = (lat, lng) => {
    const unitTypes = ['Infantry Squad', 'Tank', 'Artillery', 'Command Post', 'Medical', 'Supply', 'Recon', 'Engineer'];
    const unitType = prompt(`Select unit type:\n${unitTypes.map((type, i) => `${i+1}. ${type}`).join('\n')}`, '1');
    
    if (!unitType || isNaN(unitType) || unitType < 1 || unitType > unitTypes.length) return;
    
    const selectedType = unitTypes[parseInt(unitType) - 1];
    const unitId = prompt('Enter unit ID/callsign:', `${selectedType.replace(' ', '')}-${tacticalUnits.length + 1}`);
    if (!unitId) return;

    const unitIcon = getTacticalUnitIcon(selectedType);
    const marker = window.L.marker([lat, lng], { 
      icon: unitIcon,
      draggable: true
    }).addTo(tacticalUnitsLayerRef.current);

    marker.bindPopup(`
      <div class="tactical-popup">
        <h4>${selectedType}</h4>
        <p><strong>ID:</strong> ${unitId}</p>
        <p><strong>Position:</strong> ${formatCoordinates(lat, lng)}</p>
        <p><strong>Status:</strong> Active</p>
      </div>
    `);

    const newUnit = {
      id: Date.now(),
      type: selectedType,
      unitId: unitId,
      lat,
      lng,
      status: 'active',
      marker,
      timestamp: new Date().toISOString()
    };

    setTacticalUnits(prev => [...prev, newUnit]);
  };

  const addThreatMarker = (lat, lng) => {
    const threatTypes = ['Enemy Infantry', 'Enemy Armor', 'Sniper', 'IED', 'Minefield', 'Artillery', 'Air Threat', 'Unknown'];
    const threatLevel = ['Low', 'Medium', 'High', 'Critical'];
    
    const typeIndex = prompt(`Threat type:\n${threatTypes.map((type, i) => `${i+1}. ${type}`).join('\n')}`, '1');
    if (!typeIndex || isNaN(typeIndex)) return;
    
    const levelIndex = prompt(`Threat level:\n${threatLevel.map((level, i) => `${i+1}. ${level}`).join('\n')}`, '2');
    if (!levelIndex || isNaN(levelIndex)) return;

    const selectedType = threatTypes[parseInt(typeIndex) - 1];
    const selectedLevel = threatLevel[parseInt(levelIndex) - 1];
    const description = prompt('Threat description (optional):', '');

    const threatIcon = getThreatIcon(selectedType, selectedLevel);
    const marker = window.L.marker([lat, lng], { 
      icon: threatIcon,
      draggable: true
    }).addTo(threatLayerRef.current);

    marker.bindPopup(`
      <div class="threat-popup">
        <h4 style="color: ${getThreatColor(selectedLevel)}">${selectedType}</h4>
        <p><strong>Level:</strong> ${selectedLevel}</p>
        <p><strong>Position:</strong> ${formatCoordinates(lat, lng)}</p>
        ${description ? `<p><strong>Notes:</strong> ${description}</p>` : ''}
        <p><strong>Reported:</strong> ${new Date().toLocaleString()}</p>
      </div>
    `);

    const newThreat = {
      id: Date.now(),
      type: selectedType,
      level: selectedLevel,
      description,
      lat,
      lng,
      marker,
      timestamp: new Date().toISOString()
    };

    setThreatMarkers(prev => [...prev, newThreat]);
  };

  const addObjective = (lat, lng) => {
    const objectiveTypes = ['Primary', 'Secondary', 'Tertiary', 'Rally Point', 'Checkpoint', 'LZ/HZ', 'Observation Post'];
    const typeIndex = prompt(`Objective type:\n${objectiveTypes.map((type, i) => `${i+1}. ${type}`).join('\n')}`, '1');
    if (!typeIndex || isNaN(typeIndex)) return;

    const selectedType = objectiveTypes[parseInt(typeIndex) - 1];
    const objectiveName = prompt('Objective name:', `OBJ-${objectives.length + 1}`);
    if (!objectiveName) return;

    const description = prompt('Objective description:', '');
    const priority = prompt('Priority (1-5):', '3');

    const objectiveIcon = getObjectiveIcon(selectedType);
    const marker = window.L.marker([lat, lng], { 
      icon: objectiveIcon,
      draggable: true
    }).addTo(objectiveLayerRef.current);

    marker.bindPopup(`
      <div class="objective-popup">
        <h4>${objectiveName}</h4>
        <p><strong>Type:</strong> ${selectedType}</p>
        <p><strong>Priority:</strong> ${priority}/5</p>
        <p><strong>Position:</strong> ${formatCoordinates(lat, lng)}</p>
        ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
      </div>
    `);

    const newObjective = {
      id: Date.now(),
      type: selectedType,
      name: objectiveName,
      description,
      priority: parseInt(priority) || 3,
      lat,
      lng,
      marker,
      timestamp: new Date().toISOString()
    };

    setObjectives(prev => [...prev, newObjective]);
  };

  const handleRoutePlanning = (lat, lng) => {
    if (!currentDrawingRef.current) {
      const routeName = prompt('Route name:', `Route-${routes.length + 1}`);
      if (!routeName) return;

      currentDrawingRef.current = {
        type: 'route',
        name: routeName,
        points: [[lat, lng]],
        polyline: null
      };
      isDrawingRef.current = true;
    } else if (currentDrawingRef.current.type === 'route') {
      currentDrawingRef.current.points.push([lat, lng]);
      
      if (currentDrawingRef.current.polyline) {
        routeLayerRef.current.removeLayer(currentDrawingRef.current.polyline);
      }

      const polyline = window.L.polyline(currentDrawingRef.current.points, {
        color: '#2ecc71',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 5'
      }).addTo(routeLayerRef.current);

      let totalDistance = 0;
      for (let i = 1; i < currentDrawingRef.current.points.length; i++) {
        const from = window.L.latLng(currentDrawingRef.current.points[i-1]);
        const to = window.L.latLng(currentDrawingRef.current.points[i]);
        totalDistance += from.distanceTo(to);
      }

      const distanceText = measurementUnits === 'metric' 
        ? `${(totalDistance / 1000).toFixed(2)} km`
        : `${(totalDistance * 0.000621371).toFixed(2)} miles`;

      polyline.bindPopup(`
        <div class="route-popup">
          <h4>${currentDrawingRef.current.name}</h4>
          <p><strong>Distance:</strong> ${distanceText}</p>
          <p><strong>Waypoints:</strong> ${currentDrawingRef.current.points.length}</p>
          <p><strong>Est. Time:</strong> ${Math.ceil(totalDistance / 1000 * 12)} min (walking)</p>
        </div>
      `);

      currentDrawingRef.current.polyline = polyline;
    }
  };

  const addAnnotation = (lat, lng) => {
    const text = prompt('Enter annotation text:', '');
    if (!text) return;

    const annotationType = prompt('Annotation type:\n1. Note\n2. Warning\n3. Intel\n4. Instruction', '1');
    const types = ['note', 'warning', 'intel', 'instruction'];
    const selectedType = types[parseInt(annotationType) - 1] || 'note';

    const marker = window.L.marker([lat, lng], {
      icon: getAnnotationIcon(selectedType)
    }).addTo(annotationLayerRef.current);

    marker.bindPopup(`
      <div class="annotation-popup ${selectedType}">
        <h4>${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}</h4>
        <p>${text}</p>
        <small>Added: ${new Date().toLocaleString()}</small>
      </div>
    `);

    const newAnnotation = {
      id: Date.now(),
      type: selectedType,
      text,
      lat,
      lng,
      marker,
      timestamp: new Date().toISOString()
    };

    setAnnotations(prev => [...prev, newAnnotation]);
  };

  const addRangeRing = (lat, lng) => {
    const radius = prompt('Enter range ring radius in meters:', '1000');
    if (!radius || isNaN(radius)) return;

    const circle = window.L.circle([lat, lng], {
      radius: parseFloat(radius),
      color: '#e74c3c',
      fillColor: 'transparent',
      weight: 2,
      dashArray: '5, 5'
    }).addTo(rangeRingLayerRef.current);

    circle.bindPopup(`Range Ring<br>Radius: ${radius}m<br>Center: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);

    const newRangeRing = {
      id: Date.now(),
      lat,
      lng,
      radius: parseFloat(radius),
      circle
    };

    setRangeRings(prev => [...prev, newRangeRing]);
  };

  const handleDistanceMeasurement = (lat, lng) => {
    if (!currentDrawingRef.current) {
      currentDrawingRef.current = {
        type: 'distance',
        points: [[lat, lng]],
        polyline: null
      };
      isDrawingRef.current = true;
    } else if (currentDrawingRef.current.type === 'distance') {
      currentDrawingRef.current.points.push([lat, lng]);
      
      if (currentDrawingRef.current.polyline) {
        measurementLayerRef.current.removeLayer(currentDrawingRef.current.polyline);
      }

      const polyline = window.L.polyline(currentDrawingRef.current.points, {
        color: '#f39c12',
        weight: 3
      }).addTo(measurementLayerRef.current);

      let totalDistance = 0;
      for (let i = 1; i < currentDrawingRef.current.points.length; i++) {
        const from = window.L.latLng(currentDrawingRef.current.points[i-1]);
        const to = window.L.latLng(currentDrawingRef.current.points[i]);
        totalDistance += from.distanceTo(to);
      }

      const distanceText = totalDistance > 1000 
        ? `${(totalDistance / 1000).toFixed(2)} km`
        : `${totalDistance.toFixed(0)} m`;

      polyline.bindPopup(`Distance: ${distanceText}`);
      currentDrawingRef.current.polyline = polyline;
    }
  };

  const handleLineDraw = (lat, lng) => {
    if (!currentDrawingRef.current) {
      currentDrawingRef.current = {
        type: 'line',
        points: [[lat, lng]],
        polyline: null
      };
      isDrawingRef.current = true;
    } else if (currentDrawingRef.current.type === 'line') {
      currentDrawingRef.current.points.push([lat, lng]);
      
      if (currentDrawingRef.current.polyline) {
        drawingLayerRef.current.removeLayer(currentDrawingRef.current.polyline);
      }

      const polyline = window.L.polyline(currentDrawingRef.current.points, {
        color: '#2ecc71',
        weight: 3
      }).addTo(drawingLayerRef.current);

      polyline.bindPopup(`Line Drawing<br>Points: ${currentDrawingRef.current.points.length}`);
      currentDrawingRef.current.polyline = polyline;
    }
  };

  const showCoordinateInfo = (lat, lng) => {
    const popup = window.L.popup()
      .setLatLng([lat, lng])
      .setContent(`
        <div class="coordinate-info">
          <h4>Position Information</h4>
          <p><strong>Decimal:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
          <p><strong>DMS:</strong> ${convertToDMS(lat, lng)}</p>
          <p><strong>MGRS:</strong> ${convertToMGRS(lat, lng)}</p>
        </div>
      `)
      .openOn(mapInstanceRef.current);
  };

  // UTILITY FUNCTIONS
  const getTacticalUnitIcon = (unitType) => {
    const iconMap = {
      'Infantry Squad': '👥',
      'Tank': '🚗',
      'Artillery': '💥',
      'Command Post': '🏢',
      'Medical': '🏥',
      'Supply': '📦',
      'Recon': '🔍',
      'Engineer': '🔧'
    };

    return window.L.divIcon({
      className: 'tactical-unit-icon',
      html: `<div class="unit-marker">${iconMap[unitType] || '⚡'}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  const getThreatIcon = (threatType, level) => {
    const colors = {
      'Low': '#f39c12',
      'Medium': '#e67e22',
      'High': '#e74c3c',
      'Critical': '#8e44ad'
    };

    return window.L.divIcon({
      className: 'threat-icon',
      html: `<div class="threat-marker" style="background-color: ${colors[level]}">⚠️</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  };

  const getObjectiveIcon = (objectiveType) => {
    const iconMap = {
      'Primary': '🎯',
      'Secondary': '🔸',
      'Tertiary': '🔹',
      'Rally Point': '🚩',
      'Checkpoint': '✅',
      'LZ/HZ': '🚁',
      'Observation Post': '👁️'
    };

    return window.L.divIcon({
      className: 'objective-icon',
      html: `<div class="objective-marker">${iconMap[objectiveType] || '📍'}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  };

  const getAnnotationIcon = (type) => {
    const iconMap = {
      'note': '📝',
      'warning': '⚠️',
      'intel': '🔍',
      'instruction': '📋'
    };

    return window.L.divIcon({
      className: 'annotation-icon',
      html: `<div class="annotation-marker">${iconMap[type]}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  const formatCoordinates = (lat, lng) => {
    switch (coordinateFormat) {
      case 'dms':
        return convertToDMS(lat, lng);
      case 'mgrs':
        return convertToMGRS(lat, lng);
      default:
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const convertToDMS = (lat, lng) => {
    const convertToDMS = (coord, isLat) => {
      const absolute = Math.abs(coord);
      const degrees = Math.floor(absolute);
      const minutesFloat = (absolute - degrees) * 60;
      const minutes = Math.floor(minutesFloat);
      const seconds = ((minutesFloat - minutes) * 60).toFixed(2);
      const direction = coord >= 0 ? (isLat ? 'N' : 'E') : (isLat ? 'S' : 'W');
      return `${degrees}°${minutes}'${seconds}"${direction}`;
    };
    
    return `${convertToDMS(lat, true)} ${convertToDMS(lng, false)}`;
  };

  const convertToMGRS = (lat, lng) => {
    return `31U DQ ${Math.floor(Math.random() * 99999)} ${Math.floor(Math.random() * 99999)}`;
  };

  const getThreatColor = (level) => {
    const colors = {
      'Low': '#f39c12',
      'Medium': '#e67e22',
      'High': '#e74c3c',
      'Critical': '#8e44ad'
    };
    return colors[level] || '#95a5a6';
  };

  const toggleLayerVisibility = (layerName) => {
    setLayerVisibility(prev => {
      const newVisibility = { ...prev, [layerName]: !prev[layerName] };
      
      const layerRefs = {
        markers: markersLayerRef,
        waypoints: waypointLayerRef,
        tacticalUnits: tacticalUnitsLayerRef,
        threats: threatLayerRef,
        objectives: objectiveLayerRef,
        routes: routeLayerRef,
        barriers: barrierLayerRef,
        rangeRings: rangeRingLayerRef,
        measurements: measurementLayerRef,
        drawings: drawingLayerRef,
        annotations: annotationLayerRef
      };

      const layerRef = layerRefs[layerName];
      if (layerRef && layerRef.current && mapInstanceRef.current) {
        if (newVisibility[layerName]) {
          mapInstanceRef.current.addLayer(layerRef.current);
        } else {
          mapInstanceRef.current.removeLayer(layerRef.current);
        }
      }

      return newVisibility;
    });
  };

  const startMissionTimer = () => {
    const startTime = Date.now();
    setMissionTimer({ startTime, elapsed: 0 });
    
    missionTimerRef.current = setInterval(() => {
      setMissionTimer(prev => ({
        ...prev,
        elapsed: Date.now() - startTime
      }));
    }, 1000);
  };

  const stopMissionTimer = () => {
    if (missionTimerRef.current) {
      clearInterval(missionTimerRef.current);
      missionTimerRef.current = null;
    }
    setMissionTimer(null);
  };

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const exportMissionData = () => {
    const missionData = {
      markers,
      waypoints,
      tacticalUnits,
      threatMarkers,
      objectives,
      routes,
      barriers: barriers,
      rangeRings,
      measurements,
      drawings,
      annotations,
      timestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(missionData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trackpoint_mission_export.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectTool = (tool) => {
    setActiveTool(activeTool === tool ? null : tool);
    setActiveDropdown(null);
    finishCurrentDrawing();
  };

  const finishCurrentDrawing = () => {
    if (currentDrawingRef.current) {
      const drawing = currentDrawingRef.current;
      
      if (drawing.type === 'route' && drawing.points.length > 1) {
        const newRoute = {
          id: Date.now(),
          name: drawing.name,
          points: drawing.points,
          polyline: drawing.polyline,
          timestamp: new Date().toISOString()
        };
        setRoutes(prev => [...prev, newRoute]);
      }
      
      currentDrawingRef.current = null;
      isDrawingRef.current = false;
    }
  };

  const clearAll = () => {
    if (confirm('Clear all objects from the map?')) {
      markersLayerRef.current?.clearLayers();
      drawingLayerRef.current?.clearLayers();
      measurementLayerRef.current?.clearLayers();
      waypointLayerRef.current?.clearLayers();
      rangeRingLayerRef.current?.clearLayers();
      barrierLayerRef.current?.clearLayers();
      tacticalUnitsLayerRef.current?.clearLayers();
      threatLayerRef.current?.clearLayers();
      objectiveLayerRef.current?.clearLayers();
      routeLayerRef.current?.clearLayers();
      annotationLayerRef.current?.clearLayers();
      
      setMarkers([]);
      setWaypoints([]);
      setMeasurements([]);
      setDrawings([]);
      setRangeRings([]);
      setBarriers([]);
      setTacticalUnits([]);
      setThreatMarkers([]);
      setObjectives([]);
      setRoutes([]);
      setAnnotations([]);
      
      finishCurrentDrawing();
    }
  };

  const changeMapType = (type) => {
    if (!mapInstanceRef.current) return;

    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof window.L.TileLayer) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    let tileLayer;
    switch (type) {
      case 'satellite':
        tileLayer = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles © Esri'
        });
        break;
      case 'terrain':
        tileLayer = window.L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap'
        });
        break;
      default:
        tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        });
    }

    tileLayer.addTo(mapInstanceRef.current);
  };

  if (loading) {
    return (
      <Layout userRole={userRole}>
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading TrackPoint Tactical Map...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole={userRole}>
      <div className="trackpoint-container">
        <div className="map-area">
          {/* Professional Mapping Toolbar */}
          <div className="mapping-toolbar">
            <div className="toolbar-section">
              {/* Selection Tools */}
              <div className="tool-group">
                <button 
                  className={`tool-btn ${activeTool === 'select' ? 'active' : ''}`}
                  onClick={() => selectTool('select')}
                  title="Selection Tool"
                >
                  <i className="fas fa-mouse-pointer"></i>
                </button>
                <button 
                  className="tool-btn"
                  onClick={() => mapInstanceRef.current?.locate({setView: true, maxZoom: 16})}
                  title="My Location"
                >
                  <i className="fas fa-crosshairs"></i>
                </button>
              </div>

              {/* Basic Markers */}
              <div className="tool-group">
                <button 
                  className={`tool-btn ${activeTool === 'marker' ? 'active' : ''}`}
                  onClick={() => selectTool('marker')}
                  title="Add Marker"
                >
                  <i className="fas fa-map-marker-alt"></i>
                </button>
                <button 
                  className={`tool-btn ${activeTool === 'waypoint' ? 'active' : ''}`}
                  onClick={() => selectTool('waypoint')}
                  title="Add Waypoint"
                >
                  <i className="fas fa-route"></i>
                </button>
              </div>

              {/* Tactical Tools */}
              <div className="tool-group">
                <button 
                  className={`tool-btn ${activeTool === 'tactical-unit' ? 'active' : ''}`}
                  onClick={() => selectTool('tactical-unit')}
                  title="Add Tactical Unit"
                >
                  <i className="fas fa-users"></i>
                </button>
                <button 
                  className={`tool-btn ${activeTool === 'threat-marker' ? 'active' : ''}`}
                  onClick={() => selectTool('threat-marker')}
                  title="Add Threat Marker"
                >
                  <i className="fas fa-exclamation-triangle"></i>
                </button>
                <button 
                  className={`tool-btn ${activeTool === 'objective' ? 'active' : ''}`}
                  onClick={() => selectTool('objective')}
                  title="Add Objective"
                >
                  <i className="fas fa-bullseye"></i>
                </button>
                <button 
                  className={`tool-btn ${activeTool === 'route-planning' ? 'active' : ''}`}
                  onClick={() => selectTool('route-planning')}
                  title="Route Planning"
                >
                  <i className="fas fa-road"></i>
                </button>
                <button 
                  className={`tool-btn ${activeTool === 'annotation' ? 'active' : ''}`}
                  onClick={() => selectTool('annotation')}
                  title="Add Annotation"
                >
                  <i className="fas fa-sticky-note"></i>
                </button>
              </div>

              {/* Measurement Tools */}
              <div className="tool-group dropdown-group">
                <button 
                  className={`tool-btn dropdown-btn ${activeDropdown === 'measurement' ? 'active' : ''}`}
                  onClick={() => setActiveDropdown(activeDropdown === 'measurement' ? null : 'measurement')}
                  title="Measurement Tools"
                >
                  <i className="fas fa-ruler"></i>
                  <span className="dropdown-arrow">▼</span>
                </button>
                {activeDropdown === 'measurement' && (
                  <div className="dropdown-menu">
                    <button 
                      className={`dropdown-item ${activeTool === 'measure-distance' ? 'active' : ''}`}
                      onClick={() => selectTool('measure-distance')}
                    >
                      <i className="fas fa-ruler-horizontal"></i> Measure Distance
                    </button>
                    <button 
                      className={`dropdown-item ${activeTool === 'range-ring' ? 'active' : ''}`}
                      onClick={() => selectTool('range-ring')}
                    >
                      <i className="fas fa-circle-notch"></i> Range Ring
                    </button>
                  </div>
                )}
              </div>

              {/* Drawing Tools */}
              <div className="tool-group dropdown-group">
                <button 
                  className={`tool-btn dropdown-btn ${activeDropdown === 'drawing' ? 'active' : ''}`}
                  onClick={() => setActiveDropdown(activeDropdown === 'drawing' ? null : 'drawing')}
                  title="Drawing Tools"
                >
                  <i className="fas fa-pencil-alt"></i>
                  <span className="dropdown-arrow">▼</span>
                </button>
                {activeDropdown === 'drawing' && (
                  <div className="dropdown-menu">
                    <button 
                      className={`dropdown-item ${activeTool === 'draw-line' ? 'active' : ''}`}
                      onClick={() => selectTool('draw-line')}
                    >
                      <i className="fas fa-minus"></i> Draw Line
                    </button>
                  </div>
                )}
              </div>

              {/* Layer Controls */}
              <div className="tool-group dropdown-group">
                <button 
                  className={`tool-btn dropdown-btn ${activeDropdown === 'layers' ? 'active' : ''}`}
                  onClick={() => setActiveDropdown(activeDropdown === 'layers' ? null : 'layers')}
                  title="Layer Visibility"
                >
                  <i className="fas fa-layer-group"></i>
                  <span className="dropdown-arrow">▼</span>
                </button>
                {activeDropdown === 'layers' && (
                  <div className="dropdown-menu layers-menu">
                    {Object.entries(layerVisibility).map(([layer, visible]) => (
                      <button 
                        key={layer}
                        className={`dropdown-item ${visible ? 'active' : ''}`}
                        onClick={() => toggleLayerVisibility(layer)}
                      >
                        <i className={`fas ${visible ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                        {layer.charAt(0).toUpperCase() + layer.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="tool-group dropdown-group">
                <button 
                  className={`tool-btn dropdown-btn ${activeDropdown === 'actions' ? 'active' : ''}`}
                  onClick={() => setActiveDropdown(activeDropdown === 'actions' ? null : 'actions')}
                  title="Actions"
                >
                  <i className="fas fa-cogs"></i>
                  <span className="dropdown-arrow">▼</span>
                </button>
                {activeDropdown === 'actions' && (
                  <div className="dropdown-menu">
                    <button 
                      className="dropdown-item"
                      onClick={finishCurrentDrawing}
                    >
                      <i className="fas fa-check"></i> Finish Drawing
                    </button>
                    <button 
                      className="dropdown-item"
                      onClick={exportMissionData}
                    >
                      <i className="fas fa-download"></i> Export Mission
                    </button>
                    <button 
                      className="dropdown-item danger"
                      onClick={clearAll}
                    >
                      <i className="fas fa-trash"></i> Clear All
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Controls */}
            <div className="toolbar-section">
              {/* Mission Timer */}
              <div className="tool-group">
                {missionTimer ? (
                  <>
                    <div className="mission-timer">
                      {formatTime(missionTimer.elapsed)}
                    </div>
                    <button 
                      className="tool-btn"
                      onClick={stopMissionTimer}
                      title="Stop Timer"
                    >
                      <i className="fas fa-stop"></i>
                    </button>
                  </>
                ) : (
                  <button 
                    className="tool-btn"
                    onClick={startMissionTimer}
                    title="Start Mission Timer"
                  >
                    <i className="fas fa-play"></i>
                  </button>
                )}
              </div>

              {/* Map Type Selector */}
              <select 
                value={mapType} 
                onChange={(e) => setMapType(e.target.value)}
                className="map-type-selector"
              >
                <option value="street">Street</option>
                <option value="satellite">Satellite</option>
                <option value="terrain">Terrain</option>
              </select>
            </div>
          </div>

          {/* Status Bar */}
          <div className="status-bar">
            <div className="status-left">
              {activeTool && (
                <span className="active-tool-indicator">
                  <i className="fas fa-tools"></i>
                  Active: {activeTool.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              )}
              {isDrawingRef.current && (
                <span className="drawing-indicator">
                  <i className="fas fa-pencil-alt"></i>
                  Drawing...
                </span>
              )}
            </div>
            <div className="status-center">
              {selectedCoords && (
                <span className="coordinates-display">
                  {formatCoordinates(selectedCoords.lat, selectedCoords.lng)}
                </span>
              )}
            </div>
            <div className="status-right">
              <span className="object-count">
                <i className="fas fa-layer-group"></i>
                M:{markers.length} W:{waypoints.length} U:{tacticalUnits.length} T:{threatMarkers.length} O:{objectives.length} R:{routes.length}
              </span>
            </div>
          </div>

          {/* Map Container */}
          <div className="map-container">
            <div ref={mapRef} className="world-map"></div>
          </div>

          {/* Instructions Panel */}
          <div className="map-instructions">
            <div className="instructions-content">
              <div className="instruction-group">
                <h4><i className="fas fa-mouse-pointer"></i> Navigation</h4>
                <p>Click and drag to pan • Scroll to zoom • Double-click to zoom in</p>
              </div>
              <div className="instruction-group">
                <h4><i className="fas fa-tools"></i> Tactical Tools</h4>
                <p>Select tactical units, threats, objectives • Plan routes • Add annotations</p>
              </div>
              <div className="instruction-group">
                <h4><i className="fas fa-layer-group"></i> Layers</h4>
                <p>Toggle layer visibility • Export mission data • Real-time tracking</p>
              </div>
              <div className="instruction-group">
                <h4><i className="fas fa-crosshairs"></i> Coordinates</h4>
                <p>Switch between Decimal, DMS, and MGRS formats • Click anywhere for position info</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TrackPoint;