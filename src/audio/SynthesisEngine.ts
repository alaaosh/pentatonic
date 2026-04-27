import { HarmonyType } from './ScaleManager';

export type Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface EnvelopeParams {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface FilterParams {
  cutoff: number;
  resonance: number;
}

export interface Voice {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  filterNode: BiquadFilterNode;
  startTime: number;
  noteId: string | number;
  baseFrequency: number;
}

export class SynthesisEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private recorderDestination: MediaStreamAudioDestinationNode | null = null;
  private voices: Map<string | number, Voice[]> = new Map();
  private arpeggioIntervals: Map<string | number, number> = new Map();
  private totalVoices: number = 0;
  private maxVoices: number = 32;
  
  private waveform: Waveform = 'sawtooth';
  private envelope: EnvelopeParams = {
    attack: 0.05,
    decay: 0.2,
    sustain: 0.3,
    release: 1.0
  };
  private filter: FilterParams = {
    cutoff: 2000,
    resonance: 1
  };

  constructor() {}

  private initContext() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.masterGain.gain.value = 0.5;
      this.recorderDestination = this.context.createMediaStreamDestination();
      this.masterGain.connect(this.recorderDestination);
    }
    return this.context;
  }

  setVolume(value: number) {
    if (this.masterGain && this.context) {
      this.masterGain.gain.setTargetAtTime(value, this.context.currentTime, 0.05);
    }
  }

  setEnvelope(params: Partial<EnvelopeParams>) {
    this.envelope = { ...this.envelope, ...params };
  }

  setFilter(params: Partial<FilterParams>) {
    this.filter = { ...this.filter, ...params };
    this.voices.forEach(voiceList => {
        voiceList.forEach(voice => {
            if (this.context) {
                voice.filterNode.frequency.setTargetAtTime(this.filter.cutoff, this.context.currentTime, 0.05);
                voice.filterNode.Q.setTargetAtTime(this.filter.resonance, this.context.currentTime, 0.05);
            }
        });
    });
  }

  setWaveform(type: Waveform) {
    this.waveform = type;
  }

  async resume() {
    const ctx = this.initContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  triggerNote(noteId: string | number, frequencies: number | number[], harmonyType: HarmonyType = 'none') {
    const ctx = this.initContext();
    if (ctx.state === 'suspended') ctx.resume();

    this.stopNote(noteId);
    const freqArray = Array.isArray(frequencies) ? frequencies : [frequencies];
    
    if (harmonyType === 'arpeggio') {
      this.startArpeggio(noteId, freqArray, this.waveform);
    } else {
      this.playStaticHarmony(noteId, freqArray, this.waveform);
    }
  }

  modulateNote(noteId: string | number, pitchBend: number, timbre: number, resonanceMod: number = 0) {
    const voiceList = this.voices.get(noteId);
    if (!voiceList || !this.context) return;

    const now = this.context.currentTime;
    // pitchBend is in semitones (-1 to 1)
    const pitchRatio = Math.pow(2, pitchBend / 12);
    // timbre is 0 to 1, use it to shift cutoff up to +2 octaves
    const filterFreq = this.filter.cutoff * (1 + timbre * 3);
    
    // resonanceMod is 0 to 1, adds to base resonance (max +10)
    const filterRes = this.filter.resonance + (resonanceMod * 10);

    voiceList.forEach(voice => {
      voice.oscillator.frequency.setTargetAtTime(voice.baseFrequency * pitchRatio, now, 0.05);
      voice.filterNode.frequency.setTargetAtTime(filterFreq, now, 0.05);
      voice.filterNode.Q.setTargetAtTime(filterRes, now, 0.05);
    });
  }

  private playStaticHarmony(noteId: string | number, frequencies: number[], waveform: Waveform) {
    const noteVoices: Voice[] = [];
    const ctx = this.initContext();
    const now = ctx.currentTime;

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
      const ctx = this.initContext();
      const voice = this.createVoice(noteId, freq, ctx.currentTime, 1, waveform);
      const currentVoices = this.voices.get(noteId) || [];
      currentVoices.push(voice);
      this.voices.set(noteId, currentVoices);
      
      // Keep arpeggio tail short and release orphaned voices
      if (currentVoices.length > frequencies.length) {
        const oldVoice = currentVoices.shift();
        if (oldVoice) this.releaseVoice(oldVoice, ctx.currentTime);
      }
      index = (index + 1) % frequencies.length;
      const timer = window.setTimeout(playNext, 150);
      this.arpeggioIntervals.set(noteId, timer);
    };
    this.arpeggioIntervals.set(noteId, 0); 
    playNext();
  }

  private createVoice(noteId: string | number, freq: number, startTime: number, div: number, waveform: Waveform): Voice {
    const ctx = this.initContext();
    const master = this.masterGain!;

    if (this.totalVoices >= this.maxVoices) {
      const firstKey = this.voices.keys().next().value;
      if (firstKey !== undefined) {
        const voicesToRelease = this.voices.get(firstKey);
        if (voicesToRelease) {
          voicesToRelease.forEach(v => this.releaseVoice(v, ctx.currentTime));
          this.voices.delete(firstKey);
        }
      }
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filterNode = ctx.createBiquadFilter();

    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(freq, startTime);

    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(this.filter.cutoff, startTime);
    filterNode.Q.setValueAtTime(this.filter.resonance, startTime);

    const peak = 0.4 / div;
    gainNode.gain.value = 0;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(peak, startTime + this.envelope.attack);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.001, peak * (this.envelope.sustain || 0.001)), startTime + this.envelope.attack + this.envelope.decay);

    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(master);

    oscillator.start(startTime);
    this.totalVoices++;

    return { oscillator, gainNode, filterNode, startTime, noteId, baseFrequency: freq };
  }

  private releaseVoice(voice: Voice, now: number) {
    try {
      voice.gainNode.gain.cancelScheduledValues(now);
      voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
      voice.gainNode.gain.exponentialRampToValueAtTime(0.001, now + this.envelope.release);
      voice.oscillator.stop(now + this.envelope.release);
      this.totalVoices--;
    } catch (e) {
      console.warn('Error releasing voice:', e);
    }
  }

  stopNote(noteId: string | number) {
    const interval = this.arpeggioIntervals.get(noteId);
    if (interval !== undefined) {
      window.clearTimeout(interval);
      this.arpeggioIntervals.delete(noteId);
    }

    const noteVoices = this.voices.get(noteId);
    if (noteVoices && this.context) {
      const now = this.context.currentTime;
      noteVoices.forEach(voice => this.releaseVoice(voice, now));
      this.voices.delete(noteId);
    }
  }

  stopAll() {
    Array.from(this.voices.keys()).forEach(id => this.stopNote(id));
  }

  getRecordingStream(): MediaStream {
    return this.recorderDestination?.stream ?? new MediaStream();
  }
}
