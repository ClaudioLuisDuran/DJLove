/**
 * Componente Biblioteca Musical Local para FIESTA MIX
 * Carga de carpetas completas y archivos locales (MP3, WAV, FLAC, OGG, M4A),
 * buscador instantáneo, filtrado por BPM y clave, playlists, favoritos
 * y botones rápidos para cargar en DECK A y DECK B.
 */

import React, { useState, useRef } from 'react';
import { TrackMetadata, Playlist, DeckId } from '../types/dj';
import {
  FolderOpen,
  FilePlus,
  Search,
  ListMusic,
  Star,
  Play,
  ArrowUpDown,
  Trash2,
  Plus,
  Clock,
  Music,
  Zap,
} from 'lucide-react';

interface LibraryProps {
  tracks: TrackMetadata[];
  playlists: Playlist[];
  onImportFiles: (files: FileList | File[]) => Promise<void>;
  onLoadTrackToDeck: (deckId: DeckId, track: TrackMetadata) => void;
  onDeleteTrack: (trackId: string) => void;
  onCreatePlaylist: (name: string) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onToggleFavorite: (trackId: string) => void;
  favoriteTrackIds: string[];
}

export const Library: React.FC<LibraryProps> = ({
  tracks,
  playlists,
  onImportFiles,
  onLoadTrackToDeck,
  onDeleteTrack,
  onCreatePlaylist,
  onDeletePlaylist,
  onToggleFavorite,
  favoriteTrackIds,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('all');
  const [sortField, setSortField] = useState<'title' | 'artist' | 'bpm' | 'duration' | 'date'>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  // Formatear duración mm:ss
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Filtrado de canciones
  const filteredTracks = tracks.filter((track) => {
    // Filtro por playlist
    if (selectedPlaylistId === 'favorites') {
      if (!favoriteTrackIds.includes(track.id)) return false;
    } else if (selectedPlaylistId === 'demos') {
      if (!track.isDemo) return false;
    } else if (selectedPlaylistId !== 'all') {
      const pl = playlists.find((p) => p.id === selectedPlaylistId);
      if (pl && !pl.trackIds.includes(track.id)) return false;
    }

    // Filtro por búsqueda
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      track.title.toLowerCase().includes(q) ||
      track.artist.toLowerCase().includes(q) ||
      (track.album && track.album.toLowerCase().includes(q)) ||
      (track.key && track.key.toLowerCase().includes(q)) ||
      track.bpm.toString().includes(q)
    );
  });

  // Ordenación
  const sortedTracks = [...filteredTracks].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'title') cmp = a.title.localeCompare(b.title);
    else if (sortField === 'artist') cmp = a.artist.localeCompare(b.artist);
    else if (sortField === 'bpm') cmp = a.bpm - b.bpm;
    else if (sortField === 'duration') cmp = a.duration - b.duration;
    else if (sortField === 'date') cmp = a.dateAdded - b.dateAdded;
    return sortAsc ? cmp : -cmp;
  });

  const toggleSort = (field: 'title' | 'artist' | 'bpm' | 'duration' | 'date') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowNewPlaylistInput(false);
    }
  };

  return (
    <div className="flex h-72 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl text-neutral-200">
      {/* 1. BARRA LATERAL: Playlists & Orígenes */}
      <div className="w-56 bg-neutral-950 p-3 border-r border-neutral-800 flex flex-col justify-between shrink-0">
        <div className="flex flex-col gap-1 overflow-y-auto">
          <span className="text-[10px] font-mono text-neutral-500 uppercase px-2 mb-1">
            BIBLIOTECA
          </span>

          <button
            onClick={() => setSelectedPlaylistId('all')}
            className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition ${
              selectedPlaylistId === 'all'
                ? 'bg-neutral-800 text-white font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Music size={14} className="text-[#4EA8DE]" />
              <span>Todas las Pistas</span>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">{tracks.length}</span>
          </button>

          <button
            onClick={() => setSelectedPlaylistId('demos')}
            className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition ${
              selectedPlaylistId === 'demos'
                ? 'bg-neutral-800 text-white font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-amber-400" />
              <span>Pistas Demo Fiesta</span>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">
              {tracks.filter((t) => t.isDemo).length}
            </span>
          </button>

          <button
            onClick={() => setSelectedPlaylistId('favorites')}
            className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition ${
              selectedPlaylistId === 'favorites'
                ? 'bg-neutral-800 text-white font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span>Favoritos</span>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">
              {favoriteTrackIds.length}
            </span>
          </button>

          {/* Listas de reproducción personalizadas */}
          <div className="flex items-center justify-between px-2 mt-3 mb-1">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">PLAYLISTS</span>
            <button
              onClick={() => setShowNewPlaylistInput(!showNewPlaylistInput)}
              className="text-neutral-400 hover:text-white p-0.5"
              title="Nueva Lista"
            >
              <Plus size={13} />
            </button>
          </div>

          {showNewPlaylistInput && (
            <form onSubmit={handleCreatePlaylist} className="px-2 mb-2">
              <input
                type="text"
                placeholder="Nombre de lista..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                autoFocus
                className="w-full text-xs bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white outline-none focus:border-cyan-500"
              />
            </form>
          )}

          {playlists.map((pl) => (
            <div
              key={pl.id}
              className={`flex items-center justify-between px-2.5 py-1 text-xs rounded-lg group transition ${
                selectedPlaylistId === pl.id
                  ? 'bg-neutral-800 text-white font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <button
                onClick={() => setSelectedPlaylistId(pl.id)}
                className="flex items-center gap-2 truncate flex-1 text-left"
              >
                <ListMusic size={13} />
                <span className="truncate">{pl.name}</span>
              </button>
              <button
                onClick={() => onDeletePlaylist(pl.id)}
                title="Eliminar playlist"
                className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 p-0.5 transition"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Botones de Importación de Archivos */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-neutral-800">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onImportFiles(e.target.files);
              }
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold bg-[#4EA8DE] hover:bg-[#3D94C9] text-black transition font-bold"
          >
            <FilePlus size={14} />
            <span>Agregar Archivos</span>
          </button>

          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
          >
            <FolderOpen size={14} />
            <span>Importar Carpeta</span>
          </button>

          <input
            type="file"
            ref={folderInputRef}
            // @ts-expect-error webkitdirectory is standard for folder picker
            webkitdirectory="true"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onImportFiles(e.target.files);
              }
            }}
          />
        </div>
      </div>

      {/* 2. ZONA DERECHA: Buscador y Tabla de Canciones */}
      <div className="flex-1 flex flex-col p-3 overflow-hidden">
        {/* Barra superior de búsqueda y conteo */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar por título, artista, BPM o tono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
            <span>{sortedTracks.length} canciones encontradas</span>
          </div>
        </div>

        {/* Tabla de canciones */}
        <div className="flex-1 overflow-y-auto border border-neutral-800 rounded-lg bg-neutral-950">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-900/90 sticky top-0 border-b border-neutral-800 text-[10px] font-mono text-neutral-400">
              <tr>
                <th className="py-2 px-3 w-8"></th>
                <th
                  onClick={() => toggleSort('title')}
                  className="py-2 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>TÍTULO</span>
                    <ArrowUpDown size={10} />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('artist')}
                  className="py-2 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>ARTISTA</span>
                    <ArrowUpDown size={10} />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('bpm')}
                  className="py-2 px-3 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>BPM</span>
                    <ArrowUpDown size={10} />
                  </div>
                </th>
                <th className="py-2 px-3 text-center">KEY</th>
                <th
                  onClick={() => toggleSort('duration')}
                  className="py-2 px-3 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <Clock size={10} />
                    <span>DURACIÓN</span>
                  </div>
                </th>
                <th className="py-2 px-3 text-center w-36">CARGAR</th>
                <th className="py-2 px-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {sortedTracks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-500">
                    No se encontraron canciones. Carga tus pistas MP3 o utiliza las demos incluidas.
                  </td>
                </tr>
              ) : (
                sortedTracks.map((track) => {
                  const isFav = favoriteTrackIds.includes(track.id);

                  return (
                    <tr
                      key={track.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', track.id);
                      }}
                      className="hover:bg-neutral-800/40 transition group cursor-grab active:cursor-grabbing"
                    >
                      {/* Favorito */}
                      <td className="py-2 px-3">
                        <button
                          onClick={() => onToggleFavorite(track.id)}
                          className="text-neutral-600 hover:text-yellow-400 transition"
                        >
                          <Star
                            size={13}
                            className={isFav ? 'text-yellow-400 fill-yellow-400' : ''}
                          />
                        </button>
                      </td>

                      {/* Título */}
                      <td className="py-2 px-3 font-semibold text-white truncate max-w-[200px]">
                        {track.title}
                      </td>

                      {/* Artista */}
                      <td className="py-2 px-3 text-neutral-400 truncate max-w-[160px]">
                        {track.artist}
                      </td>

                      {/* BPM */}
                      <td className="py-2 px-3 font-mono font-bold text-right tabular-nums text-white">
                        {track.bpm.toFixed(1)}
                      </td>

                      {/* Tonalidad */}
                      <td className="py-2 px-3 text-center font-mono text-amber-400 text-[11px]">
                        {track.key || '--'}
                      </td>

                      {/* Duración */}
                      <td className="py-2 px-3 font-mono text-neutral-400 text-right tabular-nums">
                        {formatDuration(track.duration)}
                      </td>

                      {/* Botones Cargar Deck A y Deck B */}
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onLoadTrackToDeck('deckA', track)}
                            className="px-2 py-1 text-[10px] font-mono font-bold rounded bg-[#4EA8DE]/20 text-[#4EA8DE] border border-[#4EA8DE]/35 hover:bg-[#4EA8DE] hover:text-black transition"
                          >
                            DECK A
                          </button>
                          <button
                            onClick={() => onLoadTrackToDeck('deckB', track)}
                            className="px-2 py-1 text-[10px] font-mono font-bold rounded bg-orange-600/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500 hover:text-black transition"
                          >
                            DECK B
                          </button>
                        </div>
                      </td>

                      {/* Eliminar pista de biblioteca */}
                      <td className="py-2 px-2 text-right">
                        {!track.isDemo && (
                          <button
                            onClick={() => onDeleteTrack(track.id)}
                            title="Quitar de biblioteca"
                            className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 p-1 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
