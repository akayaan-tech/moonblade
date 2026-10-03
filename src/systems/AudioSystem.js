import { Save } from './SaveSystem.js';

class AudioSystem {
  constructor() {
    this.context = null;
    this.master = null;
    this.musicGain = null;
    this.musicTimer = null;
    this.musicStep = 0;
    this.musicOscillators = [];
  }

  unlock() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume().catch(() => {});
      this.sync();
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = 0.42;
      this.master.connect(this.context.destination);
      this.musicGain = this.context.createGain();
      this.musicGain.gain.value = 0.035;
      this.musicGain.connect(this.master);
      this.startDrone();
      this.sync();
    } catch {
      this.context = null;
    }
  }

  startDrone() {
    if (!this.context || this.musicOscillators.length) return;
    [55, 82.41].forEach((frequency, index) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      osc.type = index ? 'sine' : 'triangle';
      osc.frequency.value = frequency;
      filter.type = 'lowpass';
      filter.frequency.value = 190;
      gain.gain.value = index ? 0.38 : 0.58;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start();
      this.musicOscillators.push(osc);
    });
    const notes = [220, 261.63, 329.63, 392, 329.63, 293.66, 261.63, 196];
    this.musicTimer = window.setInterval(() => {
      if (!this.context || this.context.state !== 'running' || !Save.data.settings.music) return;
      const now = this.context.currentTime;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(notes[this.musicStep++ % notes.length], now);
      filter.type = 'lowpass';
      filter.frequency.value = 820;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.13, now + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.39);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.42);
    }, 440);
  }

  sync() {
    if (!this.context || !this.master || !this.musicGain) return;
    const enabled = Save.data.settings.sound;
    const music = Save.data.settings.music;
    const now = this.context.currentTime;
    this.master.gain.setTargetAtTime(enabled ? 0.42 : 0, now, 0.04);
    this.musicGain.gain.setTargetAtTime(music ? 0.11 : 0.001, now, 0.08);
    if (this.context.state === 'suspended') this.context.resume().catch(() => {});
  }

  setSetting(key, enabled) {
    Save.setSetting(key, enabled);
    this.unlock();
    this.sync();
  }

  tone({ start = 440, end = start, duration = 0.12, type = 'sine', volume = 0.16, slide = true } = {}) {
    if (!Save.data.settings.sound || !this.context || this.context.state !== 'running') return;
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(30, start), now);
    if (slide && end !== start) osc.frequency.exponentialRampToValueAtTime(Math.max(30, end), now + duration * 0.85);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  play(name) {
    const sounds = {
      pickup: { start: 560, end: 1050, duration: 0.13, volume: 0.11 },
      coin: { start: 760, end: 1480, duration: 0.2, type: 'triangle', volume: 0.14 },
      hit: { start: 190, end: 85, duration: 0.08, type: 'square', volume: 0.055 },
      defeat: { start: 280, end: 90, duration: 0.16, type: 'triangle', volume: 0.09 },
      damage: { start: 135, end: 65, duration: 0.25, type: 'sawtooth', volume: 0.12 },
      vortex: { start: 95, end: 570, duration: 0.55, type: 'sawtooth', volume: 0.18 },
      burst: { start: 350, end: 1050, duration: 0.32, type: 'triangle', volume: 0.16 },
      level: { start: 470, end: 1120, duration: 0.42, type: 'sine', volume: 0.16 },
      boss: { start: 105, end: 42, duration: 0.7, type: 'sawtooth', volume: 0.14 },
      click: { start: 460, end: 370, duration: 0.07, volume: 0.07 },
    };
    const sound = sounds[name];
    if (sound) this.tone(sound);
  }
}

export const Audio = new AudioSystem();
