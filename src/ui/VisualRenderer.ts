import { PentatonicNote } from '../audio/ScaleManager';

export interface NoteArea {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  note: PentatonicNote;
}

export class VisualRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private noteAreas: NoteArea[] = [];
  private activeNotes: Set<number> = new Set();
  
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
    
    // Handle high DPI displays
    this.setupHighDPI();
    
    // Initial resize
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private setupHighDPI() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.style.width = this.canvas.width + 'px';
    this.canvas.style.height = this.canvas.height + 'px';
    this.canvas.width = this.canvas.width * dpr;
    this.canvas.height = this.canvas.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  resize() {
    // Get parent container dimensions or fallback to window
    const container = this.canvas.parentElement;
    if (container) {
      // We want the canvas to fit the container or have a fixed aspect ratio
      // For now, let's just match the container's width and set a fixed height or aspect ratio
      // But looking at legacy code, it seemed to rely on CSS. 
      // Let's rely on the CSS sizing and just update the internal resolution.
      
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      
      this.ctx.scale(dpr, dpr);
      
      // Re-calculate areas if we have notes
      if (this.noteAreas.length > 0) {
        // We need the original notes to recalculate. 
        // This is a bit tricky since we only stored NoteAreas.
        // We'll rely on the consumer calling updateLayout again or we store the notes.
        // Ideally, updateLayout is called after resize.
      }
    }
  }

  updateLayout(notes: PentatonicNote[]) {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const noteWidth = width / notes.length;

    this.noteAreas = notes.map((note, index) => ({
      index,
      note,
      x: index * noteWidth,
      y: 0,
      width: noteWidth,
      height: height,
      color: this.COLORS[index % this.COLORS.length]
    }));

    this.render();
  }

  setActive(noteIndex: number, isActive: boolean) {
    if (isActive) {
      this.activeNotes.add(noteIndex);
    } else {
      this.activeNotes.delete(noteIndex);
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

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    this.noteAreas.forEach(area => {
      // Draw background
      this.ctx.fillStyle = area.color;
      this.ctx.fillRect(area.x, area.y, area.width, area.height);

      // Draw active highlight
      if (this.activeNotes.has(area.index)) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(area.x, area.y, area.width, area.height);
      }

      // Draw border
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(area.x, area.y, area.width, area.height);

      // Draw Text
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      const centerX = area.x + area.width / 2;
      const centerY = area.y + area.height / 2;

      // Note Name
      this.ctx.font = 'bold 48px Arial';
      
      // Shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillText(area.note.name, centerX + 2, centerY + 2);
      
      // Main text
      this.ctx.fillStyle = 'white';
      this.ctx.fillText(area.note.name, centerX, centerY);
    });
  }

  // Helper for TouchHandler to hit-test
  getNoteIndexAt(x: number, _y: number): number {
    // Simple column-based hit testing since y is always full height
    // normalized x (0-1) would be easier, but let's map pixels.
    // We assume the caller gives us coordinates relative to the canvas client rect.
    
    // Find the area
    const area = this.noteAreas.find(a => 
      x >= a.x && x < a.x + a.width
    );

    return area ? area.index : -1;
  }
}
