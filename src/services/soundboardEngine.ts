/**
 * Motor de efectos de sonido para animación de fiestas (Soundboard).
 * Síntesis 100% nativa en Web Audio API: cero descargas, funciona totalmente offline.
 */

export class SoundboardEngine {
  private ctx: AudioContext;
  private sfxGain: GainNode;
  private customBuffers: Map<string, AudioBuffer> = new Map();

  constructor(audioCtx: AudioContext, masterOutputNode: AudioNode) {
    this.ctx = audioCtx;
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
    this.sfxGain.connect(masterOutputNode);
  }

  setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.sfxGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.02);
  }

  async loadCustomSound(id: string, file: File): Promise<AudioBuffer> {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    this.customBuffers.set(id, audioBuffer);
    return audioBuffer;
  }

  play(soundType: string, volume = 0.9, customId?: string) {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (customId && this.customBuffers.has(customId)) {
      this.playCustomBuffer(this.customBuffers.get(customId)!, volume);
      return;
    }

    switch (soundType) {
      case 'airhorn':
        this.playAirhorn(volume);
        break;
      case 'applause':
        this.playApplause(volume);
        break;
      case 'drumroll':
        this.playDrumroll(volume);
        break;
      case 'crash':
        this.playCrash(volume);
        break;
      case 'whistle':
        this.playWhistle(volume);
        break;
      case 'countdown':
        this.playCountdown(volume);
        break;
      case 'siren':
        this.playSiren(volume);
        break;
      case 'scratch':
        this.playScratchBurst(volume);
        break;
      case 'boing':
        this.playBoing(volume);
        break;
      case 'subdrop':
        this.playSubdrop(volume);
        break;
      default:
        this.playAirhorn(volume);
    }
  }

  // 1. BOCINA REGGAE / AIR HORN
  private playAirhorn(vol: number) {
    const now = this.ctx.currentTime;
    const notes = [
      { start: 0, dur: 0.15 },
      { start: 0.18, dur: 0.15 },
      { start: 0.36, dur: 0.45 },
    ];

    notes.forEach(({ start, dur }) => {
      const t = now + start;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      // Frecuencias clásicas de bocina: ~466Hz (Bb4) y ~587Hz (D5)
      osc1.frequency.setValueAtTime(466, t);
      osc1.frequency.exponentialRampToValueAtTime(480, t + dur);

      osc2.frequency.setValueAtTime(466 * 1.5, t);
      osc2.frequency.exponentialRampToValueAtTime(480 * 1.5, t + dur);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol * 0.4, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + dur);
      osc2.stop(t + dur);
    });
  }

  // 2. APLAUSOS & OVACIÓN
  private playApplause(vol: number) {
    const now = this.ctx.currentTime;
    const dur = 2.8;
    const bufferSize = this.ctx.sampleRate * dur;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Impulsos aleatorios de palmas
      const isClap = Math.random() < 0.08;
      data[i] = isClap ? (Math.random() * 2 - 1) * 0.9 : (Math.random() * 2 - 1) * 0.15;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(1.2, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol * 0.6, now + 0.3);
    gain.gain.setValueAtTime(vol * 0.6, now + 1.8);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + dur);
  }

  // 3. REDOBLE DE TAMBORES
  private playDrumroll(vol: number) {
    const now = this.ctx.currentTime;
    const totalHits = 28;
    let t = now;

    for (let i = 0; i < totalHits; i++) {
      const interval = 0.08 * (1 - (i / totalHits) * 0.45); // acelera
      const hitVol = (0.2 + (i / totalHits) * 0.8) * vol;
      this.playSnareHit(t, hitVol);
      t += interval;
    }

    // Golpe final de remate
    this.playCrash(vol, t + 0.05);
  }

  private playSnareHit(time: number, hitVol: number) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.05);

    gain.gain.setValueAtTime(hitVol * 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.06);
  }

  // 4. PLATO / REMATE CRASH
  private playCrash(vol: number, startTime?: number) {
    const now = startTime || this.ctx.currentTime;
    const dur = 1.4;
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3500, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    source.start(now);
    source.stop(now + dur);
  }

  // 5. SILBATO DE CARNAVAL
  private playWhistle(vol: number) {
    const now = this.ctx.currentTime;
    const dur = 0.5;

    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, now);

    // Trino de silbato
    lfo.frequency.setValueAtTime(25, now);
    lfoGain.gain.setValueAtTime(180, now);
    lfo.connect(osc.frequency);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol * 0.5, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + dur);
    osc.stop(now + dur);
  }

  // 6. CUENTA REGRESIVA (3-2-1-YA!)
  private playCountdown(vol: number) {
    const now = this.ctx.currentTime;
    const freqs = [523.25, 587.33, 659.25, 1046.5]; // C5, D5, E5, C6 (¡GO!)

    freqs.forEach((freq, idx) => {
      const t = now + idx * 0.45;
      const isGo = idx === 3;
      const dur = isGo ? 0.6 : 0.25;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isGo ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol * (isGo ? 0.6 : 0.45), t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + dur);
    });
  }

  // 7. SIRENA ELECTRONICA / RISER
  private playSiren(vol: number) {
    const now = this.ctx.currentTime;
    const dur = 1.8;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + dur * 0.7);
    osc.frequency.linearRampToValueAtTime(400, now + dur);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol * 0.4, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + dur);
  }

  // 8. VINYL SCRATCH BURST
  private playScratchBurst(vol: number) {
    const now = this.ctx.currentTime;
    const dur = 0.35;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(1400, now + 0.12);
    osc.frequency.linearRampToValueAtTime(180, now + 0.22);
    osc.frequency.linearRampToValueAtTime(800, now + dur);

    gain.gain.setValueAtTime(vol * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + dur);
  }

  // 9. BOING COMICO
  private playBoing(vol: number) {
    const now = this.ctx.currentTime;
    const dur = 0.8;

    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.5);

    lfo.frequency.setValueAtTime(18, now);
    lfoGain.gain.setValueAtTime(50, now);
    lfo.connect(osc.frequency);

    gain.gain.setValueAtTime(vol * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + dur);
    osc.stop(now + dur);
  }

  // 10. SUB BASS DROP 808
  private playSubdrop(vol: number) {
    const now = this.ctx.currentTime;
    const dur = 1.6;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.6);

    gain.gain.setValueAtTime(vol * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + dur);
  }

  private playCustomBuffer(buf: AudioBuffer, vol: number) {
    const source = this.ctx.createBufferSource();
    source.buffer = buf;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    source.connect(gain);
    gain.connect(this.sfxGain);
    source.start();
  }
}
