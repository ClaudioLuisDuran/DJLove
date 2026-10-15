/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DeckId,
  DeckState,
  MixerState,
  TrackMetadata,
  Playlist,
  TransitionConfig,
  SoundboardItem,
  AudioDeviceConfig,
  CrossfaderCurve,
  CuePoint,
} from './types/dj';
import { globalAudio } from './services/audioEngine';
import { analyzeAudio, TapBpmTracker } from './services/bpmAnalyzer';
import { synthesizePartyTrack, INITIAL_DEMO_TRACKS_CONFIG } from './services/demoTracks';
import { localDB } from './services/db';
import { APP_CONFIG } from './config/appConfig';

import { Header } from './components/Header';
import { Deck } from './components/Deck';
import { Mixer } from './components/Mixer';
import { Library } from './components/Library';
import { Soundboard } from './components/Soundboard';
import { AutoDjPartyMode } from './components/AutoDjPartyMode';
import { AudioSettings } from './components/AudioSettingsModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { InstallDesktopModal } from './components/InstallDesktopModal';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export default function App() {
  // 1. Estados de los Decks
  const [deckA, setDeckA] = useState<DeckState>({
    id: 'deckA',
    loadedTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playbackRate: 1.0,
    pitchPercent: 0,
    pitchRange: 16,
    keyLock: false,
    bpm: 128,
    originalBpm: 128,
    volume: 0.9,
    gain: 1.0,
    eqHigh: 0,
    eqMid: 0,
    eqLow: 0,
    eqHighKill: false,
    eqMidKill: false,
    eqLowKill: false,
    cueActive: false,
    isSync: false,
    isScratching: false,
    loopActive: false,
    loopBeats: 4,
    loopStart: null,
    loopEnd: null,
    fxFilter: 0,
    fxEcho: false,
    fxEchoTime: 0.35,
    fxEchoFeedback: 0.4,
    fxFlanger: false,
    fxReverb: false,
    fxBrake: false,
    vuLevel: 0,
    isClipping: false,
  });

  const [deckB, setDeckB] = useState<DeckState>({
    id: 'deckB',
    loadedTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playbackRate: 1.0,
    pitchPercent: 0,
    pitchRange: 16,
    keyLock: false,
    bpm: 124,
    originalBpm: 124,
    volume: 0.9,
    gain: 1.0,
    eqHigh: 0,
    eqMid: 0,
    eqLow: 0,
    eqHighKill: false,
    eqMidKill: false,
    eqLowKill: false,
    cueActive: false,
    isSync: false,
    isScratching: false,
    loopActive: false,
    loopBeats: 4,
    loopStart: null,
    loopEnd: null,
    fxFilter: 0,
    fxEcho: false,
    fxEchoTime: 0.35,
    fxEchoFeedback: 0.4,
    fxFlanger: false,
    fxReverb: false,
    fxBrake: false,
    vuLevel: 0,
    isClipping: false,
  });

  const [activeDeckId, setActiveDeckId] = useState<DeckId>('deckA');

  // 2. Estado del Mezclador
  const [mixerState, setMixerState] = useState<MixerState>({
    crossfader: -1.0, // Comienza en Deck A
    crossfaderCurve: 'smooth',
    masterVolume: 0.85,
    headphoneVolume: 0.8,
    headphoneCueMix: 0.0,
    masterCue: false,
    vuMasterL: 0,
    vuMasterR: 0,
    isMasterClipping: false,
  });

  // 3. Medidores VU en tiempo real
  const [vuLevels, setVuLevels] = useState({
    deckA: { level: 0, clip: false },
    deckB: { level: 0, clip: false },
    masterL: { level: 0, clip: false },
    masterR: { level: 0, clip: false },
  });

  // 4. Configuración de Transición
  const [transitionConfig, setTransitionConfig] = useState<TransitionConfig>({
    mode: 'smooth',
    durationBeats: 16,
    durationSeconds: 8,
    useBeats: true,
    startNextFromCue: true,
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 5. Biblioteca y Playlists
  const [tracks, setTracks] = useState<TrackMetadata[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favoriteTrackIds, setFavoriteTrackIds] = useState<string[]>([]);

  // 6. Soundboard
  const [soundboardItems, setSoundboardItems] = useState<SoundboardItem[]>(
    APP_CONFIG.defaultSoundboard as SoundboardItem[]
  );
  const [masterSfxVolume, setMasterSfxVolume] = useState(0.9);

  // 7. Modos de App y Pestañas
  const [currentTab, setCurrentTab] = useState<'library' | 'soundboard' | 'autodj' | 'audio' | 'shortcuts'>('library');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isPartyModeActive, setIsPartyModeActive] = useState(false);
  const [safetyLock, setSafetyLock] = useState(false);

  const [audioConfig, setAudioConfig] = useState<AudioDeviceConfig>({
    masterDeviceId: 'default',
    cueDeviceId: 'default',
    splitStereoMode: false,
    lowLatencyMode: true,
    limiterActive: true,
  });

  // 9. Instalación de Escritorio y Estado Offline (PWA)
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const { isInstalled, isInstallable } = usePWAInstall();
  const isOnline = useOnlineStatus();

  const tapTrackerRef = useRef(new TapBpmTracker());

  // INICIALIZACIÓN: Cargar pistas Demo, preferencias y Base de Datos
  useEffect(() => {
    async function setupApp() {
      // 1. Cargar preferencias
      const savedTheme = await localDB.getPreference<'dark' | 'light'>('theme', 'dark');
      setTheme(savedTheme);

      const savedAudio = await localDB.getPreference<AudioDeviceConfig | null>('audioConfig', null);
      if (savedAudio) {
        setAudioConfig(savedAudio);
        globalAudio.setSplitStereoMode(savedAudio.splitStereoMode);
      }

      // 2. Cargar playlists
      const savedPlaylists = await localDB.getAllPlaylists();
      setPlaylists(savedPlaylists);

      // 3. Cargar canciones de IndexedDB
      const savedTracks = await localDB.getAllTracks();

      // 4. Generar demos de fiesta
      const audioCtx = globalAudio.getContext();
      const demoTracksList: TrackMetadata[] = [];

      for (const demoCfg of INITIAL_DEMO_TRACKS_CONFIG) {
        const { metadata } = synthesizePartyTrack(audioCtx, demoCfg);
        demoTracksList.push(metadata);
      }

      const combinedTracks = [...demoTracksList, ...savedTracks];
      setTracks(combinedTracks);

      // Precargar pista 1 en Deck A y pista 2 en Deck B para prueba instantánea
      if (demoTracksList.length >= 2) {
        loadTrackToDeck('deckA', demoTracksList[0]);
        loadTrackToDeck('deckB', demoTracksList[1]);
      }
    }

    setupApp();
  }, []);

  // Bucle de animación 60 FPS para tiempo de reproducción y VU meters
  useEffect(() => {
    let animId: number;

    const tick = () => {
      // 1. Actualizar VU meters
      const vus = globalAudio.getVuLevels();
      setVuLevels(vus);

      // 2. Actualizar posiciones de reproducción
      if (deckA.isPlaying && !deckA.isScratching) {
        const timeA = globalAudio.getCurrentTime('deckA', deckA.playbackRate);
        setDeckA((prev) => {
          // Chequear bucle activo
          if (prev.loopActive && prev.loopEnd && timeA >= prev.loopEnd) {
            const loopStart = prev.loopStart || 0;
            globalAudio.seekTo('deckA', loopStart, true, prev.playbackRate);
            return { ...prev, currentTime: loopStart };
          }
          if (timeA >= prev.duration && prev.duration > 0) {
            return { ...prev, isPlaying: false, currentTime: prev.duration };
          }
          return { ...prev, currentTime: timeA };
        });
      }

      if (deckB.isPlaying && !deckB.isScratching) {
        const timeB = globalAudio.getCurrentTime('deckB', deckB.playbackRate);
        setDeckB((prev) => {
          // Chequear bucle activo
          if (prev.loopActive && prev.loopEnd && timeB >= prev.loopEnd) {
            const loopStart = prev.loopStart || 0;
            globalAudio.seekTo('deckB', loopStart, true, prev.playbackRate);
            return { ...prev, currentTime: loopStart };
          }
          if (timeB >= prev.duration && prev.duration > 0) {
            return { ...prev, isPlaying: false, currentTime: prev.duration };
          }
          return { ...prev, currentTime: timeB };
        });
      }

      // 3. Comprobación automática de Modo Fiesta (Auto DJ)
      if (isPartyModeActive && !isTransitioning) {
        const activeState = mixerState.crossfader <= 0 ? deckA : deckB;
        if (activeState.isPlaying && activeState.duration > 0) {
          const remaining = activeState.duration - activeState.currentTime;
          if (remaining > 0 && remaining <= transitionConfig.durationSeconds + 1) {
            // Iniciar transición automática
            handleStartTransition();
          }
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [
    deckA.isPlaying,
    deckA.isScratching,
    deckA.playbackRate,
    deckB.isPlaying,
    deckB.isScratching,
    deckB.playbackRate,
    isPartyModeActive,
    isTransitioning,
    mixerState.crossfader,
    transitionConfig.durationSeconds,
  ]);

  // Cargar pista en un Deck
  const loadTrackToDeck = async (deckId: DeckId, track: TrackMetadata) => {
    // Si la seguridad está activa y el deck está en el aire sonando, alertar
    const isPlayingOnAir =
      (deckId === 'deckA' && deckA.isPlaying && mixerState.crossfader < 0.8) ||
      (deckId === 'deckB' && deckB.isPlaying && mixerState.crossfader > -0.8);

    if (safetyLock && isPlayingOnAir) {
      alert('Bloqueo de seguridad activo: Desactiva el candado de seguridad para cambiar la canción en vivo.');
      return;
    }

    const audioCtx = globalAudio.getContext();
    let audioBuffer = track.audioBuffer;

    // Si viene de archivo local y no está decodificado aún
    if (!audioBuffer && track.file) {
      try {
        const arrayBuffer = await track.file.arrayBuffer();
        audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        track.audioBuffer = audioBuffer;
      } catch (err) {
        console.error('Error al decodificar archivo:', err);
        alert('No se pudo decodificar el archivo de audio. Verifica que sea un formato compatible (MP3, WAV, OGG, FLAC).');
        return;
      }
    }

    if (audioBuffer) {
      globalAudio.loadTrackBuffer(deckId, audioBuffer);
      const updateState = deckId === 'deckA' ? setDeckA : setDeckB;

      updateState((prev) => ({
        ...prev,
        loadedTrack: track,
        duration: audioBuffer!.duration,
        currentTime: 0,
        bpm: track.bpm,
        originalBpm: track.originalBpm || track.bpm,
        pitchPercent: 0,
        playbackRate: 1.0,
        isPlaying: false,
        loopActive: false,
        loopStart: null,
        loopEnd: null,
      }));
    }
  };

  // Descargar pista de Deck
  const handleUnloadTrack = (deckId: DeckId) => {
    if (safetyLock) {
      const isPlaying = deckId === 'deckA' ? deckA.isPlaying : deckB.isPlaying;
      if (isPlaying) {
        alert('Bloqueo de seguridad: No se puede expulsar la canción mientras suena.');
        return;
      }
    }
    globalAudio.unloadTrack(deckId);
    const updateState = deckId === 'deckA' ? setDeckA : setDeckB;
    updateState((prev) => ({
      ...prev,
      loadedTrack: null,
      duration: 0,
      currentTime: 0,
      isPlaying: false,
    }));
  };

  // Reproducción y Pausa
  const handlePlay = (deckId: DeckId) => {
    const deck = deckId === 'deckA' ? deckA : deckB;
    if (!deck.loadedTrack) return;
    globalAudio.playDeck(deckId, deck.currentTime, deck.playbackRate);
    if (deckId === 'deckA') setDeckA((p) => ({ ...p, isPlaying: true }));
    else setDeckB((p) => ({ ...p, isPlaying: true }));
  };

  const handlePause = (deckId: DeckId) => {
    const curTime = globalAudio.pauseDeck(deckId);
    if (deckId === 'deckA') setDeckA((p) => ({ ...p, isPlaying: false, currentTime: curTime }));
    else setDeckB((p) => ({ ...p, isPlaying: false, currentTime: curTime }));
  };

  const handleStop = (deckId: DeckId) => {
    globalAudio.stopDeck(deckId);
    globalAudio.seekTo(deckId, 0, false);
    if (deckId === 'deckA') setDeckA((p) => ({ ...p, isPlaying: false, currentTime: 0 }));
    else setDeckB((p) => ({ ...p, isPlaying: false, currentTime: 0 }));
  };

  const handleSeek = (deckId: DeckId, time: number) => {
    const deck = deckId === 'deckA' ? deckA : deckB;
    globalAudio.seekTo(deckId, time, deck.isPlaying, deck.playbackRate);
    if (deckId === 'deckA') setDeckA((p) => ({ ...p, currentTime: time }));
    else setDeckB((p) => ({ ...p, currentTime: time }));
  };

  // Scratch & Jog Wheel
  const handleScratchMove = (deckId: DeckId, deltaSeconds: number, speedMultiplier: number) => {
    const deck = deckId === 'deckA' ? deckA : deckB;
    const target = Math.max(0, Math.min(deck.currentTime + deltaSeconds, deck.duration));
    globalAudio.scratchScrub(deckId, target, speedMultiplier);
    if (deckId === 'deckA') setDeckA((p) => ({ ...p, isScratching: true, currentTime: target }));
    else setDeckB((p) => ({ ...p, isScratching: true, currentTime: target }));
  };

  const handleScratchEnd = (deckId: DeckId) => {
    const deck = deckId === 'deckA' ? deckA : deckB;
    if (deckId === 'deckA') setDeckA((p) => ({ ...p, isScratching: false }));
    else setDeckB((p) => ({ ...p, isScratching: false }));

    if (deck.isPlaying) {
      globalAudio.playDeck(deckId, deck.currentTime, deck.playbackRate);
    }
  };

  // Nudge / Beat Bend
  const handleNudge = (deckId: DeckId, direction: 'forward' | 'backward') => {
    const deck = deckId === 'deckA' ? deckA : deckB;
    const bendFactor = direction === 'forward' ? 1.05 : 0.95;
    globalAudio.setPlaybackRate(deckId, deck.playbackRate * bendFactor);

    setTimeout(() => {
      globalAudio.setPlaybackRate(deckId, deck.playbackRate);
    }, 180);
  };

  // Vinyl Brake
  const handleVinylBrake = (deckId: DeckId) => {
    globalAudio.applyVinylBrake(deckId, () => {
      if (deckId === 'deckA') setDeckA((p) => ({ ...p, isPlaying: false }));
      else setDeckB((p) => ({ ...p, isPlaying: false }));
    });
  };

  // Pitch Fader
  const handleSetPitch = (deckId: DeckId, pitchPercent: number) => {
    const rate = 1.0 + pitchPercent / 100;
    globalAudio.setPlaybackRate(deckId, rate);
    const update = deckId === 'deckA' ? setDeckA : setDeckB;
    update((prev) => ({
      ...prev,
      pitchPercent,
      playbackRate: rate,
      bpm: prev.originalBpm * rate,
    }));
  };

  // Sincronización Inteligente (SYNC)
  const handleSync = (deckId: DeckId) => {
    const sourceDeck = deckId === 'deckA' ? deckB : deckA;
    const targetDeck = deckId === 'deckA' ? deckA : deckB;
    const updateTarget = deckId === 'deckA' ? setDeckA : setDeckB;

    if (sourceDeck.originalBpm <= 0 || targetDeck.originalBpm <= 0) return;

    // Calcular variación requerida para igualar BPM
    const targetBpm = sourceDeck.bpm;
    const newRate = targetBpm / targetDeck.originalBpm;
    const pitchPercent = (newRate - 1.0) * 100;

    globalAudio.setPlaybackRate(deckId, newRate);
    updateTarget((prev) => ({
      ...prev,
      isSync: true,
      playbackRate: newRate,
      pitchPercent: Math.max(-prev.pitchRange, Math.min(prev.pitchRange, pitchPercent)),
      bpm: targetBpm,
    }));
  };

  // Tap BPM
  const handleTapBpm = (deckId: DeckId) => {
    const detected = tapTrackerRef.current.tap();
    if (detected) {
      const update = deckId === 'deckA' ? setDeckA : setDeckB;
      update((p) => ({
        ...p,
        bpm: detected,
        originalBpm: detected / p.playbackRate,
      }));
    }
  };

  // Hot Cues
  const handleSetHotCue = (deckId: DeckId, cueId: number) => {
    const deck = deckId === 'deckA' ? deckA : deckB;
    if (!deck.loadedTrack) return;

    const newCue: CuePoint = {
      id: cueId,
      time: deck.currentTime,
      color: APP_CONFIG.hotCueColors[cueId - 1] || '#06B6D4',
      label: `Cue ${cueId}`,
    };

    const updatedCues = [...(deck.loadedTrack.hotCues || []).filter((c) => c.id !== cueId), newCue];
    const updatedTrack = { ...deck.loadedTrack, hotCues: updatedCues };

    if (deckId === 'deckA') setDeckA((p) => ({ ...p, loadedTrack: updatedTrack }));
    else setDeckB((p) => ({ ...p, loadedTrack: updatedTrack }));

    localDB.saveTrack(updatedTrack);
  };

  const handleJumpHotCue = (deckId: DeckId, cue: CuePoint) => {
    handleSeek(deckId, cue.time);
  };

  const handleDeleteHotCue = (deckId: DeckId, cueId: number) => {
    const deck = deckId === 'deckA' ? deckA : deckB;
    if (!deck.loadedTrack) return;

    const updatedCues = (deck.loadedTrack.hotCues || []).filter((c) => c.id !== cueId);
    const updatedTrack = { ...deck.loadedTrack, hotCues: updatedCues };

    if (deckId === 'deckA') setDeckA((p) => ({ ...p, loadedTrack: updatedTrack }));
    else setDeckB((p) => ({ ...p, loadedTrack: updatedTrack }));

    localDB.saveTrack(updatedTrack);
  };

  // Loops
  const handleSetLoop = (deckId: DeckId, beats: number) => {
    const deck = deckId === 'deckA' ? deckA : deckB;
    const beatSeconds = 60 / deck.bpm;
    const loopDuration = beats * beatSeconds;
    const loopStart = deck.currentTime;
    const loopEnd = Math.min(deck.duration, loopStart + loopDuration);

    const update = deckId === 'deckA' ? setDeckA : setDeckB;
    update((p) => ({
      ...p,
      loopActive: true,
      loopBeats: beats,
      loopStart,
      loopEnd,
    }));
  };

  const handleToggleLoop = (deckId: DeckId) => {
    const update = deckId === 'deckA' ? setDeckA : setDeckB;
    update((p) => ({ ...p, loopActive: !p.loopActive }));
  };

  // Efectos y Filtro
  const handleSetFilter = (deckId: DeckId, val: number) => {
    globalAudio.setFilterSweep(deckId, val);
    const update = deckId === 'deckA' ? setDeckA : setDeckB;
    update((p) => ({ ...p, fxFilter: val }));
  };

  const handleToggleFx = (deckId: DeckId, fxName: 'echo' | 'flanger' | 'reverb' | 'brake') => {
    const deck = deckId === 'deckA' ? deckA : deckB;
    const update = deckId === 'deckA' ? setDeckA : setDeckB;

    if (fxName === 'echo') {
      const next = !deck.fxEcho;
      globalAudio.setEcho(deckId, next, deck.fxEchoTime, deck.fxEchoFeedback);
      update((p) => ({ ...p, fxEcho: next }));
    } else if (fxName === 'flanger') {
      const next = !deck.fxFlanger;
      globalAudio.setFlanger(deckId, next);
      update((p) => ({ ...p, fxFlanger: next }));
    } else if (fxName === 'reverb') {
      const next = !deck.fxReverb;
      globalAudio.setReverb(deckId, next);
      update((p) => ({ ...p, fxReverb: next }));
    } else if (fxName === 'brake') {
      handleVinylBrake(deckId);
    }
  };

  const handleResetFx = (deckId: DeckId) => {
    globalAudio.resetAllFx(deckId);
    const update = deckId === 'deckA' ? setDeckA : setDeckB;
    update((p) => ({
      ...p,
      fxFilter: 0,
      fxEcho: false,
      fxFlanger: false,
      fxReverb: false,
      fxBrake: false,
    }));
  };

  // Auriculares CUE
  const handleToggleCue = (deckId: DeckId) => {
    const deck = deckId === 'deckA' ? deckA : deckB;
    const next = !deck.cueActive;
    globalAudio.setCueDeck(deckId, next);
    const update = deckId === 'deckA' ? setDeckA : setDeckB;
    update((p) => ({ ...p, cueActive: next }));
  };

  // Mezclador
  const handleSetCrossfader = (val: number) => {
    globalAudio.setCrossfader(val, mixerState.crossfaderCurve);
    setMixerState((p) => ({ ...p, crossfader: val }));
  };

  const handleSetCrossfaderCurve = (curve: CrossfaderCurve) => {
    globalAudio.setCrossfader(mixerState.crossfader, curve);
    setMixerState((p) => ({ ...p, crossfaderCurve: curve }));
  };

  const handleSetGain = (deckId: DeckId, gain: number) => {
    globalAudio.setChannelGain(deckId, gain);
    const update = deckId === 'deckA' ? setDeckA : setDeckB;
    update((p) => ({ ...p, gain }));
  };

  const handleSetEq = (deckId: DeckId, band: 'high' | 'mid' | 'low', val: number) => {
    const deck = deckId === 'deckA' ? deckA : deckB;
    const isKill = band === 'high' ? deck.eqHighKill : band === 'mid' ? deck.eqMidKill : deck.eqLowKill;
    globalAudio.setEq(deckId, band, val, isKill);
    const update = deckId === 'deckA' ? setDeckA : setDeckB;
    if (band === 'high') update((p) => ({ ...p, eqHigh: val }));
    else if (band === 'mid') update((p) => ({ ...p, eqMid: val }));
    else if (band === 'low') update((p) => ({ ...p, eqLow: val }));
  };

  const handleToggleKill = (deckId: DeckId, band: 'high' | 'mid' | 'low') => {
    const deck = deckId === 'deckA' ? deckA : deckB;
    const update = deckId === 'deckA' ? setDeckA : setDeckB;

    if (band === 'high') {
      const nextKill = !deck.eqHighKill;
      globalAudio.setEq(deckId, 'high', deck.eqHigh, nextKill);
      update((p) => ({ ...p, eqHighKill: nextKill }));
    } else if (band === 'mid') {
      const nextKill = !deck.eqMidKill;
      globalAudio.setEq(deckId, 'mid', deck.eqMid, nextKill);
      update((p) => ({ ...p, eqMidKill: nextKill }));
    } else if (band === 'low') {
      const nextKill = !deck.eqLowKill;
      globalAudio.setEq(deckId, 'low', deck.eqLow, nextKill);
      update((p) => ({ ...p, eqLowKill: nextKill }));
    }
  };

  const handleSetChannelVolume = (deckId: DeckId, vol: number) => {
    globalAudio.setChannelVolume(deckId, vol);
    const update = deckId === 'deckA' ? setDeckA : setDeckB;
    update((p) => ({ ...p, volume: vol }));
  };

  const handleSetMasterVolume = (vol: number) => {
    globalAudio.setMasterVolume(vol);
    setMixerState((p) => ({ ...p, masterVolume: vol }));
  };

  const handleSetHeadphoneVolume = (vol: number) => {
    globalAudio.setHeadphoneVolume(vol);
    setMixerState((p) => ({ ...p, headphoneVolume: vol }));
  };

  const handleSetHeadphoneCueMix = (mix: number) => {
    globalAudio.setHeadphoneCueMix(mix);
    setMixerState((p) => ({ ...p, headphoneCueMix: mix }));
  };

  // TRANSICIÓN AUTOMÁTICA "MEZCLAR AHORA"
  const handleStartTransition = () => {
    if (isTransitioning) return;

    // Determinar deck entrante y saliente
    const isDeckAActive = mixerState.crossfader <= 0;
    const incomingDeckId: DeckId = isDeckAActive ? 'deckB' : 'deckA';
    const incomingDeck = incomingDeckId === 'deckA' ? deckA : deckB;

    // Asegurar que el deck entrante empiece a sonar si está cargado
    if (incomingDeck.loadedTrack && !incomingDeck.isPlaying) {
      handlePlay(incomingDeckId);
    }

    setIsTransitioning(true);
    globalAudio.startTransition(
      transitionConfig,
      mixerState.crossfader,
      (newXfader) => {
        setMixerState((p) => ({ ...p, crossfader: newXfader }));
      },
      () => {
        setIsTransitioning(false);
      }
    );
  };

  // FIN SUAVE (Fade out progresivo sin corte abrupto)
  const handleStartSmoothFadeOut = () => {
    const activeDeckToFade: DeckId = mixerState.crossfader <= 0 ? 'deckA' : 'deckB';
    globalAudio.startSmoothFadeOut(
      activeDeckToFade,
      8, // 8 segundos de fade suave
      (vol) => {
        if (activeDeckToFade === 'deckA') setDeckA((p) => ({ ...p, volume: vol }));
        else setDeckB((p) => ({ ...p, volume: vol }));
      },
      () => {
        if (activeDeckToFade === 'deckA') setDeckA((p) => ({ ...p, isPlaying: false, volume: 0.9 }));
        else setDeckB((p) => ({ ...p, isPlaying: false, volume: 0.9 }));
      }
    );
  };

  // Silencio de Emergencia
  const handleEmergencySilence = () => {
    globalAudio.emergencySilence(() => {
      setDeckA((p) => ({ ...p, isPlaying: false }));
      setDeckB((p) => ({ ...p, isPlaying: false }));
    });
  };

  // Importación de archivos locales
  const handleImportFiles = async (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    const audioCtx = globalAudio.getContext();

    for (const file of filesArray) {
      if (!file.name.match(/\.(mp3|wav|ogg|flac|m4a|aac)$/i) && !file.type.startsWith('audio/')) {
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const analysis = await analyzeAudio(audioBuffer);

        const newTrack: TrackMetadata = {
          id: `track_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'Artista Local',
          duration: audioBuffer.duration,
          bpm: analysis.bpm,
          originalBpm: analysis.bpm,
          key: analysis.camelotKey,
          file,
          audioBuffer,
          waveformData: analysis.waveformData,
          hotCues: [],
          dateAdded: Date.now(),
        };

        setTracks((prev) => [newTrack, ...prev]);
        localDB.saveTrack(newTrack);
      } catch (err) {
        console.error('Error procesando archivo:', file.name, err);
      }
    }
  };

  // Playlists
  const handleCreatePlaylist = (name: string) => {
    const newPl: Playlist = {
      id: `pl_${Date.now()}`,
      name,
      trackIds: [],
      created: Date.now(),
    };
    setPlaylists((p) => [...p, newPl]);
    localDB.savePlaylist(newPl);
  };

  const handleDeletePlaylist = (id: string) => {
    setPlaylists((p) => p.filter((pl) => pl.id !== id));
    localDB.deletePlaylist(id);
  };

  const handleToggleFavorite = (trackId: string) => {
    setFavoriteTrackIds((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  };

  const handleDeleteTrack = (id: string) => {
    setTracks((p) => p.filter((t) => t.id !== id));
    localDB.deleteTrack(id);
  };

  // Soundboard
  const handlePlaySound = (soundType: string, volume: number, customId?: string) => {
    globalAudio.soundboard.play(soundType, volume * masterSfxVolume, customId);
  };

  const handleSetSoundboardItemVolume = (id: string, vol: number) => {
    setSoundboardItems((prev) => prev.map((item) => (item.id === id ? { ...item, volume: vol } : item)));
  };

  const handleAddCustomSound = async (name: string, file: File) => {
    const id = `custom_${Date.now()}`;
    await globalAudio.soundboard.loadCustomSound(id, file);

    const newItem: SoundboardItem = {
      id,
      name,
      category: 'custom',
      hotkey: `${soundboardItems.length + 1}`,
      volume: 0.9,
      color: '#06B6D4',
      isCustom: true,
      file,
    };
    setSoundboardItems((prev) => [...prev, newItem]);
  };

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const activeDeck = activeDeckId === 'deckA' ? deckA : deckB;

      if (e.code === 'Space') {
        e.preventDefault();
        if (activeDeck.isPlaying) handlePause(activeDeckId);
        else handlePlay(activeDeckId);
      } else if (e.key === 'a' || e.key === 'A') {
        setActiveDeckId('deckA');
      } else if (e.key === 'b' || e.key === 'B') {
        setActiveDeckId('deckB');
      } else if (e.key === 's' || e.key === 'S') {
        handleSync(activeDeckId);
      } else if (e.key === 'm' || e.key === 'M') {
        handleStartTransition();
      } else if (e.key === 'f' || e.key === 'F') {
        handleStartSmoothFadeOut();
      } else if (e.key === 'c' || e.key === 'C') {
        handleToggleCue(activeDeckId);
      } else if (e.key === 'Escape') {
        handleEmergencySilence();
      } else if (e.key === 'ArrowLeft') {
        handleNudge(activeDeckId, 'backward');
      } else if (e.key === 'ArrowRight') {
        handleNudge(activeDeckId, 'forward');
      } else if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(e.key)) {
        const num = parseInt(e.key);
        // Si la pestaña de Soundboard está activa, disparar SFX, si no Hot Cue
        if (currentTab === 'soundboard') {
          const item = soundboardItems.find((s) => s.hotkey === e.key);
          if (item) handlePlaySound(item.soundType || 'airhorn', item.volume, item.id);
        } else {
          const cue = activeDeck.loadedTrack?.hotCues?.find((c) => c.id === num);
          if (cue) handleJumpHotCue(activeDeckId, cue);
          else handleSetHotCue(activeDeckId, num);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDeckId, deckA, deckB, currentTab, soundboardItems, masterSfxVolume]);

  // Manejo de Drop en el deck directamente
  const handleDeckDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDeckDrop = (deckId: DeckId, e: React.DragEvent) => {
    e.preventDefault();
    const trackId = e.dataTransfer.getData('text/plain');
    if (trackId) {
      const found = tracks.find((t) => t.id === trackId);
      if (found) loadTrackToDeck(deckId, found);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col select-none transition-colors duration-200 ${
        theme === 'dark' ? 'bg-neutral-950 text-neutral-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* 1. CABECERA PRINCIPAL */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        masterVolume={mixerState.masterVolume}
        onSetMasterVolume={handleSetMasterVolume}
        headphoneVolume={mixerState.headphoneVolume}
        onSetHeadphoneVolume={handleSetHeadphoneVolume}
        headphoneCueMix={mixerState.headphoneCueMix}
        onSetHeadphoneCueMix={handleSetHeadphoneCueMix}
        theme={theme}
        onToggleTheme={() => {
          const next = theme === 'dark' ? 'light' : 'dark';
          setTheme(next);
          localDB.savePreference('theme', next);
        }}
        onEmergencySilence={handleEmergencySilence}
        isPartyModeActive={isPartyModeActive}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        isInstalled={isInstalled}
        isInstallable={isInstallable}
      />

      {/* 2. CONSOLA PRINCIPAL DE DJ (DECK A — MIXER — DECK B) */}
      <main className="flex-1 p-3 flex flex-col gap-3 max-w-[1720px] mx-auto w-full">
        <div className="grid grid-cols-12 gap-3 items-stretch">
          {/* DECK A */}
          <div
            className="col-span-5"
            onDragOver={handleDeckDragOver}
            onDrop={(e) => handleDeckDrop('deckA', e)}
            onClick={() => setActiveDeckId('deckA')}
          >
            <Deck
              state={deckA}
              otherDeckState={deckB}
              onPlay={handlePlay}
              onPause={handlePause}
              onStop={handleStop}
              onSeek={handleSeek}
              onUnload={handleUnloadTrack}
              onSetPitch={handleSetPitch}
              onSetPitchRange={(id, r) => setDeckA((p) => ({ ...p, pitchRange: r }))}
              onToggleKeyLock={(id) => setDeckA((p) => ({ ...p, keyLock: !p.keyLock }))}
              onSync={handleSync}
              onTapBpm={handleTapBpm}
              onNudge={handleNudge}
              onSetHotCue={handleSetHotCue}
              onJumpHotCue={handleJumpHotCue}
              onDeleteHotCue={handleDeleteHotCue}
              onSetLoop={handleSetLoop}
              onToggleLoop={handleToggleLoop}
              onSetFilter={handleSetFilter}
              onToggleFx={handleToggleFx}
              onResetFx={handleResetFx}
              onToggleCue={handleToggleCue}
              onScratchMove={handleScratchMove}
              onScratchEnd={handleScratchEnd}
              onVinylBrake={handleVinylBrake}
              isOnAir={mixerState.crossfader < 0.75}
            />
          </div>

          {/* MIXER CENTRAL */}
          <div className="col-span-2">
            <Mixer
              deckA={deckA}
              deckB={deckB}
              mixerState={mixerState}
              vuLevels={vuLevels}
              transitionConfig={transitionConfig}
              onSetGain={handleSetGain}
              onSetEq={handleSetEq}
              onToggleKill={handleToggleKill}
              onSetChannelVolume={handleSetChannelVolume}
              onSetCrossfader={handleSetCrossfader}
              onSetCrossfaderCurve={handleSetCrossfaderCurve}
              onSetMasterVolume={handleSetMasterVolume}
              onSetHeadphoneVolume={handleSetHeadphoneVolume}
              onSetHeadphoneCueMix={handleSetHeadphoneCueMix}
              onStartTransition={handleStartTransition}
              onStartSmoothFadeOut={handleStartSmoothFadeOut}
              onUpdateTransitionConfig={(up) => setTransitionConfig((p) => ({ ...p, ...up }))}
              isTransitioning={isTransitioning}
            />
          </div>

          {/* DECK B */}
          <div
            className="col-span-5"
            onDragOver={handleDeckDragOver}
            onDrop={(e) => handleDeckDrop('deckB', e)}
            onClick={() => setActiveDeckId('deckB')}
          >
            <Deck
              state={deckB}
              otherDeckState={deckA}
              onPlay={handlePlay}
              onPause={handlePause}
              onStop={handleStop}
              onSeek={handleSeek}
              onUnload={handleUnloadTrack}
              onSetPitch={handleSetPitch}
              onSetPitchRange={(id, r) => setDeckB((p) => ({ ...p, pitchRange: r }))}
              onToggleKeyLock={(id) => setDeckB((p) => ({ ...p, keyLock: !p.keyLock }))}
              onSync={handleSync}
              onTapBpm={handleTapBpm}
              onNudge={handleNudge}
              onSetHotCue={handleSetHotCue}
              onJumpHotCue={handleJumpHotCue}
              onDeleteHotCue={handleDeleteHotCue}
              onSetLoop={handleSetLoop}
              onToggleLoop={handleToggleLoop}
              onSetFilter={handleSetFilter}
              onToggleFx={handleToggleFx}
              onResetFx={handleResetFx}
              onToggleCue={handleToggleCue}
              onScratchMove={handleScratchMove}
              onScratchEnd={handleScratchEnd}
              onVinylBrake={handleVinylBrake}
              isOnAir={mixerState.crossfader > -0.75}
            />
          </div>
        </div>

        {/* 3. PESTAÑA INFERIOR DE TRABAJO */}
        <div className="w-full">
          {currentTab === 'library' && (
            <Library
              tracks={tracks}
              playlists={playlists}
              onImportFiles={handleImportFiles}
              onLoadTrackToDeck={loadTrackToDeck}
              onDeleteTrack={handleDeleteTrack}
              onCreatePlaylist={handleCreatePlaylist}
              onDeletePlaylist={handleDeletePlaylist}
              onToggleFavorite={handleToggleFavorite}
              favoriteTrackIds={favoriteTrackIds}
            />
          )}

          {currentTab === 'soundboard' && (
            <Soundboard
              items={soundboardItems}
              onPlaySound={handlePlaySound}
              onSetItemVolume={handleSetSoundboardItemVolume}
              masterSfxVolume={masterSfxVolume}
              onSetMasterSfxVolume={(vol) => {
                setMasterSfxVolume(vol);
                globalAudio.soundboard.setVolume(vol);
              }}
              onAddCustomSound={handleAddCustomSound}
              onEmergencySilence={handleEmergencySilence}
            />
          )}

          {currentTab === 'autodj' && (
            <AutoDjPartyMode
              isPartyModeActive={isPartyModeActive}
              onTogglePartyMode={() => setIsPartyModeActive(!isPartyModeActive)}
              safetyLock={safetyLock}
              onToggleSafetyLock={() => setSafetyLock(!safetyLock)}
              activeDeck={mixerState.crossfader <= 0 ? deckA : deckB}
              upcomingTracks={tracks.filter((t) => t.id !== deckA.loadedTrack?.id && t.id !== deckB.loadedTrack?.id)}
              onLoadTrackToDeck={loadTrackToDeck}
            />
          )}

          {currentTab === 'audio' && (
            <AudioSettings
              config={audioConfig}
              onUpdateConfig={(up) => {
                const next = { ...audioConfig, ...up };
                setAudioConfig(next);
                if (up.splitStereoMode !== undefined) {
                  globalAudio.setSplitStereoMode(up.splitStereoMode);
                }
                localDB.savePreference('audioConfig', next);
              }}
              headphoneVolume={mixerState.headphoneVolume}
              onSetHeadphoneVolume={handleSetHeadphoneVolume}
              headphoneCueMix={mixerState.headphoneCueMix}
              onSetHeadphoneCueMix={handleSetHeadphoneCueMix}
            />
          )}

          {currentTab === 'shortcuts' && <ShortcutsModal />}
        </div>
      </main>

      {/* 4. MODAL DE INSTALACIÓN EN ESCRITORIO PC */}
      <InstallDesktopModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* 5. INDICADOR DE ESTADO OFFLINE */}
      {!isOnline && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-neutral-900/95 border border-[#4EA8DE]/60 text-[#4EA8DE] text-xs font-bold shadow-2xl backdrop-blur-md animate-pulse">
          <WifiOff size={16} />
          <span>Modo 100% Offline Activado — La consola DJLove funciona sin Internet</span>
        </div>
      )}
    </div>
  );
}
