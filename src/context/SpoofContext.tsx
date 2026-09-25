import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Coordinate, SavedPlace, SpoofStatus, TravelMode, TravelModeInfo, GPXTrack } from '../types';
import { offsetCoordinate, getDistance, SpeedInput, sampleCoordinates } from '../utils/geo';

export const TRAVEL_MODES: Record<TravelMode, TravelModeInfo> = {
  walk: { id: 'walk', title: 'Walk', icon: 'Footprints', baseSpeed: 1.4 },
  run: { id: 'run', title: 'Run', icon: 'Zap', baseSpeed: 3.3 },
  cycle: { id: 'cycle', title: 'Cycle', icon: 'Bike', baseSpeed: 6.5 },
  drive: { id: 'drive', title: 'Drive', icon: 'Car', baseSpeed: 13.4 },
};

interface SpoofContextType {
  status: SpoofStatus;
  pin: Coordinate | null;
  simulated: Coordinate | null;
  realCoordinate: Coordinate | null;
  travelMode: TravelMode;
  customSpeedMPS: number | null;
  currentSpeedMPS: number;
  mapStyleIndex: number;
  lastError: string | null;
  isBusy: boolean;
  joystickActive: boolean;
  favorites: SavedPlace[];
  recents: SavedPlace[];
  hasPairingFile: boolean;
  pairingData: string | null;
  tunnelIP: string;
  vpnConnected: boolean;
  setupComplete: boolean;
  
  // Routing & drawing state
  isRouting: boolean;
  routeStart: Coordinate | null;
  routeEnd: Coordinate | null;
  routeCoords: Coordinate[];
  drawnPath: Coordinate[];
  drawMode: boolean;
  importedTrack: GPXTrack | null;
  isPlayingRoute: boolean;
  isPlaybackPaused: boolean;
  routeProgressIndex: number;
  playbackSpeedMultiplier: number;
  setPlaybackSpeedMultiplier: (multiplier: number) => void;

  // Actions
  setPin: (coord: Coordinate | null) => void;
  setRouteStart: (coord: Coordinate | null) => void;
  setRouteEnd: (coord: Coordinate | null) => void;
  setRouteCoords: (coords: Coordinate[]) => void;
  setDrawnPath: (coords: Coordinate[]) => void;
  appendDrawnPoint: (coord: Coordinate) => void;
  undoLastDrawnPoint: () => void;
  clearDrawnPath: () => void;
  convertDrawnToRoute: () => void;
  drawMethod: 'tap' | 'freehand';
  setDrawMethod: (method: 'tap' | 'freehand') => void;
  setDrawMode: (active: boolean | ((prev: boolean) => boolean)) => void;
  setImportedTrack: (track: GPXTrack | null) => void;
  teleport: (coord: Coordinate) => void;
  stopSpoofing: () => void;
  startJoystick: () => void;
  stopJoystick: () => void;
  updateJoystickVector: (vector: { dx: number; dy: number }) => void;
  setTravelMode: (mode: TravelMode) => void;
  setCustomSpeed: (text: string) => boolean;
  clearCustomSpeed: () => void;
  cycleMapStyle: () => void;
  clearLastError: () => void;
  setLastError: (err: string | null) => void;
  addFavorite: (name: string, coord: Coordinate) => void;
  renameFavorite: (id: string, newName: string) => void;
  removeFavorite: (id: string) => void;
  removeRecent: (id: string) => void;
  importPairing: (data: string) => void;
  removePairing: () => void;
  setTunnelIP: (ip: string) => void;
  setVpnConnected: (connected: boolean) => void;
  setSetupComplete: (complete: boolean) => void;
  playRoute: (startIdx?: number) => void;
  pauseRoutePlayback: () => void;
  resumeRoutePlayback: () => void;
  stopRoutePlayback: () => void;
  cartoApiKey: string;
  setCartoApiKey: (key: string) => void;
}

const SpoofContext = createContext<SpoofContextType | null>(null);

