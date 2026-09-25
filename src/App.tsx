import React, { useState, useRef } from 'react';
import { Play, Pause, Square, Route } from 'lucide-react';
import { useSpoof } from './context/SpoofContext';
import { MapView, MapViewRef } from './components/Map/MapView';
import { TopChrome } from './components/Map/TopChrome';
import { BottomControls } from './components/Controls/BottomControls';
import { DrawingHUD } from './components/Map/DrawingHUD';
import { RoutePlannerModal } from './components/Routes/RoutePlannerModal';
import { PlacesModal } from './components/Places/PlacesModal';
import { SettingsModal } from './components/Settings/SettingsModal';
import { SetupFlowModal } from './components/Setup/SetupFlowModal';
import { EasterEggModal } from './components/EasterEgg/EasterEggModal';
import { CartoApiKeyModal } from './components/Map/CartoApiKeyModal';

export const App: React.FC = () => {
  const {
    lastError,
    clearLastError,
    setupComplete,
    isPlayingRoute,
    isPlaybackPaused,
    routeProgressIndex,
    routeCoords,
    drawnPath,
    drawMode,
    pauseRoutePlayback,
    resumeRoutePlayback,
    stopRoutePlayback,
  } = useSpoof();
  const mapRef = useRef<MapViewRef>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [showPlaces, setShowPlaces] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);
  const [showSetup, setShowSetup] = useState(!setupComplete);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  const activePointsCount = routeCoords.length > 0 ? routeCoords.length : drawnPath.length;

  const handleLocateMe = () => {
    mapRef.current?.centerOnLocation();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans">
      {/* Background Interactive Map */}
      <MapView ref={mapRef} />

      {/* Floating Top UI Chrome */}
      <div className="absolute top-0 inset-x-0 p-3 pt-4 sm:p-4 z-30 pointer-events-none">
        <TopChrome
          onOpenRoutes={() => setShowRoutes(true)}
          onLocateMe={handleLocateMe}
          onOpenSettings={() => setShowSettings(true)}
          onOpenApiKey={() => setShowApiKeyModal(true)}
        />
      </div>

      {/* Floating Active Playback HUD Banner when modal is closed */}
      {isPlayingRoute && !showRoutes && (
        <div className="absolute top-28 sm:top-24 inset-x-0 flex justify-center px-4 z-30 pointer-events-none animate-in fade-in slide-in-from-top-4">
          <div className="w-full max-w-sm p-3 rounded-2xl locus-glass shadow-2xl border border-locus-accent/40 pointer-events-auto flex items-center justify-between gap-3">
            <button
              onClick={() => setShowRoutes(true)}
              className="flex items-center gap-2.5 flex-1 min-w-0 text-left hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-locus-accent/20 border border-locus-accent/40 flex items-center justify-center text-locus-accent shrink-0">
                <Route className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                  <span className={`w-2 h-2 rounded-full ${isPlaybackPaused ? 'bg-locus-warn' : 'bg-locus-good animate-ping'}`} />
                  <span>{isPlaybackPaused ? 'Playback Paused' : 'Playback Mode'}</span>
                </div>
                <div className="text-[11px] font-mono text-white/60">
                  Point {routeProgressIndex + 1} of {activePointsCount}
                </div>
              </div>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              {isPlaybackPaused ? (
                <button
                  onClick={resumeRoutePlayback}
                  className="p-2 rounded-xl bg-locus-accent text-black hover:brightness-110 transition-all"
                  title="Resume Playback"
                >
                  <Play className="w-4 h-4 fill-black" />
                </button>
              ) : (
                <button
                  onClick={pauseRoutePlayback}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                  title="Pause Playback"
                >
                  <Pause className="w-4 h-4 fill-white" />
                </button>
              )}
              <button
                onClick={stopRoutePlayback}
                className="p-2 rounded-xl bg-locus-danger/20 hover:bg-locus-danger/30 text-locus-danger border border-locus-danger/30 transition-all"
                title="Stop Playback"
              >
                <Square className="w-4 h-4 fill-locus-danger" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Controls Tray or Drawing HUD */}
      <div className="absolute bottom-0 inset-x-0 p-3 pb-6 sm:p-4 z-30 pointer-events-none">
        {drawMode ? (
          <DrawingHUD />
        ) : (
          <BottomControls
            onOpenSettings={() => setShowSettings(true)}
            onOpenPlaces={() => setShowPlaces(true)}
          />
        )}
      </div>

      {/* Modals & Sheets */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onOpenEasterEgg={() => setShowEasterEgg(true)}
      />

      <PlacesModal
        isOpen={showPlaces}
        onClose={() => setShowPlaces(false)}
      />

      <RoutePlannerModal
        isOpen={showRoutes}
        onClose={() => setShowRoutes(false)}
      />

      <SetupFlowModal
        isOpen={showSetup}
        onFinish={() => setShowSetup(false)}
      />

      <EasterEggModal
        isOpen={showEasterEgg}
        onClose={() => setShowEasterEgg(false)}
      />

      <CartoApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
      />

      {/* Error Alert Dialog */}
      {lastError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xs p-5 rounded-2xl locus-glass border border-white/15 space-y-4 text-center">
            <h4 className="font-bold text-white text-base">Locus</h4>
            <p className="text-xs text-white/70 leading-relaxed">{lastError}</p>
            <button
              onClick={clearLastError}
              className="w-full py-2 rounded-xl bg-locus-accent text-black font-bold text-xs"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
