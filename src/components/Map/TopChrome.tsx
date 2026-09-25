import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Layers,
  Route,
  Pencil,
  Star,
  Crosshair,
  ShieldAlert,
  Key,
} from 'lucide-react';
import { useSpoof } from '../../context/SpoofContext';
import { Coordinate } from '../../types';

interface SearchResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
}

interface TopChromeProps {
  onOpenRoutes: () => void;
  onLocateMe: () => void;
  onOpenSettings: () => void;
  onOpenApiKey?: () => void;
}

export const TopChrome: React.FC<TopChromeProps> = ({
  onOpenRoutes,
  onLocateMe,
  onOpenSettings,
  onOpenApiKey,
}) => {
  const {
    status,
    simulated,
    vpnConnected,
    pin,
    setPin,
    mapStyleIndex,
    cycleMapStyle,
    drawMode,
    setDrawMode,
    setDrawnPath,
    addFavorite,
    teleport,
    cartoApiKey,
  } = useSpoof();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [dismissedKeyBanner, setDismissedKeyBanner] = useState<boolean>(() => {
    return sessionStorage.getItem('locus.dismissedKeyBanner') === 'true';
  });
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Status computation
  let statusText = 'Not Spoofing';
  let statusColor = 'bg-white/50 text-white/70 shadow-none';

  if (!vpnConnected) {
    statusText = 'Connect LocalDevVPN';
    statusColor = 'bg-locus-warn text-locus-warn shadow-[0_0_8px_rgba(250,199,71,0.8)]';
  } else if (status === 'active' && simulated) {
    statusText = `Spoofing ${simulated.latitude.toFixed(4)}, ${simulated.longitude.toFixed(4)}`;
    statusColor = 'bg-locus-good text-locus-good shadow-[0_0_8px_rgba(77,220,140,0.8)]';
  } else if (status === 'connecting' || status === 'reconnecting') {
    statusText = status === 'connecting' ? 'Connecting…' : 'Reconnecting…';
    statusColor = 'bg-locus-warn text-locus-warn shadow-[0_0_8px_rgba(250,199,71,0.8)]';
  } else if (status === 'dropped') {
    statusText = 'Disconnected';
    statusColor = 'bg-locus-bad text-locus-bad shadow-[0_0_8px_rgba(235,82,92,0.8)]';
  }

  // Geocoding search using Photon API (fast, OSM based, CORS enabled)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(
            searchQuery.trim()
          )}&limit=5`
        );
        if (res.ok) {
          const data = await res.json();
          const items: SearchResult[] = (data.features || []).map(
            (f: any, idx: number) => {
              const p = f.properties;
              const name = p.name || p.street || 'Place';
              const parts = [p.city || p.town || p.district, p.state, p.country].filter(
                Boolean
              );
              return {
                place_id: `${f.geometry.coordinates[0]}_${f.geometry.coordinates[1]}_${idx}`,
                display_name: `${name}${parts.length ? ' • ' + parts.join(', ') : ''}`,
                name: name,
                lat: String(f.geometry.coordinates[1]),
                lon: String(f.geometry.coordinates[0]),
              };
            }
          );
          setSearchResults(items);
        }
      } catch (e) {
        console.warn('Place search failed:', e);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (item: SearchResult) => {
    const coord: Coordinate = {
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    };
    setPin(coord);
    teleport(coord);
    addFavorite(item.name || item.display_name, coord);
    setSearchQuery('');
    setShowResults(false);
  };

  const handleStarPin = () => {
    if (!pin) return;
    const name = `${pin.latitude.toFixed(5)}, ${pin.longitude.toFixed(5)}`;
    addFavorite(name, pin);
  };

  const getMapStyleName = () => {
    switch (mapStyleIndex) {
      case 1:
        return 'Apple Maps Light';
      case 2:
        return 'Apple Maps Satellite';
      case 3:
        return 'OpenStreetMap';
      default:
        return 'Apple Maps Dark';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-2.5 pointer-events-auto">
      {/* Status Bar View */}
      <div
        onClick={() => {
          if (!vpnConnected) onOpenSettings();
        }}
        className={`w-full px-3.5 py-2 rounded-2xl locus-glass-clear flex items-center justify-between transition-all cursor-pointer ${
          !vpnConnected ? 'hover:border-locus-warn/50' : ''
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-xs font-semibold text-white/90">{statusText}</span>
        </div>

        {!vpnConnected ? (
          <ShieldAlert className="w-4 h-4 text-locus-warn" />
        ) : (
          status === 'active' &&
          simulated && (
            <span className="text-[11px] font-mono text-white/50">ACTIVE</span>
          )
        )}
      </div>

      {/* Search Bar */}
      <div ref={searchContainerRef} className="relative w-full">
        <div className="w-full px-3 py-2.5 rounded-2xl locus-glass flex items-center gap-2.5 border border-white/10 shadow-lg">
          <Search className="w-4 h-4 text-white/50 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder="Search places or coordinates"
            className="w-full bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {showResults && (searchResults.length > 0 || isSearching) && (
          <div className="absolute top-12 left-0 right-0 rounded-2xl locus-glass overflow-hidden shadow-2xl z-50 divide-y divide-white/10 border border-white/15">
            {isSearching && searchResults.length === 0 && (
              <div className="p-3 text-xs text-white/50 text-center">Searching…</div>
            )}
            {searchResults.map((item) => (
              <button
                key={item.place_id}
                onClick={() => handleSelectResult(item)}
                className="w-full px-3.5 py-2.5 text-left hover:bg-white/10 transition-colors flex flex-col gap-0.5"
              >
                <span className="text-xs font-semibold text-white">
                  {item.name || item.display_name}
                </span>
                <span className="text-[11px] text-white/60 line-clamp-1">
                  {item.display_name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick CARTO API Key Prompt Banner */}
      {!cartoApiKey && !dismissedKeyBanner && onOpenApiKey && (
        <div className="p-2.5 px-3.5 rounded-2xl locus-glass border border-locus-accent/40 shadow-xl flex items-center justify-between gap-2.5 pointer-events-auto animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 min-w-0 text-left">
            <div className="w-7 h-7 rounded-full bg-locus-accent/15 border border-locus-accent/30 flex items-center justify-center text-locus-accent shrink-0">
              <Key className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-white block">Seeing &quot;API KEY REQUIRED&quot;?</span>
              <span className="text-[11px] text-white/60 block truncate">Tap to paste your CARTO key or use free clean tiles</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenApiKey}
              className="py-1.5 px-3 rounded-xl bg-locus-accent text-black font-extrabold text-xs hover:brightness-110 active:scale-98 shadow-sm transition-all"
            >
              Enter Key
            </button>
            <button
              onClick={() => {
                setDismissedKeyBanner(true);
                sessionStorage.setItem('locus.dismissedKeyBanner', 'true');
              }}
              className="p-1 rounded-full text-white/50 hover:text-white"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Map Action Chrome Toolbar */}
      <div className="flex items-center justify-between">
        {/* Left pill buttons */}
        <div className="flex items-center gap-1 p-1 rounded-full locus-glass-clear">
          {/* Layer switcher */}
          <button
            onClick={cycleMapStyle}
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white/90 transition-colors relative"
            title={`Map Layer: ${getMapStyleName()}`}
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Route planner button */}
          <button
            onClick={onOpenRoutes}
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white/90 transition-colors"
            title="Routes & GPX"
          >
            <Route className="w-4 h-4" />
          </button>

          {/* Draw mode toggle */}
          <button
            onClick={() => {
              setDrawMode((prev) => {
                if (prev) setDrawnPath([]);
                return !prev;
              });
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              drawMode
                ? 'bg-locus-accentSecondary text-black font-bold shadow-[0_0_10px_rgba(242,140,71,0.6)]'
                : 'hover:bg-white/10 text-white/90'
            }`}
            title={drawMode ? 'Drawing mode ON (tap map to sketch path)' : 'Draw Path'}
          >
            <Pencil className="w-4 h-4" />
          </button>

          {/* API Key Modal Button */}
          {onOpenApiKey && (
            <button
              onClick={onOpenApiKey}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                cartoApiKey
                  ? 'text-locus-good hover:bg-white/10'
                  : 'text-locus-accent hover:bg-white/10'
              }`}
              title={cartoApiKey ? 'CARTO API Key Active' : 'Enter CARTO API Key to remove watermarks'}
            >
              <Key className="w-4 h-4" />
            </button>
          )}

          {/* Star current pin */}
          {pin && (
            <button
              onClick={handleStarPin}
              className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-locus-warn transition-colors"
              title="Save pin to Favorites"
            >
              <Star className="w-4 h-4 fill-locus-warn" />
            </button>
          )}
        </div>

        {/* Locate me button */}
        <button
          onClick={onLocateMe}
          className="w-11 h-11 rounded-full locus-glass-interactive flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
          title="Center on GPS / Location"
          aria-label="Locate me"
        >
          <Crosshair className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
