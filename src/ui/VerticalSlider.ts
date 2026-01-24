export class VerticalSlider {
  private container: HTMLElement;
  private handle: HTMLElement;
  private fill: HTMLElement;
  
  private value: number; // 0 to 1
  private onChange: (val: number) => void;

  private isDragging = false;

  constructor(containerId: string, initialValue: number, onChange: (val: number) => void) {
    const parent = document.getElementById(containerId);
    if (!parent) throw new Error(`Container ${containerId} not found`);
    this.container = parent;
    
    this.handle = this.container.querySelector('.slider-handle-v') as HTMLElement;
    this.fill = this.container.querySelector('.slider-fill') as HTMLElement;
    
    this.value = initialValue;
    this.onChange = onChange;

    this.container.setAttribute('tabindex', '0');
    this.container.setAttribute('role', 'slider');
    this.container.setAttribute('aria-label', 'Volume');
    this.container.setAttribute('aria-valuemin', '0');
    this.container.setAttribute('aria-valuemax', '1');

    this.setupEventListeners();
    this.updateVisuals();
  }

  private setupEventListeners() {
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));

    this.container.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    window.addEventListener('touchend', this.onMouseUp.bind(this));

    this.container.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  private onKeyDown(e: KeyboardEvent) {
    let newVal = this.value;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      newVal += 0.05;
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      newVal -= 0.05;
    } else if (e.key === 'PageUp') {
      newVal += 0.2;
    } else if (e.key === 'PageDown') {
      newVal -= 0.2;
    } else if (e.key === 'Home') {
      newVal = 0;
    } else if (e.key === 'End') {
      newVal = 1;
    } else {
      return;
    }

    e.preventDefault();
    newVal = Math.max(0, Math.min(1, newVal));
    if (this.value !== newVal) {
      this.value = newVal;
      this.updateVisuals();
      this.onChange(this.value);
    }
  }

  private onMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.handleMove(e.clientY);
    e.preventDefault();
  }

  private onTouchStart(e: TouchEvent) {
    this.isDragging = true;
    this.handleMove(e.touches[0].clientY);
    e.preventDefault();
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;
    this.handleMove(e.clientY);
  }

  private onTouchMove(e: TouchEvent) {
    if (!this.isDragging) return;
    this.handleMove(e.touches[0].clientY);
  }

  private handleMove(clientY: number) {
    const rect = this.container.getBoundingClientRect();
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
    
    // Invert because Y is top-down but we want bottom-up (0-1)
    const newVal = 1 - (y / rect.height);

    if (this.value !== newVal) {
      this.value = newVal;
      this.updateVisuals();
      this.onChange(this.value);
    }
  }

  private onMouseUp() {
    this.isDragging = false;
  }

  private updateVisuals() {
    const percent = this.value * 100;
    this.handle.style.top = `${100 - percent}%`;
    this.fill.style.height = `${percent}%`;
    this.container.setAttribute('aria-valuenow', this.value.toFixed(2));
  }
}
