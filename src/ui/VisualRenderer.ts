import { PentatonicNote } from '../audio/ScaleManager';

export interface NoteArea {
  index: number;
  octave: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  label: string;
  note: PentatonicNote;
}

export interface OctaveSettings {
  top: number;
  mid: number;
  bottom: number;
}

export interface PadCustomization {
  label: string;
  color: string;
}

export class VisualRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private noteAreas: NoteArea[] = [];
  private activeNotes: Set<string> = new Set();
  
  // Store state for resize recalculations
  private currentNotes: PentatonicNote[] = [];
  public currentOctaves: OctaveSettings | null = null;

  private readonly COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'
  ];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;
    
    // Listen for resize events
    window.addEventListener('resize', () => this.resize());
    
    // MutationObserver to catch layout changes that don't trigger window.resize
    const observer = new MutationObserver(() => this.resize());
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
  }

  private setupHighDPI() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    // Only update if dimensions actually changed to avoid loop
    const newWidth = Math.floor(rect.width * dpr);
    const newHeight = Math.floor(rect.height * dpr);
    
    if (this.canvas.width !== newWidth || this.canvas.height !== newHeight) {
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
    }
    
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  resize() {
    this.setupHighDPI();
    if (this.currentNotes.length > 0 && this.currentOctaves) {
        this.calculateNoteAreas();
    }
    this.render();
  }

  updateLayout(notes: PentatonicNote[], octaves: OctaveSettings, customizations: PadCustomization[]) {
    this.currentNotes = notes;
    this.currentOctaves = octaves;
    this.currentPadCustomizations = customizations;
    this.setupHighDPI();
    this.calculateNoteAreas();
    this.render();
  }

  private currentPadCustomizations: PadCustomization[] = [];

  private calculateNoteAreas() {
    if (!this.currentOctaves) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Handle cases where rect might be 0 temporarily
    if (width === 0 || height === 0) return;

    const noteWidth = width / this.currentNotes.length;

    const rows = [
        { pct: 0.25, val: this.currentOctaves.top },
        { pct: 0.5, val: this.currentOctaves.mid },
        { pct: 0.25, val: this.currentOctaves.bottom }
    ];

    this.noteAreas = [];
    
    this.currentNotes.forEach((note, noteIndex) => {
        const customization = this.currentPadCustomizations[noteIndex];
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
                color: customization?.color ?? this.COLORS[noteIndex % this.COLORS.length],
                label: customization?.label ?? `${note.name}${row.val}`,
                note: note
            });
            currentY += areaHeight;
        });
    });
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

    if (this.noteAreas.length === 0) return;

    this.noteAreas.forEach((area) => {
      const key = `${area.index}-${area.octave}`;
      const isActive = this.activeNotes.has(key);

      const midOctave = this.currentOctaves?.mid || 4;
      const brightnessShift = (area.octave === midOctave) ? 0 : (area.octave > midOctave ? 20 : -20);
      
      this.ctx.fillStyle = this.adjustBrightness(area.color, brightnessShift);
      this.ctx.fillRect(area.x, area.y, area.width, area.height);

      if (isActive) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fillRect(area.x, area.y, area.width, area.height);
      }

      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(area.x, area.y, area.width, area.height);

      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      const centerX = area.x + area.width / 2;
      const centerY = area.y + area.height / 2;

      const displayText = area.label || `${area.note.name}${area.octave}`;
      const showSubtitle = area.label && area.label !== `${area.note.name}${area.octave}`;
      this.ctx.font = area.height < 60 ? 'bold 12px Arial' : 'bold 20px Arial';

      if (showSubtitle) {
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.fillText(displayText, centerX, centerY - 10);
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        this.ctx.fillText(`${area.note.name}${area.octave}`, centerX, centerY + 10);
      } else {
        this.ctx.font = area.height < 60 ? 'bold 12px Arial' : 'bold 20px Arial';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillText(displayText, centerX + 1, centerY + 1);
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(displayText, centerX, centerY);
      }
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
    const area = this.getAreaAt(x, y);
    return area ? { index: area.index, octave: area.octave } : null;
  }

  getAreaAt(x: number, y: number): NoteArea | null {
    return this.noteAreas.find(a => 
      x >= a.x && x < a.x + a.width &&
      y >= a.y && y < a.y + a.height
    ) || null;
  }
}