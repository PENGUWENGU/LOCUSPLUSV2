import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface EasterEggModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Critter {
  band: number;
  size: number;
  speed: number;
  reverse: boolean;
  bob: number;
}

const SWARM: Critter[] = [
  { band: 0.10, size: 36, speed: 0.14, reverse: false, bob: 10 },
  { band: 0.18, size: 28, speed: 0.22, reverse: true, bob: 14 },
  { band: 0.26, size: 44, speed: 0.11, reverse: false, bob: 8 },
  { band: 0.34, size: 32, speed: 0.19, reverse: true, bob: 16 },
  { band: 0.42, size: 40, speed: 0.16, reverse: false, bob: 12 },
  { band: 0.50, size: 24, speed: 0.27, reverse: true, bob: 18 },
  { band: 0.58, size: 48, speed: 0.09, reverse: false, bob: 7 },
  { band: 0.66, size: 30, speed: 0.20, reverse: true, bob: 13 },
  { band: 0.74, size: 38, speed: 0.15, reverse: false, bob: 11 },
  { band: 0.82, size: 26, speed: 0.24, reverse: true, bob: 15 },
  { band: 0.90, size: 34, speed: 0.17, reverse: false, bob: 9 },
  { band: 0.14, size: 22, speed: 0.30, reverse: true, bob: 20 },
  { band: 0.62, size: 52, speed: 0.08, reverse: false, bob: 6 },
  { band: 0.38, size: 20, speed: 0.28, reverse: false, bob: 17 },
  { band: 0.78, size: 42, speed: 0.13, reverse: true, bob: 10 },
  { band: 0.22, size: 18, speed: 0.32, reverse: false, bob: 22 },
];

export const EasterEggModal: React.FC<EasterEggModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    let animId: number;
    let start = performance.now();

    const loop = (now: number) => {
      setTime((now - start) / 1000);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isOpen]);

  if (!isOpen) return null;

  const width = window.innerWidth;
  const height = window.innerHeight;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#0f1715] via-black to-[#140e0a] overflow-hidden select-none">
      {/* Animated swarm */}
      <div className="absolute inset-0 pointer-events-none">
        {SWARM.map((critter, idx) => {
          const travel = width + 160;
          const phase = ((time * critter.speed + idx * 0.07) % 1);
          const progress = critter.reverse ? 1 - phase : phase;
          const x = -80 + progress * travel;
          const bob = Math.sin(time * (2.5 + idx * 0.17) + idx) * critter.bob;
          const y = height * critter.band + bob;
          const wobble = Math.sin(time * (4 + idx * 0.3)) * 10;

          return (
            <div
              key={idx}
              className="absolute"
              style={{
                fontSize: critter.size,
                transform: `translate3d(${x}px, ${y}px, 0) scaleX(${
                  critter.reverse ? -1 : 1
                }) rotate(${wobble}deg)`,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
              }}
            >
              🦗
            </div>
          );
        })}
      </div>

      {/* Close button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full locus-glass flex items-center justify-center text-white/80 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quote & punchline */}
      <div className="absolute inset-x-0 bottom-8 text-center pointer-events-none space-y-1">
        <div className="text-xs italic text-white/40">close enough</div>
        <div className="text-[10px] text-white/20 font-mono">locus vs locust</div>
      </div>
    </div>
  );
};
