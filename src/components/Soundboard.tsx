/**
 * Componente Soundboard para Animación de Fiestas
 * Efectos de sonido rápidos (Bocina, Aplausos, Redoble, Silbato, Sirena, Scratch, etc.)
 * con reproducción instantánea superpuesta, atajos de teclado y volumen dedicado.
 */

import React, { useRef } from 'react';
import { SoundboardItem } from '../types/dj';
import { Volume2, Sparkles, Plus, ShieldAlert, Upload } from 'lucide-react';

interface SoundboardProps {
  items: SoundboardItem[];
  onPlaySound: (soundType: string, volume: number, customId?: string) => void;
  onSetItemVolume: (id: string, vol: number) => void;
  masterSfxVolume: number;
  onSetMasterSfxVolume: (vol: number) => void;
  onAddCustomSound: (name: string, file: File) => void;
  onEmergencySilence: () => void;
}

export const Soundboard: React.FC<SoundboardProps> = ({
  items,
  onPlaySound,
  onSetItemVolume,
  masterSfxVolume,
  onSetMasterSfxVolume,
  onAddCustomSound,
  onEmergencySilence,
}) => {
  const customFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const name = file.name.replace(/\.[^/.]+$/, '');
      onAddCustomSound(name, file);
    }
  };

  return (
    <div className="flex flex-col h-72 bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-xl overflow-hidden">
      {/* Cabecera del Soundboard */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-orange-500/20 text-orange-400">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Soundboard Animador de Fiesta
            </h3>
            <p className="text-[10px] text-neutral-400">
              Dispara efectos en vivo sobre la música sin cortar los decks
            </p>
          </div>
        </div>

        {/* Controles de Volumen y Carga */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800">
            <Volume2 size={13} className="text-neutral-400" />
            <span className="text-[10px] font-mono text-neutral-400">VOL SFX</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={masterSfxVolume}
              onChange={(e) => onSetMasterSfxVolume(parseFloat(e.target.value))}
              className="w-20 h-1.5 accent-orange-400 cursor-pointer"
            />
          </div>

          <input
            type="file"
            ref={customFileInputRef}
            accept="audio/*,.mp3,.wav"
            className="hidden"
            onChange={handleCustomFileUpload}
          />
          <button
            onClick={() => customFileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
          >
            <Upload size={13} />
            <span>Agregar Sonido Propio</span>
          </button>

          <button
            onClick={onEmergencySilence}
            title="Detener todos los efectos de sonido"
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600 hover:text-white transition"
          >
            <ShieldAlert size={13} />
            <span>SILENCIAR</span>
          </button>
        </div>
      </div>

      {/* Rejilla de Botones de Sonido (Pads) */}
      <div className="grid grid-cols-5 gap-2.5 flex-1 overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 rounded-lg p-2 transition shadow group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                [{item.hotkey}]
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={item.volume}
                onChange={(e) => onSetItemVolume(item.id, parseFloat(e.target.value))}
                className="w-12 h-1 accent-orange-400 cursor-pointer opacity-70 group-hover:opacity-100"
                title={`Volumen individual: ${Math.round(item.volume * 100)}%`}
              />
            </div>

            <button
              onClick={() => onPlaySound(item.soundType || 'airhorn', item.volume, item.id)}
              className="py-3 px-2 rounded-md font-bold text-xs tracking-wide text-white transition active:scale-95 shadow-md flex flex-col items-center justify-center gap-1 mt-1 text-center"
              style={{
                backgroundColor: item.color,
                boxShadow: `0 4px 12px ${item.color}30`,
              }}
            >
              <span className="truncate w-full drop-shadow-sm font-extrabold">{item.name}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
