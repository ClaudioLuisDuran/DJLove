/**
 * Tipos de datos para FIESTA MIX
 * Aplicación de DJ de escritorio, offline y fácil de usar
 */

export type DeckId = 'deckA' | 'deckB';

export interface CuePoint {
  id: number; // 1 to 8
  time: number; // segundos
  color: string;
  label?: string;
}

export interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // segundos
  bpm: number;
  originalBpm: number;
  key?: string; // e.g. "8A" o "Am"
  file?: File;
  filePath?: string;
  isDemo?: boolean;
  audioBuffer?: AudioBuffer;
  waveformData?: Float32Array; // Picos reducidos para visualización rápida
  hotCues: CuePoint[];
  loopStart?: number;
  loopEnd?: number;
  dateAdded: number;
}

export interface DeckState {
  id: DeckId;
  loadedTrack: TrackMetadata | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number; // 1.0 = normal
  pitchPercent: number; // -32% a +32%
  pitchRange: 8 | 16 | 32;
  keyLock: boolean;
  bpm: number;
  originalBpm: number;
  volume: number; // 0.0 a 1.0 (Fader de canal)
  gain: number; // 0.5 a 2.0 (Ganancia/Trim)
  eqHigh: number; // dB (-40 a +6)
  eqMid: number; // dB (-40 a +6)
  eqLow: number; // dB (-40 a +6)
  eqHighKill: boolean;
  eqMidKill: boolean;
  eqLowKill: boolean;
  cueActive: boolean; // Preescucha en auriculares
  isSync: boolean;
  isScratching: boolean;
  loopActive: boolean;
  loopBeats: number; // 1, 2, 4, 8, 16
  loopStart: number | null;
  loopEnd: number | null;
  fxFilter: number; // -100 (LPF) a +100 (HPF), 0 = apagado
  fxEcho: boolean;
  fxEchoTime: number; // 1/4, 1/2, etc. en segs
  fxEchoFeedback: number; // 0 a 0.85
  fxFlanger: boolean;
  fxReverb: boolean;
  fxBrake: boolean;
  vuLevel: number; // 0 a 1
  isClipping: boolean;
}

export type CrossfaderCurve = 'smooth' | 'cut' | 'linear';

export interface MixerState {
  crossfader: number; // -1.0 (Deck A) a +1.0 (Deck B)
  crossfaderCurve: CrossfaderCurve;
  masterVolume: number; // 0.0 a 1.0
  headphoneVolume: number; // 0.0 a 1.0
  headphoneCueMix: number; // 0.0 (Solo Cue) a 1.0 (Solo Master)
  masterCue: boolean;
  vuMasterL: number;
  vuMasterR: number;
  isMasterClipping: boolean;
}

export type TransitionMode = 'smooth' | 'bass_swap' | 'quick_cut' | 'beat_synced';

export interface TransitionConfig {
  mode: TransitionMode;
  durationBeats: 4 | 8 | 16 | 32;
  durationSeconds: number; // 3, 5, 8, 12, 16
  useBeats: boolean;
  startNextFromCue: boolean;
}

export interface SoundboardItem {
  id: string;
  name: string;
  category: 'party' | 'crowd' | 'rhythm' | 'comic' | 'custom';
  hotkey: string;
  volume: number; // 0.0 a 1.0
  color: string;
  isCustom?: boolean;
  soundType?: string; // tipo de síntesis o archivo local
  file?: File;
  audioBuffer?: AudioBuffer;
}

export interface AudioDeviceConfig {
  masterDeviceId: string;
  cueDeviceId: string;
  splitStereoMode: boolean; // Left = Master, Right = Auriculares CUE (para laptops con salida única)
  lowLatencyMode: boolean;
  limiterActive: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  created: number;
}

export interface AppPreferences {
  theme: 'dark' | 'light';
  audioConfig: AudioDeviceConfig;
  transitionConfig: TransitionConfig;
  partyModeAutoTransition: boolean;
  partyModeSafetyLock: boolean;
  smoothFadeOutDuration: number; // 3 a 20 segs
}
