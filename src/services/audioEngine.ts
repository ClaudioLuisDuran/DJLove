/**
 * Motor central de audio de FIESTA MIX
 * Implementa reproducción simultánea de dos decks, mezcla real, ecualización de 3 bandas con kills,
 * efectos (Echo, Reverb, Filter, Flanger, Vinyl Brake), crossfader con curvas configurables,
 * medidores VU con detección de clipping, y matriz de preescucha para auriculares (incluyendo Split-Stereo).
 */

import { DeckId, DeckState, MixerState, CrossfaderCurve, TransitionConfig } from '../types/dj';
import { SoundboardEngine } from './soundboardEngine';

export interface ChannelNodes {
  source: AudioBufferSourceNode | null;
  gainTrim: GainNode;
  eqLow: BiquadFilterNode;
  eqMid: BiquadFilterNode;
  eqHigh: BiquadFilterNode;
  filterSweep: BiquadFilterNode;
  // Delay FX
  delayNode: DelayNode;
  delayFeedback: GainNode;
  delayWet: GainNode;
  // Flanger FX
  flangerDelay: DelayNode;
  flangerLfo: OscillatorNode | null;
  flangerLfoGain: GainNode | null;
  flangerWet: GainNode;
  // Reverb FX
  reverbConvolver: ConvolverNode;
  reverbWet: GainNode;
  // Channel fader
  channelFader: GainNode;
  // Crossfader contribution
  xfaderGain: GainNode;
  // Pre-escucha / Cue gain
  cueGain: GainNode;
  // Analizador para VU meter
  analyser: AnalyserNode;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private masterLimiter!: DynamicsCompressorNode;
  private masterAnalyserL!: AnalyserNode;
  private masterAnalyserR!: AnalyserNode;
  private masterSplitter!: ChannelSplitterNode;
  private masterMerger!: ChannelMergerNode;

  // Headphone / Cue bus
  private cueMasterGain!: GainNode;
  private headphoneBusGain!: GainNode;
  private cueSplitter!: ChannelSplitterNode;
  private outputMergerSplitStereo!: ChannelMergerNode;

  // Deck channels
  private deckA!: ChannelNodes;
  private deckB!: ChannelNodes;

  // Track playback state tracking
  private playStartTime: { deckA: number; deckB: number } = { deckA: 0, deckB: 0 };
  private playStartOffset: { deckA: number; deckB: number } = { deckA: 0, deckB: 0 };
  private loadedBuffers: { deckA: AudioBuffer | null; deckB: AudioBuffer | null } = { deckA: null, deckB: null };

  // Soundboard
  public soundboard!: SoundboardEngine;

  // Device & Mode configuration
  public splitStereoMode = false;
  private activeTransitionAnimation: number | null = null;
  private activeSmoothFadeAnimation: number | null = null;

  constructor() {
    // Inicialización perezosa con la primera interacción del usuario
  }

  public init() {
    if (this.ctx) return;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass({ latencyHint: 'interactive' });

    // 1. Master Output Chain con Limiter anti-clipping
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    this.masterLimiter = this.ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.setValueAtTime(-1.0, this.ctx.currentTime); // Límite -1 dBFS
    this.masterLimiter.knee.setValueAtTime(3.0, this.ctx.currentTime);
    this.masterLimiter.ratio.setValueAtTime(16.0, this.ctx.currentTime);
    this.masterLimiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.masterLimiter.release.setValueAtTime(0.08, this.ctx.currentTime);

    // Analizadores estéreo Master
    this.masterAnalyserL = this.ctx.createAnalyser();
    this.masterAnalyserR = this.ctx.createAnalyser();
    this.masterAnalyserL.fftSize = 256;
    this.masterAnalyserR.fftSize = 256;

    this.masterSplitter = this.ctx.createChannelSplitter(2);
    this.masterMerger = this.ctx.createChannelMerger(2);

    // Conexión Master normal
    this.masterGain.connect(this.masterLimiter);
    this.masterLimiter.connect(this.masterSplitter);
    this.masterSplitter.connect(this.masterAnalyserL, 0);
    this.masterSplitter.connect(this.masterAnalyserR, 1);

    // 2. Bus de auriculares (CUE)
    this.headphoneBusGain = this.ctx.createGain();
    this.headphoneBusGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    this.cueMasterGain = this.ctx.createGain();
    this.cueMasterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.masterLimiter.connect(this.cueMasterGain);
    this.cueMasterGain.connect(this.headphoneBusGain);

    // Salida estéreo estándar
    this.masterLimiter.connect(this.ctx.destination);

    // 3. Crear nodos para Deck A y Deck B
    this.deckA = this.createChannelGraph('deckA');
    this.deckB = this.createChannelGraph('deckB');

    // 4. Inicializar Soundboard
    this.soundboard = new SoundboardEngine(this.ctx, this.masterGain);

    // Reverb impulse response sintética
    this.initReverbImpulse(this.deckA.reverbConvolver);
    this.initReverbImpulse(this.deckB.reverbConvolver);
  }

