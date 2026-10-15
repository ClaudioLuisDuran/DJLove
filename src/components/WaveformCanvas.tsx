/**
 * Componente WaveformCanvas
 * Renderizado de forma de onda en canvas a 60 FPS con beatgrid, hot cues,
 * zona de loop y navegación interactiva por arrastre/clic.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CuePoint, DeckId } from '../types/dj';

interface WaveformCanvasProps {
  deckId: DeckId;
  peaks: Float32Array | undefined;
  duration: number;
  currentTime: number;
  bpm: number;
  firstBeatOffset?: number;
  hotCues: CuePoint[];
  loopStart: number | null;
  loopEnd: number | null;
  loopActive: boolean;
  onSeek: (seconds: number) => void;
  accentColor: string; // ej. '#06B6D4' para Deck A, '#F97316' para Deck B
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  deckId,
  peaks,
  duration,
  currentTime,
  bpm,
  firstBeatOffset = 0,
  hotCues,
  loopStart,
  loopEnd,
  loopActive,
  onSeek,
  accentColor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);
  const [zoom, setZoom] = useState<1 | 2 | 4>(1);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    seekFromEvent(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      seekFromEvent(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Nada
      }
    }
  };

  const seekFromEvent = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || duration <= 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const fraction = clickX / rect.width;

    if (zoom === 1) {
      onSeek(fraction * duration);
    } else {
      // Si hay zoom, la ventana se centra en currentTime
      const windowDuration = duration / zoom;
      const windowStart = Math.max(0, Math.min(currentTime - windowDuration / 2, duration - windowDuration));
      const targetTime = windowStart + fraction * windowDuration;
      onSeek(targetTime);
    }
  }, [duration, zoom, currentTime, onSeek]);

  // Dibujado del Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;

    // Fondo limpio
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, width, height);

    // Línea central de referencia
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();

    if (!peaks || peaks.length === 0 || duration <= 0) {
      // Estado vacío / Sin pista cargada
      ctx.fillStyle = '#4B5563';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Arrastra una canción o selecciona una demo para ver la forma de onda', width / 2, midY + 4);
      return;
    }

    const windowDuration = duration / zoom;
    const windowStart = zoom === 1 ? 0 : Math.max(0, Math.min(currentTime - windowDuration / 2, duration - windowDuration));
    const windowEnd = windowStart + windowDuration;

    // 1. Dibujar Zona de Loop si existe
    if (loopStart !== null && loopEnd !== null && loopEnd > loopStart) {
      const loopX1 = ((loopStart - windowStart) / windowDuration) * width;
      const loopX2 = ((loopEnd - windowStart) / windowDuration) * width;
      if (loopX2 > 0 && loopX1 < width) {
        ctx.fillStyle = loopActive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(107, 114, 128, 0.2)';
        ctx.fillRect(Math.max(0, loopX1), 0, Math.min(width, loopX2) - Math.max(0, loopX1), height);
        ctx.strokeStyle = loopActive ? '#10B981' : '#6B7280';
        ctx.lineWidth = 2;
        ctx.strokeRect(Math.max(0, loopX1), 1, Math.min(width, loopX2) - Math.max(0, loopX1), height - 2);
      }
    }

    // 2. Dibujar Beatgrid (Pulsos del compás)
    if (bpm > 0) {
      const beatInterval = 60 / bpm;
      const startBeat = Math.max(0, Math.floor((windowStart - firstBeatOffset) / beatInterval));
      const endBeat = Math.ceil((windowEnd - firstBeatOffset) / beatInterval);

      for (let b = startBeat; b <= endBeat; b++) {
        const beatTime = firstBeatOffset + b * beatInterval;
        if (beatTime >= windowStart && beatTime <= windowEnd) {
          const beatX = ((beatTime - windowStart) / windowDuration) * width;
          const isDownbeat = b % 4 === 0;
          ctx.strokeStyle = isDownbeat ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = isDownbeat ? 1.5 : 1;
          ctx.beginPath();
          ctx.moveTo(beatX, isDownbeat ? 2 : height * 0.2);
          ctx.lineTo(beatX, isDownbeat ? height - 2 : height * 0.8);
          ctx.stroke();
        }
      }
    }

    // 3. Dibujar Forma de Onda (Peaks)
    const totalPeaks = peaks.length;
    const startIndex = Math.floor((windowStart / duration) * totalPeaks);
    const endIndex = Math.min(totalPeaks, Math.ceil((windowEnd / duration) * totalPeaks));
    const renderPoints = endIndex - startIndex;

    if (renderPoints > 0) {
      const barWidth = Math.max(1.5, width / renderPoints);

      for (let i = 0; i < renderPoints; i++) {
        const peakIdx = startIndex + i;
        if (peakIdx >= totalPeaks) break;
        const amp = peaks[peakIdx];
        const barHeight = Math.max(2, amp * (height * 0.44));
        const x = (i / renderPoints) * width;

        const timeAtX = windowStart + (i / renderPoints) * windowDuration;
        const isPlayed = timeAtX <= currentTime;

        // Color más brillante antes del cabezal de reproducción
        if (isPlayed) {
          ctx.fillStyle = accentColor;
        } else {
          ctx.fillStyle = deckId === 'deckA' ? 'rgba(78, 168, 222, 0.35)' : 'rgba(249, 115, 22, 0.35)';
        }

        // Espejado simétrico arriba y abajo
        ctx.fillRect(x, midY - barHeight, barWidth - 0.5, barHeight * 2);
      }
    }

    // 4. Dibujar Hot Cues
    hotCues.forEach((cue) => {
      if (cue.time >= windowStart && cue.time <= windowEnd) {
        const cueX = ((cue.time - windowStart) / windowDuration) * width;
        ctx.fillStyle = cue.color;
        ctx.beginPath();
        // Marcador superior tipo banderín
        ctx.moveTo(cueX - 5, 2);
        ctx.lineTo(cueX + 5, 2);
        ctx.lineTo(cueX, 12);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = cue.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cueX, 12);
        ctx.lineTo(cueX, height - 2);
        ctx.stroke();

        // Número del Hot Cue
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${cue.id}`, cueX, 10);
      }
    });

    // 5. Cabezal de reproducción principal (Playhead)
    if (currentTime >= windowStart && currentTime <= windowEnd) {
      const playheadX = ((currentTime - windowStart) / windowDuration) * width;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Puntero triangular
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(playheadX - 6, 0);
      ctx.lineTo(playheadX + 6, 0);
      ctx.lineTo(playheadX, 8);
      ctx.closePath();
      ctx.fill();
    }
  }, [peaks, duration, currentTime, bpm, firstBeatOffset, hotCues, loopStart, loopEnd, loopActive, zoom, accentColor, deckId]);

  return (
    <div className="relative w-full h-24 bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800 shadow-inner group">
      <canvas
        ref={canvasRef}
        width={900}
        height={96}
        className="w-full h-full cursor-pointer select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Selector de Zoom */}
      <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5 border border-white/10 z-10">
        <span className="text-[10px] text-neutral-400 font-mono">ZOOM</span>
        {([1, 2, 4] as const).map((z) => (
          <button
            key={z}
            onClick={() => setZoom(z)}
            className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${
              zoom === z ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {z}x
          </button>
        ))}
      </div>
    </div>
  );
};
