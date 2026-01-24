export type PentatonicNote = {
  name: string;
  frequency: number;
  ratio: number;
};

export type ScaleKey = 'C' | 'G' | 'D' | 'A' | 'E' | 'F';

export type HarmonyType = 'none' | 'chord' | 'power' | 'arpeggio';

export interface NoteInfo {
  name: string;
  octave: number;
  type: 'root' | 'third' | 'fifth' | 'seventh' | 'octave';
}

export class ScaleManager {
  private static readonly PENTATONIC_RATIOS = [1.0, 1.125, 1.25, 1.5, 1.6666666666666667]; // 1, 9/8, 5/4, 3/2, 5/3
  private static readonly NOTE_NAMES: Record<ScaleKey, string[]> = {
    'C': ['C', 'D', 'E', 'G', 'A'],
    'G': ['G', 'A', 'B', 'D', 'E'],
    'D': ['D', 'E', 'F#', 'A', 'B'],
    'A': ['A', 'B', 'C#', 'E', 'F#'],
    'E': ['E', 'F#', 'G#', 'B', 'C#'],
    'F': ['F', 'G', 'A', 'C', 'D']
  };

  private static readonly BASE_FREQUENCIES: Record<ScaleKey, number> = {
    'C': 261.63,
    'G': 392.00,
    'D': 293.66,
    'A': 440.00,
    'E': 329.63,
    'F': 349.23
  };

  private static readonly CHORD_PROGRESSIONS: Record<string, Record<string, NoteInfo[]>> = {
    'C': {
      chord: [
        { name: 'C', octave: 4, type: 'root' },
        { name: 'E', octave: 4, type: 'third' },
        { name: 'G', octave: 4, type: 'fifth' },
        { name: 'B', octave: 4, type: 'seventh' }
      ],
      power: [
        { name: 'C', octave: 4, type: 'root' },
        { name: 'G', octave: 4, type: 'fifth' },
        { name: 'C', octave: 5, type: 'octave' }
      ]
    },
    'D': {
      chord: [
        { name: 'D', octave: 4, type: 'root' },
        { name: 'F#', octave: 4, type: 'third' },
        { name: 'A', octave: 4, type: 'fifth' },
        { name: 'C', octave: 5, type: 'seventh' }
      ],
      power: [
        { name: 'D', octave: 4, type: 'root' },
        { name: 'A', octave: 4, type: 'fifth' },
        { name: 'D', octave: 5, type: 'octave' }
      ]
    },
    'E': {
      chord: [
        { name: 'E', octave: 4, type: 'root' },
        { name: 'G#', octave: 4, type: 'third' },
        { name: 'B', octave: 4, type: 'fifth' },
        { name: 'D', octave: 5, type: 'seventh' }
      ],
      power: [
        { name: 'E', octave: 4, type: 'root' },
        { name: 'B', octave: 4, type: 'fifth' },
        { name: 'E', octave: 5, type: 'octave' }
      ]
    },
    'G': {
      chord: [
        { name: 'G', octave: 4, type: 'root' },
        { name: 'B', octave: 4, type: 'third' },
        { name: 'D', octave: 5, type: 'fifth' },
        { name: 'F', octave: 5, type: 'seventh' }
      ],
      power: [
        { name: 'G', octave: 4, type: 'root' },
        { name: 'D', octave: 5, type: 'fifth' },
        { name: 'G', octave: 5, type: 'octave' }
      ]
    },
    'A': {
      chord: [
        { name: 'A', octave: 4, type: 'root' },
        { name: 'C#', octave: 5, type: 'third' },
        { name: 'E', octave: 5, type: 'fifth' },
        { name: 'G', octave: 5, type: 'seventh' }
      ],
      power: [
        { name: 'A', octave: 4, type: 'root' },
        { name: 'E', octave: 5, type: 'fifth' },
        { name: 'A', octave: 5, type: 'octave' }
      ]
    }
  };

  private static readonly NOTE_TO_SEMITONE: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
    'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
  };

  /**
   * Generates frequencies for a pentatonic scale based on a root key and octave.
   */
  static generatePentatonicScale(key: ScaleKey, octave: number = 4): PentatonicNote[] {
    const rootFreq = this.BASE_FREQUENCIES[key] * Math.pow(2, octave - 4);
    const names = this.NOTE_NAMES[key];

    return names.map((name, index) => ({
      name,
      ratio: this.PENTATONIC_RATIOS[index],
      frequency: rootFreq * this.PENTATONIC_RATIOS[index]
    }));
  }

  /**
   * Gets a specific frequency by note index within an octave.
   */
  static getFrequency(key: ScaleKey, noteIndex: number, octave: number = 4): number {
    const rootFreq = this.BASE_FREQUENCIES[key] * Math.pow(2, octave - 4);
    const ratio = this.PENTATONIC_RATIOS[noteIndex % 5];
    return rootFreq * ratio;
  }

  /**
   * Converts a note name and octave to frequency.
   */
  static noteToFrequency(note: string, octave: number = 4): number {
    const semitone = this.NOTE_TO_SEMITONE[note];
    if (semitone === undefined) return 440;
    return 440 * Math.pow(2, (octave - 4) + (semitone - 9) / 12);
  }

  /**
   * Generates harmony notes for a given root note.
   */
  static generateHarmony(rootNoteName: string, harmonyType: HarmonyType): NoteInfo[] {
    if (harmonyType === 'none') {
      return [{ name: rootNoteName, octave: 4, type: 'root' }];
    }

    const hType = harmonyType === 'arpeggio' ? 'chord' : harmonyType;
    const harmony = this.CHORD_PROGRESSIONS[rootNoteName]?.[hType];

    if (harmony) return harmony;

    // Default fallback
    return [
      { name: rootNoteName, octave: 4, type: 'root' },
      { name: rootNoteName, octave: 5, type: 'octave' }
    ];
  }
}