  public getContext(): AudioContext {
    if (!this.ctx) this.init();
    return this.ctx!;
  }

  private createChannelGraph(deckId: DeckId): ChannelNodes {
    const ctx = this.ctx!;

    // 1. Ganancia de entrada (Trim)
    const gainTrim = ctx.createGain();
    gainTrim.gain.setValueAtTime(1.0, ctx.currentTime);

    // 2. EQ 3 bandas
    // Low: Low-shelf a 250 Hz
    const eqLow = ctx.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.setValueAtTime(250, ctx.currentTime);
    eqLow.gain.setValueAtTime(0, ctx.currentTime);

    // Mid: Peaking a 1500 Hz
    const eqMid = ctx.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.setValueAtTime(1500, ctx.currentTime);
    eqMid.Q.setValueAtTime(1.0, ctx.currentTime);
    eqMid.gain.setValueAtTime(0, ctx.currentTime);

    // High: High-shelf a 4000 Hz
    const eqHigh = ctx.createBiquadFilter();
    eqHigh.type = 'highshelf';
    eqHigh.frequency.setValueAtTime(4000, ctx.currentTime);
    eqHigh.gain.setValueAtTime(0, ctx.currentTime);

    // 3. Filter Sweep (LPF / HPF)
    const filterSweep = ctx.createBiquadFilter();
    filterSweep.type = 'lowpass';
    filterSweep.frequency.setValueAtTime(20000, ctx.currentTime);

    // 4. Efecto Delay / Echo
    const delayNode = ctx.createDelay(2.0);
    delayNode.delayTime.setValueAtTime(0.35, ctx.currentTime);
    const delayFeedback = ctx.createGain();
    delayFeedback.gain.setValueAtTime(0.4, ctx.currentTime);
    const delayWet = ctx.createGain();
    delayWet.gain.setValueAtTime(0.0, ctx.currentTime);

    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode);
    delayNode.connect(delayWet);

    // 5. Flanger
    const flangerDelay = ctx.createDelay(0.05);
    flangerDelay.delayTime.setValueAtTime(0.003, ctx.currentTime);
    const flangerWet = ctx.createGain();
    flangerWet.gain.setValueAtTime(0.0, ctx.currentTime);
    flangerDelay.connect(flangerWet);

    // 6. Reverb
    const reverbConvolver = ctx.createConvolver();
    const reverbWet = ctx.createGain();
    reverbWet.gain.setValueAtTime(0.0, ctx.currentTime);
    reverbConvolver.connect(reverbWet);

    // 7. Fader de canal
    const channelFader = ctx.createGain();
    channelFader.gain.setValueAtTime(0.85, ctx.currentTime);

    // 8. Crossfader ganancia por canal
    const xfaderGain = ctx.createGain();
    xfaderGain.gain.setValueAtTime(deckId === 'deckA' ? 1.0 : 0.0, ctx.currentTime);

