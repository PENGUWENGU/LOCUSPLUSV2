import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Square,
  Upload,
  Download,
  Milestone,
  Pencil,
  Loader2,
  Check,
  FileCode,
  Copy,
  Clock,
  Compass,
  Gauge,
  Eye,
  FastForward,
  Timer,
  Hourglass,
} from 'lucide-react';
import { useSpoof } from '../../context/SpoofContext';
import { fetchRoadRoute, parseGPX, exportGPX, calculateTotalDistance } from '../../utils/geo';

interface RoutePlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoutePlannerModal: React.FC<RoutePlannerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    pin,
    simulated,
    travelMode,
    currentSpeedMPS,
    customSpeedMPS,
    routeStart,
    setRouteStart,
    routeEnd,
    setRouteEnd,
    routeCoords,
    setRouteCoords,
    drawnPath,
    setDrawnPath,
    setDrawMode,
    importedTrack,
    setImportedTrack,
    playRoute,
    pauseRoutePlayback,
    resumeRoutePlayback,
    stopRoutePlayback,
    isPlayingRoute,
    isPlaybackPaused,
    routeProgressIndex,
    playbackSpeedMultiplier,
    setPlaybackSpeedMultiplier,
    setLastError,
  } = useSpoof();

  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [customRouteName, setCustomRouteName] = useState('');
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [copiedXML, setCopiedXML] = useState(false);
  
  // Speed unit toggle state: 'kmh' or 'mph'
  const [speedUnit, setSpeedUnit] = useState<'kmh' | 'mph'>(() => {
    return (localStorage.getItem('locus.routeSpeedUnit') as 'kmh' | 'mph') || 'kmh';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live clock ticker to update ETA and durations dynamically every second
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Speed conversions
  const effectivePlaybackSpeed = currentSpeedMPS * playbackSpeedMultiplier;
  const speedKmH = useMemo(() => (effectivePlaybackSpeed * 3.6).toFixed(1), [effectivePlaybackSpeed]);
  const speedMph = useMemo(() => (effectivePlaybackSpeed * 2.23694).toFixed(1), [effectivePlaybackSpeed]);
  const baseSpeedKmH = useMemo(() => (currentSpeedMPS * 3.6).toFixed(1), [currentSpeedMPS]);
  const baseSpeedMph = useMemo(() => (currentSpeedMPS * 2.23694).toFixed(1), [currentSpeedMPS]);

  const handleUnitToggle = (unit: 'kmh' | 'mph') => {
    setSpeedUnit(unit);
    localStorage.setItem('locus.routeSpeedUnit', unit);
  };

  // Active route coordinates: generated road route takes precedence, then drawn path
  const activeCoordinates = useMemo(() => {
    return routeCoords.length > 0 ? routeCoords : drawnPath;
  }, [routeCoords, drawnPath]);

  // Format seconds into a friendly string (e.g. 1h 24m 10s or 14m 20s)
  const formatDuration = (seconds: number): string => {
    const totalSecs = Math.max(0, Math.round(seconds));
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Route statistics with calculated Travel Time & Estimated Time of Arrival (ETA)
  const routeStats = useMemo(() => {
    if (activeCoordinates.length <= 1) return null;
    const totalDistanceMeters = calculateTotalDistance(activeCoordinates);
    const distanceKm = totalDistanceMeters / 1000;
    const distanceMiles = totalDistanceMeters * 0.000621371;

    // Total trip travel time
    const totalTravelTimeSeconds = totalDistanceMeters / Math.max(0.1, effectivePlaybackSpeed);
    const totalTravelTimeStr = formatDuration(totalTravelTimeSeconds);

    // Remaining distance and travel time (adjusted during playback)
    const remainingCoords = isPlayingRoute
      ? activeCoordinates.slice(Math.min(routeProgressIndex, activeCoordinates.length - 1))
      : activeCoordinates;
    const remainingDistanceMeters = calculateTotalDistance(remainingCoords);
    const remainingDurationSeconds = remainingDistanceMeters / Math.max(0.1, effectivePlaybackSpeed);
    const remainingDurationStr = formatDuration(remainingDurationSeconds);

    // Estimated Time of Arrival (ETA)
    const etaDate = new Date(currentTime.getTime() + remainingDurationSeconds * 1000);
    const etaTimeStr = etaDate.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });

    // Check if ETA crosses past midnight
    const isTomorrow = etaDate.getDate() !== currentTime.getDate();
    const etaDisplay = isTomorrow ? `Tomorrow at ${etaTimeStr}` : etaTimeStr;

    return {
      points: activeCoordinates.length,
      km: distanceKm.toFixed(2),
      miles: distanceMiles.toFixed(2),
      totalTravelTimeStr,
      totalTravelTimeSeconds,
      remainingDurationStr,
      remainingDurationSeconds,
      etaDisplay,
      isTomorrow,
    };
  }, [activeCoordinates, effectivePlaybackSpeed, isPlayingRoute, routeProgressIndex, currentTime]);

  if (!isOpen) return null;

  const handleSetStart = () => {
    const start = simulated || pin;
    if (start) {
      setRouteStart(start);
    } else {
      setLastError('Drop a pin on the map first.');
    }
  };

  const handleSetEnd = () => {
    if (pin) {
      setRouteEnd(pin);
    } else {
      setLastError('Drop a pin on the map first.');
    }
  };

  const handleBuildRoadRoute = async () => {
    const start = routeStart || simulated || pin;
    const end = routeEnd;

    if (!start || !end) {
      setLastError('Set both route start and end coordinates.');
      return;
    }

    setIsLoadingRoute(true);
    try {
      const coords = await fetchRoadRoute(start, end, travelMode);
      setImportedTrack(null);
      setRouteCoords(coords);
      setExportSuccessMessage(null);
    } catch (e: any) {
      setLastError(e.message || 'Failed to build route');
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const handleUseDrawnPath = () => {
    if (drawnPath.length < 2) {
      setLastError('Draw at least 2 points on the map first using Draw mode.');
      return;
    }
    setImportedTrack(null);
    setRouteCoords(drawnPath);
    setDrawnPath([]);
    setDrawMode(false);
    setExportSuccessMessage(null);
  };

  const handleStartPlayback = () => {
    playRoute(0);
  };

  const handleImportGPXClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const track = parseGPX(content);
        setImportedTrack(track);

        const flattened = track.segments.flatMap((seg) =>
          seg.map((p) => p.coordinate)
        );
        setRouteCoords(flattened);
        if (track.name) setCustomRouteName(track.name);
        setExportSuccessMessage(`Imported ${flattened.length} points from ${file.name}`);
      } catch (err: any) {
        setLastError(err.message || 'Failed to parse GPX file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  /**
   * Main function to export current generated route coordinates as a standard .gpx file
   */
  const exportRouteAsGPX = (overrideName?: string) => {
    const coords = routeCoords.length > 0 ? routeCoords : drawnPath;
    if (coords.length === 0) {
      setLastError('No route or path coordinates to export. Build or draw a route first.');
      return;
    }

    const defaultName = `Locus Route ${new Date().toLocaleDateString()}`;
    const routeName = (overrideName || customRouteName.trim() || defaultName).trim();

    // Generate standard GPX 1.1 with timestamps and waypoints
    const xml = importedTrack
      ? exportGPX(importedTrack, {
          name: routeName,
          speedMPS: currentSpeedMPS,
          includeWaypoints: true,
        })
      : exportGPX(coords, {
          name: routeName,
          speedMPS: currentSpeedMPS,
          includeWaypoints: true,
          description: `Generated by Locus Web GPS. Mode: ${travelMode}, Speed: ${currentSpeedMPS.toFixed(1)} m/s (${baseSpeedKmH} km/h / ${baseSpeedMph} mph)`,
        });

    // Create downloadable blob
    const blob = new Blob([xml], { type: 'application/gpx+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const sanitizedFilename = routeName.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_') || 'Locus-Route';
    const filename = `${sanitizedFilename}.gpx`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportSuccessMessage(`Saved ${coords.length} coordinates to ${filename}`);
    setTimeout(() => {
      setExportSuccessMessage(null);
    }, 4500);
  };

  /**
   * Copies GPX XML content to clipboard
   */
  const handleCopyGPX = () => {
    const coords = routeCoords.length > 0 ? routeCoords : drawnPath;
    if (coords.length === 0) {
      setLastError('No route to copy.');
      return;
    }

    const routeName = customRouteName.trim() || 'Locus Route';
    const xml = importedTrack
      ? exportGPX(importedTrack, { name: routeName, speedMPS: currentSpeedMPS })
      : exportGPX(coords, { name: routeName, speedMPS: currentSpeedMPS });

    navigator.clipboard.writeText(xml).then(() => {
      setCopiedXML(true);
      setTimeout(() => setCopiedXML(false), 2500);
    });
  };

  const formatCoord = (c: { latitude: number; longitude: number } | null) => {
    if (!c) return '—';
    return `${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`;
  };

  const progressPercent = activeCoordinates.length > 0
    ? Math.min(100, Math.round(((routeProgressIndex + 1) / activeCoordinates.length) * 100))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md h-[85vh] sm:h-auto sm:max-h-[85vh] locus-glass rounded-t-[32px] sm:rounded-[28px] overflow-hidden flex flex-col border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-locus-accent" />
            <h3 className="text-lg font-bold text-white">Route Planner</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-sm">
          {/* Simulated Travel Speed Indicator Display */}
          <div className="p-3.5 rounded-2xl locus-glass-clear border border-white/10 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-locus-accent/15 border border-locus-accent/30 flex items-center justify-center text-locus-accent shrink-0">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-white/50 font-medium flex items-center gap-1.5">
                  <span>Simulated Speed</span>
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span className="capitalize text-white/70">
                    {customSpeedMPS ? 'Custom' : travelMode}
                  </span>
                  {playbackSpeedMultiplier > 1 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-locus-accent/20 text-locus-accent font-bold">
                      {playbackSpeedMultiplier}x
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base font-bold text-white font-mono tracking-tight">
                    {speedUnit === 'kmh' ? speedKmH : speedMph}
                  </span>
                  <span className="text-xs font-bold text-locus-accent">
                    {speedUnit === 'kmh' ? 'km/h' : 'mph'}
                  </span>
                  <span className="text-[11px] text-white/40 font-mono pl-1">
                    ({speedUnit === 'kmh' ? `${speedMph} mph` : `${speedKmH} km/h`})
                  </span>
                </div>
              </div>
            </div>

            {/* km/h or mph toggle pill */}
            <div className="flex items-center p-0.5 rounded-xl bg-white/10 border border-white/10 text-xs shrink-0">
              <button
                onClick={() => handleUnitToggle('kmh')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs ${
                  speedUnit === 'kmh'
                    ? 'bg-locus-accent text-black shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                km/h
              </button>
              <button
                onClick={() => handleUnitToggle('mph')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs ${
                  speedUnit === 'mph'
                    ? 'bg-locus-accent text-black shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                mph
              </button>
            </div>
          </div>

          {/* Export Success Feedback Toast */}
          {exportSuccessMessage && (
            <div className="p-3 rounded-2xl bg-locus-good/15 border border-locus-good/30 flex items-center gap-2.5 text-xs text-locus-good font-semibold animate-in fade-in slide-in-from-top-2">
              <Check className="w-4 h-4 shrink-0" />
              <span className="flex-1">{exportSuccessMessage}</span>
            </div>
          )}

          {/* Active Generated Route Card & Playback Center */}
          {activeCoordinates.length > 0 && routeStats && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-locus-accent/30 space-y-3.5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-locus-accent uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-locus-accent animate-pulse" />
                  Active Generated Path
                </span>
                <span className="text-[11px] text-white/50 font-mono">
                  {routeStats.points} pts
                </span>
              </div>

              {/* ETA & Total Travel Time Highlight Banner */}
              <div className="p-3 rounded-xl bg-black/50 border border-locus-accent/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-locus-accent/15 flex items-center justify-center text-locus-accent shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-white/50 uppercase font-semibold tracking-wider">
                      {isPlayingRoute ? 'Estimated Arrival (ETA)' : 'Estimated Time of Arrival'}
                    </div>
                    <div className="text-sm font-extrabold text-locus-accent font-mono">
                      {routeStats.etaDisplay}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-white/50 uppercase font-semibold tracking-wider flex items-center justify-end gap-1">
                    <Hourglass className="w-3 h-3 text-white/40" />
                    <span>{isPlayingRoute ? 'Remaining Time' : 'Total Travel Time'}</span>
                  </div>
                  <div className="text-sm font-bold text-white font-mono">
                    {isPlayingRoute ? routeStats.remainingDurationStr : routeStats.totalTravelTimeStr}
                  </div>
                </div>
              </div>

              {/* Detailed Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 py-1 text-center border-y border-white/10">
                <div className="p-1.5">
                  <div className="text-[10px] text-white/50 uppercase">Distance</div>
                  <div className="text-xs font-bold text-white font-mono">
                    {speedUnit === 'kmh' ? `${routeStats.km} km` : `${routeStats.miles} mi`}
                  </div>
                  <div className="text-[10px] text-white/40">
                    {speedUnit === 'kmh' ? `${routeStats.miles} mi` : `${routeStats.km} km`}
                  </div>
                </div>
                <div className="p-1.5 border-x border-white/10">
                  <div className="text-[10px] text-white/50 uppercase flex items-center justify-center gap-1">
                    <Timer className="w-3 h-3 text-locus-accent" />
                    <span>Trip Duration</span>
                  </div>
                  <div className="text-xs font-bold text-white font-mono">
                    {routeStats.totalTravelTimeStr}
                  </div>
                  <div className="text-[10px] text-white/40">
                    @{speedUnit === 'kmh' ? `${speedKmH} km/h` : `${speedMph} mph`}
                  </div>
                </div>
                <div className="p-1.5">
                  <div className="text-[10px] text-white/50 uppercase">Speed Rate</div>
                  <div className="text-xs font-bold text-locus-accent font-mono">
                    {effectivePlaybackSpeed.toFixed(1)} m/s
                  </div>
                  <div className="text-[10px] text-white/40">{playbackSpeedMultiplier}x Multiplier</div>
                </div>
              </div>

              {/* Playback Mode Control Console */}
              {isPlayingRoute ? (
                <div className="p-3.5 rounded-xl bg-black/60 border border-locus-accent/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${isPlaybackPaused ? 'bg-locus-warn' : 'bg-locus-good animate-ping'}`} />
                      <span className="text-xs font-bold text-white">
                        {isPlaybackPaused ? 'Playback Paused' : 'Playback Mode Active'}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-locus-accent">
                      {progressPercent}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-locus-accent transition-all duration-200"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-white/50 font-mono">
                    <span>Point {routeProgressIndex + 1} of {activeCoordinates.length}</span>
                    <span className="text-locus-accent">ETA: {routeStats.etaDisplay}</span>
                  </div>

                  {/* Playback Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    {isPlaybackPaused ? (
                      <button
                        onClick={resumeRoutePlayback}
                        className="flex-1 py-2 px-3 rounded-lg bg-locus-accent text-black font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-98 transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>Resume Playback</span>
                      </button>
                    ) : (
                      <button
                        onClick={pauseRoutePlayback}
                        className="flex-1 py-2 px-3 rounded-lg bg-white/15 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Pause className="w-3.5 h-3.5 fill-white" />
                        <span>Pause</span>
                      </button>
                    )}

                    <button
                      onClick={stopRoutePlayback}
                      className="py-2 px-3 rounded-lg bg-locus-danger/20 hover:bg-locus-danger/30 text-locus-danger font-bold text-xs flex items-center justify-center gap-1.5 border border-locus-danger/30 transition-colors"
                    >
                      <Square className="w-3.5 h-3.5 fill-locus-danger" />
                      <span>Stop</span>
                    </button>

                    <button
                      onClick={onClose}
                      className="py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white/90 text-xs font-semibold flex items-center justify-center gap-1"
                      title="Watch simulated movement on map"
                    >
                      <Eye className="w-3.5 h-3.5 text-locus-accent" />
                      <span>View Map</span>
                    </button>
                  </div>

                  {/* Multiplier selector */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                    <span className="text-white/50 flex items-center gap-1">
                      <FastForward className="w-3 h-3 text-locus-accent" />
                      <span>Speed Multiplier:</span>
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 4, 8].map((mult) => (
                        <button
                          key={mult}
                          onClick={() => setPlaybackSpeedMultiplier(mult)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors ${
                            playbackSpeedMultiplier === mult
                              ? 'bg-locus-accent text-black'
                              : 'bg-white/10 text-white/60 hover:text-white'
                          }`}
                        >
                          {mult}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Primary Playback Mode Trigger Button */
                <div className="space-y-1.5">
                  <button
                    onClick={handleStartPlayback}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-locus-accent via-[#50c2b2] to-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-[0_0_18px_rgba(89,199,184,0.5)] hover:brightness-110 active:scale-98 transition-all"
                    title="Simulate movement step-by-step along route coordinates"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>Start Playback Mode ({speedUnit === 'kmh' ? `${speedKmH} km/h` : `${speedMph} mph`})</span>
                  </button>
                  <p className="text-[10px] text-white/50 text-center">
                    Simulates real GPS travel along plotted coordinates • Trip time: {routeStats.totalTravelTimeStr}
                  </p>
                </div>
              )}

              {/* Route Name Input & Export Action */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-white/60 font-medium">Route Name for GPX File</label>
                  <input
                    type="text"
                    value={customRouteName}
                    onChange={(e) => setCustomRouteName(e.target.value)}
                    placeholder="e.g. Scenic Downtown Walk"
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-locus-accent"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportRouteAsGPX()}
                    className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-white/10"
                    title="Export current route coordinates to a .gpx file"
                  >
                    <Download className="w-3.5 h-3.5 text-locus-accent" />
                    <span>Export as .gpx File</span>
                  </button>

                  <button
                    onClick={handleCopyGPX}
                    className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10"
                    title="Copy GPX XML text to clipboard"
                  >
                    {copiedXML ? <Check className="w-3.5 h-3.5 text-locus-good" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedXML ? 'Copied' : 'Copy XML'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Road route generation */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Road Route
            </h4>
            <div className="rounded-2xl bg-white/5 border border-white/5 divide-y divide-white/5 overflow-hidden">
              <button
                onClick={handleSetStart}
                className="w-full p-3 text-left hover:bg-white/5 flex items-center justify-between text-locus-accent font-medium text-xs transition-colors"
              >
                <span>Use current pin / spoof as start</span>
                <span className="font-mono text-white/60 text-[11px]">
                  {formatCoord(routeStart)}
                </span>
              </button>

              <button
                onClick={handleSetEnd}
                className="w-full p-3 text-left hover:bg-white/5 flex items-center justify-between text-locus-accent font-medium text-xs transition-colors"
              >
                <span>Use current pin as end</span>
                <span className="font-mono text-white/60 text-[11px]">
                  {formatCoord(routeEnd)}
                </span>
              </button>

              <div className="p-3">
                <button
                  onClick={handleBuildRoadRoute}
                  disabled={isLoadingRoute}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-xs"
                >
                  {isLoadingRoute ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-locus-accent" />
                      <span>Calculating road route…</span>
                    </>
                  ) : (
                    <>
                      <Milestone className="w-4 h-4 text-locus-accent" />
                      <span>Generate walk/drive route on roads</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Play / Draw / GPX Management */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Play / Draw / GPX
            </h4>
            <div className="rounded-2xl bg-white/5 border border-white/5 divide-y divide-white/5 overflow-hidden">
              {/* Use drawn path */}
              <button
                onClick={handleUseDrawnPath}
                className="w-full p-3.5 text-left hover:bg-white/5 flex items-center gap-3 text-white transition-colors"
              >
                <Pencil className="w-4 h-4 text-locus-accentSecondary" />
                <div className="flex-1">
                  <div className="font-semibold text-xs">Use drawn path from map</div>
                  {drawnPath.length > 0 && (
                    <div className="text-[11px] text-white/50 font-mono">
                      {drawnPath.length} points sketched
                    </div>
                  )}
                </div>
              </button>

              {/* Trigger Playback Mode button */}
              <button
                onClick={handleStartPlayback}
                disabled={activeCoordinates.length < 2}
                className={`w-full p-3.5 text-left flex items-center gap-3 transition-colors text-xs font-semibold ${
                  isPlayingRoute
                    ? 'bg-locus-accent/15 text-locus-accent'
                    : 'hover:bg-white/5 text-locus-accent hover:brightness-110 disabled:opacity-40'
                }`}
              >
                <Play className="w-4 h-4 fill-locus-accent" />
                <div className="flex-1">
                  <div>{isPlayingRoute ? 'Playback Mode Active' : 'Start Playback Mode'}</div>
                  <div className="text-[11px] text-white/40">
                    {activeCoordinates.length >= 2
                      ? `Follow ${activeCoordinates.length} coordinates at ${effectivePlaybackSpeed.toFixed(1)} m/s`
                      : 'Build or draw a route first'}
                  </div>
                </div>
              </button>

              {/* Import GPX */}
              <button
                onClick={handleImportGPXClick}
                className="w-full p-3.5 text-left hover:bg-white/5 flex items-center gap-3 text-white/90 transition-colors text-xs font-medium"
              >
                <Upload className="w-4 h-4 text-white/60" />
                <div className="flex-1">
                  <div>Import GPX file</div>
                  <div className="text-[11px] text-white/40">Load paths from Garmin, Strava, or GPS trackers</div>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".gpx,application/gpx+xml,text/xml"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Secondary Export GPX button */}
              <button
                onClick={() => exportRouteAsGPX()}
                disabled={activeCoordinates.length === 0}
                className="w-full p-3.5 text-left hover:bg-white/5 flex items-center gap-3 text-white/90 transition-colors text-xs font-medium disabled:opacity-40"
              >
                <Download className="w-4 h-4 text-white/60" />
                <div className="flex-1">
                  <div>Export route to .gpx file</div>
                  <div className="text-[11px] text-white/40">Compatible with Google Earth, Strava, OsmAnd, Komoot</div>
                </div>
              </button>
            </div>
          </div>

          {/* Compatibility Note */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-white/50 leading-relaxed space-y-1">
            <div className="font-semibold text-white/70 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-locus-accent" />
              <span>Mapping App Compatibility</span>
            </div>
            <p>
              Exported GPX files use standard GPX 1.1 format with accurate track coordinates, calculated timestamps based on your travel speed ({baseSpeedKmH} km/h / {baseSpeedMph} mph), and origin/destination markers for seamless import into Apple Maps, Google Earth, Garmin Connect, Strava, Gaia GPS, or OsmAnd.
            </p>
          </div>
        </div>

        {/* Done Button */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
