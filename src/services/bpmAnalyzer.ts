/**
 * Motor de análisis de audio: BPM, beatgrid, tonalidad (Camelot) y picos de forma de onda.
 * Procesamiento offline 100% local en Web Audio, sin dependencias externas.
 */

export interface BpmAnalysisResult {
  bpm: number;
  confidence: number;
  firstBeatOffset: number; // segundos donde cae el primer golpe
  musicalKey: string; // Ej: "A min"
  camelotKey: string; // Ej: "8A"
  waveformData: Float32Array;
}

// Perfiles de clave Krumhansl-Kessler para estimación de tonalidad
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const CAMELOT_MAJOR: Record<string, string> = {
  'B': '1B', 'F#': '2B', 'C#': '3B', 'G#': '4B', 'D#': '5B', 'A#': '6B',
  'F': '7B', 'C': '8B', 'G': '9B', 'D': '10B', 'A': '11B', 'E': '12B',
};

const CAMELOT_MINOR: Record<string, string> = {
  'G#': '1A', 'D#': '2A', 'A#': '3A', 'F': '4A', 'C': '5A', 'G': '6A',
  'D': '7A', 'A': '8A', 'E': '9A', 'B': '10A', 'F#': '11A', 'C#': '12A',
};

/**
 * Genera picos de forma de onda reducidos (por ejemplo, 1000 puntos para toda la pista)
 */
export function generateWaveformPeaks(buffer: AudioBuffer, targetPoints = 1200): Float32Array {
  const channelData = buffer.getChannelData(0);
  const totalSamples = channelData.length;
  const blockSize = Math.floor(totalSamples / targetPoints);
  const peaks = new Float32Array(targetPoints);

  for (let i = 0; i < targetPoints; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, totalSamples);
    let max = 0;
    for (let j = start; j < end; j += 4) { // paso de 4 para optimizar CPU
      const absVal = Math.abs(channelData[j]);
      if (absVal > max) max = absVal;
    }
    peaks[i] = Math.min(1.0, max);
  }

  return peaks;
}

/**
 * Analiza un AudioBuffer y estima BPM, primer beat, tonalidad y picos.
 */