export const SpoofProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default coordinates: Apple Park Cupertino (37.3349, -122.0090)
  const defaultCoord: Coordinate = { latitude: 37.3349, longitude: -122.0090 };

  const [status, setStatus] = useState<SpoofStatus>('idle');
  const [pin, setPin] = useState<Coordinate | null>(defaultCoord);
  const [simulated, setSimulated] = useState<Coordinate | null>(null);
  const [realCoordinate, setRealCoordinate] = useState<Coordinate | null>(defaultCoord);
  const [travelMode, setTravelModeState] = useState<TravelMode>('walk');
  const [customSpeedMPS, setCustomSpeedMPS] = useState<number | null>(() => {
    const enabled = localStorage.getItem('locus.customSpeedEnabled') === 'true';
    const val = parseFloat(localStorage.getItem('locus.customSpeedMPS') || '');
    return enabled && !isNaN(val) && val > 0 ? val : null;
  });
  const [mapStyleIndex, setMapStyleIndex] = useState<number>(() => {
    return parseInt(localStorage.getItem('locus.mapStyle') || '0', 10) % 4;
  });
  const [lastError, setLastError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [joystickActive, setJoystickActive] = useState(false);

  // Persistent storage state
  const [favorites, setFavorites] = useState<SavedPlace[]>(() => {
    try {
      const data = localStorage.getItem('locus.favorites');
      return data ? JSON.parse(data) : [
        { id: '37.3349,-122.0090', name: 'Apple Park Cupertino', latitude: 37.3349, longitude: -122.0090 },
        { id: '37.7749,-122.4194', name: 'San Francisco Downtown', latitude: 37.7749, longitude: -122.4194 },
        { id: '40.7580,-73.9855', name: 'Times Square New York', latitude: 40.7580, longitude: -73.9855 },
        { id: '48.8584,2.2945', name: 'Eiffel Tower Paris', latitude: 48.8584, longitude: 2.2945 },
        { id: '35.6586,139.7454', name: 'Tokyo Tower', latitude: 35.6586, longitude: 139.7454 },
      ];
    } catch {
      return [];
    }
  });

  const [recents, setRecents] = useState<SavedPlace[]>(() => {
    try {
      const data = localStorage.getItem('locus.recents');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  const [hasPairingFile, setHasPairingFile] = useState<boolean>(() => {
    return localStorage.getItem('locus.hasPairing') === 'true';
  });
  const [pairingData, setPairingData] = useState<string | null>(() => {
    return localStorage.getItem('locus.pairingData');
  });
  const [tunnelIP, setTunnelIPState] = useState<string>(() => {
    return localStorage.getItem('locus.tunnelIP') || '10.7.0.1';
  });
  const [vpnConnected, setVpnConnectedState] = useState<boolean>(() => {
    return localStorage.getItem('locus.vpnConnected') !== 'false';
  });
  const [setupComplete, setSetupCompleteState] = useState<boolean>(() => {
    return localStorage.getItem('locus.setupComplete') === 'true';
  });
  const [cartoApiKey, setCartoApiKeyState] = useState<string>(() => {
    return localStorage.getItem('locus.cartoApiKey') || import.meta.env.VITE_CARTO_API_KEY || '';
  });

  const setCartoApiKey = (key: string) => {
    const trimmed = key.trim();
    setCartoApiKeyState(trimmed);
    if (trimmed) {
      localStorage.setItem('locus.cartoApiKey', trimmed);
    } else {
      localStorage.removeItem('locus.cartoApiKey');
    }
  };

  // Routing & draw path state
  const [isRouting, setIsRouting] = useState(false);
  const [routeStart, setRouteStart] = useState<Coordinate | null>(null);
  const [routeEnd, setRouteEnd] = useState<Coordinate | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);
  const [drawnPath, setDrawnPath] = useState<Coordinate[]>([]);
  const [drawMode, setDrawMode] = useState<boolean>(false);
  const [drawMethod, setDrawMethod] = useState<'tap' | 'freehand'>('tap');
  const [importedTrack, setImportedTrack] = useState<GPXTrack | null>(null);
  const [isPlayingRoute, setIsPlayingRoute] = useState(false);
  const [isPlaybackPaused, setIsPlaybackPaused] = useState(false);
  const [routeProgressIndex, setRouteProgressIndex] = useState(0);
  const [playbackSpeedMultiplier, setPlaybackSpeedMultiplier] = useState(1);

  // Joystick reference vector
  const joystickVectorRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const routePlaybackTimerRef = useRef<number | null>(null);
  const playbackIndexRef = useRef<number>(0);
  const playbackMultiplierRef = useRef<number>(1);
  playbackMultiplierRef.current = playbackSpeedMultiplier;

  // Current effective speed in meters per second
  const currentSpeedMPS = customSpeedMPS ?? TRAVEL_MODES[travelMode].baseSpeed;

  // Real GPS lookup on mount (safeguarded for Chromebooks / devices without GPS)
  useEffect(() => {
    try {
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const userCoord = {
              latitude: Number(pos.coords.latitude.toFixed(6)),
              longitude: Number(pos.coords.longitude.toFixed(6)),
            };
            setRealCoordinate(userCoord);
          },
          (err) => {
            // Devices without GPS hardware (like Chromebooks) will trigger this
            // We log quietly and continue without breaking the app
            console.log('Real GPS hardware unavailable or permission denied:', err.message);
          },
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
        );
      }
    } catch (e) {
      console.warn('Geolocation query safely skipped:', e);
    }
  }, []);

  // Save favorites & recents
  useEffect(() => {
    localStorage.setItem('locus.favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('locus.recents', JSON.stringify(recents));
  }, [recents]);

  const setSetupComplete = (complete: boolean) => {
    setSetupCompleteState(complete);
    localStorage.setItem('locus.setupComplete', String(complete));
  };

  const setTunnelIP = (ip: string) => {
    setTunnelIPState(ip);
    localStorage.setItem('locus.tunnelIP', ip);
  };

  const setVpnConnected = (connected: boolean) => {
    setVpnConnectedState(connected);
    localStorage.setItem('locus.vpnConnected', String(connected));
  };

  const importPairing = (data: string) => {
    setPairingData(data);
    setHasPairingFile(true);
    localStorage.setItem('locus.pairingData', data);
    localStorage.setItem('locus.hasPairing', 'true');
  };

  const removePairing = () => {
    setPairingData(null);
    setHasPairingFile(false);
    localStorage.removeItem('locus.pairingData');
    localStorage.removeItem('locus.hasPairing');
  };

  const cycleMapStyle = () => {
    setMapStyleIndex((prev) => {
      const next = (prev + 1) % 4;
      localStorage.setItem('locus.mapStyle', String(next));
      return next;
    });
  };

  const setTravelMode = (mode: TravelMode) => {
    setTravelModeState(mode);
  };

  const setCustomSpeed = (text: string): boolean => {
    const val = SpeedInput.parse(text);
    if (val === null) return false;
    setCustomSpeedMPS(val);
    localStorage.setItem('locus.customSpeedMPS', String(val));
    localStorage.setItem('locus.customSpeedEnabled', 'true');
    return true;
  };

  const clearCustomSpeed = () => {
    setCustomSpeedMPS(null);
    localStorage.removeItem('locus.customSpeedEnabled');
  };

  const clearLastError = () => setLastError(null);

  const pushRecent = useCallback((coord: Coordinate, name?: string) => {
    const placeName = name || `${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}`;
    const newPlace: SavedPlace = {
      id: `${coord.latitude.toFixed(6)},${coord.longitude.toFixed(6)}`,
      name: placeName,
      latitude: coord.latitude,
      longitude: coord.longitude,
    };
    setRecents((prev) => {
      const filtered = prev.filter(
        (p) =>
          Math.abs(p.latitude - coord.latitude) >= 0.00015 ||
          Math.abs(p.longitude - coord.longitude) >= 0.00015
      );
      return [newPlace, ...filtered].slice(0, 20);
    });
  }, []);

  const addFavorite = (name: string, coord: Coordinate) => {
    const trimmed = name.trim() || `${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}`;
    const newPlace: SavedPlace = {
      id: `${coord.latitude.toFixed(6)},${coord.longitude.toFixed(6)}`,
      name: trimmed,
      latitude: coord.latitude,
      longitude: coord.longitude,
    };
    setFavorites((prev) => {
      const filtered = prev.filter((p) => p.id !== newPlace.id);
      return [newPlace, ...filtered];
    });
  };

  const renameFavorite = (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setFavorites((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: trimmed } : p))
    );
  };

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((p) => p.id !== id));
  };

  const removeRecent = (id: string) => {
    setRecents((prev) => prev.filter((p) => p.id !== id));
  };

  const appendDrawnPoint = (coord: Coordinate) => {
    setDrawnPath((prev) => [...prev, coord]);
  };

  const undoLastDrawnPoint = () => {
    setDrawnPath((prev) => prev.slice(0, -1));
  };

  const clearDrawnPath = () => {
    setDrawnPath([]);
  };

  const convertDrawnToRoute = () => {
    if (drawnPath.length < 2) {
      setLastError('Draw at least 2 points to start simulating movement.');
      return;
    }
    setRouteCoords([...drawnPath]);
    setDrawMode(false);
    playRoute(0);
  };

  // Teleport action
  const teleport = (coord: Coordinate) => {
    if (!hasPairingFile) {
      setLastError('Import an RPPairing file in Settings first.');
      return;
    }
    if (!vpnConnected) {
      setLastError('LocalDevVPN is not connected. Turn on the tunnel in Settings.');
      return;
    }

    setIsBusy(true);
    setStatus('connecting');

    setTimeout(() => {
      setSimulated(coord);
      setPin(coord);
      setStatus('active');
      setIsBusy(false);
      setLastError(null);
      pushRecent(coord);
    }, 200);
  };

  // Stop spoofing
  const stopSpoofing = () => {
    stopRoutePlayback();
    stopJoystick();
    setIsBusy(true);
    setTimeout(() => {
      setSimulated(null);
      setStatus('idle');
      setIsBusy(false);
    }, 150);
  };

  // Joystick controls
  const startJoystick = () => {
    if (!hasPairingFile) {
      setLastError('Import an RPPairing file in Settings first.');
      return;
    }
    if (!vpnConnected) {
      setLastError('LocalDevVPN is not connected. Turn on the tunnel in Settings.');
      return;
    }

    const start = simulated || pin || realCoordinate || defaultCoord;
    if (!simulated) {
      setSimulated(start);
      setStatus('active');
    }
    setJoystickActive(true);
  };

  const stopJoystick = () => {
    setJoystickActive(false);
    joystickVectorRef.current = { dx: 0, dy: 0 };
  };

  const updateJoystickVector = (vector: { dx: number; dy: number }) => {
    joystickVectorRef.current = vector;
  };

  // Joystick tick loop (interval = 250ms = 0.25s)
  useEffect(() => {
    if (!joystickActive) return;

    const interval = setInterval(() => {
      const { dx, dy } = joystickVectorRef.current;
      const magnitude = Math.hypot(dx, dy);

      if (magnitude > 0.08) {
        setSimulated((curr) => {
          if (!curr) return curr;
          const nx = dx / magnitude;
          const ny = -dy / magnitude; // canvas Y is inverted from North
          // Slight natural variation 0.9..1.1
          const speed = currentSpeedMPS * Math.min(1.0, magnitude) * (0.9 + Math.random() * 0.2);
          const dt = 0.25;
          const meters = speed * dt;
          return offsetCoordinate(curr, nx * meters, ny * meters);
        });
      }
    }, 250);

    return () => clearInterval(interval);
  }, [joystickActive, currentSpeedMPS]);

  // Route playback
  const playRoute = (startIdx = 0) => {
    const path = routeCoords.length > 0 ? routeCoords : drawnPath;
    if (path.length < 2) {
      setLastError('Build or draw a route first.');
      return;
    }
    // Auto-enable pairing if needed so simulation works seamlessly
    if (!hasPairingFile) {
      importPairing('LOCUS-DEV-TUNNEL-AUTO');
    }

    stopJoystick();
    if (routePlaybackTimerRef.current) {
      clearTimeout(routePlaybackTimerRef.current);
      routePlaybackTimerRef.current = null;
    }

    setIsPlayingRoute(true);
    setIsPlaybackPaused(false);
    
    const validStart = Math.min(Math.max(0, startIdx), path.length - 1);
    playbackIndexRef.current = validStart;
    setRouteProgressIndex(validStart);

    // Initial position
    setSimulated(path[validStart]);
    setStatus('active');
    if (validStart === 0) {
      pushRecent(path[0], 'Route Start');
    }

    const stepInterval = () => {
      const idx = playbackIndexRef.current;
      if (idx >= path.length - 1) {
        setIsPlayingRoute(false);
        setIsPlaybackPaused(false);
        return;
      }

      const nextIdx = idx + 1;
      playbackIndexRef.current = nextIdx;
      setRouteProgressIndex(nextIdx);
      const nextCoord = path[nextIdx];
      setSimulated(nextCoord);

      // Calculate step time adjusted by playback multiplier
      const dist = getDistance(path[idx], nextCoord);
      const baseSpeed = currentSpeedMPS * playbackMultiplierRef.current;
      const stepSpeed = Math.max(0.8, baseSpeed * (0.95 + Math.random() * 0.1));
      const stepMs = Math.max(60, (dist / stepSpeed) * 1000);

      routePlaybackTimerRef.current = window.setTimeout(stepInterval, stepMs);
    };

    routePlaybackTimerRef.current = window.setTimeout(stepInterval, 250);
  };

  const pauseRoutePlayback = () => {
    if (routePlaybackTimerRef.current) {
      clearTimeout(routePlaybackTimerRef.current);
      routePlaybackTimerRef.current = null;
    }
    setIsPlaybackPaused(true);
  };

  const resumeRoutePlayback = () => {
    if (!isPlayingRoute) return;
    setIsPlaybackPaused(false);
    playRoute(playbackIndexRef.current);
  };

  const stopRoutePlayback = () => {
    if (routePlaybackTimerRef.current) {
      clearTimeout(routePlaybackTimerRef.current);
      routePlaybackTimerRef.current = null;
    }
    setIsPlayingRoute(false);
    setIsPlaybackPaused(false);
    playbackIndexRef.current = 0;
    setRouteProgressIndex(0);
  };

  return (
    <SpoofContext.Provider
      value={{
        status,
        pin,
        simulated,
        realCoordinate,
        travelMode,
        customSpeedMPS,
        currentSpeedMPS,
        mapStyleIndex,
        lastError,
        isBusy,
        joystickActive,
        favorites,
        recents,
        hasPairingFile,
        pairingData,
        tunnelIP,
        vpnConnected,
        setupComplete,
        isRouting,
        routeStart,
        routeEnd,
        routeCoords,
        drawnPath,
        drawMode,
        importedTrack,
        isPlayingRoute,
        isPlaybackPaused,
        routeProgressIndex,
        playbackSpeedMultiplier,
        setPlaybackSpeedMultiplier,
        setPin,
        setRouteStart,
        setRouteEnd,
        setRouteCoords,
        setDrawnPath,
        appendDrawnPoint,
        undoLastDrawnPoint,
        clearDrawnPath,
        convertDrawnToRoute,
        drawMethod,
        setDrawMethod,
        setDrawMode,
        setImportedTrack,
        teleport,
        stopSpoofing,
        startJoystick,
        stopJoystick,
        updateJoystickVector,
        setTravelMode,
        setCustomSpeed,
        clearCustomSpeed,
        cycleMapStyle,
        clearLastError,
        setLastError,
        addFavorite,
        renameFavorite,
        removeFavorite,
        removeRecent,
        importPairing,
        removePairing,
        setTunnelIP,
        setVpnConnected,
        setSetupComplete,
        playRoute,
        pauseRoutePlayback,
        resumeRoutePlayback,
        stopRoutePlayback,
        cartoApiKey,
        setCartoApiKey,
      }}
    >
      {children}
    </SpoofContext.Provider>
  );
};

export const useSpoof = () => {
  const ctx = useContext(SpoofContext);
  if (!ctx) {
    throw new Error('useSpoof must be used within a SpoofProvider');
  }
  return ctx;
};
