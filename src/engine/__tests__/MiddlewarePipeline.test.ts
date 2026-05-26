import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MiddlewarePipeline, NoteEvent, Middleware } from '../MiddlewarePipeline';
import { ComplexityManager } from '../ComplexityManager';

// Minimal mocks
const mockAudio = {
  triggerNote: vi.fn(),
  stopNote: vi.fn(),
  modulateNote: vi.fn(),
  setWaveform: vi.fn(),
  setFilter: vi.fn(),
  setEnvelope: vi.fn(),
} as any;

const mockRenderer = {
  setActive: vi.fn(),
} as any;

describe('MiddlewarePipeline', () => {
  let pipeline: MiddlewarePipeline;
  let complexity: ComplexityManager;

  beforeEach(() => {
    vi.clearAllMocks();
    complexity = new ComplexityManager();
    pipeline = new MiddlewarePipeline(complexity, mockAudio, mockRenderer);
    pipeline.setScale('C', 'major');
  });

  it('should deliver note_on events to the audio engine', () => {
    complexity.setComplexity(0.6); // chord mode
    const event: NoteEvent = { type: 'note_on', index: 0, octave: 4, velocity: 1 };
    pipeline.process(event);
    expect(mockAudio.triggerNote).toHaveBeenCalled();
    expect(mockRenderer.setActive).toHaveBeenCalledWith(0, 4, true);
  });

  it('should deliver note_off events to the audio engine', () => {
    const event: NoteEvent = { type: 'note_off', index: 2, octave: 5 };
    pipeline.process(event);
    expect(mockAudio.stopNote).toHaveBeenCalledWith('2-5');
    expect(mockRenderer.setActive).toHaveBeenCalledWith(2, 5, false);
  });

  it('should deliver note_modulate events to the audio engine', () => {
    const event: NoteEvent = {
      type: 'note_modulate', index: 1, octave: 4,
      pitchBend: 0.5, timbre: 0.3, resonance: 0.1
    };
    pipeline.process(event);
    expect(mockAudio.modulateNote).toHaveBeenCalledWith('1-4', 0.5, 0.3, 0.1);
  });

  it('should pass events through middleware in order', () => {
    const order: number[] = [];

    const mw1: Middleware = (event, next) => {
      order.push(1);
      next(event);
    };
    const mw2: Middleware = (event, next) => {
      order.push(2);
      next(event);
    };

    pipeline.use(mw1);
    pipeline.use(mw2);
    pipeline.process({ type: 'note_off', index: 0, octave: 4 });

    expect(order).toEqual([1, 2]);
  });

  it('should allow middleware to modify events', () => {
    // Middleware that transposes all notes up one octave
    const transposeUp: Middleware = (event, next) => {
      next({ ...event, octave: event.octave + 1 });
    };

    pipeline.use(transposeUp);
    pipeline.process({ type: 'note_off', index: 0, octave: 4 });

    expect(mockAudio.stopNote).toHaveBeenCalledWith('0-5'); // octave 4+1=5
  });

  it('should allow middleware to swallow events', () => {
    // Middleware that blocks all note_on events
    const blocker: Middleware = (event, next) => {
      if (event.type !== 'note_on') next(event);
      // else: swallowed
    };

    pipeline.use(blocker);
    complexity.setComplexity(0.5);
    pipeline.process({ type: 'note_on', index: 0, octave: 4, velocity: 1 });

    expect(mockAudio.triggerNote).not.toHaveBeenCalled();
  });

  it('should update synth params when complexity changes', () => {
    complexity.setComplexity(0.5);
    expect(mockAudio.setWaveform).toHaveBeenCalled();
    expect(mockAudio.setFilter).toHaveBeenCalled();
    expect(mockAudio.setEnvelope).toHaveBeenCalled();
  });

  it('should use harmony mode based on complexity level', () => {
    // At low complexity, harmony should be "none" (single note)
    complexity.setComplexity(0.1);
    pipeline.process({ type: 'note_on', index: 0, octave: 4, velocity: 1 });
    
    const call = mockAudio.triggerNote.mock.calls[0];
    // With 'none' harmony, should pass a single frequency
    expect(call[1].length).toBe(1); // single note
  });
});
