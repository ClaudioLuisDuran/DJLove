/**
 * Componente Deck de DJ (DECK A o DECK B)
 * Controles de transporte, forma de onda, jogwheel, pitch fader, sync, cues, loops y efectos.
 */

import React, { useState } from 'react';
import { DeckId, DeckState, TrackMetadata, CuePoint } from '../types/dj';
import { WaveformCanvas } from './WaveformCanvas';
import { JogWheel } from './JogWheel';
import { APP_CONFIG } from '../config/appConfig';
import {
  Play,
  Pause,
  RotateCcw,
  Headphones,
  Sliders,
  Sparkles,
  Zap,
  Disc3,
  X,
  Plus,
  RefreshCw,
} from 'lucide-react';

interface DeckProps {
  state: DeckState;
  otherDeckState: DeckState;
  onPlay: (deckId: DeckId) => void;
  onPause: (deckId: DeckId) => void;
  onStop: (deckId: DeckId) => void;
  onSeek: (deckId: DeckId, time: number) => void;
  onUnload: (deckId: DeckId) => void;
  onSetPitch: (deckId: DeckId, pitchPercent: number) => void;
  onSetPitchRange: (deckId: DeckId, range: 8 | 16 | 32) => void;
  onToggleKeyLock: (deckId: DeckId) => void;
  onSync: (deckId: DeckId) => void;
  onTapBpm: (deckId: DeckId) => void;
  onNudge: (deckId: DeckId, direction: 'forward' | 'backward') => void;
  onSetHotCue: (deckId: DeckId, cueId: number) => void;
  onJumpHotCue: (deckId: DeckId, cue: CuePoint) => void;
  onDeleteHotCue: (deckId: DeckId, cueId: number) => void;
  onSetLoop: (deckId: DeckId, beats: number) => void;
  onToggleLoop: (deckId: DeckId) => void;
  onSetFilter: (deckId: DeckId, value: number) => void;
  onToggleFx: (deckId: DeckId, fxName: 'echo' | 'flanger' | 'reverb' | 'brake') => void;
  onResetFx: (deckId: DeckId) => void;
  onToggleCue: (deckId: DeckId) => void;
  onScratchMove: (deckId: DeckId, deltaSeconds: number, speedMultiplier: number) => void;
  onScratchEnd: (deckId: DeckId) => void;
  onVinylBrake: (deckId: DeckId) => void;
  isOnAir: boolean;
}

