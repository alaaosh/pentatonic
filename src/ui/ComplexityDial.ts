/**
 * ComplexityDial: The single most important UI control in APS v2.0.
 * 
 * A large, prominent radial dial that replaces all the individual
 * synthesis controls (waveform, filter, resonance, ADSR, harmony mode,
 * chord type). It renders as a glowing arc with a draggable indicator,
 * and displays the current module intensities as colored segments.
 */

import { ComplexityManager } from '../engine/ComplexityManager';

export class ComplexityDial {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private complexity: ComplexityManager;

  private isDragging = false;
  private size = 0;

  // Module colors
  private static readonly SHIFTER_COLOR = '#FF6B6B';  // Warm red — microtonal heat
  private static readonly WEAVER_COLOR = '#4ECDC4';   // Teal — contrapuntal weave
  private static readonly CLOUD_COLOR = '#9B59B6';    // Purple — spectral mist

  constructor(containerId: string, complexity: ComplexityManager) {
    const parent = document.getElementById(containerId);
    if (!parent) throw new Error(`ComplexityDial container "${containerId}" not found`);
    this.container = parent;
    this.complexity = complexity;

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'complexity-dial-canvas';
    this.canvas.setAttribute('role', 'slider');
    this.canvas.setAttribute('aria-label', 'Complexity');
    this.canvas.setAttribute('aria-valuemin', '0');
    this.canvas.setAttribute('aria-valuemax', '100');
    this.canvas.setAttribute('aria-valuenow', '0');
    this.canvas.tabIndex = 0;
    this.container.appendChild(this.canvas);

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context for ComplexityDial');
    this.ctx = ctx;

    this.setupEvents();
    this.resize();

    // Re-render when complexity changes externally
    this.complexity.onChange(() => this.render());

    // Resize observer
    window.addEventListener('resize', () => this.resize());
  }

