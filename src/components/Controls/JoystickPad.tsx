import React, { useRef, useState, useEffect, useCallback } from 'react';

interface JoystickPadProps {
  onChange: (vector: { dx: number; dy: number }) => void;
}

export const JoystickPad: React.FC<JoystickPadProps> = ({ onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const radius = 52;

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    handleMove(clientX, clientY);
  };

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rawDx = clientX - centerX;
    const rawDy = clientY - centerY;
    const distance = Math.hypot(rawDx, rawDy);

    let x = rawDx;
    let y = rawDy;

    if (distance > radius) {
      const scale = radius / distance;
      x = rawDx * scale;
      y = rawDy * scale;
    }

    setOffset({ x, y });
    onChange({ dx: x / radius, dy: y / radius });
  }, [radius, onChange]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    setOffset({ x: 0, y: 0 });
    onChange({ dx: 0, dy: 0 });
  }, [onChange]);

  // Window event listeners for drag tracking
  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (e: PointerEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const onPointerUp = () => {
      handleEnd();
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [isDragging, handleMove, handleEnd]);

  return (
    <div
      ref={containerRef}
      className="relative select-none flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
      style={{ width: radius * 2 + 28, height: radius * 2 + 28 }}
      onPointerDown={(e) => {
        e.preventDefault();
        handleStart(e.clientX, e.clientY);
      }}
    >
      {/* Outer Glass Ring */}
      <div className="absolute inset-0 rounded-full locus-glass-clear pointer-events-none" />

      {/* Guide Circle */}
      <div
        className="absolute rounded-full border-2 border-locus-accent/40 pointer-events-none"
        style={{ width: radius * 2, height: radius * 2 }}
      />

      {/* Direction indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] text-white/30 font-bold pointer-events-none">
        <span>W</span>
        <span>E</span>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-between py-3 text-[10px] text-white/30 font-bold pointer-events-none">
        <span>N</span>
        <span>S</span>
      </div>

      {/* Joystick Knob */}
      <div
        className={`absolute rounded-full bg-locus-accent shadow-[0_0_16px_rgba(89,199,184,0.6)] flex items-center justify-center z-10 ${
          isDragging ? 'scale-105' : 'transition-transform duration-200 ease-out'
        }`}
        style={{
          width: 44,
          height: 44,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
      >
        <div className="w-3.5 h-3.5 rounded-full bg-white/40" />
      </div>
    </div>
  );
};
