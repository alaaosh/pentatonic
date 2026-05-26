/**
 * MiddlewarePipeline: The event processing backbone of APS v2.0.
 * 
 * In v1.0, input events (NOTE_ON, NOTE_OFF, NOTE_MODULATE) flow directly
 * from the TouchHandler/GestureController to the SynthesisEngine.
 * 
 * In v2.0, events pass through a chain of middleware modules. Each module
 * can observe, modify, delay, or generate new events. This is the architectural
 * foundation that The Weaver, The Shifter, and The Cloud will plug into.
 * 
 * For Phase 1, we implement the pipeline infrastructure with a single
 * built-in middleware: the ComplexityRouter, which uses the ComplexityManager
 * to automatically select harmony mode, chord type, waveform, and envelope
 * based on the dial position — replacing all the manual UI controls.
 */

import { ComplexityManager } from './ComplexityManager';
import { ScaleManager, RootNote, ScaleType } from '../audio/ScaleManager';
import { SynthesisEngine } from '../audio/SynthesisEngine';
import { VisualRenderer } from '../ui/VisualRenderer';

export interface NoteEvent {
  type: 'note_on' | 'note_off' | 'note_modulate';
  index: number;
  octave: number;
  velocity?: number;
  pitchBend?: number;
  timbre?: number;
  resonance?: number;
}

/**
 * A Middleware is a function that receives an event and a `next` callback.
 * It can:
 * - Pass the event through unchanged: next(event)
 * - Modify the event: next({ ...event, pitchBend: event.pitchBend * 0.5 })
 * - Swallow the event: (don't call next)
 * - Generate additional events: next(event); emitExtra(newEvent)
 */
export type Middleware = (event: NoteEvent, next: (event: NoteEvent) => void) => void;

export class MiddlewarePipeline {
  private middlewares: Middleware[] = [];
  private complexity: ComplexityManager;
  private audio: SynthesisEngine;
  private renderer: VisualRenderer;
  private scaleRoot: RootNote = 'C';
  private scaleType: ScaleType = 'major';

  constructor(
    complexity: ComplexityManager,
    audio: SynthesisEngine,
    renderer: VisualRenderer
  ) {
    this.complexity = complexity;
    this.audio = audio;
    this.renderer = renderer;

    // When complexity changes, update the synth parameters in real time
    this.complexity.onChange((_intensity, _raw) => {
      const waveform = this.complexity.getWaveform();
      const filter = this.complexity.getFilterParams();
      const envelope = this.complexity.getEnvelopeParams();

      this.audio.setWaveform(waveform);
      this.audio.setFilter(filter);
      this.audio.setEnvelope(envelope);
    });
  }

  /**
   * Register a middleware. Order matters — first registered = first to process.
   */
  use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Set the current scale context (used for frequency lookups).
   */
  setScale(root: RootNote, type: ScaleType): void {
    this.scaleRoot = root;
    this.scaleType = type;
  }

  getScaleRoot(): RootNote { return this.scaleRoot; }
  getScaleType(): ScaleType { return this.scaleType; }

  /**
   * Process an incoming event through the middleware chain,
   * then deliver it to the synthesis engine.
   */
  process(event: NoteEvent): void {
    const chain = [...this.middlewares];
    let index = 0;

    const next = (ev: NoteEvent): void => {
      if (index < chain.length) {
        const middleware = chain[index++];
        middleware(ev, next);
      } else {
        // End of chain — deliver to audio/visual
        this.deliver(ev);
      }
    };

    next(event);
  }

  /**
   * Final delivery: translate the processed event into audio and visual actions.
   */
  private deliver(event: NoteEvent): void {
    const voiceId = `${event.index}-${event.octave}`;

    switch (event.type) {
      case 'note_on': {
        const notes = ScaleManager.generatePentatonicScale(this.scaleRoot, this.scaleType, event.octave);
        const rootNote = notes[event.index];
        if (!rootNote) return;

        // Use complexity-driven harmony instead of manual selection
        const harmonyType = this.complexity.getHarmonyMode();
        const chordType = this.complexity.getChordType();

        const harmonyNotes = ScaleManager.generateHarmony(rootNote.name, harmonyType, chordType);
        const frequencies = harmonyNotes.map(n =>
          ScaleManager.noteToFrequency(n.name, n.octave + (event.octave - 4))
        );

        this.audio.triggerNote(voiceId, frequencies, harmonyType);
        this.renderer.setActive(event.index, event.octave, true);
        break;
      }

      case 'note_off': {
        this.audio.stopNote(voiceId);
        this.renderer.setActive(event.index, event.octave, false);
        break;
      }

      case 'note_modulate': {
        this.audio.modulateNote(
          voiceId,
          event.pitchBend || 0,
          event.timbre || 0,
          event.resonance || 0
        );
        break;
      }
    }
  }
}
