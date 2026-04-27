import { ScaleManager, RootNote, ScaleType, HarmonyType, ChordType } from './audio/ScaleManager';
import { SynthesisEngine, Waveform } from './audio/SynthesisEngine';
import { VisualRenderer } from './ui/VisualRenderer';
import { TouchHandler } from './ui/TouchHandler';
import { MultiRangeSlider } from './ui/MultiRangeSlider';
import { DialWidget } from './ui/DialWidget';
import { VerticalSlider } from './ui/VerticalSlider';
import { KeypadManager } from './ui/KeypadManager';
import { GestureController } from './gesture/GestureController';
import { globalEvents, EventType, NoteOnEvent, NoteOffEvent, NoteModulateEvent } from './utils/EventProcessor';
import './styles.css';

// App State
let currentRoot: RootNote = 'C';
let currentScaleType: ScaleType = 'major';
let currentOctaves = { top: 5, mid: 4, bottom: 3 };
let currentHarmony: HarmonyType = 'chord';
let currentChordType: ChordType = 'maj7';

// DOM Elements
const canvas = document.getElementById('instrument') as HTMLCanvasElement;
const rootStrip = document.getElementById('root-strip');
const scaleSelect = document.getElementById('scale-select') as HTMLSelectElement;
const harmonyMode = document.getElementById('harmony-mode');
const chordTypeSelect = document.getElementById('chord-type') as HTMLSelectElement;
const waveformSelect = document.getElementById('waveform-select');
const noteDisplay = document.getElementById('note-display');
const bgColorStart = document.getElementById('bg-color-start') as HTMLInputElement;
const bgColorEnd = document.getElementById('bg-color-end') as HTMLInputElement;
const recordBtn = document.getElementById('record-btn') as HTMLButtonElement;
const unlockOverlay = document.getElementById('audio-unlock');
const startBtn = document.getElementById('start-btn');

// Keypad Name Elements
const keypadNameEl = document.getElementById('keypad-name');
const renameBtn = document.getElementById('rename-btn');
const renameInput = document.getElementById('rename-input') as HTMLInputElement;
const padCustomizationContainer = document.getElementById('pad-customization');

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

// Keypad Name Management
const keypadManager = new KeypadManager();
if (keypadNameEl) keypadNameEl.textContent = keypadManager.name;

const startRename = () => {
    if (!keypadNameEl || !renameInput) return;
    renameInput.value = keypadManager.name;
    keypadNameEl.classList.add('hidden');
    renameInput.classList.remove('hidden');
    renameInput.focus();
    renameInput.select();
};

const commitRename = () => {
    if (!keypadNameEl || !renameInput) return;
    keypadManager.rename(renameInput.value);
    keypadNameEl.textContent = keypadManager.name;
    renameInput.classList.add('hidden');
    keypadNameEl.classList.remove('hidden');
};

if (renameBtn) renameBtn.addEventListener('click', startRename);
if (keypadNameEl) keypadNameEl.addEventListener('dblclick', startRename);

if (renameInput) {
    renameInput.addEventListener('blur', commitRename);
    renameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') renameInput.blur();
        if (e.key === 'Escape') {
            renameInput.value = keypadManager.name;
            renameInput.blur();
        }
    });
}

const PAD_STORAGE_KEY = 'pentatonic-pad-customizations';

type PadCustomization = {
    label: string;
    color: string;
};

const DEFAULT_PAD_CUSTOMIZATION: PadCustomization[] = [
    { label: '', color: '#FF6B6B' },
    { label: '', color: '#4ECDC4' },
    { label: '', color: '#45B7D1' },
    { label: '', color: '#96CEB4' },
    { label: '', color: '#FFEAA7' }
];

let padCustomizations: PadCustomization[] = DEFAULT_PAD_CUSTOMIZATION;

