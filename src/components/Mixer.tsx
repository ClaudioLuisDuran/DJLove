/**
 * Componente Mezclador Central (Mixer) de 2 canales para FIESTA MIX
 * Ecualizador de 3 bandas con Kill switches, medidores VU de alta precisión,
 * faders de canal, crossfader con curvas configurables,
 * botones destacados "MEZCLAR AHORA" (MIX NOW) y "FIN SUAVE" (END SMOOTH).
 */

import React, { useState } from 'react';
import { DeckState, MixerState, TransitionConfig, CrossfaderCurve, TransitionMode } from '../types/dj';
import { Sliders, Headphones, Volume2, Wand2, ShieldAlert, Zap } from 'lucide-react';

interface MixerProps {
  deckA: DeckState;
  deckB: DeckState;
  mixerState: MixerState;
  vuLevels: {
    deckA: { level: number; clip: boolean };
    deckB: { level: number; clip: boolean };
    masterL: { level: number; clip: boolean };
    masterR: { level: number; clip: boolean };
  };
  transitionConfig: TransitionConfig;
  onSetGain: (deckId: 'deckA' | 'deckB', gain: number) => void;
  onSetEq: (deckId: 'deckA' | 'deckB', band: 'high' | 'mid' | 'low', val: number) => void;
  onToggleKill: (deckId: 'deckA' | 'deckB', band: 'high' | 'mid' | 'low') => void;
  onSetChannelVolume: (deckId: 'deckA' | 'deckB', vol: number) => void;
  onSetCrossfader: (val: number) => void;
  onSetCrossfaderCurve: (curve: CrossfaderCurve) => void;
  onSetMasterVolume: (vol: number) => void;
  onSetHeadphoneVolume: (vol: number) => void;
  onSetHeadphoneCueMix: (mix: number) => void;
  onStartTransition: () => void;
  onStartSmoothFadeOut: () => void;
  onUpdateTransitionConfig: (config: Partial<TransitionConfig>) => void;
  isTransitioning: boolean;
}

