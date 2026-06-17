export class SpectrumRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private spectrumData: Uint8Array | null = null;
  private spectrumBufferLength: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;
    
    window.addEventListener('resize', () => this.resize());
    // Initial resize
    this.resize();
    
    // Start animation loop
    this.animate();
  }

  private setupHighDPI() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
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
  }

  updateSpectrumData(data: Uint8Array, bufferLength: number) {
      this.spectrumData = data;
      this.spectrumBufferLength = bufferLength;
  }

  private animate() {
      this.render();
      requestAnimationFrame(() => this.animate());
  }

  render() {
      const dpr = window.devicePixelRatio || 1;
      const width = this.canvas.width / dpr;
      const height = this.canvas.height / dpr;
      
      this.ctx.clearRect(0, 0, width, height);
      
      if (!this.spectrumData || this.spectrumBufferLength === 0) return;

      this.ctx.save();
      this.ctx.globalCompositeOperation = 'source-over'; 
      this.ctx.globalAlpha = 0.5;

      const barWidth = (width / this.spectrumBufferLength) * 2.5;
      let x = 0;

      this.ctx.beginPath();
      // Draw from bottom
      
      for (let i = 0; i < this.spectrumBufferLength; i++) {
          const v = this.spectrumData[i] / 255.0;
          const y = v * height * 0.6; // Scale height
          
          if (y > 1) {
            const hue = (i / this.spectrumBufferLength) * 360;
            this.ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.6)`;
            this.ctx.fillRect(x, height - y, barWidth, y);
          }
          
          x += barWidth;
      }

      this.ctx.restore();
  }
}
