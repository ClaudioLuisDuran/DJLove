/**
 * Componente JogWheel
 * Rueda de DJ táctil e interactiva: simulación de vinilo con rayado / scratch,
 * rotación continua durante la reproducción y nudges de sincronización.
 */

import React, { useRef, useState, useEffect } from 'react';
import { DeckId } from '../types/dj';

interface JogWheelProps {
  deckId: DeckId;
  isPlaying: boolean;
  accentColor: string; // '#06B6D4' o '#F97316'
  onScratchMove: (targetDeltaSeconds: number, speedMultiplier: number) => void;
  onScratchEnd: () => void;
  onNudge: (direction: 'forward' | 'backward') => void;
}

export const JogWheel: React.FC<JogWheelProps> = ({
  deckId,
  isPlaying,
  accentColor,
  onScratchMove,
  onScratchEnd,
  onNudge,
}) => {
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isScratching, setIsScratching] = useState(false);
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const lastAngleRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Animación de rotación continua cuando está sonando normalmente
  useEffect(() => {
    if (!isPlaying || isScratching) return;

    let prevTime = performance.now();
    const rotate = (time: number) => {
      const delta = (time - prevTime) / 1000;
      prevTime = time;
      // 33.33 RPM = ~200 grados por segundo
      setRotationAngle((prev) => (prev + delta * 200) % 360);
      animFrameRef.current = requestAnimationFrame(rotate);
    };

    animFrameRef.current = requestAnimationFrame(rotate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isScratching]);

  // Manejo de puntero para Scratch
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!wheelRef.current) return;
    setIsScratching(true);
    wheelRef.current.setPointerCapture(e.pointerId);

    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const initialAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

    lastAngleRef.current = initialAngle;
    lastTimeRef.current = performance.now();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScratching || !wheelRef.current) return;

    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

    let deltaAngle = currentAngle - lastAngleRef.current;
    // Normalizar salto de 180 a -180
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;

    const now = performance.now();
    const deltaTime = Math.max(0.005, (now - lastTimeRef.current) / 1000);

    // Velocidad angular en grados por segundo
    const angularSpeed = deltaAngle / deltaTime;
    // Convertir delta de ángulo a desplazamiento temporal (~1 vuelta = 1.8 segundos de audio)
    const timeDelta = (deltaAngle / 360) * 1.8;
    const speedRatio = Math.abs(angularSpeed) / 200;

    setRotationAngle((prev) => (prev + deltaAngle) % 360);
    onScratchMove(timeDelta, Math.max(0.2, Math.min(3.0, speedRatio)));

    lastAngleRef.current = currentAngle;
    lastTimeRef.current = now;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isScratching && wheelRef.current) {
      setIsScratching(false);
      try {
        wheelRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // Nada
      }
      onScratchEnd();
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Contenedor Jog Wheel */}
      <div
        ref={wheelRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`relative w-44 h-44 rounded-full cursor-grab active:cursor-grabbing p-2 shadow-2xl transition-shadow ${
          isScratching ? 'ring-2 ring-white/60 shadow-cyan-500/20' : 'hover:shadow-neutral-800'
        }`}
        style={{
          background: 'radial-gradient(circle, #262626 0%, #171717 60%, #0a0a0a 100%)',
          border: '3px solid #333',
        }}
      >
        {/* Anillo exterior de Nudge táctil */}
        <div
          className="w-full h-full rounded-full relative flex items-center justify-center overflow-hidden"
          style={{
            transform: `rotate(${rotationAngle}deg)`,
            backgroundImage: `repeating-radial-gradient(circle, #1a1a1a 0, #1a1a1a 2px, #141414 3px, #141414 4px)`,
          }}
        >
          {/* Textura de ranuras de vinilo */}
          <div className="absolute inset-2 rounded-full border border-white/5 opacity-40 pointer-events-none" />
          <div className="absolute inset-5 rounded-full border border-white/5 opacity-40 pointer-events-none" />
          <div className="absolute inset-8 rounded-full border border-white/5 opacity-40 pointer-events-none" />

          {/* Marcador de posición blanca (rayita del vinilo) */}
          <div className="absolute top-0 w-1.5 h-7 rounded-full bg-white shadow-md z-10" />

          {/* Galleta / Etiqueta central del vinilo */}
          <div
            className="w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-inner relative z-10"
            style={{
              backgroundColor: accentColor,
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            <div className="w-5 h-5 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center shadow-md">
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
            </div>
            <span className="text-[10px] font-black tracking-widest text-black/90 uppercase mt-1">
              {deckId === 'deckA' ? 'DECK A' : 'DECK B'}
            </span>
            <span className="text-[8px] font-mono text-black/70">
              {isScratching ? 'SCRATCH' : isPlaying ? 'ON AIR' : 'CUE'}
            </span>
          </div>
        </div>
      </div>

      {/* Botones de Nudge rápido (+ / -) */}
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={() => onNudge('backward')}
          title="Frenar ligeramente el beat (Nudge -)"
          className="px-2.5 py-1 text-xs font-mono font-bold rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white active:scale-95 transition"
        >
          - BEND
        </button>
        <span className="text-[10px] font-mono text-neutral-500 uppercase">JOG & NUDGE</span>
        <button
          onClick={() => onNudge('forward')}
          title="Acelerar ligeramente el beat (Nudge +)"
          className="px-2.5 py-1 text-xs font-mono font-bold rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white active:scale-95 transition"
        >
          + BEND
        </button>
      </div>
    </div>
  );
};