export async function analyzeAudio(buffer: AudioBuffer): Promise<BpmAnalysisResult> {
  const sampleRate = buffer.sampleRate;
  const channelData = buffer.getChannelData(0);
  const duration = buffer.duration;

  // Generar picos visuales
  const waveformData = generateWaveformPeaks(buffer, 1200);

  // Analizamos una ventana representativa (hasta 60 segundos)
  const maxAnalysisSeconds = Math.min(60, duration);
  const analysisSamples = Math.floor(maxAnalysisSeconds * sampleRate);
  
  // 1. Detección de picos / transientes de baja frecuencia (bombo/kick)
  // Submuestreo a ~4000 Hz para acelerar enormemente
  const downsampleFactor = Math.floor(sampleRate / 4000) || 1;
  const downsampledLength = Math.floor(analysisSamples / downsampleFactor);
  const envelope = new Float32Array(downsampledLength);
  const downsampledRate = sampleRate / downsampleFactor;

  // Filtro de energía simple paso-bajos + diferenciador
  let prevSample = 0;
  for (let i = 0; i < downsampledLength; i++) {
    const rawIdx = i * downsampleFactor;
    const sample = channelData[rawIdx];
    // Envolvente de energía de transiente (rectificación + filtro)
    const diff = Math.max(0, Math.abs(sample) - prevSample);
    envelope[i] = diff;
    prevSample = Math.abs(sample) * 0.95;
  }

  // 2. Autocorrelación para encontrar período de tempo
  // Rango DJ típico: 70 BPM a 180 BPM
  const minBpm = 70;
  const maxBpm = 175;
  const minLag = Math.floor((60 / maxBpm) * downsampledRate);
  const maxLag = Math.floor((60 / minBpm) * downsampledRate);

  let bestLag = minLag;
  let maxCorrelation = 0;
  const maxSearchSamples = Math.min(downsampledLength - maxLag, 20000);

  for (let lag = minLag; lag <= maxLag; lag += 2) {
    let sum = 0;
    for (let i = 0; i < maxSearchSamples; i += 8) {
      sum += envelope[i] * envelope[i + lag];
    }
    if (sum > maxCorrelation) {
      maxCorrelation = sum;
      bestLag = lag;
    }
  }

  // Refinamiento alrededor del mejor lag
  let refinedLag = bestLag;
  let refinedMax = maxCorrelation;
  for (let lag = Math.max(minLag, bestLag - 3); lag <= Math.min(maxLag, bestLag + 3); lag++) {
    let sum = 0;
    for (let i = 0; i < maxSearchSamples; i += 4) {
      sum += envelope[i] * envelope[i + lag];
    }
    if (sum > refinedMax) {
      refinedMax = sum;
      refinedLag = lag;
    }
  }

  let calculatedBpm = Math.round(((60 * downsampledRate) / refinedLag) * 10) / 10;

  // Normalización de BPM si cayó en múltiplos (ej. 60bpm -> 120bpm, o 240bpm -> 120bpm)
  if (calculatedBpm < 75) calculatedBpm *= 2;
  if (calculatedBpm > 175) calculatedBpm /= 2;
  calculatedBpm = Math.round(calculatedBpm * 10) / 10;

  // 3. Detección del primer beat (offset)
  const beatIntervalSeconds = 60 / calculatedBpm;
  const beatIntervalDownsampled = Math.floor(beatIntervalSeconds * downsampledRate);
  let firstBeatSample = 0;
  let maxBeatEnergy = 0;

  for (let i = 0; i < Math.min(beatIntervalDownsampled, downsampledLength - 100); i += 4) {
    let energy = 0;
    // Comprobar si resuena a lo largo de 4 compases
    for (let b = 0; b < 4; b++) {
      const idx = i + b * beatIntervalDownsampled;
      if (idx < downsampledLength) {
        energy += envelope[idx];
      }
    }
    if (energy > maxBeatEnergy) {
      maxBeatEnergy = energy;
      firstBeatSample = i;
    }
  }

  const firstBeatOffset = (firstBeatSample * downsampleFactor) / sampleRate;

  // 4. Estimación de tonalidad (Chroma analysis aproximado)
  const chroma = new Float32Array(12);
  // Analizamos 10 ventanas distribuidas en la canción
  const windowCount = 10;
  const windowLen = 2048;
  for (let w = 0; w < windowCount; w++) {
    const centerSample = Math.floor(((w + 1) / (windowCount + 1)) * (analysisSamples - windowLen));
    if (centerSample > 0 && centerSample + windowLen < channelData.length) {
      for (let k = 0; k < 12; k++) {
        // Frecuencia representativa de la nota en octava 3 (ej. A3 = 220Hz)
        const noteFreq = 220 * Math.pow(2, (k - 9) / 12);
        const samplesPerCycle = sampleRate / noteFreq;
        let noteEnergy = 0;
        for (let s = 0; s < 512; s += 2) {
          const sample = channelData[centerSample + s];
          noteEnergy += Math.abs(sample * Math.sin((2 * Math.PI * s) / samplesPerCycle));
        }
        chroma[k] += noteEnergy;
      }
    }
  }

  // Correlación con perfiles Mayor y Menor
  let bestKeyName = 'A min';
  let bestCamelot = '8A';
  let highestScore = -Infinity;

  for (let root = 0; root < 12; root++) {
    // Mayor
    let majScore = 0;
    let minScore = 0;
    for (let i = 0; i < 12; i++) {
      const chromaIdx = (root + i) % 12;
      majScore += chroma[chromaIdx] * MAJOR_PROFILE[i];
      minScore += chroma[chromaIdx] * MINOR_PROFILE[i];
    }

    const note = NOTE_NAMES[root];
    if (majScore > highestScore) {
      highestScore = majScore;
      bestKeyName = `${note} Maj`;
      bestCamelot = CAMELOT_MAJOR[note] || '8B';
    }
    if (minScore > highestScore) {
      highestScore = minScore;
      bestKeyName = `${note} min`;
      bestCamelot = CAMELOT_MINOR[note] || '8A';
    }
  }

  return {
    bpm: calculatedBpm,
    confidence: Math.min(1.0, maxCorrelation / (maxSearchSamples * 0.1 || 1)),
    firstBeatOffset: Math.max(0, firstBeatOffset),
    musicalKey: bestKeyName,
    camelotKey: bestCamelot,
    waveformData,
  };
}

/**
 * Calculador de TAP BPM
 */
export class TapBpmTracker {
  private taps: number[] = [];
  private readonly maxInterval = 2500; // Si pasa más de 2.5s se reinicia

  tap(): number | null {
    const now = Date.now();
    if (this.taps.length > 0 && now - this.taps[this.taps.length - 1] > this.maxInterval) {
      this.taps = [];
    }

    this.taps.push(now);

    // Mantener solo los últimos 8 taps
    if (this.taps.length > 8) {
      this.taps.shift();
    }

    if (this.taps.length < 3) {
      return null; // Necesita al menos 3 golpes
    }

    // Calcular diferencias
    const intervals: number[] = [];
    for (let i = 1; i < this.taps.length; i++) {
      intervals.push(this.taps[i] - this.taps[i - 1]);
    }

    // Media
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = Math.round((60000 / avgInterval) * 10) / 10;
    return Math.min(220, Math.max(50, bpm));
  }

  reset() {
    this.taps = [];
  }
}