const loadPadCustomizations = () => {
    try {
        const raw = window.localStorage.getItem(PAD_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as PadCustomization[];
            if (Array.isArray(parsed) && parsed.length === DEFAULT_PAD_CUSTOMIZATION.length) {
                padCustomizations = parsed.map((item, index) => ({
                    label: typeof item?.label === 'string' && item.label.trim().length > 0 ? item.label : DEFAULT_PAD_CUSTOMIZATION[index].label,
                    color: typeof item?.color === 'string' && item.color ? item.color : DEFAULT_PAD_CUSTOMIZATION[index].color
                }));
                return;
            }
        }
    } catch {
        // ignore invalid data
    }
    padCustomizations = [...DEFAULT_PAD_CUSTOMIZATION];
};

let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: BlobPart[] = [];

const createRecorder = async () => {
    if (!recordBtn) return null;
    await audio.resume();
    const stream = audio.getRecordingStream();
    if (stream.getAudioTracks().length === 0) return null;

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

    try {
        const recorder = new MediaRecorder(stream, { mimeType });
        recorder.addEventListener('dataavailable', (event) => {
            if (event.data && event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        });
        recorder.addEventListener('stop', () => {
            if (recordedChunks.length === 0) return;
            const blob = new Blob(recordedChunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'pentatonic-recording.webm';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            recordedChunks = [];
            if (recordBtn) {
                recordBtn.classList.remove('active');
                recordBtn.textContent = '●';
            }
            if (noteDisplay) {
                noteDisplay.textContent = 'Recording saved';
            }
        });
        return recorder;
    } catch (error) {
        console.warn('Recording is not supported in this browser', error);
        return null;
    }
};

const toggleRecording = async () => {
    if (!recordBtn) return;
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        return;
    }
    const recorder = await createRecorder();
    if (!recorder) {
        if (noteDisplay) noteDisplay.textContent = 'Recording unavailable';
        return;
    }
    mediaRecorder = recorder;
    recordedChunks = [];
    mediaRecorder.start();
    recordBtn.classList.add('active');
    recordBtn.textContent = '■';
    if (noteDisplay) noteDisplay.textContent = 'Recording...';
};

const savePadCustomizations = () => {
    try {
        window.localStorage.setItem(PAD_STORAGE_KEY, JSON.stringify(padCustomizations));
    } catch (error) {
        console.warn('Unable to persist pad customizations', error);
    }
};

const renderPadCustomizationControls = () => {
    if (!padCustomizationContainer) return;
    padCustomizationContainer.innerHTML = '';

    padCustomizations.forEach((settings, index) => {
        const row = document.createElement('div');
        row.className = 'pad-customization-row';

        const label = document.createElement('input');
        label.type = 'text';
        label.value = settings.label;
        label.placeholder = `Pad ${index + 1}`;
        label.setAttribute('aria-label', `Pad ${index + 1} name`);
        label.addEventListener('input', () => {
            padCustomizations[index].label = label.value;
            savePadCustomizations();
            updateLayout();
        });

        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = settings.color;
        colorInput.setAttribute('aria-label', `Pad ${index + 1} color`);
        colorInput.addEventListener('input', () => {
            padCustomizations[index].color = colorInput.value;
            savePadCustomizations();
            updateLayout();
        });

        row.appendChild(label);
        row.appendChild(colorInput);
        padCustomizationContainer.appendChild(row);
    });
};

const setBackgroundColors = (start: string, end: string) => {
    document.documentElement.style.setProperty('--bg-start', start);
    document.documentElement.style.setProperty('--bg-end', end);
    try {
        window.localStorage.setItem('pentatonicBgStart', start);
        window.localStorage.setItem('pentatonicBgEnd', end);
    } catch (error) {
        console.warn('Unable to persist background color settings', error);
    }
};

const initializeBackground = () => {
    const defaultStart = '#1e3c72';
    const defaultEnd = '#2a5298';
    const savedStart = window.localStorage.getItem('pentatonicBgStart');
    const savedEnd = window.localStorage.getItem('pentatonicBgEnd');
    const start = savedStart || defaultStart;
    const end = savedEnd || defaultEnd;
    setBackgroundColors(start, end);
    if (bgColorStart) bgColorStart.value = start;
    if (bgColorEnd) bgColorEnd.value = end;
};

if (bgColorStart) {
    bgColorStart.addEventListener('input', () => {
        setBackgroundColors(bgColorStart.value, bgColorEnd?.value ?? '#2a5298');
    });
}

if (bgColorEnd) {
    bgColorEnd.addEventListener('input', () => {
        setBackgroundColors(bgColorStart?.value ?? '#1e3c72', bgColorEnd.value);
    });
}

loadPadCustomizations();
renderPadCustomizationControls();
initializeBackground();

// Initialize Components
const renderer = new VisualRenderer(canvas);
const audio = new SynthesisEngine();
const touch = new TouchHandler(canvas, renderer);

// Gesture Controller (initialized on demand)
let gestureController: GestureController | null = null;
// Track which voices are active for which fingers to enable polyphony
const activeFingerVoices: Map<string, { index: number, octave: number }> = new Map();

// --- Widget Initializations ---

new VerticalSlider('volume-slider', 0.5, (v) => {
    audio.setVolume(v);
});

new MultiRangeSlider('octave-slider', currentOctaves, (newValues) => {
    currentOctaves = { ...newValues };
    updateLayout();
});

new DialWidget('dial-filter', {
    min: 100, max: 10000, step: 10, initialValue: 2000, label: 'Cutoff',
    onChange: (v) => audio.setFilter({ cutoff: v })
});

new DialWidget('dial-resonance', {
    min: 0, max: 20, step: 0.1, initialValue: 1, label: 'Res',
    onChange: (v) => audio.setFilter({ resonance: v })
});

new DialWidget('dial-attack', {
    min: 0.01, max: 2, step: 0.01, initialValue: 0.05, label: 'Atk',
    onChange: (v) => audio.setEnvelope({ attack: v })
});

new DialWidget('dial-decay', {
    min: 0.01, max: 2, step: 0.01, initialValue: 0.2, label: 'Dec',
    onChange: (v) => audio.setEnvelope({ decay: v })
});

new DialWidget('dial-sustain', {
    min: 0, max: 1, step: 0.01, initialValue: 0.3, label: 'Sus',
    onChange: (v) => audio.setEnvelope({ sustain: v })
});

new DialWidget('dial-release', {
    min: 0.1, max: 5, step: 0.1, initialValue: 1.0, label: 'Rel',
    onChange: (v) => audio.setEnvelope({ release: v })
});

// --- Audio Unlock Logic ---

const startApp = async () => {
    await audio.resume();
    unlockOverlay?.classList.add('hidden');
    console.log('Pentatonic Synth Started');
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
        if (noteDisplay) noteDisplay.textContent = `Playing: ${rootNote.name}${data.octave}`;
    }
    renderer.setActive(data.index, data.octave, true);
});

