import { VisualRenderer } from './VisualRenderer';

export type TouchCallback = (noteIndex: number, octave: number) => void;

interface ActiveTouch {
  index: number;
  octave: number;
}

export class TouchHandler {
  private canvas: HTMLCanvasElement;
  private renderer: VisualRenderer;
  private activeTouches: Map<number | string, ActiveTouch> = new Map(); // touchId -> ActiveTouch
  
  public onNoteStart?: TouchCallback;
  public onNoteStop?: TouchCallback;

  constructor(canvas: HTMLCanvasElement, renderer: VisualRenderer) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Touch Events
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this));

    // Mouse Events
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));

    // Keyboard Events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private keyMap: Record<string, number> = {
    'a': 0, 's': 1, 'd': 2, 'f': 3, 'g': 4,
    'A': 0, 'S': 1, 'D': 2, 'F': 3, 'G': 4
  };

  private activeKeys: Set<string> = new Set();

  private handleKeyDown(e: KeyboardEvent) {
    if (e.repeat) return;
    const noteIndex = this.keyMap[e.key];
    if (noteIndex !== undefined) {
      this.activeKeys.add(e.key);
      this.onNoteStart?.(noteIndex, 4); // Default to octave 4 for keyboard
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    const noteIndex = this.keyMap[e.key];
    if (noteIndex !== undefined) {
      this.activeKeys.delete(e.key);
      this.onNoteStop?.(noteIndex, 4);
    }
  }

  private getNote(clientX: number, clientY: number): ActiveTouch | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return this.renderer.getNoteAt(x, y);
  }

  // --- Touch Handlers ---

  private handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const result = this.getNote(touch.clientX, touch.clientY);
      
      if (result) {
        this.activeTouches.set(touch.identifier, result);
        this.onNoteStart?.(result.index, result.octave);
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
        if (oldTouch) {
          this.onNoteStop?.(oldTouch.index, oldTouch.octave);
        }
        this.activeTouches.set(touch.identifier, newTouch);
        this.onNoteStart?.(newTouch.index, newTouch.octave);
      } 
      else if (!newTouch && oldTouch) {
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

  // --- Mouse Handlers ---

  private handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return; // Only left click
    const result = this.getNote(e.clientX, e.clientY);
    if (result) {
      this.activeTouches.set('mouse', result);
      this.onNoteStart?.(result.index, result.octave);
    }
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.activeTouches.has('mouse')) return;

    const oldTouch = this.activeTouches.get('mouse') as ActiveTouch;
    const newTouch = this.getNote(e.clientX, e.clientY);

    if (newTouch && (newTouch.index !== oldTouch.index || newTouch.octave !== oldTouch.octave)) {
      this.onNoteStop?.(oldTouch.index, oldTouch.octave);
      this.activeTouches.set('mouse', newTouch);
      this.onNoteStart?.(newTouch.index, newTouch.octave);
    } else if (!newTouch) {
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