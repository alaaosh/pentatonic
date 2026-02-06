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

export interface RippleEffect {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
  createdAt: number;
  type: 'pitch' | 'timbre';
}

export class VisualRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private noteAreas: NoteArea[] = [];
  private activeNotes: Set<string> = new Set();
  private rippleEffects: RippleEffect[] = [];
  
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
    
    // Start animation loop for ripple effects
    this.animate();
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

  updateLayout(notes: PentatonicNote[], octaves: OctaveSettings) {
    this.currentNotes = notes;
    this.currentOctaves = octaves;
    this.setupHighDPI();
    this.calculateNoteAreas();
    this.render();
  }

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

      this.ctx.font = area.height < 60 ? 'bold 12px Arial' : 'bold 20px Arial';
      
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fillText(`${area.note.name}${area.octave}`, centerX + 1, centerY + 1);
      this.ctx.fillStyle = 'white';
      this.ctx.fillText(`${area.note.name}${area.octave}`, centerX, centerY);
    });
    
    // Render ripple effects
    this.rippleEffects.forEach(ripple => {
      this.ctx.beginPath();
      this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = ripple.color;
      this.ctx.lineWidth = 2;
      this.ctx.globalAlpha = ripple.opacity;
      this.ctx.stroke();
      this.ctx.globalAlpha = 1.0;
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

  /**
   * Add a ripple effect at a specific position
   */
  addRippleEffect(x: number, y: number, type: 'pitch' | 'timbre', intensity: number, color: string) {
    const rect = this.canvas.getBoundingClientRect();
    const area = this.getAreaAt(x, y);
    
    if (area) {
      // Create a ripple effect for the note area
      const ripple: RippleEffect = {
        id: `${Date.now()}-${Math.random()}`,
        x: area.x + area.width / 2,
        y: area.y + area.height / 2,
        radius: 5,
        maxRadius: 30 + intensity * 50, // Scale with intensity
        opacity: 0.7,
        color: color,
        createdAt: Date.now(),
        type: type
      };
      
      this.rippleEffects.push(ripple);
    }
  }

  /**
   * Animation loop for ripple effects
   */
  private animate() {
    this.updateRipples();
    this.render();
    requestAnimationFrame(() => this.animate());
  }

  /**
   * Update and render ripple effects
   */
  private updateRipples() {
    const now = Date.now();
    
    // Update ripple effects
    this.rippleEffects = this.rippleEffects.filter(ripple => {
      const age = now - ripple.createdAt;
      const progress = Math.min(age / 1000, 1); // 1 second duration
      
      if (progress >= 1) return false; // Remove expired ripples
      
      // Update ripple properties
      ripple.radius = 5 + (ripple.maxRadius - 5) * progress;
      ripple.opacity = 0.7 * (1 - progress);
      
      return true;
    });
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

  /**
   * Handle modulation events to create visual feedback
   */
  handleModulation(x: number, y: number, pitchBend: number, timbre: number) {
    const area = this.getAreaAt(x, y);
    if (!area) return;
    
    // Map pitch bend to visual effect (range -1 to 1)
    const pitchIntensity = Math.abs(pitchBend);
    const timbreIntensity = timbre;
    
    // Add pitch bend ripple (blue-ish color)
    if (Math.abs(pitchBend) > 0.05) { // Only show if significant
      this.addRippleEffect(x, y, 'pitch', pitchIntensity, '#45B7D1');
    }
    
    // Add timbre ripple (green-ish color)
    if (timbre > 0.1) { // Only show if significant
      this.addRippleEffect(x, y, 'timbre', timbreIntensity, '#96CEB4');
    }
  }
  
  /**
   * Draw FFT spectrum visualization in the background
   */
  drawSpectrum(dataArray: Uint8Array, bufferLength: number) {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Draw spectrum at the bottom of the canvas with low opacity
    this.ctx.globalAlpha = 0.3;
    this.ctx.fillStyle = 'rgba(70, 130, 180, 0.3)';
    
    const barWidth = (width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] * height / 255;
      
      this.ctx.fillStyle = `rgba(${Math.min(255, dataArray[i])}, ${Math.min(255, dataArray[i] * 0.8)}, ${Math.min(255, 255 - dataArray[i])}, 0.3)`;
      this.ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      
      x += barWidth + 1;
    }
    
    this.ctx.globalAlpha = 1.0;
  }
}