export const Mixer: React.FC<MixerProps> = ({
  deckA,
  deckB,
  mixerState,
  vuLevels,
  transitionConfig,
  onSetGain,
  onSetEq,
  onToggleKill,
  onSetChannelVolume,
  onSetCrossfader,
  onSetCrossfaderCurve,
  onSetMasterVolume,
  onSetHeadphoneVolume,
  onSetHeadphoneCueMix,
  onStartTransition,
  onStartSmoothFadeOut,
  onUpdateTransitionConfig,
  isTransitioning,
}) => {
  const [showTransitionMenu, setShowTransitionMenu] = useState(false);

  // Renderizador de barra LED para VU Meter
  const renderVuMeter = (level: number, clip: boolean) => {
    const totalBars = 12;
    const activeBars = Math.round(level * totalBars);

    return (
      <div className="flex flex-col-reverse gap-[2px] w-2.5 h-28 bg-neutral-950 p-[2px] rounded border border-neutral-800">
        {Array.from({ length: totalBars }).map((_, idx) => {
          const isLit = idx < activeBars;
          let barColor = 'bg-neutral-800';

          if (isLit) {
            if (idx >= 10) barColor = 'bg-rose-500 shadow-sm shadow-rose-500/50'; // Rojo / Pico
            else if (idx >= 7) barColor = 'bg-amber-400'; // Amarillo
            else barColor = 'bg-emerald-500'; // Verde
          }

          return <div key={idx} className={`w-full h-1.5 rounded-[1px] ${barColor}`} />;
        })}
        {clip && <div className="w-full h-1.5 rounded-[1px] bg-red-600 animate-ping" />}
      </div>
    );
  };

  return (
    <div className="flex flex-col justify-between bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-2xl">
      {/* 1. SECCIÓN SUPERIOR: GANANCIA & EQ DE 3 BANDAS (A y B) */}
      <div className="grid grid-cols-2 gap-4 pb-3 border-b border-neutral-800">
        {/* CANAL A EQ */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono font-bold text-[#4EA8DE] mb-1">CANAL A</span>

          {/* Ganancia (Trim) */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-mono text-neutral-400">TRIM</span>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.05}
              value={deckA.gain}
              onChange={(e) => onSetGain('deckA', parseFloat(e.target.value))}
              className="w-16 h-1 accent-[#4EA8DE] cursor-pointer"
            />
          </div>

          {/* EQ: HIGH, MID, LOW */}
          <div className="flex flex-col gap-1.5 w-full">
            {/* HIGH */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-neutral-400 w-7">HI</span>
              <input
                type="range"
                min={-30}
                max={6}
                value={deckA.eqHigh}
                onChange={(e) => onSetEq('deckA', 'high', parseFloat(e.target.value))}
                className="w-20 h-1.5 accent-[#4EA8DE] cursor-pointer"
              />
              <button
                onClick={() => onToggleKill('deckA', 'high')}
                className={`text-[9px] font-mono px-1 py-0.5 rounded border ${
                  deckA.eqHighKill ? 'bg-rose-600 text-white border-rose-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                KILL
              </button>
            </div>

            {/* MID */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-neutral-400 w-7">MID</span>
              <input
                type="range"
                min={-30}
                max={6}
                value={deckA.eqMid}
                onChange={(e) => onSetEq('deckA', 'mid', parseFloat(e.target.value))}
                className="w-20 h-1.5 accent-[#4EA8DE] cursor-pointer"
              />
              <button
                onClick={() => onToggleKill('deckA', 'mid')}
                className={`text-[9px] font-mono px-1 py-0.5 rounded border ${
                  deckA.eqMidKill ? 'bg-rose-600 text-white border-rose-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                KILL
              </button>
            </div>

            {/* LOW (Graves) */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-neutral-400 w-7">LOW</span>
              <input
                type="range"
                min={-30}
                max={6}
                value={deckA.eqLow}
                onChange={(e) => onSetEq('deckA', 'low', parseFloat(e.target.value))}
                className="w-20 h-1.5 accent-[#4EA8DE] cursor-pointer"
              />
              <button
                onClick={() => onToggleKill('deckA', 'low')}
                className={`text-[9px] font-mono px-1 py-0.5 rounded border ${
                  deckA.eqLowKill ? 'bg-rose-600 text-white border-rose-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                KILL
              </button>
            </div>
          </div>
        </div>

        {/* CANAL B EQ */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono font-bold text-orange-400 mb-1">CANAL B</span>

          {/* Ganancia (Trim) */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-mono text-neutral-400">TRIM</span>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.05}
              value={deckB.gain}
              onChange={(e) => onSetGain('deckB', parseFloat(e.target.value))}
              className="w-16 h-1 accent-orange-400 cursor-pointer"
            />
          </div>

          {/* EQ: HIGH, MID, LOW */}
          <div className="flex flex-col gap-1.5 w-full">
            {/* HIGH */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-neutral-400 w-7">HI</span>
              <input
                type="range"
                min={-30}
                max={6}
                value={deckB.eqHigh}
                onChange={(e) => onSetEq('deckB', 'high', parseFloat(e.target.value))}
                className="w-20 h-1.5 accent-orange-400 cursor-pointer"
              />
              <button
                onClick={() => onToggleKill('deckB', 'high')}
                className={`text-[9px] font-mono px-1 py-0.5 rounded border ${
                  deckB.eqHighKill ? 'bg-rose-600 text-white border-rose-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                KILL
              </button>
            </div>

            {/* MID */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-neutral-400 w-7">MID</span>
              <input
                type="range"
                min={-30}
                max={6}
                value={deckB.eqMid}
                onChange={(e) => onSetEq('deckB', 'mid', parseFloat(e.target.value))}
                className="w-20 h-1.5 accent-orange-400 cursor-pointer"
              />
              <button
                onClick={() => onToggleKill('deckB', 'mid')}
                className={`text-[9px] font-mono px-1 py-0.5 rounded border ${
                  deckB.eqMidKill ? 'bg-rose-600 text-white border-rose-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                KILL
              </button>
            </div>

            {/* LOW (Graves) */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-neutral-400 w-7">LOW</span>
              <input
                type="range"
                min={-30}
                max={6}
                value={deckB.eqLow}
                onChange={(e) => onSetEq('deckB', 'low', parseFloat(e.target.value))}
                className="w-20 h-1.5 accent-orange-400 cursor-pointer"
              />
              <button
                onClick={() => onToggleKill('deckB', 'low')}
                className={`text-[9px] font-mono px-1 py-0.5 rounded border ${
                  deckB.eqLowKill ? 'bg-rose-600 text-white border-rose-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                KILL
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ZONA CENTRAL: FADERS DE CANAL Y VU METERS */}
      <div className="flex items-center justify-center gap-6 py-3">
        {/* Fader Canal A */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-mono text-neutral-400 mb-1">FADER A</span>
          <div className="relative h-28 flex items-center justify-center">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={deckA.volume}
              onChange={(e) => onSetChannelVolume('deckA', parseFloat(e.target.value))}
              className="h-28 w-2 accent-[#4EA8DE] cursor-pointer"
              style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
            />
          </div>
        </div>

        {/* Medidor VU A */}
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-mono text-neutral-500 mb-1">VU A</span>
          {renderVuMeter(vuLevels.deckA.level, vuLevels.deckA.clip)}
        </div>

        {/* Medidores Master Estéreo L y R */}
        <div className="flex flex-col items-center bg-black/40 p-1.5 rounded-lg border border-neutral-800">
          <span className="text-[8px] font-mono text-neutral-400 mb-1">MASTER</span>
          <div className="flex items-center gap-1">
            {renderVuMeter(vuLevels.masterL.level, vuLevels.masterL.clip)}
            {renderVuMeter(vuLevels.masterR.level, vuLevels.masterR.clip)}
          </div>
        </div>

        {/* Medidor VU B */}
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-mono text-neutral-500 mb-1">VU B</span>
          {renderVuMeter(vuLevels.deckB.level, vuLevels.deckB.clip)}
        </div>

        {/* Fader Canal B */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-mono text-neutral-400 mb-1">FADER B</span>
          <div className="relative h-28 flex items-center justify-center">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={deckB.volume}
              onChange={(e) => onSetChannelVolume('deckB', parseFloat(e.target.value))}
              className="h-28 w-2 accent-orange-400 cursor-pointer"
              style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
            />
          </div>
        </div>
      </div>

      {/* 3. BOTONES DE ACCIÓN PRINCIPALES: MEZCLAR AHORA & FIN SUAVE */}
      <div className="grid grid-cols-2 gap-2 my-2">
        {/* BOTÓN MEZCLAR AHORA (MIX NOW) */}
        <button
          onClick={onStartTransition}
          disabled={isTransitioning}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg font-black text-xs tracking-wider border shadow-lg transition active:scale-95 ${
            isTransitioning
              ? 'bg-[#3A8CC0] text-white border-[#4EA8DE] animate-pulse'
              : 'bg-gradient-to-r from-[#3582B6] to-[#4EA8DE] hover:from-[#2F73A3] hover:to-[#4396C7] text-white border-[#4EA8DE]/50 shadow-md shadow-[#4EA8DE]/20'
          }`}
        >
          <Wand2 size={16} />
          <span>{isTransitioning ? 'MEZCLANDO...' : 'MEZCLAR AHORA'}</span>
        </button>

        {/* BOTÓN FIN SUAVE (END SMOOTH) */}
        <button
          onClick={onStartSmoothFadeOut}
          title="Salida progresiva suave sin cortes abruptos"
          className="flex items-center justify-center gap-2 py-3 px-3 rounded-lg font-bold text-xs tracking-wider bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/30 shadow-md active:scale-95 transition"
        >
          <Zap size={15} />
          <span>FIN SUAVE</span>
        </button>
      </div>

      {/* Selector de Configuración de Transición Rápida */}
      <div className="flex items-center justify-between px-2 py-1 bg-neutral-950/70 rounded text-[10px] font-mono mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500">MODO:</span>
          <select
            value={transitionConfig.mode}
            onChange={(e) => onUpdateTransitionConfig({ mode: e.target.value as TransitionMode })}
            className="bg-neutral-800 text-white rounded px-1.5 py-0.5 border border-neutral-700 cursor-pointer"
          >
            <option value="smooth">Suave (Fade)</option>
            <option value="bass_swap">Bass Swap (EQ)</option>
            <option value="quick_cut">Corte Rápido</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500">DURACIÓN:</span>
          <select
            value={transitionConfig.durationSeconds}
            onChange={(e) => onUpdateTransitionConfig({ durationSeconds: parseInt(e.target.value) })}
            className="bg-neutral-800 text-white rounded px-1.5 py-0.5 border border-neutral-700 cursor-pointer"
          >
            <option value={4}>4s (Rápida)</option>
            <option value={8}>8s (Estándar)</option>
            <option value={12}>12s (Lenta)</option>
            <option value={16}>16s (Ultra)</option>
          </select>
        </div>
      </div>

      {/* 4. CROSSFADER HORIZONTAL */}
      <div className="flex flex-col bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
          <span className="text-cyan-400 font-bold">DECK A</span>
          <div className="flex items-center gap-2">
            <span>CURVA:</span>
            <button
              onClick={() => onSetCrossfaderCurve('smooth')}
              className={`px-1.5 py-0.5 rounded transition ${
                mixerState.crossfaderCurve === 'smooth' ? 'bg-white text-black font-bold' : 'text-neutral-500'
              }`}
            >
              SUAVE
            </button>
            <button
              onClick={() => onSetCrossfaderCurve('cut')}
              className={`px-1.5 py-0.5 rounded transition ${
                mixerState.crossfaderCurve === 'cut' ? 'bg-white text-black font-bold' : 'text-neutral-500'
              }`}
            >
              CORTE
            </button>
          </div>
          <span className="text-orange-400 font-bold">DECK B</span>
        </div>

        {/* Fader Horizontal */}
        <div className="relative flex items-center my-1">
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={mixerState.crossfader}
            onChange={(e) => onSetCrossfader(parseFloat(e.target.value))}
            className="w-full h-3 accent-white cursor-pointer"
          />
          {/* Marca de centro exacta */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-neutral-500 pointer-events-none" />
        </div>

        {/* Botones de salto a extremos A / CENTRO / B */}
        <div className="flex items-center justify-between mt-1">
          <button
            onClick={() => onSetCrossfader(-1)}
            className="text-[9px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-[#4EA8DE] hover:bg-neutral-700"
          >
            SOLO A
          </button>
          <button
            onClick={() => onSetCrossfader(0)}
            className="text-[9px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
          >
            CENTRO (50/50)
          </button>
          <button
            onClick={() => onSetCrossfader(1)}
            className="text-[9px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-orange-400 hover:bg-neutral-700"
          >
            SOLO B
          </button>
        </div>
      </div>
    </div>
  );
};
