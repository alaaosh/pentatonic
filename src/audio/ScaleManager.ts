export type PentatonicNote = {
  name: string;
  frequency: number;
  ratio: number;
};

export type RootNote = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export type ScaleType = 'major' | 'minor' | 'blues' | 'yo' | 'hirajoshi';

export type HarmonyType = 'none' | 'chord' | 'power' | 'arpeggio';

export type ChordType = 'maj7' | 'min7' | 'dom7' | 'maj9' | 'min9' | 'sus4' | 'dim7';

export interface NoteInfo {
  name: string;
  octave: number;
  type: 'root' | 'third' | 'fifth' | 'seventh' | 'ninth' | 'fourth' | 'octave';
}

export class ScaleManager {
  private static readonly ROOT_FREQUENCIES: Record<RootNote, number> = {
    'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
    'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
    'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
  };

  private static readonly CHROMATIC_NAMES: RootNote[] = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
  ];

  // Semitone offsets for 5-note scales
  private static readonly SCALE_INTERVALS: Record<ScaleType, number[]> = {
    'major': [0, 2, 4, 7, 9],     // Major Pentatonic
    'minor': [0, 3, 5, 7, 10],    // Minor Pentatonic
    'blues': [0, 3, 5, 6, 10],    // Blues Pentatonic (1, b3, 4, b5, b7)
    'yo': [0, 2, 5, 7, 9],        // Yo scale (Japanese)
    'hirajoshi': [0, 2, 3, 7, 8]  // Hirajoshi scale (Japanese)
  };

  // Semitone offsets for Chord Types
  private static readonly CHORD_INTERVALS: Record<ChordType, { semi: number, type: NoteInfo['type'] }[]> = {
    'maj7': [{ semi: 0, type: 'root' }, { semi: 4, type: 'third' }, { semi: 7, type: 'fifth' }, { semi: 11, type: 'seventh' }],
    'min7': [{ semi: 0, type: 'root' }, { semi: 3, type: 'third' }, { semi: 7, type: 'fifth' }, { semi: 10, type: 'seventh' }],
    'dom7': [{ semi: 0, type: 'root' }, { semi: 4, type: 'third' }, { semi: 7, type: 'fifth' }, { semi: 10, type: 'seventh' }],
    'maj9': [{ semi: 0, type: 'root' }, { semi: 4, type: 'third' }, { semi: 7, type: 'fifth' }, { semi: 11, type: 'seventh' }, { semi: 14, type: 'ninth' }],
    'min9': [{ semi: 0, type: 'root' }, { semi: 3, type: 'third' }, { semi: 7, type: 'fifth' }, { semi: 10, type: 'seventh' }, { semi: 14, type: 'ninth' }],
    'sus4': [{ semi: 0, type: 'root' }, { semi: 5, type: 'fourth' }, { semi: 7, type: 'fifth' }, { semi: 12, type: 'octave' }],
    'dim7': [{ semi: 0, type: 'root' }, { semi: 3, type: 'third' }, { semi: 6, type: 'fifth' }, { semi: 9, type: 'seventh' }]
  };

  /**
   * Generates frequencies for a scale based on root, type, and octave.
   */
  static generatePentatonicScale(root: RootNote, type: ScaleType = 'major', octave: number = 4): PentatonicNote[] {
    const rootFreq = this.ROOT_FREQUENCIES[root] * Math.pow(2, octave - 4);
    const intervals = this.SCALE_INTERVALS[type];
    const rootIndex = this.CHROMATIC_NAMES.indexOf(root);

    return intervals.map((semi) => {
      const nameIndex = (rootIndex + semi) % 12;
      const ratio = Math.pow(2, semi / 12);
      
      return {
        name: this.CHROMATIC_NAMES[nameIndex],
        ratio: ratio,
        frequency: rootFreq * ratio
      };
    });
  }

  /**
   * Gets a specific frequency by note index within an octave.
   */
  static getFrequency(root: RootNote, type: ScaleType, noteIndex: number, octave: number = 4): number {
    const rootFreq = this.ROOT_FREQUENCIES[root] * Math.pow(2, octave - 4);
    const intervals = this.SCALE_INTERVALS[type];
    const semi = intervals[noteIndex % 5];
    const ratio = Math.pow(2, semi / 12);
    return rootFreq * ratio;
  }

  /**
   * Converts a note name and octave to frequency.
   */
  static noteToFrequency(note: string, octave: number = 4): number {
    const semitone = this.CHROMATIC_NAMES.indexOf(note as RootNote);
    if (semitone === -1) return 440;
    return 440 * Math.pow(2, (octave - 4) + (semitone - 9) / 12);
  }

  /**
   * Generates harmony notes for a given root note.
   * 
   * DESIGN PHILOSOPHY:
   * While the interface is pentatonic for intuitive playability, the harmonies generated
   * here utilize the full chromatic spectrum (Major 3rds, Perfect 5ths, Dominant 7ths, etc.)
   * to provide a rich, professional musical experience that transcends the limitations
   * of a simple 5-note scale.
   */
  static generateHarmony(rootNoteName: string, harmonyType: HarmonyType, chordType: ChordType = 'maj7'): NoteInfo[] {
    if (harmonyType === 'none') {
      return [{ name: rootNoteName, octave: 4, type: 'root' }];
    }

    const rootIndex = this.CHROMATIC_NAMES.indexOf(rootNoteName as RootNote);
    
    if (harmonyType === 'power') {
      const fifthIndex = (rootIndex + 7) % 12;
      const fifthOctave = rootIndex + 7 >= 12 ? 5 : 4;
      return [
        { name: rootNoteName, octave: 4, type: 'root' },
        { name: this.CHROMATIC_NAMES[fifthIndex], octave: fifthOctave, type: 'fifth' },
        { name: rootNoteName, octave: 5, type: 'octave' }
      ];
    }

    // Full Chord / Arpeggio
    const chordIntervals = this.CHORD_INTERVALS[chordType];

    return chordIntervals.map(interval => {
      const noteIndex = (rootIndex + interval.semi) % 12;
      const octaveOffset = Math.floor((rootIndex + interval.semi) / 12);
      return {
        name: this.CHROMATIC_NAMES[noteIndex],
        octave: 4 + octaveOffset,
        type: interval.type
      };
    });
  }
}
