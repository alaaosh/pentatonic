export class DialWidget {
  private container: HTMLElement;
  private dialEl: HTMLElement;
  private indicatorEl: HTMLElement;
  private valueEl: HTMLElement;
  
  private value: number;
  private min: number;
  private max: number;
  private step: number;
  private onChange: (val: number) => void;

  private isDragging = false;
  private startY = 0;
  private startValue = 0;

  constructor(containerId: string, options: {
    min: number,
    max: number,
    step?: number,
    initialValue: number,
    label: string,
    onChange: (val: number) => void
  }) {
    const parent = document.getElementById(containerId);
    if (!parent) throw new Error(`Container ${containerId} not found`);
    this.container = parent;
    
    this.min = options.min;
    this.max = options.max;
    this.step = options.step || 1;
    this.value = options.initialValue;
    this.onChange = options.onChange;

    // Create DOM
    this.container.innerHTML = `
      <div class="dial" tabindex="0" role="slider" 
           aria-label="${options.label}" 
           aria-valuemin="${this.min}" 
           aria-valuemax="${this.max}" 
           aria-valuenow="${this.value}"
           aria-valuetext="${this.formatValue(this.value)}">
        <div class="dial-indicator"></div>
      </div>
      <div class="dial-value" aria-hidden="true">${this.formatValue(this.value)}</div>
    `;

    this.dialEl = this.container.querySelector('.dial') as HTMLElement;
    this.indicatorEl = this.container.querySelector('.dial-indicator') as HTMLElement;
    this.valueEl = this.container.querySelector('.dial-value') as HTMLElement;

    this.setupEventListeners();
    this.updateVisuals();
  }

  private setupEventListeners() {
    this.dialEl.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));

    this.dialEl.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    window.addEventListener('touchend', this.onMouseUp.bind(this));

    this.dialEl.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  private onKeyDown(e: KeyboardEvent) {
    let newVal = this.value;
    const stepLarge = (this.max - this.min) / 10;

    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      newVal += this.step;
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      newVal -= this.step;
    } else if (e.key === 'PageUp') {
      newVal += stepLarge;
    } else if (e.key === 'PageDown') {
      newVal -= stepLarge;
    } else if (e.key === 'Home') {
      newVal = this.min;
    } else if (e.key === 'End') {
      newVal = this.max;
    } else {
      return;
    }

    e.preventDefault();
    newVal = Math.round(newVal / this.step) * this.step;
    newVal = Math.max(this.min, Math.min(this.max, newVal));

    if (this.value !== newVal) {
      this.value = newVal;
      this.updateVisuals();
      this.onChange(this.value);
    }
  }

  private onMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.startY = e.clientY;
    this.startValue = this.value;
    document.body.style.cursor = 'ns-resize';
    e.preventDefault();
  }

  private onTouchStart(e: TouchEvent) {
    this.isDragging = true;
    this.startY = e.touches[0].clientY;
    this.startValue = this.value;
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

  private handleMove(currentY: number) {
    const deltaY = this.startY - currentY;
    const valueRange = this.max - this.min;
    
    // Calculate movement based on a fixed 200px drag range for full sweep
    const dragDistance = 200; 
    const change = (deltaY / dragDistance) * valueRange;
    
    let newVal = this.startValue + change;
    
    // Snap to step
    newVal = Math.round(newVal / this.step) * this.step;
    newVal = Math.max(this.min, Math.min(this.max, newVal));

    if (this.value !== newVal) {
      this.value = newVal;
      this.updateVisuals();
      this.onChange(this.value);
    }
  }

  private onMouseUp() {
    this.isDragging = false;
    document.body.style.cursor = 'default';
  }

  private updateVisuals() {
    // Rotate indicator from -135deg to +135deg
    const percent = (this.value - this.min) / (this.max - this.min);
    const rotation = -135 + (percent * 270);
    this.indicatorEl.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
    const formatted = this.formatValue(this.value);
    this.valueEl.textContent = formatted;
    
    // Update ARIA
    this.dialEl.setAttribute('aria-valuenow', this.value.toString());
    this.dialEl.setAttribute('aria-valuetext', formatted);
  }

  private formatValue(val: number): string {
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
    if (val < 1 && val > 0) return val.toFixed(2);
    return Math.round(val).toString();
  }
}
