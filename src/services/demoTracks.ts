/**
 * Generador offline de pistas musicales de demostración
 * Crea pistas completas mediante síntesis de audio de alta calidad (Drums, Bass, Synths, Chords)
 * para permitir la mezcla inmediata sin necesidad de archivos externos.
 */

import { TrackMetadata } from '../types/dj';
import { generateWaveformPeaks } from './bpmAnalyzer';

/**
 * Sintetiza un AudioBuffer con ritmo de fiesta completo
 */
export function synthesizePartyTrack(
  ctx: AudioContext,
  options: {
    title: string;
    artist: string;
    bpm: number;
    key: string;
    genre: 'electro' | 'cumbia' | 'house';
    durationSeconds?: number;
  }
): { metadata: TrackMetadata; buffer: AudioBuffer } {
  const duration = options.durationSeconds || 60; // 60 segundos de pista de fiesta en loop
  const sampleRate = ctx.sampleRate;
  const numSamples = Math.floor(duration * sampleRate);
  const buffer = ctx.createBuffer(2, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const bpm = options.bpm;
  const beatDuration = 60 / bpm;
  const totalBeats = Math.floor(duration / beatDuration);

  // Escala musical según la clave
  // Pentatónica menor o mayor
  const baseFreq = options.key.includes('A') ? 220 : options.key.includes('C') ? 261.63 : 196; // G o C o A

  // Síntesis beat a beat
  for (let b = 0; b < totalBeats; b++) {
    const beatTime = b * beatDuration;
    const beatStartSample = Math.floor(beatTime * sampleRate);
    const measurePos = b % 4; // 0, 1, 2, 3
    const section = Math.floor(b / 16) % 4; // 4 secciones de 16 beats

    // 1. KICK DRUM (en todos los beats para house/electro, o en 0 y 2 para cumbia)
    const hasKick = options.genre === 'cumbia' ? measurePos === 0 || measurePos === 2 : true;
    if (hasKick) {
      const kickLength = Math.floor(sampleRate * 0.25);
      for (let i = 0; i < kickLength && beatStartSample + i < numSamples; i++) {
        const t = i / sampleRate;
        // Pitch drop de 150Hz a 40Hz
        const freq = 45 + 120 * Math.exp(-t * 28);
        const amp = Math.exp(-t * 12) * 0.9;
        const val = Math.sin(2 * Math.PI * freq * t) * amp;
        left[beatStartSample + i] += val;
        right[beatStartSample + i] += val;
      }
    }

    // 2. SNARE / CLAP (en beats 1 y 3)
    if (measurePos === 1 || measurePos === 3) {
      const snareLength = Math.floor(sampleRate * 0.2);
      for (let i = 0; i < snareLength && beatStartSample + i < numSamples; i++) {
        const t = i / sampleRate;
        const noise = (Math.random() * 2 - 1) * Math.exp(-t * 16) * 0.45;
        const tone = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 22) * 0.35;
        const val = noise + tone;
        left[beatStartSample + i] += val;
        right[beatStartSample + i] += val;
      }
    }

    // 3. HI-HATS (en los offbeats & semicorcheas)
    const hatSteps = options.genre === 'cumbia' ? [0.25, 0.5, 0.75] : [0.5];
    for (const offsetFrac of hatSteps) {
      const hatStart = Math.floor((beatTime + offsetFrac * beatDuration) * sampleRate);
      const hatLength = Math.floor(sampleRate * 0.06);
      for (let i = 0; i < hatLength && hatStart + i < numSamples; i++) {
        const t = i / sampleRate;
        const val = (Math.random() * 2 - 1) * Math.exp(-t * 50) * 0.25;
        left[hatStart + i] += val * 0.8;
        right[hatStart + i] += val * 1.1; // ligero stereo pan
      }
    }

    // 4. BASSLINE
    const bassNote = section === 0 ? 1 : section === 1 ? 1.2 : section === 2 ? 0.8 : 1.33;
    const bassFreq = (baseFreq / 2) * bassNote;
    const bassSamples = Math.floor(beatDuration * 0.85 * sampleRate);
    for (let i = 0; i < bassSamples && beatStartSample + i < numSamples; i++) {
      const t = i / sampleRate;
      // Onda diente de sierra suave con filtro
      const phase = (bassFreq * t) % 1;
      const saw = (phase * 2 - 1);
      const sub = Math.sin(2 * Math.PI * (bassFreq / 2) * t);
      const env = Math.exp(-t * 4) * (options.genre === 'cumbia' ? 0.4 : 0.35);
      const val = (saw * 0.5 + sub * 0.5) * env;
      left[beatStartSample + i] += val;
      right[beatStartSample + i] += val;
    }

    // 5. SYNTH HOOK / CHORDS (Melodía de fiesta)
    const melodyPattern = [1, 1.25, 1.5, 1.33, 1.5, 1.8, 1.5, 1.25];
    const melNote = melodyPattern[b % melodyPattern.length];
    const synthFreq = baseFreq * melNote * (section > 1 ? 2 : 1);
    const synthLen = Math.floor(beatDuration * 0.45 * sampleRate);
    for (let i = 0; i < synthLen && beatStartSample + i < numSamples; i++) {
      const t = i / sampleRate;
      const val = (
        Math.sin(2 * Math.PI * synthFreq * t) * 0.5 +
        Math.sin(2 * Math.PI * synthFreq * 1.01 * t) * 0.3 + // detune
        Math.sin(2 * Math.PI * synthFreq * 2.0 * t) * 0.2
      ) * Math.exp(-t * 5) * 0.25;

      left[beatStartSample + i] += val * 1.1;
      right[beatStartSample + i] += val * 0.9;
    }
  }

  // Normalizar para evitar clipping
  let peak = 0;
  for (let i = 0; i < numSamples; i++) {
    const l = Math.abs(left[i]);
    const r = Math.abs(right[i]);
    if (l > peak) peak = l;
    if (r > peak) peak = r;
  }

  if (peak > 0.95) {
    const factor = 0.92 / peak;
    for (let i = 0; i < numSamples; i++) {
      left[i] *= factor;
      right[i] *= factor;
    }
  }

  const waveformData = generateWaveformPeaks(buffer, 1200);

  const metadata: TrackMetadata = {
    id: `demo_${options.genre}`,
    title: options.title,
    artist: options.artist,
    album: 'Fiesta Mix Demos',
    duration,
    bpm: options.bpm,
    originalBpm: options.bpm,
    key: options.key,
    isDemo: true,
    audioBuffer: buffer,
    waveformData,
    hotCues: [
      { id: 1, time: 0, color: '#EF4444', label: 'Intro' },
      { id: 2, time: beatDuration * 16, color: '#F59E0B', label: 'Drop' },
      { id: 3, time: beatDuration * 32, color: '#10B981', label: 'Break' },
      { id: 4, time: beatDuration * 48, color: '#06B6D4', label: 'Final' },
    ],
    dateAdded: Date.now(),
  };

  return { metadata, buffer };
}

/**
 * Conjunto de 3 pistas iniciales listas para pinchar
 */
export const INITIAL_DEMO_TRACKS_CONFIG = [
  {
    genre: 'electro' as const,
    title: 'Noche de Fiesta (Electro)',
    artist: 'DJ Fiesta Mix',
    bpm: 128,
    key: '8A / Am',
    durationSeconds: 75,
  },
  {
    genre: 'cumbia' as const,
    title: 'Ritmo Tropical (Cumbia Urbana)',
    artist: 'Sonido Latino',
    bpm: 100,
    key: '6B / Bb Maj',
    durationSeconds: 72,
  },
  {
    genre: 'house' as const,
    title: 'Club Energy (House Groove)',
    artist: 'Pacha Beats',
    bpm: 124,
    key: '11B / A Maj',
    durationSeconds: 77,
  },
];
