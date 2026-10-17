/**
 * Componente Modo Fiesta / Auto DJ para DJLove
 * Reproducción continua desatendida, sincronización automática de BPM,
 * transiciones programadas antes del fin de tema, selección de Playlist de origen
 * y bloqueo de seguridad anti-errores.
 */

import React from 'react';
import { TrackMetadata, DeckState, Playlist } from '../types/dj';
import {
  Radio,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ListMusic,
} from 'lucide-react';

interface AutoDjPartyModeProps {
  isPartyModeActive: boolean;
  onTogglePartyMode: () => void;
  safetyLock: boolean;
  onToggleSafetyLock: () => void;
  activeDeck: DeckState;
  upcomingTracks: TrackMetadata[];
  onLoadTrackToDeck: (deckId: 'deckA' | 'deckB', track: TrackMetadata) => void;
  playlists?: Playlist[];
  activePlaylistId?: string | null;
  onSelectPlaylist?: (playlistId: string | null) => void;
}

export const AutoDjPartyMode: React.FC<AutoDjPartyModeProps> = ({
  isPartyModeActive,
  onTogglePartyMode,
  safetyLock,
  onToggleSafetyLock,
  activeDeck,
  upcomingTracks,
  onLoadTrackToDeck,
  playlists = [],
  activePlaylistId,
  onSelectPlaylist,
}) => {
  const currentBpm = activeDeck.bpm || 120;
  const currentKey = activeDeck.loadedTrack?.key || '';

  const activePlaylist = playlists.find((p) => p.id === activePlaylistId);

  // Calcular compatibilidad armónica y de tempo
  const getCompatibilityScore = (candidate: TrackMetadata) => {
    let score = 100;
    // Penalización por diferencia de BPM
    const bpmDiff = Math.abs(candidate.bpm - currentBpm);
    if (bpmDiff > 10) score -= Math.min(50, (bpmDiff - 10) * 3);

    // Si coincide la clave o es compatible Camelot
    if (currentKey && candidate.key) {
      if (candidate.key === currentKey) score += 10;
    }

    return Math.max(10, Math.min(100, Math.round(score)));
  };

  return (
    <div className="flex flex-col h-80 bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-xl overflow-hidden">
      {/* Cabecera del Modo Fiesta */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Radio size={16} className={isPartyModeActive ? 'animate-pulse' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Modo Fiesta & AutoDJ Desatendido
              </h3>
              {isPartyModeActive && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500 text-black">
                  ACTIVO
                </span>
              )}
            </div>
            <p className="text-[10px] text-neutral-400">
              Mezcla continua sin pausas: prepara el siguiente tema y transiciona antes de que termine
            </p>
          </div>
        </div>

        {/* Interruptores y selector de origen */}
        <div className="flex items-center gap-2.5">
          {/* Selector de Playlist */}
          {onSelectPlaylist && (
            <div className="flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800">
              <ListMusic size={13} className="text-[#4EA8DE]" />
              <label htmlFor="autodj-playlist-select" className="text-[10px] font-mono text-neutral-400">
                Lista:
              </label>
              <select
                id="autodj-playlist-select"
                value={activePlaylistId || 'all'}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? null : e.target.value;
                  onSelectPlaylist(val);
                }}
                className="bg-transparent text-xs text-white outline-none cursor-pointer font-semibold max-w-[150px] truncate"
              >
                <option value="all" className="bg-neutral-900 text-white">
                  Todas las Pistas
                </option>
                {playlists.map((pl) => (
                  <option key={pl.id} value={pl.id} className="bg-neutral-900 text-white">
                    📋 {pl.name} ({pl.trackIds.length})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Bloqueo de seguridad */}
          <button
            onClick={onToggleSafetyLock}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition ${
              safetyLock
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
            }`}
            title="Bloquea la expulsión o detención accidental de la canción que suena en vivo"
          >
            {safetyLock ? <Lock size={13} /> : <Unlock size={13} />}
            <span>{safetyLock ? 'Seguridad Activada' : 'Seguridad Desactivada'}</span>
          </button>

          {/* Activar Modo Fiesta */}
          <button
            onClick={onTogglePartyMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black tracking-wide border shadow-md transition active:scale-95 ${
              isPartyModeActive
                ? 'bg-emerald-500 text-black border-emerald-400 shadow-emerald-500/30'
                : 'bg-neutral-800 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}
          >
            <Radio size={14} className={isPartyModeActive ? 'animate-spin' : ''} />
            <span>{isPartyModeActive ? 'DETENER MODO FIESTA' : 'INICIAR MODO FIESTA'}</span>
          </button>
        </div>
      </div>

      {/* Contenido: Sugerencias Inteligentes & Próximas Pistas */}
      <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
        {/* Columna Izquierda: Asistente de Mezcla en Vivo */}
        <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-neutral-400 uppercase">
                ESTADO DEL DECK ACTIVO
              </span>
              {activePlaylist && (
                <span className="text-[10px] font-mono text-[#4EA8DE] truncate max-w-[180px]">
                  Reproduciendo: {activePlaylist.name}
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div className="truncate max-w-[220px]">
                <p className="text-sm font-bold text-white truncate">
                  {activeDeck.loadedTrack ? activeDeck.loadedTrack.title : 'Ninguna canción sonando'}
                </p>
                <p className="text-xs text-neutral-400 truncate">
                  {activeDeck.loadedTrack ? activeDeck.loadedTrack.artist : '--'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-base font-mono font-bold text-[#4EA8DE] tabular-nums">
                  {activeDeck.bpm.toFixed(1)} BPM
                </span>
                <p className="text-[10px] font-mono text-amber-400">
                  {activeDeck.loadedTrack?.key || 'Clave --'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-neutral-800/80 text-[11px]">
            <div className="flex items-center gap-2 text-neutral-300">
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
              <span>Transición automática antes del final de la pista.</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-300">
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
              <span>
                {activePlaylist
                  ? `Secuencia activa desde "${activePlaylist.name}". Carga la siguiente automáticamente.`
                  : 'Sincronización armónica y de BPM activada para mezclas sin desfase.'}
              </span>
            </div>
            {safetyLock && (
              <div className="flex items-center gap-2 text-amber-300">
                <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                <span>Protección activa: no se pueden detener pistas en vivo por error.</span>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Sugerencias o Próximas Pistas de la Lista */}
        <div className="flex flex-col bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">
              {activePlaylist ? `PRÓXIMAS DE "${activePlaylist.name.toUpperCase()}"` : 'SUGERENCIAS COMPATIBLES'}
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">
              Base: {currentBpm.toFixed(0)} BPM
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {upcomingTracks.length === 0 ? (
              <div className="p-4 text-center text-xs text-neutral-500">
                {activePlaylist
                  ? 'No hay más canciones en esta lista de reproducción.'
                  : 'Carga más pistas en la biblioteca para ver sugerencias.'}
              </div>
            ) : (
              upcomingTracks.slice(0, 5).map((track) => {
                const score = getCompatibilityScore(track);
                const targetDeck = activeDeck.id === 'deckA' ? 'deckB' : 'deckA';

                return (
                  <div
                    key={track.id}
                    className="flex items-center justify-between p-2 rounded bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 transition text-xs"
                  >
                    <div className="truncate max-w-[170px]">
                      <p className="font-semibold text-white truncate">{track.title}</p>
                      <p className="text-[10px] text-neutral-400 truncate">{track.artist}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono">
                        <span className="font-bold text-white tabular-nums">{track.bpm.toFixed(1)}</span>
                        <span className="text-[9px] text-amber-400 block">{track.key || '--'}</span>
                      </div>

                      <div className="flex flex-col items-end">
                        <span
                          className={`text-[9px] font-bold font-mono px-1 rounded ${
                            score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {score}% MATCH
                        </span>
                        <button
                          onClick={() => onLoadTrackToDeck(targetDeck, track)}
                          className="text-[10px] font-bold text-[#4EA8DE] hover:text-white mt-0.5 flex items-center gap-0.5"
                        >
                          <span>Cargar en {targetDeck === 'deckA' ? 'A' : 'B'}</span>
                          <ArrowRight size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
