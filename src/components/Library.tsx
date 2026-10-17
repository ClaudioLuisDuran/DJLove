/**
 * Componente Biblioteca Musical Local para DJLove
 * Carga de carpetas completas y archivos locales (MP3, WAV, FLAC, OGG, M4A),
 * buscador instantáneo, filtrado por BPM y clave, favoritos,
 * y soporte completo de Listas de Reproducción (Playlists) con nombre personalizado
 * para elegir y reproducir a gusto en Deck A, Deck B o en Modo Fiesta (AutoDJ).
 */

import React, { useState, useRef, useEffect } from 'react';
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
  Edit2,
  Shuffle,
  ChevronUp,
  ChevronDown,
  Check,
  Radio,
  Sparkles,
} from 'lucide-react';
import { PlaylistModal } from './PlaylistModal';

interface LibraryProps {
  tracks: TrackMetadata[];
  playlists: Playlist[];
  onImportFiles: (files: FileList | File[]) => Promise<void>;
  onLoadTrackToDeck: (deckId: DeckId, track: TrackMetadata) => void;
  onDeleteTrack: (trackId: string) => void;
  onCreatePlaylist: (name: string, trackIds?: string[]) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onRenamePlaylist: (playlistId: string, newName: string) => void;
  onUpdatePlaylistTracks: (playlistId: string, trackIds: string[]) => void;
  onPlayPlaylist: (playlistId: string, autoDj?: boolean, shuffle?: boolean) => void;
  onToggleFavorite: (trackId: string) => void;
  favoriteTrackIds: string[];
  activePlaylistId?: string | null;
}

