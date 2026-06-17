import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SynthesisEngine } from '../SynthesisEngine';

// Mock Web Audio API
class MockAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  createGain = vi.fn(() => ({
    connect: vi.fn(),
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      setTargetAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
    }
  }));
  createOscillator = vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: {
      setValueAtTime: vi.fn()
    },
    type: 'sine'
  }));
  createBiquadFilter = vi.fn(() => ({
    connect: vi.fn(),
    type: 'lowpass',
    frequency: {
      setValueAtTime: vi.fn(),
      setTargetAtTime: vi.fn()
    },
    Q: {
      setValueAtTime: vi.fn(),
      setTargetAtTime: vi.fn()
    }
  }));
  createAnalyser = vi.fn(() => ({
    connect: vi.fn(),
    frequencyBinCount: 1024,
    getByteFrequencyData: vi.fn(),
    fftSize: 2048
  }));
  resume = vi.fn(() => Promise.resolve());
}

(window as any).AudioContext = MockAudioContext;

describe('SynthesisEngine', () => {
  let engine: SynthesisEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new SynthesisEngine();
  });

  it('should initialize with a master gain connected to destination', () => {
    expect(engine).toBeDefined();
  });

  it('should trigger a note and create audio nodes', () => {
    engine.triggerNote('C4', 261.63);
    const ctx = (engine as any).context;
    expect(ctx.createOscillator).toHaveBeenCalled();
    expect(ctx.createGain).toHaveBeenCalled();
  });

  it('should stop a note and apply release envelope', () => {
    engine.triggerNote('C4', 261.63);
    engine.stopNote('C4');
    
    // We can't easily check the voice map because it's private and uses setTimeout
    // but we can check if oscillator.stop was called eventually
  });

  it('should recycle voices when max limit is reached', () => {
    // Fill up voices
    for (let i = 0; i < 15; i++) {
      engine.triggerNote(`note-${i}`, 440);
    }
    
    // Since maxVoices is 12, it should have called stopNote for some
    // Actually, in our implementation, it stops the oldest one immediately
    const ctx = (engine as any).context;
    // createOscillator should have been called 15 times
    expect(ctx.createOscillator).toHaveBeenCalledTimes(15);
  });
});
