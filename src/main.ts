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
let currentOctaveOffset = 1;
let currentHarmony: HarmonyType = 'chord';
let currentChordType: ChordType = 'maj7';

// DOM Elements
const canvas = document.getElementById('instrument') as HTMLCanvasElement;
const rootStrip = document.getElementById('root-strip');
const scaleSelect = document.getElementById('scale-select') as HTMLSelectElement;
const harmonyMode = document.getElementById('harmony-mode');
const chordTypeSelect = document.getElementById('chord-type') as HTMLSelectElement;
const volumeSlider = document.getElementById('volume') as HTMLInputElement;
const octaveSepSlider = document.getElementById('octave-sep') as HTMLInputElement;
const noteDisplay = document.getElementById('note-display');
const unlockOverlay = document.getElementById('audio-unlock');
const startBtn = document.getElementById('start-btn');

if (!canvas) {
    throw new Error('Canvas element not found');
}

// Initialize Components
const renderer = new VisualRenderer(canvas);
const audio = new SynthesisEngine();
const touch = new TouchHandler(canvas, renderer);

// --- Audio Unlock Logic ---

const startApp = async () => {
    await audio.resume();
    unlockOverlay?.classList.add('hidden');
    console.log('Pentatonic Synth Started');
    
    // Initial Layout after unlock to ensure canvas is ready
    updateLayout();
};

if (startBtn) {
    startBtn.addEventListener('click', startApp);
}

// --- Subscriptions ---

globalEvents.subscribe<NoteOnEvent>(EventType.NOTE_ON, (data) => {
    const notes = ScaleManager.generatePentatonicScale(currentRoot, currentScaleType, data.octave);
    const rootNote = notes[data.index];
    
    if (rootNote) {
        const harmonyNotes = ScaleManager.generateHarmony(rootNote.name, data.harmonyType, data.chordType);
        const frequencies = harmonyNotes.map(n => ScaleManager.noteToFrequency(n.name, n.octave + (data.octave - 4)));
        
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
    renderer.updateLayout(notes, currentOctave, currentOctaveOffset);
};

// UI Controls Listeners

if (rootStrip) {
    rootStrip.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('.root-btn');
        if (!btn) return;
        currentRoot = btn.getAttribute('data-value') as RootNote;
        rootStrip.querySelectorAll('.root-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateLayout();
    });
}

if (scaleSelect) {
    scaleSelect.addEventListener('change', (e) => {
        currentScaleType = (e.target as HTMLSelectElement).value as ScaleType;
        updateLayout();
    });
}

if (harmonyMode) {
    harmonyMode.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('.segment-btn');
        if (!btn) return;
        currentHarmony = btn.getAttribute('data-value') as HarmonyType;
        harmonyMode.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
}

if (chordTypeSelect) {
    chordTypeSelect.addEventListener('change', (e) => {
        currentChordType = (e.target as HTMLSelectElement).value as ChordType;
    });
}

if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value) / 100;
        audio.setVolume(val);
    });
}

if (octaveSepSlider) {
    octaveSepSlider.addEventListener('input', (e) => {
        currentOctaveOffset = parseInt((e.target as HTMLInputElement).value);
        updateLayout();
    });
}

// Initial Setup (Partial - Visuals only, full layout after Start)
updateLayout();

// Prevent default gestures
document.addEventListener('touchmove', (e) => {
    if (e.target === canvas) {
        e.preventDefault();
    }
}, { passive: false });