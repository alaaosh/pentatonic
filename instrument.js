class PentatonicInstrument {
    constructor() {
        this.canvas = document.getElementById('instrument');
        this.ctx = this.canvas.getContext('2d');
        this.audioEngine = new AudioEngine();
        
        this.currentKey = 'C';
        this.harmonyType = 'chord';
        this.pentatonicNotes = [];
        this.noteAreas = [];
        
        this.setupEventListeners();
        this.setupControls();
        this.updatePentatonicScale();
        this.draw();
    }

    // Define pentatonic scales for different keys
    getPentatonicScale(key) {
        const scales = {
            'C': ['C', 'D', 'E', 'G', 'A'],
            'G': ['G', 'A', 'B', 'D', 'E'],
            'D': ['D', 'E', 'F#', 'A', 'B'],
            'A': ['A', 'B', 'C#', 'E', 'F#'],
            'E': ['E', 'F#', 'G#', 'B', 'C#'],
            'F': ['F', 'G', 'A', 'C', 'D']
        };
        return scales[key] || scales['C'];
    }

    // Generate complex harmonies for each pentatonic note
    generateHarmony(rootNote, harmonyType) {
        const chordProgressions = {
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

        // Default harmonies for notes not explicitly defined
        const defaultHarmony = {
            chord: [
                { name: rootNote, octave: 4, type: 'root' },
                { name: rootNote, octave: 5, type: 'octave' }
            ],
            power: [
                { name: rootNote, octave: 4, type: 'root' },
                { name: rootNote, octave: 5, type: 'octave' }
            ]
        };

        const harmony = chordProgressions[rootNote] || defaultHarmony;
        return harmony[harmonyType] || harmony.chord;
    }

    updatePentatonicScale() {
        this.pentatonicNotes = this.getPentatonicScale(this.currentKey);
        this.calculateNoteAreas();
    }

    calculateNoteAreas() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const noteWidth = width / this.pentatonicNotes.length;
        
        this.noteAreas = this.pentatonicNotes.map((note, index) => ({
            note: note,
            x: index * noteWidth,
            y: 0,
            width: noteWidth,
            height: height,
            color: this.getNoteColor(index)
        }));
    }

    getNoteColor(index) {
        const colors = [
            '#FF6B6B', // Red
            '#4ECDC4', // Teal
            '#45B7D1', // Blue
            '#96CEB4', // Green
            '#FFEAA7'  // Yellow
        ];
        return colors[index % colors.length];
    }

    setupEventListeners() {
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouch(e.touches[0]);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouch(e.touches[0]);
        });

        // Mouse events for desktop
        this.canvas.addEventListener('mousedown', (e) => {
            this.handleTouch(e);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (e.buttons === 1) { // Left mouse button pressed
                this.handleTouch(e);
            }
        });
    }

    setupControls() {
        const keySelect = document.getElementById('key-select');
        const harmonySelect = document.getElementById('harmony-type');
        const volumeSlider = document.getElementById('volume');

        keySelect.addEventListener('change', (e) => {
            this.currentKey = e.target.value;
            this.updatePentatonicScale();
            this.draw();
        });

        harmonySelect.addEventListener('change', (e) => {
            this.harmonyType = e.target.value;
        });

        volumeSlider.addEventListener('input', (e) => {
            this.audioEngine.setVolume(e.target.value);
        });

        // Initialize audio on first user interaction
        document.addEventListener('click', () => {
            this.audioEngine.initialize();
        }, { once: true });

        document.addEventListener('touchstart', () => {
            this.audioEngine.initialize();
        }, { once: true });
    }

    handleTouch(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Scale coordinates if canvas is scaled
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const scaledX = x * scaleX;
        const scaledY = y * scaleY;

        const noteArea = this.noteAreas.find(area => 
            scaledX >= area.x && scaledX <= area.x + area.width &&
            scaledY >= area.y && scaledY <= area.y + area.height
        );

        if (noteArea) {
            this.playNote(noteArea.note);
            this.highlightNote(noteArea);
        }
    }

    playNote(note) {
        const harmony = this.generateHarmony(note, this.harmonyType);
        this.audioEngine.playChord(harmony, this.harmonyType);
        
        // Update display
        const display = document.getElementById('note-display');
        display.textContent = `Playing: ${note} ${this.harmonyType}`;
        
        setTimeout(() => {
            display.textContent = 'Touch to play';
        }, 1500);
    }

    highlightNote(noteArea) {
        this.draw();
        
        // Draw highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(noteArea.x, noteArea.y, noteArea.width, noteArea.height);
        
        setTimeout(() => {
            this.draw();
        }, 200);
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw note areas
        this.noteAreas.forEach((area, index) => {
            // Main note area
            this.ctx.fillStyle = area.color;
            this.ctx.fillRect(area.x, area.y, area.width, area.height);

            // Border
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(area.x, area.y, area.width, area.height);

            // Note label
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const centerX = area.x + area.width / 2;
            const centerY = area.y + area.height / 2;
            
            // Text shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillText(area.note, centerX + 2, centerY + 2);
            
            // Main text
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(area.note, centerX, centerY);
        });
    }
}

// Initialize the instrument when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PentatonicInstrument();
});