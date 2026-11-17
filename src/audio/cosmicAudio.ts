// Zero-dependency Web Audio API synthesizer for cosmic ambience and UI sound effects

class CosmicAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientNodes: AudioNode[] = [];
  private ambientEnabled = false;
  private sfxEnabled = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  setAmbient(enabled: boolean) {
    this.ambientEnabled = enabled;
    if (enabled) {
      this.startAmbient();
    } else {
      this.stopAmbient();
    }
  }

  setSfx(enabled: boolean) {
    this.sfxEnabled = enabled;
    if (enabled) {
      this.ensureContext();
      this.playStarTap(523.25);
    }
  }

  private startAmbient() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    if (this.ambientNodes.length > 0) return;

    const ambGain = ctx.createGain();
    ambGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    ambGain.gain.exponentialRampToValueAtTime(0.11, ctx.currentTime + 1.8);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 1.2;

    // Gentle LFO breathing on the pad filter
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    // Warm cosmic drone chord (D2, A2, E3, F#3)
    const freqs = [73.42, 110.0, 164.81, 185.0];
    const oscs: OscillatorNode[] = [];

    for (let i = 0; i < freqs.length; i++) {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freqs[i];
      osc.detune.value = (i - 1.5) * 4;

      const oscGain = ctx.createGain();
      oscGain.gain.value = i === 0 ? 0.42 : 0.2;
      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start();
      oscs.push(osc);
    }

    filter.connect(ambGain);
    ambGain.connect(this.masterGain);

    this.ambientGain = ambGain;
    this.ambientNodes = [...oscs, lfo, filter, ambGain];
  }

  private stopAmbient() {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    const nodes = this.ambientNodes;
    const gainNode = this.ambientGain;

    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(Math.max(0.0001, gainNode.gain.value), now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    this.ambientNodes = [];
    this.ambientGain = null;

    window.setTimeout(() => {
      for (const node of nodes) {
        try {
          if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
            (node as OscillatorNode).stop();
          }
          node.disconnect();
        } catch {
          // ignore already stopped
        }
      }
    }, 680);
  }

  playStarTap(baseFreq = 587.33) {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, now + 0.14);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  playDiscovery() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const start = ctx.currentTime + i * 0.085;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.11, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(start);
      osc.stop(start + 0.6);
    });
  }
}

export const cosmicAudio = new CosmicAudioEngine();
