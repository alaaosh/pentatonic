import { ScaleManager, RootNote, ScaleType } from './audio/ScaleManager';
import { SynthesisEngine } from './audio/SynthesisEngine';
import { VisualRenderer } from './ui/VisualRenderer';
import { TouchHandler } from './ui/TouchHandler';
import { MultiRangeSlider } from './ui/MultiRangeSlider';
import { VerticalSlider } from './ui/VerticalSlider';
import { ComplexityDial } from './ui/ComplexityDial';
import { GestureController } from './gesture/GestureController';
import { ComplexityManager } from './engine/ComplexityManager';
import { MiddlewarePipeline } from './engine/MiddlewarePipeline';
import './styles.css';

// ─── Core State ───────────────────────────────────────────────────────────────

let currentRoot: RootNote = 'C';
let currentScaleType: ScaleType = 'major';
let currentOctaves = { top: 5, mid: 4, bottom: 3 };

// ─── DOM Elements ─────────────────────────────────────────────────────────────

const canvas = document.getElementById('instrument') as HTMLCanvasElement;
const rootStrip = document.getElementById('root-strip');
const scaleSelect = document.getElementById('scale-select') as HTMLSelectElement;
const noteDisplay = document.getElementById('note-display');
const unlockOverlay = document.getElementById('audio-unlock');
const startBtn = document.getElementById('start-btn');

// Gesture Control Elements
const gestureToggleBtn = document.getElementById('gesture-toggle');
const gesturePanel = document.getElementById('gesture-panel');
const gestureCloseBtn = document.getElementById('gesture-close');
const gestureVideo = document.getElementById('gesture-video') as HTMLVideoElement;
const gestureCanvas = document.getElementById('gesture-canvas') as HTMLCanvasElement;
const videoUpload = document.getElementById('video-upload') as HTMLInputElement;

if (!canvas) {
    throw new Error('Canvas element not found');
}

// ─── Initialize v2.0 Architecture ────────────────────────────────────────────

const complexity = new ComplexityManager();
const audio = new SynthesisEngine();
const renderer = new VisualRenderer(canvas);
const pipeline = new MiddlewarePipeline(complexity, audio, renderer);
const touch = new TouchHandler(canvas, renderer);

// Gesture Controller (initialized on demand)
let gestureController: GestureController | null = null;
const activeFingerVoices: Map<string, { index: number, octave: number }> = new Map();

// ─── Widget Initializations ──────────────────────────────────────────────────

// The Complexity Dial — replaces waveform, filter, ADSR, harmony, and chord controls
new ComplexityDial('complexity-dial-container', complexity);

// Volume remains as a separate control (it's about loudness, not musical complexity)
new VerticalSlider('volume-slider', 0.5, (v) => {
    audio.setVolume(v);
});

// Octave range remains (it's about register, not complexity)
new MultiRangeSlider('octave-slider', currentOctaves, (newValues) => {
    currentOctaves = { ...newValues };
    updateLayout();
});

// ─── Audio Unlock ─────────────────────────────────────────────────────────────

const startApp = async () => {
    await audio.resume();
    unlockOverlay?.classList.add('hidden');
    console.log('PentaSynth v2.0 Started');
    updateLayout();
};

if (startBtn) {
    startBtn.addEventListener('click', startApp);
}

// ─── Input → Pipeline ─────────────────────────────────────────────────────────

touch.onNoteStart = (noteIndex, octave) => {
    pipeline.process({
        type: 'note_on',
        index: noteIndex,
        octave,
        velocity: 1.0,
    });
    // Update display
    const notes = ScaleManager.generatePentatonicScale(currentRoot, currentScaleType, octave);
    const rootNote = notes[noteIndex];
    if (noteDisplay && rootNote) {
        noteDisplay.textContent = `${rootNote.name}${octave}`;
    }
};

touch.onNoteModulate = (noteIndex, octave, relX, relY) => {
    const pitchBend = (0.5 - relY) * 2; // -1 to 1 semitones
    const timbre = relX; // 0 to 1

    pipeline.process({
        type: 'note_modulate',
        index: noteIndex,
        octave,
        pitchBend,
        timbre,
    });
};

touch.onNoteStop = (noteIndex, octave) => {
    pipeline.process({
        type: 'note_off',
        index: noteIndex,
        octave,
    });
    if (noteDisplay) noteDisplay.textContent = '';
};

// ─── Scale Controls ───────────────────────────────────────────────────────────

const updateLayout = () => {
    const notes = ScaleManager.generatePentatonicScale(currentRoot, currentScaleType, 4);
    renderer.updateLayout(notes, currentOctaves);
    pipeline.setScale(currentRoot, currentScaleType);
};

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

updateLayout();

// ─── Touch Prevention ─────────────────────────────────────────────────────────

document.addEventListener('touchmove', (e) => {
    if (e.target === canvas) e.preventDefault();
}, { passive: false });

// ─── Gesture Control ──────────────────────────────────────────────────────────

if (gestureToggleBtn && gesturePanel && gestureCloseBtn) {
    if (videoUpload) {
        videoUpload.addEventListener('change', (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file && gestureController) {
                gestureController.loadVideo(file);
            }
        });
    }

    gestureToggleBtn.addEventListener('click', async () => {
        if (gestureController) {
            // STOP — release all active voices
            activeFingerVoices.forEach((noteData, _voiceId) => {
                pipeline.process({ type: 'note_off', index: noteData.index, octave: noteData.octave });
            });
            activeFingerVoices.clear();
            gestureController.stop();
            gestureController = null;
            gesturePanel.classList.add('hidden');
            gestureToggleBtn.classList.remove('active');
        } else {
            // START
            gestureToggleBtn.classList.add('active');
            gesturePanel.classList.remove('hidden');

            try {
                gestureCanvas.width = 640;
                gestureCanvas.height = 480;
                gestureController = new GestureController(gestureVideo, gestureCanvas);
                await gestureController.initialize();

                gestureController.onGesture((event) => {
                    const voiceId = event.fingerId;

                    if (event.type === 'start') {
                        pipeline.process({
                            type: 'note_on',
                            index: event.noteIndex,
                            octave: event.octave,
                            velocity: 1.0,
                        });
                        activeFingerVoices.set(voiceId, { index: event.noteIndex, octave: event.octave });

                    } else if (event.type === 'stop') {
                        const noteData = activeFingerVoices.get(voiceId);
                        if (noteData) {
                            pipeline.process({ type: 'note_off', index: noteData.index, octave: noteData.octave });
                            activeFingerVoices.delete(voiceId);
                        }

                    } else if (event.type === 'modulate') {
                        const noteData = activeFingerVoices.get(voiceId);
                        if (noteData && event.pitchBend !== undefined && event.timbre !== undefined) {
                            pipeline.process({
                                type: 'note_modulate',
                                index: noteData.index,
                                octave: noteData.octave,
                                pitchBend: event.pitchBend,
                                timbre: event.timbre,
                                resonance: event.resonance || 0,
                            });
                        }
                    }
                });
            } catch (error) {
                console.error('Failed to initialize gesture control:', error);
                alert('Camera access required for gesture control. Please allow camera permissions.');
                gestureToggleBtn.classList.remove('active');
                return;
            }
        }
    });

    gestureCloseBtn.addEventListener('click', () => {
        gesturePanel.classList.add('hidden');
    });
}

console.log('PentaSynth v2.0 Initialized');