export const Deck: React.FC<DeckProps> = ({
  state,
  otherDeckState,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onUnload,
  onSetPitch,
  onSetPitchRange,
  onToggleKeyLock,
  onSync,
  onTapBpm,
  onNudge,
  onSetHotCue,
  onJumpHotCue,
  onDeleteHotCue,
  onSetLoop,
  onToggleLoop,
  onSetFilter,
  onToggleFx,
  onResetFx,
  onToggleCue,
  onScratchMove,
  onScratchEnd,
  onVinylBrake,
  isOnAir,
}) => {
  const isDeckA = state.id === 'deckA';
  const accentColor = isDeckA ? '#4EA8DE' : '#F97316';
  const accentBorder = isDeckA ? 'border-[#4EA8DE]/40' : 'border-orange-500/40';
  const [activeTab, setActiveTab] = useState<'cues' | 'loops' | 'fx'>('cues');
  const [deleteMode, setDeleteMode] = useState(false);

  // Formateador de tiempo mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const remainingTime = Math.max(0, state.duration - state.currentTime);

  return (
    <div
      className={`flex flex-col bg-neutral-900 border ${accentBorder} rounded-xl p-3 shadow-xl transition-all ${
        isOnAir ? 'ring-1 ring-white/10' : 'opacity-95'
      }`}
    >
      {/* 1. CABECERA DEL DECK: Nombre, Título de canción y Estado */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded text-xs font-black tracking-wider text-black"
            style={{ backgroundColor: accentColor }}
          >
            {isDeckA ? 'DECK A' : 'DECK B'}
          </span>

          {isOnAir && (
            <span className="text-[10px] font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
              EN VIVO
            </span>
          )}

          <div className="flex flex-col ml-1 max-w-[220px]">
            <span className="text-sm font-bold text-white truncate leading-tight">
              {state.loadedTrack ? state.loadedTrack.title : 'Sin pista cargada'}
            </span>
            <span className="text-xs text-neutral-400 truncate">
              {state.loadedTrack ? state.loadedTrack.artist : 'Selecciona una canción abajo'}
            </span>
          </div>
        </div>

        {/* Info BPM y Tonalidad */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-mono font-black tabular-nums text-white">
                {state.bpm.toFixed(1)}
              </span>
              <span className="text-[10px] font-mono text-neutral-400">BPM</span>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">
              Orig: {state.originalBpm > 0 ? state.originalBpm.toFixed(1) : '--'}
            </span>
          </div>

          {state.loadedTrack?.key && (
            <div className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 flex flex-col items-center">
              <span className="text-[9px] text-neutral-400">KEY</span>
              <span className="text-xs font-bold text-amber-400 font-mono">
                {state.loadedTrack.key}
              </span>
            </div>
          )}

          {state.loadedTrack && (
            <button
              onClick={() => onUnload(state.id)}
              title="Expulsar pista del deck"
              className="p-1 rounded text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 2. FORMA DE ONDA NAVEGABLE */}
      <div className="mb-2">
        <WaveformCanvas
          deckId={state.id}
          peaks={state.loadedTrack?.waveformData}
          duration={state.duration}
          currentTime={state.currentTime}
          bpm={state.bpm}
          firstBeatOffset={0}
          hotCues={state.loadedTrack?.hotCues || []}
          loopStart={state.loopStart}
          loopEnd={state.loopEnd}
          loopActive={state.loopActive}
          onSeek={(time) => onSeek(state.id, time)}
          accentColor={accentColor}
        />
      </div>

      {/* 3. VISOR DE TIEMPO (Transcurrido y Restante) */}
      <div className="flex items-center justify-between px-2 py-1 mb-2 bg-neutral-950/80 rounded border border-neutral-800/60 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-neutral-500">TRANSCURRIDO</span>
          <span className="text-white font-bold tabular-nums text-sm">
            {formatTime(state.currentTime)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-neutral-500">RESTANTE</span>
          <span className="text-neutral-300 font-bold tabular-nums text-sm">
            -{formatTime(remainingTime)}
          </span>
        </div>
      </div>

      {/* 4. CUERPO PRINCIPAL: Jogwheel a la izquierda, Pitch Fader a la derecha */}
      <div className="grid grid-cols-12 gap-3 items-center mb-3">
        {/* Jogwheel de vinilo para scratch y rotación */}
        <div className="col-span-8 flex justify-center py-1">
          <JogWheel
            deckId={state.id}
            isPlaying={state.isPlaying}
            accentColor={accentColor}
            onScratchMove={(delta, speed) => onScratchMove(state.id, delta, speed)}
            onScratchEnd={() => onScratchEnd(state.id)}
            onNudge={(dir) => onNudge(state.id, dir)}
          />
        </div>

        {/* Pitch Fader vertical y controles de tempo */}
        <div className="col-span-4 flex flex-col items-center bg-neutral-950/60 p-2 rounded-lg border border-neutral-800">
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[10px] font-mono text-neutral-400">TEMPO</span>
            <span
              className={`text-xs font-mono font-bold tabular-nums ${
                state.pitchPercent === 0
                  ? 'text-neutral-400'
                  : state.pitchPercent > 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {state.pitchPercent >= 0 ? `+${state.pitchPercent.toFixed(1)}` : state.pitchPercent.toFixed(1)}%
            </span>
          </div>

          {/* Fader vertical de pitch */}
          <div className="relative h-28 flex items-center justify-center my-1">
            <input
              type="range"
              min={-state.pitchRange}
              max={state.pitchRange}
              step={0.1}
              value={state.pitchPercent}
              onChange={(e) => onSetPitch(state.id, parseFloat(e.target.value))}
              className="h-24 w-2 cursor-pointer accent-[#4EA8DE]"
              style={{
                writingMode: 'vertical-lr',
                direction: 'rtl',
              }}
            />
            {/* Marca de centro 0% */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-neutral-600 pointer-events-none" />
          </div>

          {/* Reset a 0% */}
          <button
            onClick={() => onSetPitch(state.id, 0)}
            title="Restablecer velocidad original (0%)"
            className="text-[9px] font-mono px-2 py-0.5 mt-1 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition"
          >
            RESET 0%
          </button>

          {/* Selector de Rango y Key Lock */}
          <div className="flex items-center gap-1 mt-2">
            <button
              onClick={() => {
                const nextRange = state.pitchRange === 8 ? 16 : state.pitchRange === 16 ? 32 : 8;
                onSetPitchRange(state.id, nextRange);
              }}
              title="Cambiar rango de tempo (±8%, ±16%, ±32%)"
              className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white"
            >
              ±{state.pitchRange}%
            </button>
            <button
              onClick={() => onToggleKeyLock(state.id)}
              title="Bloqueo de Tono (Key Lock / Master Tempo)"
              className={`px-1.5 py-0.5 text-[9px] font-mono rounded border transition ${
                state.keyLock
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400'
              }`}
            >
              KEY
            </button>
          </div>
        </div>
      </div>

      {/* 5. BOTONES DE TRANSPORTE Y SINCRONIZACIÓN */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {/* PLAY / PAUSE */}
        <button
          onClick={() => (state.isPlaying ? onPause(state.id) : onPlay(state.id))}
          className={`col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm shadow-md transition active:scale-95 ${
            state.isPlaying
              ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
              : 'bg-neutral-800 hover:bg-neutral-700 text-white'
          }`}
        >
          {state.isPlaying ? <Pause size={18} /> : <Play size={18} />}
          <span>{state.isPlaying ? 'PAUSA' : 'PLAY'}</span>
        </button>

        {/* CUE (Vuelta al inicio / marcador) */}
        <button
          onClick={() => onStop(state.id)}
          title="Saltar al inicio / CUE principal"
          className="flex items-center justify-center gap-1 py-2.5 rounded-lg font-bold text-xs bg-neutral-800 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 active:scale-95 transition"
        >
          <RotateCcw size={15} />
          <span>CUE</span>
        </button>

        {/* SYNC INTELIGENTE */}
        <button
          onClick={() => onSync(state.id)}
          title="Sincronizar BPM y pulsos con el otro deck"
          className={`flex items-center justify-center gap-1 py-2.5 rounded-lg font-black text-xs border active:scale-95 transition ${
            state.isSync
              ? 'bg-[#4EA8DE] text-black border-[#4EA8DE] shadow-md shadow-[#4EA8DE]/30'
              : 'bg-neutral-800 hover:bg-[#4EA8DE]/20 text-[#4EA8DE] border-[#4EA8DE]/30'
          }`}
        >
          <RefreshCw size={14} className={state.isSync ? 'animate-spin' : ''} />
          <span>SYNC</span>
        </button>
      </div>

      {/* 6. PESTAÑAS DE CONTROLES INFERIORES: HOT CUES | LOOPS | EFECTOS */}
      <div className="flex items-center justify-between border-b border-neutral-800 mb-2 pb-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('cues')}
            className={`px-3 py-1 text-xs font-semibold rounded transition ${
              activeTab === 'cues' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Hot Cues
          </button>
          <button
            onClick={() => setActiveTab('loops')}
            className={`px-3 py-1 text-xs font-semibold rounded transition ${
              activeTab === 'loops' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Loops
          </button>
          <button
            onClick={() => setActiveTab('fx')}
            className={`px-3 py-1 text-xs font-semibold rounded transition ${
              activeTab === 'fx' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Efectos (FX)
          </button>
        </div>

        {/* Botón de Preescucha para Auriculares */}
        <button
          onClick={() => onToggleCue(state.id)}
          title="Escuchar este deck en auriculares (CUE)"
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded border transition ${
            state.cueActive
              ? 'bg-amber-500 text-black border-amber-400'
              : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-amber-400'
          }`}
        >
          <Headphones size={13} />
          <span>AURIC</span>
        </button>
      </div>

      {/* CONTENIDO DE LA PESTAÑA SELECCIONADA */}
      <div className="min-h-[76px]">
        {/* PESTAÑA 1: HOT CUES (1 al 8) */}
        {activeTab === 'cues' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-neutral-400 font-mono">PUNTOS HOT CUE (1-8)</span>
              <button
                onClick={() => setDeleteMode(!deleteMode)}
                className={`text-[10px] px-2 py-0.5 rounded font-mono transition ${
                  deleteMode ? 'bg-rose-600 text-white font-bold' : 'text-neutral-500 hover:text-rose-400'
                }`}
              >
                {deleteMode ? 'LISTO' : 'ELIMINAR'}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {([1, 2, 3, 4, 5, 6, 7, 8] as const).map((cueId) => {
                const existingCue = state.loadedTrack?.hotCues?.find((c) => c.id === cueId);
                const color = APP_CONFIG.hotCueColors[cueId - 1];

                return (
                  <button
                    key={cueId}
                    onClick={() => {
                      if (deleteMode && existingCue) {
                        onDeleteHotCue(state.id, cueId);
                      } else if (existingCue) {
                        onJumpHotCue(state.id, existingCue);
                      } else {
                        onSetHotCue(state.id, cueId);
                      }
                    }}
                    style={{
                      borderColor: existingCue ? color : '#333',
                      backgroundColor: existingCue ? `${color}25` : '#171717',
                    }}
                    className={`flex items-center justify-between px-2 py-1.5 rounded border text-xs font-mono font-bold transition active:scale-95 ${
                      existingCue ? 'text-white' : 'text-neutral-500 hover:border-neutral-600'
                    }`}
                  >
                    <span>{cueId}</span>
                    <span className="text-[10px] font-normal">
                      {existingCue ? formatTime(existingCue.time) : '+'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PESTAÑA 2: LOOPS DE BEATS (1, 2, 4, 8, 16) */}
        {activeTab === 'loops' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-neutral-400 font-mono">BUCLES POR COMPÁS (BEATS)</span>
              {state.loopActive && (
                <span className="text-[10px] text-emerald-400 font-bold font-mono animate-pulse">
                  LOOP ACTIVO ({state.loopBeats} BEATS)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {([1, 2, 4, 8, 16] as const).map((beats) => (
                <button
                  key={beats}
                  onClick={() => onSetLoop(state.id, beats)}
                  className={`flex-1 py-2 text-xs font-bold font-mono rounded border transition active:scale-95 ${
                    state.loopActive && state.loopBeats === beats
                      ? 'bg-emerald-500 text-black border-emerald-400'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                  }`}
                >
                  {beats}
                </button>
              ))}

              <button
                onClick={() => onToggleLoop(state.id)}
                className={`px-3 py-2 text-xs font-bold rounded border transition ${
                  state.loopActive
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                {state.loopActive ? 'SALIR' : 'RELOOP'}
              </button>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: EFECTOS (Filter, Echo, Flanger, Reverb, Vinyl Brake) */}
        {activeTab === 'fx' && (
          <div className="flex flex-col gap-2">
            {/* Knob / Slider Filtro Low-Pass / High-Pass */}
            <div className="flex items-center justify-between bg-neutral-950 p-1.5 rounded border border-neutral-800">
              <span className="text-[10px] font-mono text-neutral-400">FILTRO LPF/HPF</span>
              <input
                type="range"
                min={-100}
                max={100}
                value={state.fxFilter}
                onChange={(e) => onSetFilter(state.id, parseInt(e.target.value))}
                className="w-32 h-1.5 accent-[#4EA8DE] cursor-pointer"
              />
              <button
                onClick={() => onSetFilter(state.id, 0)}
                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 hover:text-white"
              >
                0
              </button>
            </div>

            {/* Botones de FX Rápidos */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onToggleFx(state.id, 'echo')}
                className={`flex-1 py-1 text-xs font-bold rounded border transition ${
                  state.fxEcho
                    ? 'bg-[#4EA8DE] text-black border-[#4EA8DE]'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                }`}
              >
                ECHO
              </button>
              <button
                onClick={() => onToggleFx(state.id, 'flanger')}
                className={`flex-1 py-1 text-xs font-bold rounded border transition ${
                  state.fxFlanger
                    ? 'bg-purple-500 text-white border-purple-400'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                }`}
              >
                FLANGER
              </button>
              <button
                onClick={() => onToggleFx(state.id, 'reverb')}
                className={`flex-1 py-1 text-xs font-bold rounded border transition ${
                  state.fxReverb
                    ? 'bg-amber-500 text-black border-amber-400'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                }`}
              >
                REVERB
              </button>
              <button
                onClick={() => onVinylBrake(state.id)}
                title="Frenado de motor de tocadiscos"
                className="flex-1 py-1 text-xs font-bold rounded border bg-neutral-800 border-neutral-700 text-rose-400 hover:bg-rose-500/20 transition"
              >
                BRAKE
              </button>
              <button
                onClick={() => onResetFx(state.id)}
                title="Apagar todos los efectos de golpe"
                className="px-2 py-1 text-[10px] font-mono font-bold rounded bg-neutral-800 text-neutral-400 hover:text-white"
              >
                LIMPIAR
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
