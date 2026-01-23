class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.activeOscillators = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.3;
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }

    // Convert note name to frequency
    noteToFrequency(note, octave = 4) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
            'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };
        
        const semitone = noteMap[note];
        if (semitone === undefined) return 440;
        
        return 440 * Math.pow(2, (octave - 4) + (semitone - 9) / 12);
    }

    // Create a complex oscillator with multiple harmonics
    createComplexOscillator(frequency, type = 'sine') {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        // Add some detuning for richness
        oscillator.detune.setValueAtTime(Math.random() * 4 - 2, this.audioContext.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        return { oscillator, gainNode };
    }

    // Play a chord with multiple notes
    playChord(notes, harmonyType = 'chord', duration = 2) {
        if (!this.initialized) return;

        const chordId = Date.now() + Math.random();
        const oscillators = [];

        notes.forEach((note, index) => {
            const frequency = this.noteToFrequency(note.name, note.octave);
            
            if (harmonyType === 'arpeggio') {
                // Stagger the notes for arpeggio effect
                setTimeout(() => {
                    this.playNote(frequency, 0.8, chordId + index);
                }, index * 150);
            } else {
                // Play all notes together for chords
                const { oscillator, gainNode } = this.createComplexOscillator(frequency, 'sawtooth');
                
                // Different gain levels for different chord tones
                const baseGain = note.type === 'root' ? 0.4 : 
                                note.type === 'fifth' ? 0.3 : 0.25;
                
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(baseGain, this.audioContext.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + duration);
                
                oscillators.push({ oscillator, gainNode });
            }
        });

        this.activeOscillators.set(chordId, oscillators);
        
        // Clean up after duration
        setTimeout(() => {
            this.activeOscillators.delete(chordId);
        }, duration * 1000);

        return chordId;
    }

    // Play a single note with harmonics
    playNote(frequency, gain = 0.3, noteId = null) {
        if (!this.initialized) return;

        const id = noteId || Date.now();
        const oscillators = [];

        // Fundamental frequency
        const fundamental = this.createComplexOscillator(frequency, 'sawtooth');
        fundamental.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        fundamental.gainNode.gain.linearRampToValueAtTime(gain, this.audioContext.currentTime + 0.05);
        fundamental.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.5);
        
        fundamental.oscillator.start();
        fundamental.oscillator.stop(this.audioContext.currentTime + 1.5);
        oscillators.push(fundamental);

        // Add harmonics for richness
        [2, 3, 4].forEach((harmonic, index) => {
            const harmonicOsc = this.createComplexOscillator(frequency * harmonic, 'sine');
            const harmonicGain = gain * (0.3 / harmonic);
            
            harmonicOsc.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            harmonicOsc.gainNode.gain.linearRampToValueAtTime(harmonicGain, this.audioContext.currentTime + 0.05);
            harmonicOsc.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.2);
            
            harmonicOsc.oscillator.start();
            harmonicOsc.oscillator.stop(this.audioContext.currentTime + 1.2);
            oscillators.push(harmonicOsc);
        });

        this.activeOscillators.set(id, oscillators);
        return id;
    }

    setVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(volume / 100 * 0.5, this.audioContext.currentTime);
        }
    }

    stopAll() {
        this.activeOscillators.forEach((oscillators) => {
            oscillators.forEach(({ oscillator, gainNode }) => {
                try {
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
                    oscillator.stop(this.audioContext.currentTime + 0.1);
                } catch (e) {
                    // Oscillator might already be stopped
                }
            });
        });
        this.activeOscillators.clear();
    }
}