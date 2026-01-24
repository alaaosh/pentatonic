export interface SliderValues {
  top: number;
  mid: number;
  bottom: number;
}

export class MultiRangeSlider {
  private container: HTMLElement;
  private handles: Map<string, HTMLElement> = new Map();
  private values: SliderValues;
  private min: number = 1;
  private max: number = 8;
  private onChange: (values: SliderValues) => void;

  private activeHandle: HTMLElement | null = null;

  constructor(containerId: string, initialValues: SliderValues, onChange: (values: SliderValues) => void) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Slider container ${containerId} not found`);
    this.container = el;
    this.values = { ...initialValues };
    this.onChange = onChange;

    // Initialize handles
    this.container.querySelectorAll('.slider-handle').forEach(h => {
      const key = h.getAttribute('data-key');
      if (key) {
        this.handles.set(key, h as HTMLElement);
      }
    });

    this.setupEventListeners();
    this.updateHandlePositions();
  }

  private setupEventListeners() {
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));

    // Touch support
    this.container.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    window.addEventListener('touchend', this.onMouseUp.bind(this));
  }

  private updateHandlePositions() {
    this.handles.forEach((handle, key) => {
      const val = (this.values as any)[key];
      const percent = ((val - this.min) / (this.max - this.min)) * 100;
      handle.style.left = `${percent}%`;
    });
  }

  private getValueFromX(clientX: number): number {
    const rect = this.container.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = x / rect.width;
    const rawVal = this.min + percent * (this.max - this.min);
    return Math.round(rawVal);
  }

  private onMouseDown(e: MouseEvent) {
    const handle = (e.target as HTMLElement).closest('.slider-handle') as HTMLElement;
    if (handle) {
      this.activeHandle = handle;
      e.preventDefault();
    }
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.activeHandle) return;
    this.handleMove(e.clientX);
  }

  private onTouchStart(e: TouchEvent) {
    const handle = (e.target as HTMLElement).closest('.slider-handle') as HTMLElement;
    if (handle) {
      this.activeHandle = handle;
      e.preventDefault();
    }
  }

  private onTouchMove(e: TouchEvent) {
    if (!this.activeHandle) return;
    this.handleMove(e.touches[0].clientX);
    e.preventDefault();
  }

  private handleMove(clientX: number) {
    const key = this.activeHandle!.getAttribute('data-key') as keyof SliderValues;
    const newVal = this.getValueFromX(clientX);
    
    if (this.values[key] !== newVal) {
      this.values[key] = newVal;
      this.updateHandlePositions();
      this.onChange(this.values);
    }
  }

  private onMouseUp() {
    this.activeHandle = null;
  }
}
