import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useSpoof } from '../../context/SpoofContext';

export interface MapViewRef {
  centerOnLocation: () => void;
}

export const MapView = React.forwardRef<MapViewRef>((_, ref) => {
  const {
    pin,
    setPin,
    simulated,
    realCoordinate,
    mapStyleIndex,
    routeCoords,
    drawnPath,
    drawMode,
    drawMethod,
    appendDrawnPoint,
    cartoApiKey,
  } = useSpoof();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const tileLabelsLayerRef = useRef<L.TileLayer | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);
  const spoofMarkerRef = useRef<L.Marker | null>(null);
  const realMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const drawnPolylineRef = useRef<L.Polyline | null>(null);
  const drawnMarkersGroupRef = useRef<L.LayerGroup | null>(null);

  // References to keep event listeners fresh without recreation
  const drawModeRef = useRef(drawMode);
  drawModeRef.current = drawMode;
  const drawMethodRef = useRef(drawMethod);
  drawMethodRef.current = drawMethod;
  const appendDrawnPointRef = useRef(appendDrawnPoint);
  appendDrawnPointRef.current = appendDrawnPoint;
  const setPinRef = useRef(setPin);
  setPinRef.current = setPin;

  const isMouseDownRef = useRef(false);
  const lastDrawnPointRef = useRef<{ latitude: number; longitude: number } | null>(null);

  // Initialize Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapInstanceRef.current) return;

    // Safety: ensure container does not have an orphan leaflet instance id
    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    let handleResize: (() => void) | null = null;

    try {
      const initialCenter: [number, number] = [37.3349, -122.0090];
      const map = L.map(container, {
        center: initialCenter,
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // Ensure map tiles and center adapt cleanly after mount
      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 400);

      handleResize = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      };
      window.addEventListener('resize', handleResize);

      // Handle map click
      map.on('click', (e: L.LeafletMouseEvent) => {
        const coord = {
          latitude: Number(e.latlng.lat.toFixed(6)),
          longitude: Number(e.latlng.lng.toFixed(6)),
        };

        if (drawModeRef.current) {
          if (drawMethodRef.current === 'tap') {
            appendDrawnPointRef.current(coord);
          }
        } else {
          setPinRef.current(coord);
        }
      });

      // Freehand drawing listeners
      map.on('mousedown', (e: L.LeafletMouseEvent) => {
        if (!drawModeRef.current || drawMethodRef.current !== 'freehand') return;
        isMouseDownRef.current = true;
        const coord = {
          latitude: Number(e.latlng.lat.toFixed(6)),
          longitude: Number(e.latlng.lng.toFixed(6)),
        };
        appendDrawnPointRef.current(coord);
        lastDrawnPointRef.current = coord;
      });

      map.on('mousemove', (e: L.LeafletMouseEvent) => {
        if (!drawModeRef.current || drawMethodRef.current !== 'freehand' || !isMouseDownRef.current) return;
        const currentLat = e.latlng.lat;
        const currentLng = e.latlng.lng;
        const last = lastDrawnPointRef.current;

        if (last) {
          // Check roughly if moved at least ~10 meters (approx 0.0001 deg)
          const dLat = Math.abs(currentLat - last.latitude);
          const dLng = Math.abs(currentLng - last.longitude);
          if (dLat < 0.00008 && dLng < 0.00008) return;
        }

        const coord = {
          latitude: Number(currentLat.toFixed(6)),
          longitude: Number(currentLng.toFixed(6)),
        };
        appendDrawnPointRef.current(coord);
        lastDrawnPointRef.current = coord;
      });

      const handlePointerUp = () => {
        isMouseDownRef.current = false;
      };
      map.on('mouseup', handlePointerUp);
      window.addEventListener('mouseup', handlePointerUp);

    } catch (err) {
      console.warn('Leaflet map initialization guarded:', err);
    }

    return () => {
      if (handleResize) {
        window.removeEventListener('resize', handleResize);
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore cleanup errors
        }
        mapInstanceRef.current = null;
      }
      if (container) {
        delete (container as any)._leaflet_id;
      }
    };
  }, []);

  // Update dragging permission and cursor based on drawMode and drawMethod
  useEffect(() => {
    const map = mapInstanceRef.current;
    const container = mapContainerRef.current;
    if (!map) return;

    if (drawMode) {
      if (container) {
        container.style.cursor = 'crosshair';
      }
      if (drawMethod === 'freehand') {
        map.dragging.disable();
      } else {
        map.dragging.enable();
      }
    } else {
      if (container) {
        container.style.cursor = '';
      }
      map.dragging.enable();
    }
  }, [drawMode, drawMethod]);

  // Update Tile Layers when mapStyleIndex or cartoApiKey changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    if (tileLabelsLayerRef.current) {
      map.removeLayer(tileLabelsLayerRef.current);
      tileLabelsLayerRef.current = null;
    }

    let tileUrl = '';
    let maxZoom = 19;
    let maxNativeZoom: number | undefined = undefined;
    let subdomains = 'abc';

    // 0: Apple Maps Dark (Cupertino Dark)
    // 1: Apple Maps Light (iOS Standard)
    // 2: Apple Maps Satellite / Hybrid
    // 3: OpenStreetMap Standard
    if (mapStyleIndex === 0) {
      if (cartoApiKey) {
        tileUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?api_key=${encodeURIComponent(cartoApiKey)}&key=${encodeURIComponent(cartoApiKey)}`;
        subdomains = 'abcd';
        maxZoom = 19;
      } else {
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
        maxNativeZoom = 16;
        maxZoom = 19;
        subdomains = 'abc';

        try {
          const labelsLayer = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
            {
              maxZoom: 19,
              maxNativeZoom: 16,
              subdomains: 'abc',
              opacity: 0.85,
            }
          ).addTo(map);
          tileLabelsLayerRef.current = labelsLayer;
        } catch (e) {
          console.warn('Labels layer note:', e);
        }
      }
    } else if (mapStyleIndex === 1) {
      // Apple Maps Light (iOS Standard style with clear streets and soft pastels)
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      maxNativeZoom = 16;
      maxZoom = 19;
      subdomains = 'abc';

      try {
        const labelsLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
          {
            maxZoom: 19,
            maxNativeZoom: 16,
            subdomains: 'abc',
            opacity: 0.9,
          }
        ).addTo(map);
        tileLabelsLayerRef.current = labelsLayer;
      } catch (e) {
        console.warn('Light labels layer note:', e);
      }
    } else if (mapStyleIndex === 2) {
      // Apple Maps Satellite / Hybrid
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 18;
      subdomains = 'abc';

      try {
        const hybridRef = L.tileLayer(
          'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          { maxZoom: 18, subdomains: 'abc', opacity: 0.9 }
        ).addTo(map);
        tileLabelsLayerRef.current = hybridRef;
      } catch (e) {
        console.warn('Satellite hybrid layer note:', e);
      }
    } else if (mapStyleIndex === 3) {
      // OpenStreetMap Standard
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      maxZoom = 19;
      subdomains = 'abc';
    }

    const newLayer = L.tileLayer(tileUrl, {
      maxZoom,
      maxNativeZoom,
      subdomains,
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [mapStyleIndex, cartoApiKey]);

  // Update Target Pin Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!pin) {
      if (pinMarkerRef.current) {
        map.removeLayer(pinMarkerRef.current);
        pinMarkerRef.current = null;
      }
      return;
    }

    const pinIcon = L.divIcon({
      className: 'custom-pin-marker',
      html: `
        <div style="width: 34px; height: 42px; cursor: grab; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6));">
          <svg viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; display: block;">
            <path d="M17 0C7.61116 0 0 7.61116 0 17C0 27.5 17 42 17 42C17 42 34 27.5 34 17C34 7.61116 26.3888 0 17 0Z" fill="#59C7B8"/>
            <circle cx="17" cy="16" r="6" fill="#0b0f14"/>
          </svg>
        </div>
      `,
      iconSize: [34, 42],
      iconAnchor: [17, 42],
    });

    if (pinMarkerRef.current) {
      pinMarkerRef.current.setLatLng([pin.latitude, pin.longitude]);
    } else {
      const marker = L.marker([pin.latitude, pin.longitude], {
        icon: pinIcon,
        draggable: true,
        zIndexOffset: 1000,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setPin({
          latitude: Number(pos.lat.toFixed(6)),
          longitude: Number(pos.lng.toFixed(6)),
        });
      });

      pinMarkerRef.current = marker;
    }
  }, [pin, setPin]);

  // Update Spoof Location Marker (Active simulated GPS)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!simulated) {
      if (spoofMarkerRef.current) {
        map.removeLayer(spoofMarkerRef.current);
        spoofMarkerRef.current = null;
      }
      return;
    }

    const spoofIcon = L.divIcon({
      className: 'spoof-simulated-marker',
      html: `
        <div class="spoof-marker-pulse">
          <div class="spoof-marker-core"></div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (spoofMarkerRef.current) {
      spoofMarkerRef.current.setLatLng([simulated.latitude, simulated.longitude]);
    } else {
      const marker = L.marker([simulated.latitude, simulated.longitude], {
        icon: spoofIcon,
        zIndexOffset: 1500,
      }).addTo(map);
      spoofMarkerRef.current = marker;
    }
  }, [simulated]);

  // Update Real Location Marker (hardware GPS dot)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!realCoordinate) {
      if (realMarkerRef.current) {
        map.removeLayer(realMarkerRef.current);
        realMarkerRef.current = null;
      }
      return;
    }

    const realIcon = L.divIcon({
      className: 'real-gps-marker',
      html: `
        <div style="position: relative; width: 20px; height: 20px; display: flex; items-center; justify-content: center;">
          <div style="width: 20px; height: 20px; border-radius: 50%; background: rgba(0, 122, 255, 0.25); position: absolute;"></div>
          <div style="width: 12px; height: 12px; border-radius: 50%; background: #007AFF; border: 2px solid #ffffff; box-shadow: 0 0 6px rgba(0,122,255,0.7); position: absolute; top: 4px; left: 4px;"></div>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    if (realMarkerRef.current) {
      realMarkerRef.current.setLatLng([realCoordinate.latitude, realCoordinate.longitude]);
    } else {
      const marker = L.marker([realCoordinate.latitude, realCoordinate.longitude], {
        icon: realIcon,
        zIndexOffset: 500,
      }).addTo(map);
      realMarkerRef.current = marker;
    }
  }, [realCoordinate]);

  // Update Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (routeCoords.length > 1) {
      const latlngs = routeCoords.map((c) => [c.latitude, c.longitude] as [number, number]);
      const poly = L.polyline(latlngs, {
        color: '#59C7B8',
        weight: 5,
        opacity: 0.9,
      }).addTo(map);
      routePolylineRef.current = poly;
    }
  }, [routeCoords]);

  // Update Drawn Path Polyline & Waypoint Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (drawnPolylineRef.current) {
      map.removeLayer(drawnPolylineRef.current);
      drawnPolylineRef.current = null;
    }

    if (!drawnMarkersGroupRef.current) {
      drawnMarkersGroupRef.current = L.layerGroup().addTo(map);
    } else {
      drawnMarkersGroupRef.current.clearLayers();
    }

    if (drawnPath.length > 0) {
      // Connect points with dashed orange route line
      if (drawnPath.length > 1) {
        const latlngs = drawnPath.map((c) => [c.latitude, c.longitude] as [number, number]);
        const poly = L.polyline(latlngs, {
          color: '#F28C47',
          weight: 4,
          dashArray: '6, 6',
          opacity: 0.95,
        }).addTo(map);
        drawnPolylineRef.current = poly;
      }

      // Add Start Marker at Point 0
      const startPt = drawnPath[0];
      const startIcon = L.divIcon({
        className: 'drawn-start-marker',
        html: `
          <div style="width: 24px; height: 24px; border-radius: 50%; background: #4DDC8C; border: 2.5px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: #000; font-family: -apple-system, system-ui;">
            1
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker([startPt.latitude, startPt.longitude], { icon: startIcon }).addTo(drawnMarkersGroupRef.current);

      // Add End Marker if more than 1 point
      if (drawnPath.length > 1) {
        const endPt = drawnPath[drawnPath.length - 1];
        const endIcon = L.divIcon({
          className: 'drawn-end-marker',
          html: `
            <div style="width: 24px; height: 24px; border-radius: 50%; background: #F28C47; border: 2.5px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: #000; font-family: -apple-system, system-ui;">
              ${drawnPath.length}
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        L.marker([endPt.latitude, endPt.longitude], { icon: endIcon }).addTo(drawnMarkersGroupRef.current);

        // Add intermediate waypoint dots if under 30 points
        if (drawnPath.length <= 30) {
          for (let i = 1; i < drawnPath.length - 1; i++) {
            const pt = drawnPath[i];
            const dotIcon = L.divIcon({
              className: 'drawn-dot-marker',
              html: `
                <div style="width: 8px; height: 8px; border-radius: 50%; background: #F28C47; border: 1.5px solid #ffffff; box-shadow: 0 0 6px rgba(242,140,71,0.8);"></div>
              `,
              iconSize: [8, 8],
              iconAnchor: [4, 4],
            });
            L.marker([pt.latitude, pt.longitude], { icon: dotIcon }).addTo(drawnMarkersGroupRef.current);
          }
        }
      }
    }
  }, [drawnPath]);

  // Center on Location imperatively
  React.useImperativeHandle(ref, () => ({
    centerOnLocation: () => {
      const map = mapInstanceRef.current;
      if (!map) return;
      map.invalidateSize();

      if (realCoordinate) {
        map.flyTo([realCoordinate.latitude, realCoordinate.longitude], 16, { duration: 0.8 });
        return;
      }

      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coord = {
              latitude: Number(pos.coords.latitude.toFixed(6)),
              longitude: Number(pos.coords.longitude.toFixed(6)),
            };
            map.flyTo([coord.latitude, coord.longitude], 16, { duration: 0.8 });
          },
          () => {
            const target = simulated || pin || { latitude: 37.3349, longitude: -122.0090 };
            map.flyTo([target.latitude, target.longitude], 16, { duration: 0.8 });
          },
          { enableHighAccuracy: false, timeout: 5000 }
        );
      } else {
        const target = simulated || pin || { latitude: 37.3349, longitude: -122.0090 };
        map.flyTo([target.latitude, target.longitude], 16, { duration: 0.8 });
      }
    },
  }));

  return (
    <div className="absolute inset-0 z-0 overflow-hidden isolate pointer-events-auto">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
});

MapView.displayName = 'MapView';
