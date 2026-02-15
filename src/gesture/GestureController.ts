/**
 * GestureController - Camera-based hand gesture control for Pentatonic Synth
 * Uses MediaPipe Hands for real-time hand tracking
 */

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface GestureData {
  noteIndex: number;  // 0-4 for pentatonic notes
  octave: number;     // 3-5 for octave range
  velocity: number;   // 0-1 for volume/intensity
  isActive: boolean;  // finger pinched/closed
}

export class GestureController {
  private videoElement: HTMLVideoElement;
  private canvasElement: HTMLCanvasElement;
  private canvasCtx: CanvasRenderingContext2D;
  private hands: any;
  private camera: any;
  private onGestureCallback?: (gesture: GestureData) => void;

  constructor(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement
  ) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.canvasCtx = canvasElement.getContext('2d')!;
  }

  async initialize(): Promise<void> {
    // @ts-ignore - MediaPipe loaded via CDN
    const { Hands } = window;
    // @ts-ignore
    const { Camera } = window;

    this.hands = new Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,  // Faster, less accurate (good for prototype)
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.hands.onResults((results: any) => this.onResults(results));

    this.camera = new Camera(this.videoElement, {
      onFrame: async () => {
        await this.hands.send({ image: this.videoElement });
      },
      width: 640,
      height: 480
    });

    await this.camera.start();
  }

  private onResults(results: any): void {
    // Clear canvas
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      // Draw hand landmarks
      this.drawHand(landmarks);
      
      // Extract gesture data
      const gesture = this.extractGesture(landmarks);
      
      if (this.onGestureCallback) {
        this.onGestureCallback(gesture);
      }
    }

    this.canvasCtx.restore();
  }

  private drawHand(landmarks: HandLandmark[]): void {
    // Draw connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],  // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],  // Index
      [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
      [0, 13], [13, 14], [14, 15], [15, 16],  // Ring
      [0, 17], [17, 18], [18, 19], [19, 20],  // Pinky
      [5, 9], [9, 13], [13, 17]  // Palm
    ];

    this.canvasCtx.strokeStyle = '#00FF00';
    this.canvasCtx.lineWidth = 2;

    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      this.canvasCtx.beginPath();
      this.canvasCtx.moveTo(startPoint.x * this.canvasElement.width, startPoint.y * this.canvasElement.height);
      this.canvasCtx.lineTo(endPoint.x * this.canvasElement.width, endPoint.y * this.canvasElement.height);
      this.canvasCtx.stroke();
    });

    // Draw landmarks
    landmarks.forEach((landmark) => {
      this.canvasCtx.fillStyle = '#FF0000';
      this.canvasCtx.beginPath();
      this.canvasCtx.arc(
        landmark.x * this.canvasElement.width,
        landmark.y * this.canvasElement.height,
        5, 0, 2 * Math.PI
      );
      this.canvasCtx.fill();
    });
  }

  private extractGesture(landmarks: HandLandmark[]): GestureData {
    // Index finger tip (landmark 8)
    const indexTip = landmarks[8];
    
    // Map X position (0-1) to note index (0-4)
    const noteIndex = Math.floor(indexTip.x * 5);
    const clampedNoteIndex = Math.max(0, Math.min(4, noteIndex));
    
    // Map Y position (0-1) to octave (5 at top, 3 at bottom)
    const octave = Math.floor(5 - indexTip.y * 2);
    const clampedOctave = Math.max(3, Math.min(5, octave));
    
    // Calculate pinch distance (thumb tip to index tip)
    const thumbTip = landmarks[4];
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
      Math.pow(thumbTip.y - indexTip.y, 2)
    );
    
    // Pinch threshold (closer = active)
    const isActive = distance < 0.08;
    
    // Velocity based on Z depth (closer to camera = louder)
    const velocity = Math.max(0, Math.min(1, 1 - (indexTip.z + 0.1)));

    return {
      noteIndex: clampedNoteIndex,
      octave: clampedOctave,
      velocity,
      isActive
    };
  }

  onGesture(callback: (gesture: GestureData) => void): void {
    this.onGestureCallback = callback;
  }

  stop(): void {
    if (this.camera) {
      this.camera.stop();
    }
  }
}
