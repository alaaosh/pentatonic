import { describe, it, expect } from 'vitest';
import { ScaleManager, ScaleKey } from '../ScaleManager';
import fc from 'fast-check';

describe('ScaleManager Property Tests', () => {
  const keys: ScaleKey[] = ['C', 'G', 'D', 'A', 'E', 'F'];

  // Property 6: Pentatonic Scale Accuracy
  it('Property 6: Generated frequencies should match mathematically correct ratios', () => {
    keys.forEach(key => {
      const scale = ScaleManager.generatePentatonicScale(key);
      const rootFreq = scale[0].frequency;
      
      const ratios = [1.0, 1.125, 1.25, 1.5, 1.6666666666666667];
      
      scale.forEach((note, index) => {
        expect(note.frequency).toBeCloseTo(rootFreq * ratios[index], 5);
      });
    });
  });

  // Property 7: Scale Transposition Consistency
  it('Property 7: Transposing maintains correct pentatonic intervals', () => {
    fc.assert(
      fc.property(fc.constantFrom(...keys), fc.integer({ min: 0, max: 8 }), (key, octave) => {
        const scale = ScaleManager.generatePentatonicScale(key, octave);
        const rootFreq = scale[0].frequency;
        const ratios = [1.0, 1.125, 1.25, 1.5, 1.6666666666666667];

        scale.forEach((note, index) => {
          expect(note.frequency).toBeCloseTo(rootFreq * ratios[index], 5);
        });
      })
    );
  });

  // Property 8: Octave Frequency Relationships
  it('Property 8: Octave frequency relationships maintain 2:1 ratios', () => {
    fc.assert(
      fc.property(fc.constantFrom(...keys), fc.integer({ min: 0, max: 4 }), (key, noteIndex) => {
        const freqOctave4 = ScaleManager.getFrequency(key, noteIndex, 4);
        const freqOctave5 = ScaleManager.getFrequency(key, noteIndex, 5);
        
        expect(freqOctave5).toBeCloseTo(freqOctave4 * 2, 5);
      })
    );
  });
});
