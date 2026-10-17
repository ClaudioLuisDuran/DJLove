/**
 * Modal para Crear y Administrar Listas de Reproducción (Playlists) en DJLove
 * Permite asignar nombre personalizado, sugerencias rápidas, selección de canciones
 * y renombrar listas existentes para reproducir y mezclar a gusto.
 */

import React, { useState, useEffect } from 'react';
import { TrackMetadata, Playlist } from '../types/dj';
import {
  X,
  ListMusic,
  Plus,
  Check,
  Search,
  Sparkles,
  Music,
  Clock,
  Edit2,
} from 'lucide-react';

interface PlaylistModalProps {
  isOpen: boolean;
  mode: 'create' | 'addTracks' | 'rename';
  playlist?: Playlist | null;
  tracks: TrackMetadata[];
  onClose: () => void;
  onCreatePlaylist: (name: string, trackIds: string[]) => void;
  onUpdatePlaylistTracks: (playlistId: string, trackIds: string[]) => void;
  onRenamePlaylist: (playlistId: string, newName: string) => void;
}

const NAME_SUGGESTIONS = [
  '🎉 Fiesta Total',
  '🔥 Reggaeton & Urbano',
  '🎧 Electrónica & Club',
  '💃 Cumbia & Pachanga',
  '🎸 Rock & Pop Clásicos',
  '✨ Warm-Up Sunset',
  '🌙 After Party',
  '🚀 Éxitos DJLove',
];

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  mode,
  playlist,
  tracks,
  onClose,
  onCreatePlaylist,
  onUpdatePlaylistTracks,
  onRenamePlaylist,
}) => {
  const [name, setName] = useState('');
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'create') {
        setName('');
        setSelectedTrackIds([]);
      } else if (mode === 'rename' && playlist) {
        setName(playlist.name);
      } else if (mode === 'addTracks' && playlist) {
        setName(playlist.name);
        setSelectedTrackIds([...playlist.trackIds]);
      }
      setSearchQuery('');
    }
  }, [isOpen, mode, playlist]);

  if (!isOpen) return null;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleTrack = (trackId: string) => {
    setSelectedTrackIds((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  };

  const handleSelectAllFiltered = (filteredIds: string[]) => {
    const allSelected = filteredIds.every((id) => selectedTrackIds.includes(id));
    if (allSelected) {
      setSelectedTrackIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedTrackIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (mode === 'create') {
      if (!trimmedName) return;
      onCreatePlaylist(trimmedName, selectedTrackIds);
      onClose();
    } else if (mode === 'rename' && playlist) {
      if (!trimmedName) return;
      onRenamePlaylist(playlist.id, trimmedName);
      onClose();
    } else if (mode === 'addTracks' && playlist) {
      onUpdatePlaylistTracks(playlist.id, selectedTrackIds);
      onClose();
    }
  };

  const filteredTracks = tracks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      (t.key && t.key.toLowerCase().includes(q)) ||
      t.bpm.toString().includes(q)
    );
  });

  const filteredTrackIds = filteredTracks.map((t) => t.id);
  const isAllFilteredSelected =
    filteredTrackIds.length > 0 && filteredTrackIds.every((id) => selectedTrackIds.includes(id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#4EA8DE]/15 text-[#4EA8DE] border border-[#4EA8DE]/30">
              {mode === 'rename' ? <Edit2 size={20} /> : <ListMusic size={20} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {mode === 'create' && 'Crear Nueva Lista de Reproducción'}
                {mode === 'rename' && 'Cambiar Nombre de la Lista'}
                {mode === 'addTracks' && `Administrar Canciones de "${playlist?.name}"`}
              </h2>
              <p className="text-xs text-neutral-400">
                {mode === 'create' && 'Organiza tus canciones favoritas por género, fiesta o momento para mezclar a gusto.'}
                {mode === 'rename' && 'Edita el nombre de tu lista de reproducción.'}
                {mode === 'addTracks' && 'Selecciona las canciones de tu biblioteca que formarán parte de esta lista.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Campo de nombre (Modo create o rename) */}
            {(mode === 'create' || mode === 'rename') && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-bold mb-1.5">
                  Nombre de la Lista <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Warm-Up Fiesta, Reggaeton Mix, Electrónica 2026..."
                    autoFocus
                    required
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#4EA8DE] focus:ring-1 focus:ring-[#4EA8DE] transition"
                  />
                </div>

                {/* Sugerencias de nombres rápidos */}
                {mode === 'create' && (
                  <div className="mt-2.5">
                    <span className="text-[11px] font-mono text-neutral-500 uppercase block mb-1.5">
                      Sugerencias rápidas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {NAME_SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setName(suggestion)}
                          className="px-2.5 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700/60 transition active:scale-95 flex items-center gap-1"
                        >
                          <Sparkles size={11} className="text-[#4EA8DE]" />
                          <span>{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selector de pistas (Modo create o addTracks) */}
            {(mode === 'create' || mode === 'addTracks') && (
              <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 font-bold block">
                      Seleccionar Canciones ({selectedTrackIds.length} seleccionadas)
                    </label>
                    <span className="text-[11px] text-neutral-400">
                      Elige las pistas que deseas incluir en esta lista
                    </span>
                  </div>

                  {filteredTracks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSelectAllFiltered(filteredTrackIds)}
                      className="text-xs font-semibold text-[#4EA8DE] hover:underline"
                    >
                      {isAllFilteredSelected ? 'Desmarcar todas' : 'Marcar todas'}
                    </button>
                  )}
                </div>

                {/* Buscador de pistas */}
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar por título, artista, BPM o clave..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#4EA8DE]"
                  />
                </div>

                {/* Lista de pistas disponibles */}
                <div className="border border-neutral-800 rounded-xl bg-neutral-950/70 max-h-56 overflow-y-auto divide-y divide-neutral-800/50">
                  {tracks.length === 0 ? (
                    <div className="p-6 text-center text-xs text-neutral-500">
                      No hay canciones en la biblioteca aún. Importa archivos de audio para agregarlos a tus listas.
                    </div>
                  ) : filteredTracks.length === 0 ? (
                    <div className="p-6 text-center text-xs text-neutral-500">
                      No se encontraron canciones con "{searchQuery}".
                    </div>
                  ) : (
                    filteredTracks.map((track) => {
                      const isSelected = selectedTrackIds.includes(track.id);
                      return (
                        <div
                          key={track.id}
                          onClick={() => handleToggleTrack(track.id)}
                          className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition select-none ${
                            isSelected
                              ? 'bg-[#4EA8DE]/10 hover:bg-[#4EA8DE]/15 text-white'
                              : 'hover:bg-neutral-850 text-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate max-w-[340px]">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${
                                isSelected
                                  ? 'bg-[#4EA8DE] border-[#4EA8DE] text-black'
                                  : 'border-neutral-600 bg-neutral-900'
                              }`}
                            >
                              {isSelected && <Check size={12} strokeWidth={3} />}
                            </div>
                            <div className="truncate">
                              <p className="font-semibold truncate text-white">{track.title}</p>
                              <p className="text-[11px] text-neutral-400 truncate">{track.artist}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 font-mono text-[11px] text-neutral-400 shrink-0">
                            <span className="text-white font-bold">{track.bpm.toFixed(1)} BPM</span>
                            {track.key && <span className="text-amber-400">{track.key}</span>}
                            <span className="flex items-center gap-0.5">
                              <Clock size={11} />
                              {formatDuration(track.duration)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pie de botones */}
          <div className="flex items-center justify-between p-4 border-t border-neutral-800 bg-neutral-950/90">
            <span className="text-xs text-neutral-400">
              {mode === 'create' && `${selectedTrackIds.length} canciones se añadirán`}
              {mode === 'addTracks' && `${selectedTrackIds.length} canciones en la lista`}
              {mode === 'rename' && 'Pulsa Guardar para actualizar el nombre'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={(mode === 'create' || mode === 'rename') && !name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#4EA8DE] hover:bg-[#3D94C9] text-black shadow-lg shadow-[#4EA8DE]/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mode === 'create' && (
                  <>
                    <Plus size={15} />
                    <span>Crear Lista de Reproducción</span>
                  </>
                )}
                {mode === 'rename' && (
                  <>
                    <Check size={15} />
                    <span>Guardar Nombre</span>
                  </>
                )}
                {mode === 'addTracks' && (
                  <>
                    <Check size={15} />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