export const Library: React.FC<LibraryProps> = ({
  tracks,
  playlists,
  onImportFiles,
  onLoadTrackToDeck,
  onDeleteTrack,
  onCreatePlaylist,
  onDeletePlaylist,
  onRenamePlaylist,
  onUpdatePlaylistTracks,
  onPlayPlaylist,
  onToggleFavorite,
  favoriteTrackIds,
  activePlaylistId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('all');
  const [sortField, setSortField] = useState<'title' | 'artist' | 'bpm' | 'duration' | 'date'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Estado para el modal de playlists
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'addTracks' | 'rename';
    playlist?: Playlist | null;
  }>({
    isOpen: false,
    mode: 'create',
    playlist: null,
  });

  // Dropdown de "Agregar a Lista" activo para una canción específica
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Cerrar menú emergente si se hace clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuTrackId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Formatear duración mm:ss
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  // Filtrado de canciones
  const filteredTracks = tracks.filter((track) => {
    // Filtro por playlist o categoría
    if (selectedPlaylistId === 'favorites') {
      if (!favoriteTrackIds.includes(track.id)) return false;
    } else if (selectedPlaylistId === 'demos') {
      if (!track.isDemo) return false;
    } else if (selectedPlaylistId !== 'all') {
      if (currentPlaylist && !currentPlaylist.trackIds.includes(track.id)) {
        return false;
      }
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

  // Si estamos dentro de una playlist personalizada y no hay ordenamiento activo por columnas,
  // preservamos el orden de la playlist
  const isCustomPlaylist = selectedPlaylistId !== 'all' && selectedPlaylistId !== 'favorites' && selectedPlaylistId !== 'demos';

  const sortedTracks = [...filteredTracks].sort((a, b) => {
    if (isCustomPlaylist && sortField === 'date' && currentPlaylist) {
      // Orden original de la playlist
      const idxA = currentPlaylist.trackIds.indexOf(a.id);
      const idxB = currentPlaylist.trackIds.indexOf(b.id);
      return idxA - idxB;
    }

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

  // Reordenar pista arriba o abajo dentro de la playlist
  const handleMoveTrack = (trackId: string, direction: 'up' | 'down') => {
    if (!currentPlaylist) return;
    const trackIds = [...currentPlaylist.trackIds];
    const currentIndex = trackIds.indexOf(trackId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= trackIds.length) return;

    // Intercambiar
    const temp = trackIds[currentIndex];
    trackIds[currentIndex] = trackIds[targetIndex];
    trackIds[targetIndex] = temp;

    onUpdatePlaylistTracks(currentPlaylist.id, trackIds);
  };

  // Quitar pista de la playlist actual
  const handleRemoveTrackFromPlaylist = (trackId: string) => {
    if (!currentPlaylist) return;
    const updated = currentPlaylist.trackIds.filter((id) => id !== trackId);
    onUpdatePlaylistTracks(currentPlaylist.id, updated);
  };

  // Alternar canción en una playlist desde el menú emergente
  const handleToggleTrackInPlaylist = (playlistId: string, trackId: string) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;
    let nextIds: string[];
    if (pl.trackIds.includes(trackId)) {
      nextIds = pl.trackIds.filter((id) => id !== trackId);
    } else {
      nextIds = [...pl.trackIds, trackId];
    }
    onUpdatePlaylistTracks(playlistId, nextIds);
  };

  // Mezclar orden de la playlist (Shuffle)
  const handleShufflePlaylist = () => {
    if (!currentPlaylist || currentPlaylist.trackIds.length <= 1) return;
    const shuffled = [...currentPlaylist.trackIds].sort(() => Math.random() - 0.5);
    onUpdatePlaylistTracks(currentPlaylist.id, shuffled);
  };

  // Calcular duración total de la playlist
  const playlistTotalDuration = isCustomPlaylist && currentPlaylist
    ? currentPlaylist.trackIds.reduce((acc, id) => {
        const tr = tracks.find((t) => t.id === id);
        return acc + (tr?.duration || 0);
      }, 0)
    : 0;

  return (
    <div className="flex h-80 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl text-neutral-200">
      {/* 1. BARRA LATERAL: Playlists & Orígenes */}
      <div className="w-60 bg-neutral-950 p-3 border-r border-neutral-800 flex flex-col justify-between shrink-0">
        <div className="flex flex-col gap-1 overflow-y-auto pr-1">
          <span className="text-[10px] font-mono text-neutral-500 uppercase px-2 mb-1">
            BIBLIOTECA
          </span>

          <button
            onClick={() => setSelectedPlaylistId('all')}
            className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition ${
              selectedPlaylistId === 'all'
                ? 'bg-neutral-800 text-[#4EA8DE] font-bold border-l-2 border-[#4EA8DE]'
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
                ? 'bg-neutral-800 text-amber-400 font-bold border-l-2 border-amber-400'
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
                ? 'bg-neutral-800 text-yellow-400 font-bold border-l-2 border-yellow-400'
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

          {/* SECCIÓN LISTAS DE REPRODUCCIÓN */}
          <div className="flex items-center justify-between px-2 mt-3.5 mb-1.5">
            <div className="flex items-center gap-1.5">
              <ListMusic size={13} className="text-[#4EA8DE]" />
              <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider">
                MIS PLAYLISTS
              </span>
            </div>
            <button
              onClick={() => setModalState({ isOpen: true, mode: 'create' })}
              className="text-[#4EA8DE] hover:text-white p-1 rounded hover:bg-[#4EA8DE]/20 transition flex items-center gap-1 text-[11px] font-semibold"
              title="Crear Nueva Lista de Reproducción con Nombre"
            >
              <Plus size={13} />
              <span>Nueva</span>
            </button>
          </div>

          {playlists.length === 0 ? (
            <div className="px-2 py-3 text-center rounded-lg bg-neutral-900/60 border border-dashed border-neutral-800">
              <p className="text-[11px] text-neutral-400 mb-2">No tienes listas aún.</p>
              <button
                onClick={() => setModalState({ isOpen: true, mode: 'create' })}
                className="w-full py-1 px-2 rounded text-[11px] font-bold bg-[#4EA8DE]/15 text-[#4EA8DE] hover:bg-[#4EA8DE] hover:text-black transition"
              >
                + Crear Lista
              </button>
            </div>
          ) : (
            playlists.map((pl) => {
              const isSelected = selectedPlaylistId === pl.id;
              const isCurrentlyPlaying = activePlaylistId === pl.id;

              return (
                <div
                  key={pl.id}
                  className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg group transition ${
                    isSelected
                      ? 'bg-neutral-800 text-white font-bold border-l-2 border-[#4EA8DE]'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <button
                    onClick={() => setSelectedPlaylistId(pl.id)}
                    className="flex items-center gap-2 truncate flex-1 text-left min-w-0"
                    title={pl.name}
                  >
                    <ListMusic
                      size={13}
                      className={isSelected ? 'text-[#4EA8DE]' : 'text-neutral-500'}
                    />
                    <span className="truncate">{pl.name}</span>
                    {isCurrentlyPlaying && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Reproduciendo ahora" />
                    )}
                  </button>

                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    <span className="text-[10px] font-mono text-neutral-500 px-1">
                      {pl.trackIds.length}
                    </span>

                    {/* Botones de acción rápida al pasar el mouse */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center transition">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayPlaylist(pl.id);
                        }}
                        title="Reproducir esta lista"
                        className="text-neutral-400 hover:text-[#4EA8DE] p-1 transition"
                      >
                        <Play size={11} fill="currentColor" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalState({ isOpen: true, mode: 'rename', playlist: pl });
                        }}
                        title="Cambiar nombre"
                        className="text-neutral-400 hover:text-white p-1 transition"
                      >
                        <Edit2 size={11} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`¿Eliminar la lista "${pl.name}"? (No se borrarán los archivos de audio)`)) {
                            onDeletePlaylist(pl.id);
                            if (selectedPlaylistId === pl.id) setSelectedPlaylistId('all');
                          }
                        }}
                        title="Eliminar lista"
                        className="text-neutral-500 hover:text-rose-400 p-1 transition"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
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
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs bg-[#4EA8DE] hover:bg-[#3D94C9] text-black transition font-bold shadow-md shadow-[#4EA8DE]/15"
          >
            <FilePlus size={14} />
            <span>Agregar Archivos MP3</span>
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

      {/* 2. ZONA DERECHA: Cabecera de Playlist / Buscador y Tabla de Canciones */}
      <div className="flex-1 flex flex-col p-3 overflow-hidden">
        {/* Banner contextual si hay una Playlist personalizada seleccionada */}
        {isCustomPlaylist && currentPlaylist && (
          <div className="flex items-center justify-between bg-neutral-950 px-3.5 py-2.5 rounded-xl border border-neutral-800 mb-2.5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#4EA8DE]/15 text-[#4EA8DE] border border-[#4EA8DE]/30">
                <ListMusic size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                    {currentPlaylist.name}
                  </h3>
                  <button
                    onClick={() => setModalState({ isOpen: true, mode: 'rename', playlist: currentPlaylist })}
                    className="text-neutral-400 hover:text-white p-0.5"
                    title="Cambiar nombre de la lista"
                  >
                    <Edit2 size={12} />
                  </button>
                  {activePlaylistId === currentPlaylist.id && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      EN REPRODUCCIÓN
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 font-mono">
                  {currentPlaylist.trackIds.length} canciones • {formatDuration(playlistTotalDuration)} de duración
                </p>
              </div>
            </div>

            {/* Acciones principales de la Playlist */}
            <div className="flex items-center gap-2">
              {/* Botón REPRODUCIR LISTA AHORA */}
              <button
                onClick={() => onPlayPlaylist(currentPlaylist.id, false)}
                disabled={currentPlaylist.trackIds.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#4EA8DE] hover:bg-[#3D94C9] text-black transition shadow-md shadow-[#4EA8DE]/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Cargar la primera canción en Deck A y la siguiente en Deck B para empezar a reproducir"
              >
                <Play size={13} fill="currentColor" />
                <span>Reproducir Lista</span>
              </button>

              {/* Botón Modo Fiesta (AutoDJ con esta lista) */}
              <button
                onClick={() => onPlayPlaylist(currentPlaylist.id, true)}
                disabled={currentPlaylist.trackIds.length === 0}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Mezclar automáticamente las canciones de esta lista en Modo Fiesta"
              >
                <Radio size={13} />
                <span>AutoDJ Fiesta</span>
              </button>

              {/* Botón Agregar Canciones */}
              <button
                onClick={() => setModalState({ isOpen: true, mode: 'addTracks', playlist: currentPlaylist })}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700 transition"
                title="Seleccionar canciones de la biblioteca para esta lista"
              >
                <Plus size={13} />
                <span>Añadir Pistas</span>
              </button>

              {/* Botón Shuffle / Mezclar orden */}
              <button
                onClick={handleShufflePlaylist}
                disabled={currentPlaylist.trackIds.length <= 1}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition disabled:opacity-40"
                title="Mezclar orden aleatoriamente"
              >
                <Shuffle size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Barra superior de búsqueda y conteo */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar por título, artista, BPM o tono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-[#4EA8DE]"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
            <span>{sortedTracks.length} canciones encontradas</span>
          </div>
        </div>

        {/* Tabla de canciones */}
        <div className="flex-1 overflow-y-auto border border-neutral-800 rounded-lg bg-neutral-950">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-900/90 sticky top-0 border-b border-neutral-800 text-[10px] font-mono text-neutral-400 z-10">
              <tr>
                {isCustomPlaylist && <th className="py-2 px-2 w-8 text-center">#</th>}
                <th className="py-2 px-2 w-8 text-center">FAV</th>
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
                <th className="py-2 px-2 text-center w-36">CARGAR</th>
                <th className="py-2 px-2 text-center w-28">LISTAS</th>
                <th className="py-2 px-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {sortedTracks.length === 0 ? (
                <tr>
                  <td colSpan={isCustomPlaylist ? 10 : 9} className="py-10 text-center text-neutral-400">
                    {isCustomPlaylist ? (
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <ListMusic size={32} className="text-[#4EA8DE]/60 mb-1" />
                        <p className="text-sm font-semibold text-white">Esta lista aún está vacía</p>
                        <p className="text-xs text-neutral-400">
                          Agrega canciones de tu biblioteca para reproducir y mezclar a tu gusto en cualquier momento.
                        </p>
                        <button
                          onClick={() => setModalState({ isOpen: true, mode: 'addTracks', playlist: currentPlaylist })}
                          className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#4EA8DE] hover:bg-[#3D94C9] text-black transition"
                        >
                          <Plus size={14} />
                          <span>Seleccionar Canciones Ahora</span>
                        </button>
                      </div>
                    ) : (
                      'No se encontraron canciones. Carga tus pistas MP3 o utiliza las demos de fiesta incluidas.'
                    )}
                  </td>
                </tr>
              ) : (
                sortedTracks.map((track, index) => {
                  const isFav = favoriteTrackIds.includes(track.id);
                  const isMenuOpen = activeMenuTrackId === track.id;

                  return (
                    <tr
                      key={track.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', track.id);
                      }}
                      className="hover:bg-neutral-800/40 transition group cursor-grab active:cursor-grabbing"
                    >
                      {/* Número de orden y botones de reordenamiento en playlist */}
                      {isCustomPlaylist && (
                        <td className="py-2 px-2 text-center font-mono text-neutral-500 text-[10px]">
                          <div className="flex items-center justify-center gap-0.5">
                            <span className="w-4 text-right">{index + 1}</span>
                            <div className="opacity-0 group-hover:opacity-100 flex flex-col transition ml-0.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveTrack(track.id, 'up');
                                }}
                                disabled={index === 0}
                                className="text-neutral-500 hover:text-white disabled:opacity-20 p-0.2"
                                title="Mover arriba"
                              >
                                <ChevronUp size={10} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveTrack(track.id, 'down');
                                }}
                                disabled={index === sortedTracks.length - 1}
                                className="text-neutral-500 hover:text-white disabled:opacity-20 p-0.2"
                                title="Mover abajo"
                              >
                                <ChevronDown size={10} />
                              </button>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Favorito */}
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => onToggleFavorite(track.id)}
                          className="text-neutral-600 hover:text-yellow-400 transition"
                          title={isFav ? 'Quitar de favoritos' : 'Marcar como favorito'}
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
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onLoadTrackToDeck('deckA', track)}
                            className="px-2 py-1 text-[10px] font-mono font-bold rounded bg-[#4EA8DE]/20 text-[#4EA8DE] border border-[#4EA8DE]/35 hover:bg-[#4EA8DE] hover:text-black transition"
                            title="Cargar canción en Deck A"
                          >
                            DECK A
                          </button>
                          <button
                            onClick={() => onLoadTrackToDeck('deckB', track)}
                            className="px-2 py-1 text-[10px] font-mono font-bold rounded bg-orange-600/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500 hover:text-black transition"
                            title="Cargar canción en Deck B"
                          >
                            DECK B
                          </button>
                        </div>
                      </td>

                      {/* Dropdown "+ Lista" para agregar/quitar a playlists */}
                      <td className="py-2 px-2 text-center relative">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuTrackId(isMenuOpen ? null : track.id);
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700/80 transition"
                            title="Añadir a lista de reproducción"
                          >
                            <ListMusic size={11} className="text-[#4EA8DE]" />
                            <span>+ Lista</span>
                          </button>

                          {/* Menú desplegable */}
                          {isMenuOpen && (
                            <div
                              ref={menuRef}
                              className="absolute right-0 top-full mt-1 w-52 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-2 z-50 text-left"
                            >
                              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-neutral-800">
                                <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold">
                                  Guardar en Lista
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuTrackId(null);
                                    setModalState({ isOpen: true, mode: 'create' });
                                  }}
                                  className="text-[10px] font-bold text-[#4EA8DE] hover:underline flex items-center gap-0.5"
                                >
                                  <Plus size={10} />
                                  <span>Nueva</span>
                                </button>
                              </div>

                              {playlists.length === 0 ? (
                                <p className="text-[11px] text-neutral-400 py-2 text-center">
                                  No hay listas creadas.
                                </p>
                              ) : (
                                <div className="max-h-40 overflow-y-auto space-y-1">
                                  {playlists.map((pl) => {
                                    const inThisPl = pl.trackIds.includes(track.id);
                                    return (
                                      <button
                                        key={pl.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleTrackInPlaylist(pl.id, track.id);
                                        }}
                                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition ${
                                          inThisPl
                                            ? 'bg-[#4EA8DE]/15 text-white font-semibold'
                                            : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                                        }`}
                                      >
                                        <span className="truncate max-w-[140px] text-left">{pl.name}</span>
                                        {inThisPl ? (
                                          <Check size={12} className="text-[#4EA8DE]" strokeWidth={3} />
                                        ) : (
                                          <span className="text-[10px] text-neutral-600">+</span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Quitar de playlist o eliminar pista */}
                      <td className="py-2 px-2 text-right">
                        {isCustomPlaylist ? (
                          <button
                            onClick={() => handleRemoveTrackFromPlaylist(track.id)}
                            title="Quitar de esta lista de reproducción"
                            className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 p-1 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : !track.isDemo ? (
                          <button
                            onClick={() => onDeleteTrack(track.id)}
                            title="Quitar de la biblioteca"
                            className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 p-1 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CREACIÓN / EDICIÓN DE PLAYLISTS */}
      <PlaylistModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        playlist={modalState.playlist}
        tracks={tracks}
        onClose={() => setModalState({ isOpen: false, mode: 'create', playlist: null })}
        onCreatePlaylist={(name, trackIds) => {
          onCreatePlaylist(name, trackIds);
        }}
        onUpdatePlaylistTracks={(playlistId, trackIds) => {
          onUpdatePlaylistTracks(playlistId, trackIds);
        }}
        onRenamePlaylist={(playlistId, newName) => {
          onRenamePlaylist(playlistId, newName);
        }}
      />
    </div>
  );
};
