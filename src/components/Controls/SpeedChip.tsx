import React, { useState, useRef, useEffect } from 'react';
import { Gauge, X } from 'lucide-react';
import { useSpoof } from '../../context/SpoofContext';

export const SpeedChip: React.FC = () => {
  const { currentSpeedMPS, customSpeedMPS, setCustomSpeed, clearCustomSpeed } = useSpoof();
  const [showEditor, setShowEditor] = useState(false);
  const [speedText, setSpeedText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isCustom = customSpeedMPS !== null;

  const handleOpen = () => {
    setSpeedText(currentSpeedMPS.toFixed(1));
    setErrorMessage(null);
    setShowEditor(true);
  };

  const handleSet = (e: React.FormEvent) => {
    e.preventDefault();
    if (setCustomSpeed(speedText)) {
      setErrorMessage(null);
      setShowEditor(false);
    } else {
      setErrorMessage('Enter a number > 0 (e.g. 2.5)');
    }
  };

  const handleUsePreset = () => {
    clearCustomSpeed();
    setErrorMessage(null);
    setShowEditor(false);
  };

  // Close on outside click
  useEffect(() => {
    if (!showEditor) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowEditor(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEditor]);

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className={`h-10 px-3 rounded-full flex items-center gap-1.5 font-semibold text-sm transition-all ${
          isCustom
            ? 'bg-locus-accent text-black font-bold shadow-[0_0_12px_rgba(89,199,184,0.4)]'
            : 'bg-white/10 hover:bg-white/15 text-white'
        }`}
      >
        <Gauge className="w-4 h-4" />
        <span>{currentSpeedMPS.toFixed(1)} m/s</span>
      </button>

      {showEditor && (
        <div
          ref={popoverRef}
          className="absolute bottom-12 right-0 w-64 p-4 rounded-2xl locus-glass z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-white">Custom speed</h4>
            <button
              onClick={() => setShowEditor(false)}
              className="text-white/50 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-white/60 mb-3">
            Applies to both joystick and route/GPX playback, in meters per second.
          </p>

          <form onSubmit={handleSet} className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={speedText}
                onChange={(e) => setSpeedText(e.target.value)}
                placeholder="e.g. 5.0"
                className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-locus-accent"
                autoFocus
              />
              <span className="text-xs text-white/50 whitespace-nowrap">m/s</span>
            </div>

            {errorMessage && (
              <p className="text-xs text-locus-danger font-medium">{errorMessage}</p>
            )}

            <div className="flex items-center justify-between pt-1 gap-2">
              <button
                type="button"
                onClick={handleUsePreset}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white/80 transition-colors"
              >
                Use preset
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-locus-accent text-black font-bold text-xs hover:brightness-110 transition-all"
              >
                Set
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
