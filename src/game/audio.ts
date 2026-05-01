const bgmUrl = new URL('../assets/car-selection-be-like-insta.wav', import.meta.url).href;

export class AudioSystem {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  rainNoise: AudioBufferSourceNode | null = null;
  rainGain: GainNode | null = null;
  bgmElement: HTMLAudioElement | null = null;
  bgmSource: MediaElementAudioSourceNode | null = null;
  musicGain: GainNode | null = null;
  masterGainVolume: number = 0.3;
  isMuted: boolean = false;
  initialized: boolean = false;

  init() {
    if (this.initialized) {
      this.resumeAll();
      return;
    }
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3; // Master volume
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
      this.startMusic();
      this.setMuted(this.isMuted);
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  }

  resumeAll() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          if (this.bgmElement) {
            void this.bgmElement.play().catch(() => {
              // ignore autoplay failure on resume
            });
          }
        });
      }
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.masterGainVolume;
    }
    if (this.bgmElement) {
      this.bgmElement.muted = muted;
    }
  }

  setVolume(volume: number) {
    this.masterGainVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && !this.isMuted) {
      this.masterGain.gain.value = this.masterGainVolume;
    }
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
  }

  startRain() {
    if (!this.ctx || !this.masterGain) return;
    
    // Create white noise buffer
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.rainNoise = this.ctx.createBufferSource();
    this.rainNoise.buffer = buffer;
    this.rainNoise.loop = true;

    // Filter to make it sound like rain (lowpass)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0.15; // Rain volume

    this.rainNoise.connect(filter);
    filter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);

    this.rainNoise.start();
  }

  startMusic() {
    if (!this.ctx || !this.masterGain || this.bgmElement) return;

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.12; // Gentle background level
    this.musicGain.connect(this.masterGain);

    this.bgmElement = new Audio(bgmUrl);
    this.bgmElement.loop = true;
    this.bgmElement.volume = 0.6;
    this.bgmElement.crossOrigin = 'anonymous';

    this.bgmSource = this.ctx.createMediaElementSource(this.bgmElement);
    this.bgmSource.connect(this.musicGain);

    void this.bgmElement.play().catch((err) => {
      console.warn('BGM autoplay blocked, will resume after user interaction', err);
    });
  }

  stopAll() {
    if (this.bgmElement && !this.bgmElement.paused) {
      this.bgmElement.pause();
    }
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  lastExplosionTime: number = 0;
  lastShootTime: { [key: string]: number } = {};

  playShoot(type: string) {
    if (!this.ctx || !this.masterGain) return;
    
    const now = this.ctx.currentTime;
    if (this.lastShootTime[type] && now - this.lastShootTime[type] < 0.05) {
      return; // Throttle to max 20 per second per type
    }
    this.lastShootTime[type] = now;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    if (type === 'SHREDDER') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'PLASMA') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'FLAK') {
      this.playNoiseBurst(0.2, 0.1);
    } else if (type === 'EMP') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1000, now);
      osc.frequency.linearRampToValueAtTime(2000, now + 0.2);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }

  playNoiseBurst(duration: number, volume: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start();
  }

  playExplosion() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastExplosionTime < 0.05) return; // Throttle
    this.lastExplosionTime = now;
    
    this.playNoiseBurst(0.5, 0.3);
  }

  playHack(type: string) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    const now = this.ctx.currentTime;
    
    if (type === 'BLACKOUT') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1);
      osc.start(now);
      osc.stop(now + 1);
    } else if (type === 'LASER') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(2000, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 1.5);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc.start(now);
      osc.stop(now + 1.5);
    } else if (type === 'OVERRIDE') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.5);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  }

  playBuild() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    const now = this.ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.setValueAtTime(800, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  }
  
  playError() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    const now = this.ctx.currentTime;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.setValueAtTime(100, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  }
}

export const audio = new AudioSystem();
