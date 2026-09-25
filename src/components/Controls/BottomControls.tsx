import React from 'react';
import { Settings, Star, Footprints, Zap, Bike, Car, Navigation } from 'lucide-react';
import { useSpoof, TRAVEL_MODES } from '../../context/SpoofContext';
import { TravelMode } from '../../types';
import { JoystickPad } from './JoystickPad';
import { SpeedChip } from './SpeedChip';

interface BottomControlsProps {
  onOpenSettings: () => void;
  onOpenPlaces: () => void;
}

export const BottomControls: React.FC<BottomControlsProps> = ({
  onOpenSettings,
  onOpenPlaces,
}) => {
  const {
    travelMode,
    setTravelMode,
    joystickActive,
    startJoystick,
    stopJoystick,
    updateJoystickVector,
    status,
    pin,
    teleport,
    stopSpoofing,
    isBusy,
    setLastError,
  } = useSpoof();

  const isSpoofing = status === 'active' || status === 'reconnecting';

  const modes: TravelMode[] = ['walk', 'run', 'cycle', 'drive'];

  const getModeIcon = (mode: TravelMode) => {
    switch (mode) {
      case 'walk':
        return <Footprints className="w-5 h-5" />;
      case 'run':
        return <Zap className="w-5 h-5" />;
      case 'cycle':
        return <Bike className="w-5 h-5" />;
      case 'drive':
        return <Car className="w-5 h-5" />;
    }
  };

  const handleTeleportClick = () => {
    if (!pin) {
      setLastError('Tap the map to drop a pin first.');
      return;
    }
    teleport(pin);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-3 pointer-events-auto">
      {/* Joystick Pad overlay aligned right */}
      {joystickActive && (
        <div className="flex justify-end pr-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <JoystickPad onChange={updateJoystickVector} />
        </div>
      )}

      {/* Main Glass Tray */}
      <div className="p-3.5 rounded-[28px] locus-glass space-y-3 shadow-2xl border border-white/10">
        {/* Travel Mode Row & Speed Chip */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            {modes.map((mode) => {
              const selected = travelMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setTravelMode(mode)}
                  className={`w-11 h-10 rounded-full flex items-center justify-center transition-all ${
                    selected
                      ? 'bg-locus-accent text-black font-bold shadow-[0_0_12px_rgba(89,199,184,0.4)]'
                      : 'bg-white/10 hover:bg-white/15 text-white/90'
                  }`}
                  title={TRAVEL_MODES[mode].title}
                  aria-label={TRAVEL_MODES[mode].title}
                >
                  {getModeIcon(mode)}
                </button>
              );
            })}
          </div>

          <SpeedChip />
        </div>

        {/* Action Row */}
        <div className="flex items-center gap-2.5">
          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white/90 transition-colors"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Places Button */}
          <button
            onClick={onOpenPlaces}
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white/90 transition-colors"
            title="Saved Places"
            aria-label="Saved Places"
          >
            <Star className="w-5 h-5" />
          </button>

          {/* Joystick Toggle Button */}
          <button
            onClick={() => {
              if (joystickActive) {
                stopJoystick();
              } else {
                startJoystick();
              }
            }}
            className={`flex-1 h-11 rounded-full flex items-center justify-center gap-1.5 font-semibold text-sm transition-all ${
              joystickActive
                ? 'bg-locus-accentSecondary text-black font-bold shadow-[0_0_12px_rgba(242,140,71,0.5)]'
                : 'bg-white/10 hover:bg-white/15 text-white'
            }`}
          >
            <Navigation className="w-4 h-4 rotate-45" />
            <span>{joystickActive ? 'Joy On' : 'Joy'}</span>
          </button>

          {/* Teleport or Stop Button */}
          {isSpoofing ? (
            <button
              onClick={stopSpoofing}
              disabled={isBusy}
              className="px-6 h-11 rounded-full bg-locus-danger text-white font-bold text-sm shadow-[0_0_14px_rgba(235,82,92,0.5)] hover:brightness-110 active:scale-95 transition-all"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={handleTeleportClick}
              disabled={isBusy}
              className="px-6 h-11 rounded-full bg-locus-accent text-black font-bold text-sm shadow-[0_0_14px_rgba(89,199,184,0.5)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              Teleport
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