    // 9. Pre-escucha / CUE gain
    const cueGain = ctx.createGain();
    cueGain.gain.setValueAtTime(0.0, ctx.currentTime);

    // 10. Analizador de canal
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    // Encadenado de audio:
    // gainTrim -> eqLow -> eqMid -> eqHigh -> filterSweep -> channelFader -> [Master Path & Cue Path]
    gainTrim.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(filterSweep);

    // Enrutamiento de efectos en paralelo
    filterSweep.connect(delayNode);
    filterSweep.connect(flangerDelay);
    filterSweep.connect(reverbConvolver);

    // Mezcla directa + efectos hacia fader de canal
    filterSweep.connect(channelFader);
    delayWet.connect(channelFader);
    flangerWet.connect(channelFader);
    reverbWet.connect(channelFader);

    // Del fader a crossfader -> master
    channelFader.connect(xfaderGain);
    xfaderGain.connect(this.masterGain);

    // Del fader al analizador de VU meter
    channelFader.connect(analyser);

    // Del fader a pre-escucha CUE de auriculares
    channelFader.connect(cueGain);
    cueGain.connect(this.headphoneBusGain);

    return {
      source: null,
      gainTrim,
      eqLow,
      eqMid,
      eqHigh,
      filterSweep,
      delayNode,
      delayFeedback,
      delayWet,
      flangerDelay,
      flangerLfo: null,
      flangerLfoGain: null,
      flangerWet,
      reverbConvolver,
      reverbWet,
      channelFader,
      xfaderGain,
      cueGain,
      analyser,
    };
  }

  // Genera respuesta de impulso sintética de sala/reverb
  private initReverbImpulse(convolver: ConvolverNode) {
    if (!this.ctx) return;
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * 1.5);
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const decay = Math.exp(-i / (rate * 0.4));
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }
    convolver.buffer = impulse;
  }

  // Cargar buffer en deck
  public loadTrackBuffer(deckId: DeckId, buffer: AudioBuffer) {
    this.stopDeck(deckId);
    this.loadedBuffers[deckId] = buffer;
    this.playStartOffset[deckId] = 0;
  }

  // Descargar pista
  public unloadTrack(deckId: DeckId) {
    this.stopDeck(deckId);
    this.loadedBuffers[deckId] = null;
    this.playStartOffset[deckId] = 0;
  }

  // Reproducir Deck
  public playDeck(deckId: DeckId, offsetSeconds = 0, playbackRate = 1.0) {
    if (!this.ctx) this.init();
    if (this.ctx!.state === 'suspended') {
      this.ctx!.resume();
    }

    const buffer = this.loadedBuffers[deckId];
    if (!buffer) return;

    const channel = deckId === 'deckA' ? this.deckA : this.deckB;

    // Detener fuente previa si existía
    if (channel.source) {
      try {
        channel.source.stop();
        channel.source.disconnect();
      } catch {
        // Ignorar si ya estaba detenida
      }
      channel.source = null;
    }

    const source = this.ctx!.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.setValueAtTime(playbackRate, this.ctx!.currentTime);

    // Conectar a ganancia de entrada
    source.connect(channel.gainTrim);

    const safeOffset = Math.max(0, Math.min(offsetSeconds, buffer.duration - 0.05));
    source.start(0, safeOffset);

    channel.source = source;
    this.playStartTime[deckId] = this.ctx!.currentTime;
    this.playStartOffset[deckId] = safeOffset;
  }

  // Pausar Deck
  public pauseDeck(deckId: DeckId): number {
    const currentPos = this.getCurrentTime(deckId);
    this.stopDeck(deckId);
    this.playStartOffset[deckId] = currentPos;
    return currentPos;
  }

  // Detener Deck
  public stopDeck(deckId: DeckId) {
    const channel = deckId === 'deckA' ? this.deckA : this.deckB;
    if (channel.source) {
      try {
        channel.source.stop();
        channel.source.disconnect();
      } catch {
        // Nada
      }
      channel.source = null;
    }
  }

  // Obtener tiempo actual con precisión
  public getCurrentTime(deckId: DeckId, playbackRate = 1.0): number {
    const channel = deckId === 'deckA' ? this.deckA : this.deckB;
    const buffer = this.loadedBuffers[deckId];
    if (!buffer) return 0;

    if (!channel.source) {
      return this.playStartOffset[deckId];
    }

    const elapsedWallTime = this.ctx!.currentTime - this.playStartTime[deckId];
    const adjustedElapsed = elapsedWallTime * playbackRate;
    const pos = this.playStartOffset[deckId] + adjustedElapsed;

    // Si terminó la pista
    if (pos >= buffer.duration) {
      return buffer.duration;
    }

    return pos;
  }

  // Saltar a una posición específica (CUE o scrub)
  public seekTo(deckId: DeckId, seconds: number, isPlaying: boolean, playbackRate = 1.0) {
    const buffer = this.loadedBuffers[deckId];
    if (!buffer) return;

    const clamped = Math.max(0, Math.min(seconds, buffer.duration));
    this.playStartOffset[deckId] = clamped;

    if (isPlaying) {
      this.playDeck(deckId, clamped, playbackRate);
    }
  }

  // Efecto Vinyl Brake (freno de motor de tocadiscos)
  public applyVinylBrake(deckId: DeckId, onFinish: () => void) {
    const channel = deckId === 'deckA' ? this.deckA : this.deckB;
    if (!channel.source || !this.ctx) return;

    const now = this.ctx.currentTime;
    const currentRate = channel.source.playbackRate.value;
    channel.source.playbackRate.setValueAtTime(currentRate, now);
    channel.source.playbackRate.exponentialRampToValueAtTime(0.01, now + 1.2);

    setTimeout(() => {
      this.stopDeck(deckId);
      onFinish();
    }, 1250);
  }

  // Scratch / Jog wheel scrub
  public scratchScrub(deckId: DeckId, targetPosition: number, speedMultiplier: number) {
    if (!this.ctx) return;
    const buffer = this.loadedBuffers[deckId];
    if (!buffer) return;

    const channel = deckId === 'deckA' ? this.deckA : this.deckB;
    const clampedPos = Math.max(0, Math.min(targetPosition, buffer.duration - 0.1));
    this.playStartOffset[deckId] = clampedPos;

    // Modificar playbackRate y reiniciar source si es necesario
    if (channel.source) {
      try {
        const rate = Math.max(0.1, Math.min(3.0, Math.abs(speedMultiplier)));
        channel.source.playbackRate.setTargetAtTime(rate, this.ctx.currentTime, 0.03);
      } catch {
        // Ignorar
      }
    }
  }

  // Ajustar playbackRate / Pitch fader
  public setPlaybackRate(deckId: DeckId, rate: number) {
    const channel = deckId === 'deckA' ? this.deckA : this.deckB;
    if (channel.source && this.ctx) {
      channel.source.playbackRate.setTargetAtTime(rate, this.ctx.currentTime, 0.02);
    }
  }

  // Volúmenes y EQ
  public setChannelVolume(deckId: DeckId, vol: number) {
    const channel = deckId === 'deckA' ? this.deckA : this.deckB;
    channel.channelFader.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx!.currentTime, 0.02);
  }

  public setChannelGain(deckId: DeckId, gain: number) {
    const channel = deckId === 'deckA' ? this.deckA : this.deckB;
    channel.gainTrim.gain.setTargetAtTime(Math.max(0, Math.min(2.5, gain)), this.ctx!.currentTime, 0.02);
  }

  public setEq(deckId: DeckId, band: 'low' | 'mid' | 'high', dB: number, isKill = false) {
    const channel = deckId === 'deckA' ? this.deckA : this.deckB;
    const targetDb = isKill ? -60 : Math.max(-40, Math.min(6, dB));
    const now = this.ctx!.currentTime;

    if (band === 'low') channel.eqLow.gain.setTargetAtTime(targetDb, now, 0.02);
    else if (band === 'mid') channel.eqMid.gain.setTargetAtTime(targetDb, now, 0.02);
    else if (band === 'high') channel.eqHigh.gain.setTargetAtTime(targetDb, now, 0.02);
  }

  // Filtro Sweep combinado (centro 0 = neutral, < 0 LPF, > 0 HPF)
  public setFilterSweep(deckId: DeckId, value: number) {
    const channel = deckId === 'deckA' ? this.deckA : this.deckB;
    const now = this.ctx!.currentTime;

    if (Math.abs(value) < 3) {
      channel.filterSweep.type = 'lowpass';
      channel.filterSweep.frequency.setTargetAtTime(20000, now, 0.02);
      channel.filterSweep.Q.setTargetAtTime(0.7, now, 0.02);
      return;
    }

    if (value < 0) {
      // Low-pass Filter (20000 Hz hacia 100 Hz)
      channel.filterSweep.type = 'lowpass';
      const norm = (value + 100) / 100; // 0 a 1
      const freq = 100 + Math.pow(norm, 2.5) * 19900;
      channel.filterSweep.frequency.setTargetAtTime(Math.max(80, freq), now, 0.02);
      channel.filterSweep.Q.setTargetAtTime(1.5, now, 0.02);
    } else {
      // High-pass Filter (20 Hz hacia 7000 Hz)
      channel.filterSweep.type = 'highpass';
      const norm = value / 100; // 0 a 1
      const freq = 20 + Math.pow(norm, 2.2) * 7000;
      channel.filterSweep.frequency.setTargetAtTime(Math.min(10000, freq), now, 0.02);
      channel.filterSweep.Q.setTargetAtTime(1.5, now, 0.02);
    }
  }

  // Efectos individuales
  public setEcho(deckId: DeckId, active: boolean, time = 0.35, feedback = 0.4) {
    const channel = deckId === 'deckA' ? this.deckA : this.deckB;
    const now = this.ctx!.currentTime;
    channel.delayNode.delayTime.setValueAtTime(time, now);
    channel.delayFeedback.gain.setValueAtTime(active ? feedback : 0, now);
    channel.delayWet.gain.setTargetAtTime(active ? 0.6 : 0.0, now, 0.03);
  }

  public setFlanger(deckId: DeckId, active: boolean) {
    const channel = deckId === 'deckA' ? this.deckA : this.deckB;
    const now = this.ctx!.currentTime;

    if (active && !channel.flangerLfo) {
      channel.flangerLfo = this.ctx!.createOscillator();
      channel.flangerLfoGain = this.ctx!.createGain();
      channel.flangerLfo.frequency.setValueAtTime(0.3, now); // LFO lento de barrido
      channel.flangerLfoGain.gain.setValueAtTime(0.002, now);
      channel.flangerLfo.connect(channel.flangerLfoGain);
      channel.flangerLfoGain.connect(channel.flangerDelay.delayTime);
      channel.flangerLfo.start(now);
    } else if (!active && channel.flangerLfo) {
      try {
        channel.flangerLfo.stop();
        channel.flangerLfo.disconnect();
      } catch {
        // Nada
      }
      channel.flangerLfo = null;
      channel.flangerLfoGain = null;
    }

    channel.flangerWet.gain.setTargetAtTime(active ? 0.7 : 0.0, now, 0.03);
  }

  public setReverb(deckId: DeckId, active: boolean) {
    const channel = deckId === 'deckA' ? this.deckA : this.deckB;
    channel.reverbWet.gain.setTargetAtTime(active ? 0.5 : 0.0, this.ctx!.currentTime, 0.03);
  }

  public resetAllFx(deckId: DeckId) {
    this.setFilterSweep(deckId, 0);
    this.setEcho(deckId, false);
    this.setFlanger(deckId, false);
    this.setReverb(deckId, false);
  }

  // Crossfader con curvas matemáticas profesionales
  public setCrossfader(value: number, curve: CrossfaderCurve = 'smooth') {
    if (!this.ctx) return;
    const clamped = Math.max(-1.0, Math.min(1.0, value));
    const now = this.ctx.currentTime;
    let gainA = 0;
    let gainB = 0;

    // t de 0 (todo A) a 1 (todo B)
    const t = (clamped + 1.0) / 2.0;

    if (curve === 'smooth') {
      // Equal power curve (preserva el volumen RMS en el centro exacto)
      gainA = Math.cos(t * 0.5 * Math.PI);
      gainB = Math.sin(t * 0.5 * Math.PI);
    } else if (curve === 'cut') {
      // Curva Scratch / Cut: volumen completo en ambos decks salvo en los extremos
      gainA = t < 0.9 ? 1.0 : (1.0 - t) * 10.0;
      gainB = t > 0.1 ? 1.0 : t * 10.0;
    } else {
      // Linear
      gainA = 1.0 - t;
      gainB = t;
    }

    this.deckA.xfaderGain.gain.setTargetAtTime(Math.max(0, gainA), now, 0.015);
    this.deckB.xfaderGain.gain.setTargetAtTime(Math.max(0, gainB), now, 0.015);
  }

  // Control de Master y Preescucha
  public setMasterVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1.2, vol)), this.ctx.currentTime, 0.02);
    }
  }

  public setHeadphoneVolume(vol: number) {
    if (this.headphoneBusGain && this.ctx) {
      this.headphoneBusGain.gain.setTargetAtTime(Math.max(0, Math.min(1.0, vol)), this.ctx.currentTime, 0.02);
    }
  }

  public setHeadphoneCueMix(mixVal: number) {
    // 0 = solo canales con CUE activo, 1 = solo Master en auriculares
    if (this.cueMasterGain && this.ctx) {
      this.cueMasterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, mixVal)), this.ctx.currentTime, 0.02);
    }
  }

  public setCueDeck(deckId: DeckId, active: boolean) {
    const channel = deckId === 'deckA' ? this.deckA : this.deckB;
    if (this.ctx) {
      channel.cueGain.gain.setTargetAtTime(active ? 1.0 : 0.0, this.ctx.currentTime, 0.02);
    }
  }

  // Configuración de Split-Stereo Mode (Left = Master, Right = Cue)
  public setSplitStereoMode(enabled: boolean) {
    this.splitStereoMode = enabled;
    if (!this.ctx) return;

    if (enabled) {
      // Desconectar salidas directas
      try {
        this.masterLimiter.disconnect(this.ctx.destination);
        this.headphoneBusGain.disconnect();
      } catch {
        // Nada
      }

      // Canal Izquierdo = Master Mono, Canal Derecho = Cue Mono
      const splitterM = this.ctx.createChannelSplitter(2);
      const splitterC = this.ctx.createChannelSplitter(2);
      const merger = this.ctx.createChannelMerger(2);

      this.masterLimiter.connect(splitterM);
      splitterM.connect(merger, 0, 0); // Master L -> Salida L (Altavoces)

      this.headphoneBusGain.connect(splitterC);
      splitterC.connect(merger, 0, 1); // Cue -> Salida R (Auriculares)

      merger.connect(this.ctx.destination);
    } else {
      // Volver a estéreo estándar
      try {
        this.masterLimiter.disconnect();
        this.headphoneBusGain.disconnect();
      } catch {
        // Nada
      }
      this.masterLimiter.connect(this.ctx.destination);
    }
  }

  // Transición automática MIX NOW
  public startTransition(
    config: TransitionConfig,
    currentXfader: number,
    onProgress: (val: number) => void,
    onComplete: () => void
  ) {
    if (this.activeTransitionAnimation) {
      cancelAnimationFrame(this.activeTransitionAnimation);
    }

    const startX = currentXfader;
    // Si estamos en Deck A (negativo), vamos a Deck B (+1.0) y viceversa
    const targetX = startX <= 0 ? 1.0 : -1.0;
    const durationMs = config.durationSeconds * 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1.0, elapsed / durationMs);

      // Curva suave de animación
      const easeProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI);
      const newX = startX + (targetX - startX) * easeProgress;

      this.setCrossfader(newX, config.mode === 'quick_cut' ? 'cut' : 'smooth');
      onProgress(newX);

      // Si es BASS SWAP, recortar graves del deck saliente y subir del entrante
      if (config.mode === 'bass_swap') {
        const outgoingDeck: DeckId = startX <= 0 ? 'deckA' : 'deckB';
        const incomingDeck: DeckId = startX <= 0 ? 'deckB' : 'deckA';
        const outBassDb = -30 * progress;
        const inBassDb = -30 * (1 - progress);
        this.setEq(outgoingDeck, 'low', outBassDb);
        this.setEq(incomingDeck, 'low', inBassDb);
      }

      if (progress < 1.0) {
        this.activeTransitionAnimation = requestAnimationFrame(animate);
      } else {
        this.activeTransitionAnimation = null;
        // Restaurar ecualizadores si fue bass swap
        if (config.mode === 'bass_swap') {
          this.setEq('deckA', 'low', 0);
          this.setEq('deckB', 'low', 0);
        }
        onComplete();
      }
    };

    this.activeTransitionAnimation = requestAnimationFrame(animate);
  }

  // FIN SUAVE (Fade out progresivo sin corte brusco)
  public startSmoothFadeOut(
    deckId: DeckId,
    durationSeconds: number,
    onProgress: (vol: number) => void,
    onComplete: () => void
  ) {
    if (this.activeSmoothFadeAnimation) {
      cancelAnimationFrame(this.activeSmoothFadeAnimation);
    }

    const channel = deckId === 'deckA' ? this.deckA : this.deckB;
    const startVol = channel.channelFader.gain.value;
    const durationMs = durationSeconds * 1000;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1.0, elapsed / durationMs);
      // Rampa suave exponencial
      const newVol = startVol * Math.pow(1 - progress, 2);

      channel.channelFader.gain.setValueAtTime(newVol, this.ctx!.currentTime);
      onProgress(newVol);

      if (progress < 1.0) {
        this.activeSmoothFadeAnimation = requestAnimationFrame(animate);
      } else {
        this.activeSmoothFadeAnimation = null;
        this.stopDeck(deckId);
        onComplete();
      }
    };

    this.activeSmoothFadeAnimation = requestAnimationFrame(animate);
  }

  // Silencio de emergencia
  public emergencySilence(onComplete: () => void) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    setTimeout(() => {
      this.stopDeck('deckA');
      this.stopDeck('deckB');
      this.masterGain.gain.setValueAtTime(0.85, this.ctx!.currentTime);
      onComplete();
    }, 850);
  }

  // Lectura de niveles VU para animación de la consola
  public getVuLevels(): {
    deckA: { level: number; clip: boolean };
    deckB: { level: number; clip: boolean };
    masterL: { level: number; clip: boolean };
    masterR: { level: number; clip: boolean };
  } {
    if (!this.ctx) {
      return {
        deckA: { level: 0, clip: false },
        deckB: { level: 0, clip: false },
        masterL: { level: 0, clip: false },
        masterR: { level: 0, clip: false },
      };
    }

    const readAnalyser = (analyser: AnalyserNode) => {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      let peak = 0;
      for (let i = 0; i < data.length; i++) {
        const val = Math.abs((data[i] - 128) / 128);
        sum += val * val;
        if (val > peak) peak = val;
      }
      const rms = Math.sqrt(sum / data.length);
      return {
        level: Math.min(1.0, rms * 2.8),
        clip: peak > 0.98,
      };
    };

    return {
      deckA: readAnalyser(this.deckA.analyser),
      deckB: readAnalyser(this.deckB.analyser),
      masterL: readAnalyser(this.masterAnalyserL),
      masterR: readAnalyser(this.masterAnalyserR),
    };
  }
}

// Singleton accesible en toda la app
export const globalAudio = new AudioEngine();
