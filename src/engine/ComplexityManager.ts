/**
 * ComplexityManager: The conductor of the APS v2.0 architecture.
 * 
 * A single 0–1 value governs the intensity of all algorithmic modules.
 * Each module has its own activation curve, so they fade in at different
 * points along the complexity spectrum.
 * 
 * At 0.0: Pure monophonic pentatonic. No algorithmic intervention.
 * At 1.0: Full generative mode — all modules at maximum intensity.
 * 
 * The curves are designed so that:
 * - Shifter (microtonality) activates first (subtle pitch coloring early on)
 * - Weaver (counterpoint) activates second (needs some foundation)
 * - Cloud (granular textures) activates last (the most "out there")
 */

export type ModuleIntensity = {
  shifter: number;  // 0–1: microtonal retuning + ornamentation depth
  weaver: number;   // 0–1: counterpoint voice count + independence
  cloud: number;    // 0–1: granular density + spectral diffusion
};

export type ComplexityChangeCallback = (intensity: ModuleIntensity, raw: number) => void;

export class ComplexityManager {
  private value: number = 0;
  private listeners: ComplexityChangeCallback[] = [];

  /**
   * Activation curves for each module.
   * Each returns 0–1 based on the global complexity value (0–1).
   * 
   * These are piecewise linear ramps with dead zones and saturation points.
   * Tuned by ear — adjust these as the modules are implemented.
   */
  private static shifterCurve(x: number): number {
    // Activates at 0.1, full at 0.6
    if (x < 0.1) return 0;
    if (x > 0.6) return 1;
    return (x - 0.1) / 0.5;
  }

  private static weaverCurve(x: number): number {
    // Activates at 0.25, full at 0.8
    if (x < 0.25) return 0;
    if (x > 0.8) return 1;
    return (x - 0.25) / 0.55;
  }

  private static cloudCurve(x: number): number {
    // Activates at 0.4, full at 0.95
    if (x < 0.4) return 0;
    if (x > 0.95) return 1;
    return (x - 0.4) / 0.55;
  }

  get complexity(): number {
    return this.value;
  }

  get intensity(): ModuleIntensity {
    return {
      shifter: ComplexityManager.shifterCurve(this.value),
      weaver: ComplexityManager.weaverCurve(this.value),
      cloud: ComplexityManager.cloudCurve(this.value),
    };
  }

  /**
   * Set the complexity value (0–1). Notifies all listeners.
   */
  setComplexity(value: number): void {
    this.value = Math.max(0, Math.min(1, value));
    const intensity = this.intensity;
    this.listeners.forEach(cb => cb(intensity, this.value));
  }

  /**
   * Subscribe to complexity changes.
   * Returns an unsubscribe function.
   */
  onChange(callback: ComplexityChangeCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Get the harmony type that should be used at the current complexity.
   * This replaces the manual harmony mode selector.
   * 
   * 0.0–0.2: single (monophonic)
   * 0.2–0.5: power (root + fifth + octave)
   * 0.5–0.7: chord (full voicings)
   * 0.7–1.0: arpeggio (animated chords)
   */
  getHarmonyMode(): 'none' | 'power' | 'chord' | 'arpeggio' {
    if (this.value < 0.2) return 'none';
    if (this.value < 0.5) return 'power';
    if (this.value < 0.7) return 'chord';
    return 'arpeggio';
  }

  /**
   * Get the chord complexity that should be used at the current level.
   * Simpler chords at lower complexity, richer voicings as it increases.
   */
  getChordType(): 'sus4' | 'maj7' | 'min7' | 'dom7' | 'maj9' | 'min9' | 'dim7' {
    if (this.value < 0.35) return 'sus4';
    if (this.value < 0.5) return 'maj7';
    if (this.value < 0.65) return 'min7';
    if (this.value < 0.8) return 'dom7';
    return 'maj9';
  }

  /**
   * Get the waveform that best suits the current complexity level.
   * Clean sine at low complexity, richer waveforms as it increases.
   */
  getWaveform(): 'sine' | 'triangle' | 'sawtooth' | 'square' {
    if (this.value < 0.25) return 'sine';
    if (this.value < 0.5) return 'triangle';
    if (this.value < 0.75) return 'sawtooth';
    return 'square';
  }

  /**
   * Get filter parameters scaled to complexity.
   * Low complexity = wide open, warm filter.
   * High complexity = more resonant, tighter filter for character.
   */
  getFilterParams(): { cutoff: number; resonance: number } {
    // Cutoff sweeps from fully open (8000Hz) down to more shaped (1500Hz)
    const cutoff = 8000 - (this.value * 6500);
    // Resonance increases subtly
    const resonance = 0.5 + (this.value * 8);
    return { cutoff, resonance };
  }

  /**
   * Get envelope parameters scaled to complexity.
   * Low complexity = plucky, immediate.
   * High complexity = longer, more evolving.
   */
  getEnvelopeParams(): { attack: number; decay: number; sustain: number; release: number } {
    return {
      attack: 0.01 + (this.value * 0.15),
      decay: 0.1 + (this.value * 0.4),
      sustain: 0.2 + (this.value * 0.4),
      release: 0.3 + (this.value * 2.5),
    };
  }
}
