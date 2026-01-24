import { PentatonicNote } from '../audio/ScaleManager';

export interface NoteArea {
  index: number;
  octave: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  note: PentatonicNote;
}

export interface OctaveSettings {
  top: number;
  mid: number;
  bottom: number;
}

export class VisualRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private noteAreas: NoteArea[] = [];
  private activeNotes: Set<string> = new Set(); // Using "index-octave" as key
  
  private readonly COLORS = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7'  // Yellow
  ];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private setupHighDPI() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  resize() {
    this.setupHighDPI();
    this.render();
  }

  updateLayout(notes: PentatonicNote[], octaves: OctaveSettings) {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const noteWidth = width / notes.length;

    // Mapping rows to specific octaves
    const rows = [
        { pct: 0.25, val: octaves.top },
        { pct: 0.5, val: octaves.mid },
        { pct: 0.25, val: octaves.bottom }
    ];

    this.noteAreas = [];
    
    notes.forEach((note, noteIndex) => {
        let currentY = 0;
        rows.forEach((row) => {
            const areaHeight = height * row.pct;
            this.noteAreas.push({
                index: noteIndex,
                octave: row.val,
                x: noteIndex * noteWidth,
                y: currentY,
                width: noteWidth,
                height: areaHeight,
                color: this.COLORS[noteIndex % this.COLORS.length],
                note: note
            });
            currentY += areaHeight;
        });
    });

    this.render();
  }

  setActive(noteIndex: number, octave: number, isActive: boolean) {
    const key = `${noteIndex}-${octave}`;
    if (isActive) {
      this.activeNotes.add(key);
    } else {
      this.activeNotes.delete(key);
    }
    this.render();
  }

  clearActive() {
    this.activeNotes.clear();
    this.render();
  }

  render() {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    this.ctx.clearRect(0, 0, width, height);

    this.noteAreas.forEach((area) => {
      const key = `${area.index}-${area.octave}`;
      const isActive = this.activeNotes.has(key);

      // Distinguish octaves visually: brightness relative to middle row
      // We assume middle row is at index 1 of the first column
      const midOctave = this.noteAreas[1]?.octave || 4;
      const brightnessShift = (area.octave === midOctave) ? 0 : (area.octave > midOctave ? 20 : -20);
      
      this.ctx.fillStyle = this.adjustBrightness(area.color, brightnessShift);
      this.ctx.fillRect(area.x, area.y, area.width, area.height);

      // Draw active highlight
      if (isActive) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fillRect(area.x, area.y, area.width, area.height);
      }

      // Draw border
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(area.x, area.y, area.width, area.height);

      // Draw Label
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      const centerX = area.x + area.width / 2;
      const centerY = area.y + area.height / 2;

      this.ctx.font = area.height < 60 ? 'bold 14px Arial' : 'bold 24px Arial';
      
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fillText(`${area.note.name}${area.octave}`, centerX + 1, centerY + 1);
      this.ctx.fillStyle = 'white';
      this.ctx.fillText(`${area.note.name}${area.octave}`, centerX, centerY);
    });
  }

  private adjustBrightness(hex: string, percent: number) {
    const num = parseInt(hex.replace('#', ''), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      G = (num >> 8 & 0x00FF) + amt,
      B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  getNoteAt(x: number, y: number): { index: number, octave: number } | null {
    const area = this.noteAreas.find(a => 
      x >= a.x && x < a.x + a.width &&
      y >= a.y && y < a.y + a.height
    );

    return area ? { index: area.index, octave: area.octave } : null;
  }
}
