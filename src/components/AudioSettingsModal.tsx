/**
 * Componente Configuración de Audio y Preescucha (Headphones / CUE)
 * Selección de tarjetas de sonido, soporte para modo Split-Stereo
 * e información técnica transparente sobre los requisitos de hardware en notebooks.
 */

import React, { useState, useEffect } from 'react';
import { AudioDeviceConfig } from '../types/dj';
import { Headphones, Volume2, Split, Info, Check, AlertCircle } from 'lucide-react';

interface AudioSettingsProps {
  config: AudioDeviceConfig;
  onUpdateConfig: (newConfig: Partial<AudioDeviceConfig>) => void;
  headphoneVolume: number;
  onSetHeadphoneVolume: (vol: number) => void;
  headphoneCueMix: number;
  onSetHeadphoneCueMix: (mix: number) => void;
}

export const AudioSettings: React.FC<AudioSettingsProps> = ({
  config,
  onUpdateConfig,
  headphoneVolume,
  onSetHeadphoneVolume,
  headphoneCueMix,
  onSetHeadphoneCueMix,
}) => {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [hasMultipleOutputs, setHasMultipleOutputs] = useState(false);

  useEffect(() => {
    // Enumerar dispositivos de salida de audio reales disponibles
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const audioOutputs = devices.filter((d) => d.kind === 'audiooutput');
        setAudioDevices(audioOutputs);
        setHasMultipleOutputs(audioOutputs.length > 1);
      }).catch(() => {
        // En navegadores donde esté restringido
      });
    }
  }, []);

  return (
    <div className="flex flex-col h-72 bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-xl overflow-y-auto text-neutral-200">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-500/20 text-amber-400">
            <Headphones size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Enrutamiento de Audio & Preescucha en Auriculares
            </h3>
            <p className="text-[10px] text-neutral-400">
              Escucha la próxima canción en auriculares mientras el público oye la mezcla en los altavoces
            </p>
          </div>
        </div>

        {/* Indicador de Modo Activo */}
        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
            config.splitStereoMode
              ? 'bg-[#4EA8DE]/20 text-[#4EA8DE] border-[#4EA8DE]/30'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          }`}
        >
          {config.splitStereoMode ? 'MODO CABLE SPLITTER (1 SALIDA)' : 'MODO SALIDAS INDEPENDIENTES'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Columna 1: Modos de Preescucha */}
        <div className="flex flex-col gap-3 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
          <span className="text-[10px] font-mono text-neutral-400 uppercase">
            CONFIGURACIÓN DEL HARDWARE
          </span>

          {/* Opción A: Modo Split Stereo */}
          <div
            onClick={() => onUpdateConfig({ splitStereoMode: true })}
            className={`p-2.5 rounded-lg border cursor-pointer transition ${
              config.splitStereoMode
                ? 'bg-neutral-900 border-[#4EA8DE]/50'
                : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                <Split size={14} className="text-[#4EA8DE]" />
                <span>Modo Split-Stereo (Recomendado para Notebooks)</span>
              </div>
              {config.splitStereoMode && <Check size={14} className="text-[#4EA8DE]" />}
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Divide la salida única de auriculares de tu notebook en dos canales mono con un cable divisor DJ:
              <strong className="text-[#4EA8DE]"> Canal Izquierdo = Parlantes Master</strong> y{' '}
              <strong className="text-amber-300"> Canal Derecho = Auriculares CUE</strong>.
            </p>
          </div>

          {/* Opción B: Salidas independientes */}
          <div
            onClick={() => onUpdateConfig({ splitStereoMode: false })}
            className={`p-2.5 rounded-lg border cursor-pointer transition ${
              !config.splitStereoMode
                ? 'bg-neutral-900 border-emerald-500/50'
                : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                <Headphones size={14} className="text-emerald-400" />
                <span>Interfaz USB / Placa de Sonido Multi-Salida</span>
              </div>
              {!config.splitStereoMode && <Check size={14} className="text-emerald-400" />}
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Para usuarios con placa de sonido USB (4 canales o dos dispositivos de audio diferentes).
            </p>
          </div>
        </div>

        {/* Columna 2: Niveles y Dispositivos */}
        <div className="flex flex-col gap-3 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
          <span className="text-[10px] font-mono text-neutral-400 uppercase">
            CONTROLES DE AURICULARES
          </span>

          {/* Volumen de auriculares */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-300 font-semibold">Volumen Auriculares</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={headphoneVolume}
                onChange={(e) => onSetHeadphoneVolume(parseFloat(e.target.value))}
                className="w-28 h-1.5 accent-amber-400 cursor-pointer"
              />
              <span className="text-xs font-mono text-amber-400 tabular-nums w-8">
                {Math.round(headphoneVolume * 100)}%
              </span>
            </div>
          </div>

          {/* Mezcla Cue / Master en Auriculares */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-neutral-300 font-semibold">Balance CUE / MASTER</span>
              <span className="text-[9px] text-neutral-500">Solo Preescucha &lt;--&gt; Salida General</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={headphoneCueMix}
                onChange={(e) => onSetHeadphoneCueMix(parseFloat(e.target.value))}
                className="w-28 h-1.5 accent-amber-400 cursor-pointer"
              />
              <span className="text-xs font-mono text-neutral-400 tabular-nums w-8">
                {headphoneCueMix === 0 ? 'CUE' : headphoneCueMix === 1 ? 'MST' : `${Math.round(headphoneCueMix * 100)}%`}
              </span>
            </div>
          </div>

          {/* Dispositivos detectados */}
          <div className="pt-2 border-t border-neutral-800/80">
            <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">
              DISPOSITIVOS DETECTADOS ({audioDevices.length})
            </span>
            {audioDevices.length > 0 ? (
              <div className="space-y-1">
                {audioDevices.map((dev, idx) => (
                  <div key={dev.deviceId || idx} className="text-[11px] text-neutral-400 truncate">
                    • {dev.label || `Salida de Audio ${idx + 1}`}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-neutral-500">
                Salida predeterminada del sistema operativo activa.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
