export class AudioManager {
  private ctx: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;

  private isMuted: boolean = true; 
  private lastElementSoundTime = 0;

  public init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Prevent audio clipping (estouro) with a compressor
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -24;
      this.compressor.knee.value = 30;
      this.compressor.ratio.value = 12;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5; // Soft overall volume

      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute() {
    this.init();
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted() {
    return this.isMuted;
  }

  private playTone(freq: number, type: OscillatorType, vol: number, attack: number, release: number) {
    if (this.isMuted || !this.ctx || !this.compressor) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + attack);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + attack + release);
      
      osc.connect(gain);
      gain.connect(this.compressor);
      
      osc.start();
      osc.stop(this.ctx.currentTime + attack + release);
    } catch(e) {}
  }

  public playClick() {
    this.playTone(400, 'square', 0.05, 0.005, 0.02);
  }

  public playPop() {
    this.playTone(800, 'sine', 0.015, 0.01, 0.1);
  }

  public playSelect() {
    this.playTone(400, 'triangle', 0.015, 0.01, 0.1);
  }

  public playSuccess() {
    if (this.isMuted || !this.ctx) return;
    this.playTone(440, 'sine', 0.02, 0.05, 0.1);
    setTimeout(() => this.playTone(554, 'sine', 0.02, 0.05, 0.1), 100); 
    setTimeout(() => this.playTone(659, 'sine', 0.02, 0.05, 0.2), 200); 
  }

  public playHit() {
    this.playNoise(0.01, 0.1, 0.1, 'lowpass', 800);
  }

  public playError() {
    if (this.isMuted || !this.ctx) return;
    this.playTone(300, 'triangle', 0.03, 0.05, 0.1);
    setTimeout(() => this.playTone(250, 'triangle', 0.03, 0.05, 0.2), 150);
  }
  
  public playNote(noteIndex: number) {
    if (this.isMuted || !this.ctx) return;
    const baseFreq = 261.63; // C4
    const scale = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16]; 
    const freq = baseFreq * Math.pow(2, scale[noteIndex % scale.length] / 12);
    this.playTone(freq, 'sine', 0.03, 0.05, 0.3);
  }

  public playWin() {
    if (this.isMuted || !this.ctx) return;
    this.playTone(523.25, 'sine', 0.02, 0.05, 0.1); 
    setTimeout(() => this.playTone(659.25, 'sine', 0.02, 0.05, 0.1), 150); 
    setTimeout(() => this.playTone(783.99, 'sine', 0.02, 0.05, 0.1), 300); 
    setTimeout(() => this.playTone(1046.50, 'sine', 0.04, 0.05, 0.4), 450); 
  }
  
  public playHighTech() {
    if (this.isMuted || !this.ctx || !this.compressor) return;
    try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.2); 
        gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.compressor);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    } catch(e) {}
  }

  public playElementDrop(elementType: string) {
    if (this.isMuted || !this.ctx || !this.compressor) return;
    const now = this.ctx.currentTime;
    // Throttle sound to avoid noise explosion when dragging the mouse
    if (now - this.lastElementSoundTime < 0.05) return; 
    this.lastElementSoundTime = now;

    const isLiquid = ['water', 'acid', 'oil', 'blood'].includes(elementType);
    const isFire = ['fire', 'spark', 'thermite', 'lava'].includes(elementType);
    
    if (elementType === 'empty') {
      this.playNoise(0.01, 0.05, 0.01, 'highpass', 2000);
    } else if (isLiquid) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const startFreq = 200 + Math.random() * 150;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 1.5, now + 0.05);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (isFire) {
      if (Math.random() > 0.4) {
        this.playNoise(0.01, 0.1, 0.008, 'highpass', 1000);
      }
    } else {
      this.playNoise(0.01, 0.03, 0.01, 'lowpass', 400 + Math.random()*200);
    }
  }

  public playDrum(type: 'kick' | 'snare' | 'hihat' | 'clap') {
    if (this.isMuted || !this.ctx || !this.compressor) return;
    const time = this.ctx.currentTime;
    if (type === 'kick') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
      gain.gain.setValueAtTime(0.5, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(time);
      osc.stop(time + 0.5);
    } else if (type === 'snare') {
      this.playNoise(0.01, 0.2, 0.2, 'highpass', 1000);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, time);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(time);
      osc.stop(time + 0.1);
    } else if (type === 'hihat') {
      this.playNoise(0.005, 0.05, 0.1, 'highpass', 7000);
    } else if (type === 'clap') {
      this.playNoise(0.01, 0.15, 0.2, 'bandpass', 1500);
    }
  }

  public playSynthNote(freq: number, type: OscillatorType, attack: number, release: number, vol: number = 0.05, detune: number = 0) {
    if (this.isMuted || !this.ctx || !this.compressor) return;
    try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.detune.setValueAtTime(detune, this.ctx.currentTime);
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + attack);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + attack + release);
        
        osc.connect(gain);
        gain.connect(this.compressor);
        osc.start();
        osc.stop(this.ctx.currentTime + attack + release);
    } catch(e) {}
  }

  private playNoise(attack: number, release: number, vol: number, filterType?: BiquadFilterType, freq?: number) {
      if (!this.ctx || !this.compressor) return;
      try {
          const bufferSize = Math.floor(this.ctx.sampleRate * (attack + release));
          if (bufferSize <= 0) return;
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
              data[i] = Math.random() * 2 - 1;
          }
          
          const noise = this.ctx.createBufferSource();
          noise.buffer = buffer;
          const gain = this.ctx.createGain();
          
          const now = this.ctx.currentTime;
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(vol, now + attack);
          gain.gain.linearRampToValueAtTime(0.001, now + attack + release);
          
          if (filterType && freq) {
             const filter = this.ctx.createBiquadFilter();
             filter.type = filterType;
             filter.frequency.value = freq;
             noise.connect(filter);
             filter.connect(gain);
          } else {
             noise.connect(gain);
          }
          
          gain.connect(this.compressor);
          noise.start(now);
      } catch (e) {}
  }
}

export const audioSystem = new AudioManager();
