import { ScaleManager, RootNote, ScaleType, HarmonyType, ChordType } from './audio/ScaleManager';
import { SynthesisEngine } from './audio/SynthesisEngine';
import { VisualRenderer } from './ui/VisualRenderer';
import { TouchHandler } from './ui/TouchHandler';
import { globalEvents, EventType, NoteOnEvent, NoteOffEvent } from './utils/EventProcessor';
import './styles.css';

// App State
let currentRoot: RootNote = 'C';
let currentScaleType: ScaleType = 'major';
let currentOctave = 4;
let currentHarmony: HarmonyType = 'chord';
let currentChordType: ChordType = 'maj7';

// DOM Elements
const canvas = document.getElementById('instrument') as HTMLCanvasElement;
const rootSelect = document.getElementById('root-select') as HTMLSelectElement;
const scaleSelect = document.getElementById('scale-select') as HTMLSelectElement;
const harmonySelect = document.getElementById('harmony-type') as HTMLSelectElement;
const chordTypeSelect = document.getElementById('chord-type') as HTMLSelectElement;
const volumeSlider = document.getElementById('volume') as HTMLInputElement;
const noteDisplay = document.getElementById('note-display');

if (!canvas) {
    throw new Error('Canvas element not found');
}

// Initialize Components
const renderer = new VisualRenderer(canvas);
const audio = new SynthesisEngine();
const touch = new TouchHandler(canvas, renderer);

// --- Subscriptions ---

globalEvents.subscribe<NoteOnEvent>(EventType.NOTE_ON, (data) => {
    const notes = ScaleManager.generatePentatonicScale(currentRoot, currentScaleType, data.octave);
    const rootNote = notes[data.index];
    
    if (rootNote) {
        const harmonyNotes = ScaleManager.generateHarmony(rootNote.name, data.harmonyType, data.chordType);
        const frequencies = harmonyNotes.map(n => ScaleManager.noteToFrequency(n.name, n.octave + (data.octave - 4)));
        
        // We need a unique ID for synthesis that includes octave to allow polyphonic octaves
        const voiceId = `${data.index}-${data.octave}`;
        audio.triggerNote(voiceId, frequencies, data.harmonyType);
        
        if (noteDisplay) {
            noteDisplay.textContent = `Playing: ${rootNote.name}${data.octave} (${data.harmonyType} ${data.chordType})`;
        }
    }
    
    renderer.setActive(data.index, data.octave, true);
});

globalEvents.subscribe<NoteOffEvent>(EventType.NOTE_OFF, (data) => {
    const voiceId = `${data.index}-${data.octave}`;
    audio.stopNote(voiceId);
    renderer.setActive(data.index, data.octave, false);
    
    if (noteDisplay) {
        setTimeout(() => {
             if (noteDisplay.textContent?.startsWith('Playing')) {
                 noteDisplay.textContent = 'Touch to play';
             }
        }, 500);
    }
});

// --- Input Handling -> Event Emission ---

touch.onNoteStart = (noteIndex, octave) => {
    const freq = ScaleManager.getFrequency(currentRoot, currentScaleType, noteIndex, octave);
    globalEvents.emit<NoteOnEvent>(EventType.NOTE_ON, {
        index: noteIndex,
        frequency: freq,
        velocity: 1.0,
        harmonyType: currentHarmony,
        chordType: currentChordType,
        octave: octave
    });
};

touch.onNoteStop = (noteIndex, octave) => {
    globalEvents.emit<NoteOffEvent>(EventType.NOTE_OFF, {
        index: noteIndex,
        octave: octave
    });
};

// Helper to update the scale layout
const updateLayout = () => {
    const notes = ScaleManager.generatePentatonicScale(currentRoot, currentScaleType, currentOctave);
    renderer.updateLayout(notes, currentOctave);
};

// UI Controls Listeners
if (rootSelect) {
    rootSelect.addEventListener('change', (e) => {
        currentRoot = (e.target as HTMLSelectElement).value as RootNote;
        updateLayout();
    });
}

if (scaleSelect) {
    scaleSelect.addEventListener('change', (e) => {
        currentScaleType = (e.target as HTMLSelectElement).value as ScaleType;
        updateLayout();
    });
}

if (harmonySelect) {
    harmonySelect.addEventListener('change', (e) => {
        currentHarmony = (e.target as HTMLSelectElement).value as HarmonyType;
    });
    // Set initial value from DOM
    currentHarmony = harmonySelect.value as HarmonyType;
}

if (chordTypeSelect) {
    chordTypeSelect.addEventListener('change', (e) => {
        currentChordType = (e.target as HTMLSelectElement).value as ChordType;
    });
    currentChordType = chordTypeSelect.value as ChordType;
}

if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value) / 100;
        audio.setVolume(val);
    });
}

// Initial Setup
updateLayout();

// Prevent default gestures on the document to stop scrolling/zooming while playing
document.addEventListener('touchmove', (e) => {
    if (e.target === canvas) {
        e.preventDefault();
    }
}, { passive: false });

console.log('Pentatonic Synth Initialized');
