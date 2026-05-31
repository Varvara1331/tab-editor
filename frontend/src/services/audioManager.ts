// src/services/AudioManager.ts
import Soundfont, { InstrumentName } from 'soundfont-player';

class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private instruments: Map<string, any> = new Map();
  private activeTimeouts: Set<NodeJS.Timeout> = new Set();
  private activeSources: Set<any> = new Set();

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async getAudioContext(): Promise<AudioContext> {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    return this.audioContext;
  }

  async getInstrument(instrumentName: InstrumentName = 'acoustic_guitar_steel'): Promise<any> {
    if (this.instruments.has(instrumentName)) {
      return this.instruments.get(instrumentName);
    }

    const ctx = await this.getAudioContext();
    const instrument = await Soundfont.instrument(ctx, instrumentName, {
      gain: 0.4,
      destination: ctx.destination
    });
    
    this.instruments.set(instrumentName, instrument);
    return instrument;
  }

  async stopAllPlayback(): Promise<void> {
    this.activeTimeouts.forEach(timeout => clearTimeout(timeout));
    this.activeTimeouts.clear();
    
    this.activeSources.forEach(source => {
      try {
        if (typeof source.stop === 'function') {
          source.stop();
        }
      } catch (e) {}
    });
    this.activeSources.clear();
  }

  async close(): Promise<void> {
    await this.stopAllPlayback();
    this.instruments.clear();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
    }
    this.audioContext = null;
  }

  addTimeout(timeout: NodeJS.Timeout): void {
    this.activeTimeouts.add(timeout);
  }

  removeTimeout(timeout: NodeJS.Timeout): void {
    this.activeTimeouts.delete(timeout);
  }

  addSource(source: any): void {
    this.activeSources.add(source);
  }

  removeSource(source: any): void {
    this.activeSources.delete(source);
  }
}

export const audioManager = AudioManager.getInstance();