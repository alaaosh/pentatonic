import { HarmonyType } from './ScaleManager';

export type Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface EnvelopeParams {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface Voice {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  startTime: number;
  noteId: string | number;
}

export class SynthesisEngine {
  private context: AudioContext;
  private masterGain: GainNode;
  private voices: Map<string | number, Voice[]> = new Map();
  private arpeggioIntervals: Map<string | number, number> = new Map();
  private totalVoices: number = 0;
  private maxVoices: number = 32;
  private envelope: EnvelopeParams = {
    attack: 0.05,
    decay: 0.2,
    sustain: 0.3,
    release: 1.0
  };

  constructor() {
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
    this.masterGain.gain.value = 0.5;
  }

  setVolume(value: number) {
    this.masterGain.gain.setTargetAtTime(value, this.context.currentTime, 0.05);
  }

  setEnvelope(params: Partial<EnvelopeParams>) {
    this.envelope = { ...this.envelope, ...params };
  }

  async resume() {
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  triggerNote(noteId: string | number, frequencies: number | number[], harmonyType: HarmonyType = 'none', waveform: Waveform = 'sawtooth') {
    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    this.stopNote(noteId);

    const freqArray = Array.isArray(frequencies) ? frequencies : [frequencies];
    
    if (harmonyType === 'arpeggio') {
      this.startArpeggio(noteId, freqArray, waveform);
    } else {
      this.playStaticHarmony(noteId, freqArray, waveform);
    }
  }

  private playStaticHarmony(noteId: string | number, frequencies: number[], waveform: Waveform) {
    const noteVoices: Voice[] = [];
    const now = this.context.currentTime;

    frequencies.forEach((freq) => {
      noteVoices.push(this.createVoice(noteId, freq, now, frequencies.length, waveform));
    });

    this.voices.set(noteId, noteVoices);
  }

  private startArpeggio(noteId: string | number, frequencies: number[], waveform: Waveform) {
    let index = 0;
    const playNext = () => {
      if (!this.arpeggioIntervals.has(noteId)) return;

      const freq = frequencies[index];
      const now = this.context.currentTime;
      const voice = this.createVoice(noteId, freq, now, 1, waveform);
      
      const currentVoices = this.voices.get(noteId) || [];
      currentVoices.push(voice);
      this.voices.set(noteId, currentVoices);

      if (currentVoices.length > frequencies.length * 2) {
          currentVoices.shift();
      }

      index = (index + 1) % frequencies.length;
      const timer = window.setTimeout(playNext, 150);
      this.arpeggioIntervals.set(noteId, timer);
    };

    this.arpeggioIntervals.set(noteId, 0); 
    playNext();
  }

  private createVoice(noteId: string | number, freq: number, startTime: number, div: number, waveform: Waveform): Voice {
    if (this.totalVoices >= this.maxVoices) {
      const firstKey = this.voices.keys().next().value;
      if (firstKey !== undefined) this.stopNote(firstKey);
    }

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(freq, startTime);

    gainNode.gain.value = 0;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.4 / div, startTime + this.envelope.attack);
    gainNode.gain.exponentialRampToValueAtTime(this.envelope.sustain || 0.001, startTime + this.envelope.attack + this.envelope.decay);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(startTime);
    this.totalVoices++;

    return { oscillator, gainNode, startTime, noteId };
  }

  stopNote(noteId: string | number) {
    const interval = this.arpeggioIntervals.get(noteId);
    if (interval !== undefined) {
      window.clearTimeout(interval);
      this.arpeggioIntervals.delete(noteId);
    }

    const noteVoices = this.voices.get(noteId);
    if (noteVoices) {
      const now = this.context.currentTime;
      noteVoices.forEach(voice => {
        try {
          voice.gainNode.gain.cancelScheduledValues(now);
          voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
          voice.gainNode.gain.exponentialRampToValueAtTime(0.001, now + this.envelope.release);
          voice.oscillator.stop(now + this.envelope.release);
        } catch (e) {
          // Ignore
        }
        this.totalVoices--;
      });
      this.voices.delete(noteId);
    }
  }

  stopAll() {
    Array.from(this.voices.keys()).forEach(id => this.stopNote(id));
  }
}
