import React, { useMemo } from 'react';
import {
  Pencil,
  Undo2,
  Trash2,
  Play,
  X,
  Footprints,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useSpoof } from '../../context/SpoofContext';
import { calculateTotalDistance } from '../../utils/geo';

export const DrawingHUD: React.FC = () => {
  const {
    drawMode,
    setDrawMode,
    drawnPath,
    undoLastDrawnPoint,
    clearDrawnPath,
    convertDrawnToRoute,
    drawMethod,
    setDrawMethod,
  } = useSpoof();

  const totalMeters = useMemo(() => {
    return calculateTotalDistance(drawnPath);
  }, [drawnPath]);

  if (!drawMode) return null;

  const distanceKm = (totalMeters / 1000).toFixed(2);
  const distanceMiles = (totalMeters / 1609.344).toFixed(2);

  return (
    <div className="w-full max-w-md mx-auto pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="p-3.5 rounded-3xl locus-glass border border-locus-accentSecondary/50 shadow-2xl space-y-3">
        {/* Top Header & Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-locus-accentSecondary/20 border border-locus-accentSecondary/40 flex items-center justify-center text-locus-accentSecondary shadow-[0_0_12px_rgba(242,140,71,0.4)]">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <span>Draw Custom Route</span>
                <span className="w-1.5 h-1.5 rounded-full bg-locus-accentSecondary animate-ping" />
              </div>
              <div className="text-[10px] text-white/60">
                {drawMethod === 'freehand'
                  ? 'Drag finger or mouse across map to sketch'
                  : 'Tap on the map to add waypoint points'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setDrawMode(false)}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            title="Close drawing mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Method Picker & Live Stats Bar */}
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10 text-xs">
          {/* Method Segmented Controls */}
          <div className="flex items-center p-0.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold">
            <button
              onClick={() => setDrawMethod('tap')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                drawMethod === 'tap'
                  ? 'bg-locus-accent text-black font-bold shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>Tap Points</span>
            </button>
            <button
              onClick={() => setDrawMethod('freehand')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                drawMethod === 'freehand'
                  ? 'bg-locus-accentSecondary text-black font-bold shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Freehand</span>
            </button>
          </div>

          {/* Stats */}
          <div className="text-right pr-1">
            <div className="font-mono font-bold text-white text-xs">
              {drawnPath.length} {drawnPath.length === 1 ? 'pt' : 'pts'} • {distanceMiles} mi
            </div>
            <div className="text-[10px] text-white/50 font-mono">
              {distanceKm} km
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Undo */}
          <button
            onClick={undoLastDrawnPoint}
            disabled={drawnPath.length === 0}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none text-white transition-colors flex items-center justify-center gap-1 text-xs font-semibold"
            title="Undo last point"
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          {/* Clear */}
          <button
            onClick={clearDrawnPath}
            disabled={drawnPath.length === 0}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none text-white/70 hover:text-white transition-colors flex items-center justify-center gap-1 text-xs font-semibold"
            title="Clear entire drawn path"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          {/* Start Simulation */}
          <button
            onClick={convertDrawnToRoute}
            disabled={drawnPath.length < 2}
            className="flex-1 py-2.5 px-4 rounded-xl bg-locus-accent text-black font-extrabold text-xs shadow-[0_0_16px_rgba(89,199,184,0.4)] hover:brightness-110 active:scale-98 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>Simulate Route</span>
          </button>
        </div>
      </div>
    </div>
  );
};
