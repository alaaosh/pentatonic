import { VisualRenderer } from './VisualRenderer';

export type TouchCallback = (noteIndex: number) => void;

export class TouchHandler {
  private canvas: HTMLCanvasElement;
  private renderer: VisualRenderer;
  private activeTouches: Map<number | string, number> = new Map(); // touchId -> noteIndex
  
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
      this.onNoteStart?.(noteIndex);
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    const noteIndex = this.keyMap[e.key];
    if (noteIndex !== undefined) {
      this.activeKeys.delete(e.key);
      this.onNoteStop?.(noteIndex);
    }
  }

  private getNoteIndex(clientX: number, clientY: number): number {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return this.renderer.getNoteIndexAt(x, y);
  }

  // --- Touch Handlers ---

  private handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const noteIndex = this.getNoteIndex(touch.clientX, touch.clientY);
      
      if (noteIndex !== -1) {
        this.activeTouches.set(touch.identifier, noteIndex);
        this.onNoteStart?.(noteIndex);
      }
    }
  }

  private handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const oldNoteIndex = this.activeTouches.get(touch.identifier);
      const newNoteIndex = this.getNoteIndex(touch.clientX, touch.clientY);

      // If we moved to a new valid note
      if (newNoteIndex !== -1 && newNoteIndex !== oldNoteIndex) {
        // Stop old note if it existed
        if (oldNoteIndex !== undefined && oldNoteIndex !== -1) {
          this.onNoteStop?.(oldNoteIndex);
        }
        
        // Start new note
        this.activeTouches.set(touch.identifier, newNoteIndex);
        this.onNoteStart?.(newNoteIndex);
      } 
      // If we moved off the instrument completely
      else if (newNoteIndex === -1 && oldNoteIndex !== undefined) {
         this.onNoteStop?.(oldNoteIndex);
         this.activeTouches.delete(touch.identifier);
      }
    }
  }

  private handleTouchEnd(e: TouchEvent) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const noteIndex = this.activeTouches.get(touch.identifier);
      
      if (noteIndex !== undefined) {
        this.onNoteStop?.(noteIndex);
        this.activeTouches.delete(touch.identifier);
      }
    }
  }

  // --- Mouse Handlers ---

  private handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return; // Only left click
    const noteIndex = this.getNoteIndex(e.clientX, e.clientY);
    if (noteIndex !== -1) {
      this.activeTouches.set('mouse', noteIndex);
      this.onNoteStart?.(noteIndex);
    }
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.activeTouches.has('mouse')) return;

    const oldNoteIndex = this.activeTouches.get('mouse') as number;
    const newNoteIndex = this.getNoteIndex(e.clientX, e.clientY);

    if (newNoteIndex !== -1 && newNoteIndex !== oldNoteIndex) {
      this.onNoteStop?.(oldNoteIndex);
      this.activeTouches.set('mouse', newNoteIndex);
      this.onNoteStart?.(newNoteIndex);
    } else if (newNoteIndex === -1) {
      this.onNoteStop?.(oldNoteIndex);
      this.activeTouches.delete('mouse');
    }
  }

  private handleMouseUp(_e: MouseEvent) {
    const noteIndex = this.activeTouches.get('mouse') as number;
    if (noteIndex !== undefined) {
      this.onNoteStop?.(noteIndex);
      this.activeTouches.delete('mouse');
    }
  }
}