globalEvents.subscribe<NoteOffEvent>(EventType.NOTE_OFF, (data) => {
    const voiceId = `${data.index}-${data.octave}`;
    audio.stopNote(voiceId);
    renderer.setActive(data.index, data.octave, false);
});

globalEvents.subscribe<NoteModulateEvent>(EventType.NOTE_MODULATE, (data) => {
    const voiceId = `${data.index}-${data.octave}`;
    audio.modulateNote(voiceId, data.pitchBend, data.timbre);
});

// --- Input Handling -> Event Emission ---

touch.onNoteStart = (noteIndex, octave) => {
    const freq = ScaleManager.getFrequency(currentRoot, currentScaleType, noteIndex, octave);
    globalEvents.emit<NoteOnEvent>(EventType.NOTE_ON, {
        index: noteIndex, frequency: freq, velocity: 1.0, 
        harmonyType: currentHarmony, chordType: currentChordType, octave: octave
    });
};

touch.onNoteModulate = (noteIndex, octave, relX, relY) => {
    // relY: 0 (top) to 1 (bottom). Let's map center (0.5) to no bend.
    // 0.5 to 0 -> 0 to +1 semitone
    // 0.5 to 1 -> 0 to -1 semitone
    const pitchBend = (0.5 - relY) * 2; // Range -1 to 1 semitones
    
    // relX: 0 (left) to 1 (right). 
    const timbre = relX; // Range 0 to 1

    globalEvents.emit<NoteModulateEvent>(EventType.NOTE_MODULATE, {
        index: noteIndex, octave: octave, pitchBend, timbre
    });
};

