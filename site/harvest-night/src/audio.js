// audio.js — all procedural sound (Web Audio API only, nothing loaded from disk).
// Phase 1: footsteps. Later phases add ambience, heartbeat, and the jump-scare sting here.

export class AudioManager {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.6;
    this.master.connect(this.ctx.destination);
    const resume = () => { this.resume(); document.removeEventListener('click', resume); };
    document.addEventListener('click', resume);
  }

  resume() {
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  _noiseBuffer(duration) {
    const rate = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, Math.max(1, Math.floor(rate * duration)), rate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  playFootstep(surface = 'grass', quiet = false) {
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(0.12);

    const filter = this.ctx.createBiquadFilter();
    filter.type = surface === 'dirt' ? 'bandpass' : 'lowpass';
    filter.frequency.value = surface === 'dirt' ? 1400 : 500;
    filter.Q.value = surface === 'dirt' ? 0.8 : 0.5;

    const gain = this.ctx.createGain();
    const peak = (quiet ? 0.12 : 0.28) * (0.85 + Math.random() * 0.3);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    src.connect(filter).connect(gain).connect(this.master);
    src.start(now);
    src.stop(now + 0.13);
  }

  // A small rising three-note chime for picking up a key.
  playChime() {
    const now = this.ctx.currentTime;
    const notes = [660, 880, 1320];
    notes.forEach((freq, i) => {
      const t = now + i * 0.09;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(gain).connect(this.master);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  // A low wooden creak + rattle for the gate unlocking.
  playGateUnlock() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 1.2);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    osc.connect(filter).connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 1.35);
  }
}
