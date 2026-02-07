import { VisualRenderer } from './VisualRenderer';

export type TouchCallback = (noteIndex: number, octave: number) => void;
export type ModulateCallback = (noteIndex: number, octave: number, relX: number, relY: number, x: number, y: number) => void;

interface ActiveTouch {
  index: number;
  octave: number;
  relX: number;
  relY: number;
  x: number;
  y: number;
}

export class TouchHandler {
  private canvas: HTMLCanvasElement;
  private renderer: VisualRenderer;
  private activeTouches: Map<number | string, ActiveTouch> = new Map();
  
  public onNoteStart?: TouchCallback;
  public onNoteStop?: TouchCallback;
  public onNoteModulate?: ModulateCallback;

  constructor(canvas: HTMLCanvasElement, renderer: VisualRenderer) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this));
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private keyMap: Record<string, { index: number, row: number }> = {
    'q': { index: 0, row: 0 }, 'w': { index: 1, row: 0 }, 'e': { index: 2, row: 0 }, 'r': { index: 3, row: 0 }, 't': { index: 4, row: 0 },
    'a': { index: 0, row: 1 }, 's': { index: 1, row: 1 }, 'd': { index: 2, row: 1 }, 'f': { index: 3, row: 1 }, 'g': { index: 4, row: 1 },
    'z': { index: 0, row: 2 }, 'x': { index: 1, row: 2 }, 'c': { index: 2, row: 2 }, 'v': { index: 3, row: 2 }, 'b': { index: 4, row: 2 },
    // Caps support
    'Q': { index: 0, row: 0 }, 'W': { index: 1, row: 0 }, 'E': { index: 2, row: 0 }, 'R': { index: 3, row: 0 }, 'T': { index: 4, row: 0 },
    'A': { index: 0, row: 1 }, 'S': { index: 1, row: 1 }, 'D': { index: 2, row: 1 }, 'F': { index: 3, row: 1 }, 'G': { index: 4, row: 1 },
    'Z': { index: 0, row: 2 }, 'X': { index: 1, row: 2 }, 'C': { index: 2, row: 2 }, 'V': { index: 3, row: 2 }, 'B': { index: 4, row: 2 }
  };

  private activeKeys: Set<string> = new Set();

  private getOctaveFromRow(row: number): number {
    const octaves = this.renderer.currentOctaves;
    if (!octaves) return 4;
    if (row === 0) return octaves.top;
    if (row === 1) return octaves.mid;
    return octaves.bottom;
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.repeat) return;
    const mapping = this.keyMap[e.key];
    if (mapping !== undefined) {
      this.activeKeys.add(e.key);
      const octave = this.getOctaveFromRow(mapping.row);
      this.onNoteStart?.(mapping.index, octave);
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    const mapping = this.keyMap[e.key];
    if (mapping !== undefined) {
      this.activeKeys.delete(e.key);
      const octave = this.getOctaveFromRow(mapping.row);
      this.onNoteStop?.(mapping.index, octave);
    }
  }

  private getNote(clientX: number, clientY: number): ActiveTouch | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Find the note area and calculate relative position (0-1)
    const area = this.renderer.getAreaAt(x, y);
    if (area) {
        return {
            index: area.index,
            octave: area.octave,
            relX: (x - area.x) / area.width,
            relY: (y - area.y) / area.height,
            x: x,
            y: y
        };
    }
    return null;
  }

  private handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const result = this.getNote(touch.clientX, touch.clientY);
      if (result) {
        this.activeTouches.set(touch.identifier, result);
        this.onNoteStart?.(result.index, result.octave);
        this.onNoteModulate?.(result.index, result.octave, result.relX, result.relY, result.x, result.y);
      }
    }
  }

  private handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const oldTouch = this.activeTouches.get(touch.identifier);
      const newTouch = this.getNote(touch.clientX, touch.clientY);

      if (newTouch && (!oldTouch || newTouch.index !== oldTouch.index || newTouch.octave !== oldTouch.octave)) {
        if (oldTouch) this.onNoteStop?.(oldTouch.index, oldTouch.octave);
        this.activeTouches.set(touch.identifier, newTouch);
        this.onNoteStart?.(newTouch.index, newTouch.octave);
        this.onNoteModulate?.(newTouch.index, newTouch.octave, newTouch.relX, newTouch.relY, newTouch.x, newTouch.y);
      } else if (newTouch && oldTouch) {
        // Same note, just modulate
        this.activeTouches.set(touch.identifier, newTouch);
        this.onNoteModulate?.(newTouch.index, newTouch.octave, newTouch.relX, newTouch.relY, newTouch.x, newTouch.y);
      } else if (!newTouch && oldTouch) {
         this.onNoteStop?.(oldTouch.index, oldTouch.octave);
         this.activeTouches.delete(touch.identifier);
      }
    }
  }

  private handleTouchEnd(e: TouchEvent) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const oldTouch = this.activeTouches.get(touch.identifier);
      if (oldTouch) {
        this.onNoteStop?.(oldTouch.index, oldTouch.octave);
        this.activeTouches.delete(touch.identifier);
      }
    }
  }

  private handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    const result = this.getNote(e.clientX, e.clientY);
    if (result) {
      this.activeTouches.set('mouse', result);
      this.onNoteStart?.(result.index, result.octave);
      this.onNoteModulate?.(result.index, result.octave, result.relX, result.relY, result.x, result.y);
    }
  }

  private handleMouseMove(e: MouseEvent) {
    const isDown = this.activeTouches.has('mouse');
    if (!isDown) return;

    const oldTouch = this.activeTouches.get('mouse') as ActiveTouch;
    const newTouch = this.getNote(e.clientX, e.clientY);

    if (newTouch && (newTouch.index !== oldTouch.index || newTouch.octave !== oldTouch.octave)) {
      this.onNoteStop?.(oldTouch.index, oldTouch.octave);
      this.activeTouches.set('mouse', newTouch);
      this.onNoteStart?.(newTouch.index, newTouch.octave);
      this.onNoteModulate?.(newTouch.index, newTouch.octave, newTouch.relX, newTouch.relY, newTouch.x, newTouch.y);
    } else if (newTouch) {
      this.activeTouches.set('mouse', newTouch);
      this.onNoteModulate?.(newTouch.index, newTouch.octave, newTouch.relX, newTouch.relY, newTouch.x, newTouch.y);
    } else {
      this.onNoteStop?.(oldTouch.index, oldTouch.octave);
      this.activeTouches.delete('mouse');
    }
  }

  private handleMouseUp(_e: MouseEvent) {
    const oldTouch = this.activeTouches.get('mouse');
    if (oldTouch) {
      this.onNoteStop?.(oldTouch.index, oldTouch.octave);
      this.activeTouches.delete('mouse');
    }
  }
}