  private setupEvents(): void {
    this.canvas.addEventListener('mousedown', this.onPointerDown.bind(this));
    window.addEventListener('mousemove', this.onPointerMove.bind(this));
    window.addEventListener('mouseup', this.onPointerUp.bind(this));

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.onPointerDown(e.touches[0]);
    }, { passive: false });
    window.addEventListener('touchmove', (e) => {
      if (this.isDragging) {
        e.preventDefault();
        this.onPointerMove(e.touches[0]);
      }
    }, { passive: false });
    window.addEventListener('touchend', () => this.onPointerUp());

    // Keyboard support
    this.canvas.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 0.1 : 0.02;
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.complexity.setComplexity(this.complexity.complexity + step);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        e.preventDefault();
        this.complexity.setComplexity(this.complexity.complexity - step);
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.complexity.setComplexity(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        this.complexity.setComplexity(1);
      }
    });
  }

  private onPointerDown(e: MouseEvent | Touch): void {
    this.isDragging = true;
    this.updateFromPointer(e);
  }

  private onPointerMove(e: MouseEvent | Touch): void {
    if (!this.isDragging) return;
    this.updateFromPointer(e);
  }

  private onPointerUp(): void {
    this.isDragging = false;
  }

  private updateFromPointer(e: MouseEvent | Touch): void {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;

    // Convert to angle (0 at bottom-left, 1 at bottom-right)
    // Arc spans from 225° (bottom-left) to -45° (bottom-right) = 270° sweep
    let angle = Math.atan2(-y, x); // Standard math angle
    let degrees = angle * (180 / Math.PI);

    // Normalize: our arc starts at 225° CCW from right (= bottom-left)
    // and sweeps 270° clockwise to 315° (= bottom-right)
    // Convert to our 0–1 range
    let normalized = (225 - degrees) / 270;
    if (normalized < 0) normalized += 360 / 270;
    
    // Clamp
    normalized = Math.max(0, Math.min(1, normalized));
    this.complexity.setComplexity(normalized);
  }

  private resize(): void {
    const rect = this.container.getBoundingClientRect();
    this.size = Math.min(rect.width, rect.height);
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.size * dpr;
    this.canvas.height = this.size * dpr;
    this.canvas.style.width = `${this.size}px`;
    this.canvas.style.height = `${this.size}px`;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.render();
  }

  render(): void {
    const size = this.size;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.38;
    const trackWidth = size * 0.06;
    const intensity = this.complexity.intensity;
    const value = this.complexity.complexity;

    this.ctx.clearRect(0, 0, size, size);

    // Arc geometry: 270° sweep, starting at 225° (bottom-left)
    const startAngle = (225 * Math.PI) / 180;
    const endAngle = (-45 * Math.PI) / 180;
    const totalSweep = (270 * Math.PI) / 180;

    // Background track
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, startAngle, endAngle, false);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = trackWidth;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();

    // Module intensity arcs (stacked as concentric rings)
    this.drawModuleArc(cx, cy, radius + trackWidth * 1.2, trackWidth * 0.4, startAngle, totalSweep, intensity.shifter, ComplexityDial.SHIFTER_COLOR);
    this.drawModuleArc(cx, cy, radius, trackWidth * 0.4, startAngle, totalSweep, intensity.weaver, ComplexityDial.WEAVER_COLOR);
    this.drawModuleArc(cx, cy, radius - trackWidth * 1.2, trackWidth * 0.4, startAngle, totalSweep, intensity.cloud, ComplexityDial.CLOUD_COLOR);

    // Main value arc (bright foreground)
    const valueAngle = startAngle - totalSweep * value;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, startAngle, valueAngle, true);
    this.ctx.strokeStyle = '#4ECDC4';
    this.ctx.lineWidth = trackWidth;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();

    // Glow effect on the value arc
    this.ctx.shadowColor = '#4ECDC4';
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, startAngle, valueAngle, true);
    this.ctx.strokeStyle = 'rgba(78, 205, 196, 0.3)';
    this.ctx.lineWidth = trackWidth * 1.5;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Indicator dot at current position
    const dotX = cx + radius * Math.cos(valueAngle);
    const dotY = cy + radius * Math.sin(valueAngle);
    this.ctx.beginPath();
    this.ctx.arc(dotX, dotY, trackWidth * 0.8, 0, Math.PI * 2);
    this.ctx.fillStyle = '#fff';
    this.ctx.fill();
    this.ctx.shadowColor = '#4ECDC4';
    this.ctx.shadowBlur = 15;
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // Center text: percentage
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = `bold ${size * 0.12}px monospace`;
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText(`${Math.round(value * 100)}%`, cx, cy - size * 0.02);

    // Label below percentage
    this.ctx.font = `${size * 0.06}px sans-serif`;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fillText('COMPLEXITY', cx, cy + size * 0.1);

    // Module labels at bottom
    this.drawModuleLabel(cx - size * 0.25, cy + size * 0.28, 'SHF', intensity.shifter, ComplexityDial.SHIFTER_COLOR);
    this.drawModuleLabel(cx, cy + size * 0.28, 'WVR', intensity.weaver, ComplexityDial.WEAVER_COLOR);
    this.drawModuleLabel(cx + size * 0.25, cy + size * 0.28, 'CLD', intensity.cloud, ComplexityDial.CLOUD_COLOR);

    // Update ARIA
    this.canvas.setAttribute('aria-valuenow', Math.round(value * 100).toString());
    this.canvas.setAttribute('aria-valuetext', `${Math.round(value * 100)}% complexity`);
  }

  private drawModuleArc(
    cx: number, cy: number, radius: number, width: number,
    startAngle: number, totalSweep: number,
    intensity: number, color: string
  ): void {
    if (intensity <= 0) return;
    const arcEnd = startAngle - totalSweep * intensity;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, startAngle, arcEnd, true);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.lineCap = 'round';
    this.ctx.globalAlpha = 0.7;
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }

  private drawModuleLabel(x: number, y: number, label: string, intensity: number, color: string): void {
    const size = this.size;
    this.ctx.font = `bold ${size * 0.045}px monospace`;
    this.ctx.fillStyle = intensity > 0 ? color : 'rgba(255, 255, 255, 0.3)';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(label, x, y);
  }
}