touch.onNoteStop = (noteIndex, octave) => {
    globalEvents.emit<NoteOffEvent>(EventType.NOTE_OFF, { index: noteIndex, octave: octave });
};

// Helper to update the scale layout
const updateLayout = () => {
    const notes = ScaleManager.generatePentatonicScale(currentRoot, currentScaleType, 4);
    renderer.updateLayout(notes, currentOctaves, padCustomizations);
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

if (waveformSelect) {
    waveformSelect.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('.segment-btn');
        if (!btn) return;
        audio.setWaveform(btn.getAttribute('data-value') as Waveform);
        waveformSelect.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
}

updateLayout();

document.addEventListener('touchmove', (e) => {
    if (e.target === canvas) e.preventDefault();
}, { passive: false });

// --- Gesture Control Logic ---

if (gestureToggleBtn && gesturePanel && gestureCloseBtn) {
    // Handle File Upload
    if (videoUpload) {
        videoUpload.addEventListener('change', (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file && gestureController) {
                gestureController.loadVideo(file);
            }
        });
    }

    gestureToggleBtn.addEventListener('click', async () => {
        // Mode 1: If Controller is active, Toggle logic
        if (gestureController) {
            // If panel is hidden, show it. If panel is visible, STOP controller (Toggle OFF).
            // Wait, user said: "stopping... should be by clicking icon again".
            // And: "camera to keep working even if we dismiss the camera overlay".
            
            // Logic:
            // 1. If Controller Exists:
            //    - Click -> Stop Controller completely.
            // 2. If Controller doesn't exist:
            //    - Click -> Start Controller & Show Panel.
            
            // STOP Logic
            activeFingerVoices.forEach((noteData, voiceId) => {
                audio.stopNote(voiceId);
                renderer.setActive(noteData.index, noteData.octave, false);
            });
            activeFingerVoices.clear();
            gestureController.stop();
            gestureController = null;
            
            gesturePanel.classList.add('hidden');
            gestureToggleBtn.classList.remove('active'); // Visual feedback
            
        } else {
            // START Logic
            gestureToggleBtn.classList.add('active'); // Visual feedback
            gesturePanel.classList.remove('hidden');

            try {
                gestureCanvas.width = 640;
                gestureCanvas.height = 480;
                gestureController = new GestureController(gestureVideo, gestureCanvas);
                await gestureController.initialize();
                
                gestureController.onGesture((event) => {
                    const voiceId = event.fingerId; 

                    if (event.type === 'start') {
                        const notes = ScaleManager.generatePentatonicScale(currentRoot, currentScaleType, event.octave);
                        const rootNote = notes[event.noteIndex];
                        if (rootNote) {
                             const harmonyNotes = ScaleManager.generateHarmony(rootNote.name, currentHarmony, currentChordType);
                             const frequencies = harmonyNotes.map(n => ScaleManager.noteToFrequency(n.name, n.octave + (event.octave - 4)));
                             
                             audio.triggerNote(voiceId, frequencies, currentHarmony);
                             activeFingerVoices.set(voiceId, { index: event.noteIndex, octave: event.octave });
                             
                             renderer.setActive(event.noteIndex, event.octave, true);
                        }

                    } else if (event.type === 'stop') {
                        audio.stopNote(voiceId);
                        const noteData = activeFingerVoices.get(voiceId);
                        if (noteData) {
                            renderer.setActive(noteData.index, noteData.octave, false);
                            activeFingerVoices.delete(voiceId);
                        }

                    } else if (event.type === 'modulate') {
                        if (event.pitchBend !== undefined && event.timbre !== undefined) {
                            audio.modulateNote(
                                voiceId, 
                                event.pitchBend, 
                                event.timbre,
                                event.resonance || 0 // Pass resonance
                            ); 
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
        // Just hide the panel, keep controller running
        gesturePanel.classList.add('hidden');
    });
}

console.log('Pentatonic Synth Initialized');