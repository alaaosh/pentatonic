import { describe, it, expect } from 'vitest';
import { ScaleManager, RootNote, ScaleType } from '../ScaleManager';
import fc from 'fast-check';

describe('ScaleManager Property Tests', () => {
  const roots: RootNote[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const types: ScaleType[] = ['major', 'minor', 'blues', 'yo', 'hirajoshi'];

  // Property 6: Pentatonic Scale Accuracy
  it('Property 6: Generated frequencies should match semitone-based ratios', () => {
    roots.forEach(root => {
      types.forEach(type => {
        const scale = ScaleManager.generatePentatonicScale(root, type);
        const rootFreq = scale[0].frequency;
        
        // Interval-based ratios
        const intervals = {
            'major': [0, 2, 4, 7, 9],
            'minor': [0, 3, 5, 7, 10],
            'blues': [0, 3, 5, 6, 10],
            'yo': [0, 2, 5, 7, 9],
            'hirajoshi': [0, 2, 3, 7, 8]
        }[type];
        
        scale.forEach((note, index) => {
          const expectedRatio = Math.pow(2, intervals[index] / 12);
          expect(note.frequency).toBeCloseTo(rootFreq * expectedRatio, 5);
        });
      });
    });
  });

  // Property 7: Scale Transposition Consistency
  it('Property 7: Transposing maintains correct intervals across octaves', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...roots), 
        fc.constantFrom(...types),
        fc.integer({ min: 0, max: 8 }), 
        (root, type, octave) => {
          const scale = ScaleManager.generatePentatonicScale(root, type, octave);
          const rootFreq = scale[0].frequency;
          
          const intervals = {
            'major': [0, 2, 4, 7, 9],
            'minor': [0, 3, 5, 7, 10],
            'blues': [0, 3, 5, 6, 10],
            'yo': [0, 2, 5, 7, 9],
            'hirajoshi': [0, 2, 3, 7, 8]
          }[type];

          scale.forEach((note, index) => {
            const expectedRatio = Math.pow(2, intervals[index] / 12);
            expect(note.frequency).toBeCloseTo(rootFreq * expectedRatio, 5);
          });
        }
      )
    );
  });

  // Property 8: Octave Frequency Relationships
  it('Property 8: Octave frequency relationships maintain 2:1 ratios', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...roots), 
        fc.constantFrom(...types),
        fc.integer({ min: 0, max: 4 }), 
        (root, type, noteIndex) => {
          const freqOctave4 = ScaleManager.getFrequency(root, type, noteIndex, 4);
          const freqOctave5 = ScaleManager.getFrequency(root, type, noteIndex, 5);
          
          expect(freqOctave5).toBeCloseTo(freqOctave4 * 2, 5);
        }
      )
    );
  });
});