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
  type: 'release';
}

interface ActiveCursor {
    index: number;
    octave: number;
    x: number;
    y: number;
    startTime: number;
    color: string;
}

export class VisualRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private noteAreas: NoteArea[] = [];
  private activeNotes: Set<string> = new Set();
  
  private activeCursors: Map<string, ActiveCursor> = new Map();
  private rippleEffects: RippleEffect[] = [];
  
  // Store state for resize recalculations
  private currentNotes: PentatonicNote[] = [];
  public currentOctaves: OctaveSettings | null = null;
  
  // Spectrum Data
  private onRender: (() => void) | null = null;

  private readonly COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'
  ];

  constructor(canvas: HTMLCanvasElement, onRender?: () => void) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency on canvas itself
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;
    this.onRender = onRender || null;
    
    // Listen for resize events
    window.addEventListener('resize', () => this.resize());
    
    // MutationObserver to catch layout changes that don't trigger window.resize
    const observer = new MutationObserver(() => this.resize());
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    
    // Start animation loop
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
  }

  updateLayout(notes: PentatonicNote[], octaves: OctaveSettings) {
    this.currentNotes = notes;
    this.currentOctaves = octaves;
    this.setupHighDPI();
    this.calculateNoteAreas();
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
      
      // Ensure cursor exists (active from start of note)
      if (!this.activeCursors.has(key)) {
          const area = this.noteAreas.find(a => a.index === noteIndex && a.octave === octave);
          if (area) {
             const cx = area.x + area.width / 2;
             const cy = area.y + area.height / 2;
             this.activeCursors.set(key, {
                 index: noteIndex,
                 octave: octave,
                 x: cx,
                 y: cy,
                 startTime: Date.now(),
                 color: area.color
             });
          }
      }
    } else {
      this.activeNotes.delete(key);
      // Note released: Trigger "End Ripple"
      this.triggerReleaseRipple(key);
    }
  }

  clearActive() {
    this.activeNotes.clear();
    // Clear cursors too? Maybe not, or trigger all releases.
    this.activeCursors.forEach((_, key) => this.triggerReleaseRipple(key));
  }
  
  private triggerReleaseRipple(key: string) {
      const cursor = this.activeCursors.get(key);
      if (cursor) {
          const duration = Date.now() - cursor.startTime;
          // Scale maxRadius based on duration (short tap = small ripple, long press = big ripple)
          // Clamp duration effect between 100ms and 1000ms
          const normalizedDuration = Math.min(Math.max(duration, 100), 1000) / 1000; 
          // Size range: 20px to 100px
          const size = 20 + (normalizedDuration * 80);
          
          this.addRippleEffect(cursor.x, cursor.y, size, cursor.color);
          this.activeCursors.delete(key);
      }
  }

  /**
   * Main Render Loop
   */
  private animate() {
    if (this.onRender) {
        this.onRender();
    }
    
    this.updateRipples();
    this.render();
    requestAnimationFrame(() => this.animate());
  }

  render() {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // 1. Clear & Background
    this.ctx.clearRect(0, 0, width, height);
    
    // Fill background with dark gradient to match theme
    // We make it semi-transparent so the background spectrum shows through
    const bgGradient = this.ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, 'rgba(26, 26, 46, 0.8)');
    bgGradient.addColorStop(1, 'rgba(22, 33, 62, 0.8)');
    this.ctx.fillStyle = bgGradient;
    this.ctx.fillRect(0, 0, width, height);

    if (this.noteAreas.length === 0) return;

    // 3. Draw Note Areas (Semi-transparent)
    this.noteAreas.forEach((area) => {
      const key = `${area.index}-${area.octave}`;
      const isActive = this.activeNotes.has(key);

      const midOctave = this.currentOctaves?.mid || 4;
      const brightnessShift = (area.octave === midOctave) ? 0 : (area.octave > midOctave ? 20 : -20);
      
      const baseColor = this.adjustBrightness(area.color, brightnessShift);
      
      // Use alpha for transparency
      this.ctx.globalAlpha = isActive ? 0.9 : 0.6;
      this.ctx.fillStyle = baseColor;
      this.ctx.fillRect(area.x, area.y, area.width, area.height);
      this.ctx.globalAlpha = 1.0;

      if (isActive) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(area.x, area.y, area.width, area.height);
      }

      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(area.x, area.y, area.width, area.height);

      // Text labels
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      const centerX = area.x + area.width / 2;
      const centerY = area.y + area.height / 2;

      this.ctx.font = area.height < 60 ? 'bold 12px Arial' : 'bold 20px Arial';
      
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillText(`${area.note.name}${area.octave}`, centerX + 1, centerY + 1);
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.ctx.fillText(`${area.note.name}${area.octave}`, centerX, centerY);
    });
    
    // 4. Draw Active Cursors
    this.drawActiveCursors();
    
    // 5. Draw Release Ripples
    this.drawRipples();
  }
  
  private drawActiveCursors() {
      this.activeCursors.forEach(cursor => {
          this.ctx.save();
          this.ctx.shadowBlur = 20;
          this.ctx.shadowColor = 'white';
          
          // Outer glow ring
          this.ctx.beginPath();
          this.ctx.arc(cursor.x, cursor.y, 25, 0, Math.PI * 2);
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
          
          // Inner core
          this.ctx.beginPath();
          this.ctx.arc(cursor.x, cursor.y, 10, 0, Math.PI * 2);
          this.ctx.fillStyle = 'white';
          this.ctx.fill();
          
          this.ctx.restore();
      });
  }
  
  private drawRipples() {
    this.rippleEffects.forEach(ripple => {
      this.ctx.save();
      
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = ripple.color;
      
      this.ctx.beginPath();
      this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = ripple.color;
      this.ctx.lineWidth = 3;
      this.ctx.globalAlpha = ripple.opacity;
      this.ctx.stroke();
      
      this.ctx.restore();
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

  addRippleEffect(x: number, y: number, maxRadius: number, color: string) {
      const ripple: RippleEffect = {
        id: `${Date.now()}-${Math.random()}`,
        x: x,
        y: y,
        radius: 10,
        maxRadius: maxRadius,
        opacity: 0.8,
        color: color,
        createdAt: Date.now(),
        type: 'release'
      };
      this.rippleEffects.push(ripple);
  }

  private updateRipples() {
    const now = Date.now();
    this.rippleEffects = this.rippleEffects.filter(ripple => {
      const age = now - ripple.createdAt;
      const progress = Math.min(age / 500, 1); // 0.5s fade out (quick)
      
      if (progress >= 1) return false;
      
      // Easing out
      const ease = 1 - Math.pow(1 - progress, 3);
      
      ripple.radius = 10 + (ripple.maxRadius - 10) * ease;
      ripple.opacity = 0.8 * (1 - progress);
      
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

  handleModulation(index: number, octave: number, x: number, y: number, _pitchBend: number, _timbre: number) {
    const key = `${index}-${octave}`;
    let cursor = this.activeCursors.get(key);
    
    if (!cursor) {
        // Create new cursor
        // Find color
        const area = this.noteAreas.find(a => a.index === index && a.octave === octave);
        const color = area ? area.color : '#ffffff';
        
        cursor = {
            index, octave, x, y, startTime: Date.now(), color
        };
        this.activeCursors.set(key, cursor);
    } else {
        // Update existing
        cursor.x = x;
        cursor.y = y;
    }
  }
}
