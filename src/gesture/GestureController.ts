/**
 * GestureController - Camera-based hand gesture control for Pentatonic Synth
 * Uses MediaPipe Tasks Vision for real-time hand tracking
 */

import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export type GestureEventType = 'start' | 'stop' | 'modulate';

export interface GestureEvent {
  type: GestureEventType;
  fingerId: string; // "left-0", "right-4", etc.
  noteIndex: number;
  octave: number;
  velocity: number;
  pitchBend?: number; // -1 to 1 semitones
}

interface FingerState {
  isActive: boolean;
  startY: number;
  smoothingY: number[]; // For averaging
}

export class GestureController {
  private videoElement: HTMLVideoElement;
  private canvasElement: HTMLCanvasElement;
  private canvasCtx: CanvasRenderingContext2D;
  private handLandmarker: HandLandmarker | undefined;
  private runningMode: 'IMAGE' | 'VIDEO' = 'VIDEO';
  private onGestureCallback?: (event: GestureEvent) => void;
  private isProcessing: boolean = false;
  private animationFrameId: number | null = null;
  private lastVideoTime: number = -1;
  
  // Track state of each finger: "HandSide-FingerIndex" (e.g., "Left-1")
  private fingerStates: Map<string, FingerState> = new Map();

  constructor(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement
  ) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.canvasCtx = canvasElement.getContext('2d')!;
  }

  async initialize(): Promise<void> {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        '/mediapipe/wasm' // Local path to Wasm files
      );

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/mediapipe/models/hand_landmarker.task', // Local path to model
          delegate: 'GPU'
        },
        runningMode: this.runningMode,
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      // Start webcam stream by default
      await this.setupCamera();
      
      // Start processing loop
      this.predictWebcam();

    } catch (error) {
      console.error('Error initializing gesture controller:', error);
      throw error;
    }
  }

  async loadVideo(file: File) {
      // Stop webcam stream if active
      if (this.videoElement.srcObject) {
          const stream = this.videoElement.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          this.videoElement.srcObject = null;
      }

      const url = URL.createObjectURL(file);
      this.videoElement.src = url;
      this.videoElement.loop = true;
      this.videoElement.play();
  }

  private async setupCamera(): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: 640,
        height: 480
      }
    });

    this.videoElement.srcObject = stream;
    
    return new Promise((resolve) => {
      this.videoElement.onloadedmetadata = () => {
        this.videoElement.play();
        resolve();
      };
    });
  }

  private async predictWebcam() {
    this.isProcessing = true;
    
    // Resize canvas to match video dimensions if needed
    if (this.videoElement.videoWidth !== this.canvasElement.width) {
        this.canvasElement.width = this.videoElement.videoWidth;
        this.canvasElement.height = this.videoElement.videoHeight;
    }

    if (this.handLandmarker && this.videoElement.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.videoElement.currentTime;
      const startTimeMs = performance.now();
      const results = this.handLandmarker.detectForVideo(this.videoElement, startTimeMs);
      
      this.onResults(results);
    }

    if (this.isProcessing) {
      this.animationFrameId = requestAnimationFrame(() => this.predictWebcam());
    }
  }

  private onResults(results: any): void {
    // Clear canvas
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    
    // Mirror the video output for natural feel
    this.canvasCtx.scale(-1, 1);
    this.canvasCtx.translate(-this.canvasElement.width, 0);
    
    // Draw video frame
    this.canvasCtx.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);

    if (results.landmarks && results.landmarks.length > 0) {
      results.landmarks.forEach((landmarks: HandLandmark[], index: number) => {
        // Handle handedness
        // MediaPipe New API returns 'handedness' array
        // Each entry has categoryName: "Left" | "Right"
        // Note: Camera is mirrored, so "Left" from model corresponds to user's Right hand visually if unmirrored?
        // But we are drawing mirrored. 
        // Let's rely on the label from the model. 
        // In mirrored view: Model 'Left' = User Right Hand (visually on right side of screen).
        // Let's stick to the label for ID generation.
        
        const handednessEntry = results.handedness[index][0];
        const handednessLabel = handednessEntry.categoryName; 

        this.processHand(landmarks, handednessLabel);
        this.drawHand(landmarks, handednessLabel);
      });
    } else {
        // Safety: ensure all notes stop if hands disappear
        this.stopAllFingers();
    }

    this.canvasCtx.restore();
  }

  private stopAllFingers() {
      this.fingerStates.forEach((state, fingerId) => {
          if (state.isActive) {
              state.isActive = false;
              // Extract info from fingerId "Left-1"
              const parts = fingerId.split('-');
              const handedness = parts[0];
              const fingerIndex = parseInt(parts[1], 10);
              
              // Recalculate octave/index to send correct stop event
              // Note: This logic must match processHand mapping
              let noteIndex = 0;
              let octave = 4;
              if (handedness === 'Right') {
                  octave = 5; 
                  noteIndex = fingerIndex;
              } else {
                  octave = 3; 
                  noteIndex = 4 - fingerIndex; 
              }

              this.emit({
                  type: 'stop',
                  fingerId,
                  noteIndex,
                  octave,
                  velocity: 0
              });
          }
      });
  }

  private processHand(landmarks: HandLandmark[], handedness: string): void {
    // MediaPipe Handedness:
    // "Left" = Left Hand
    // "Right" = Right Hand
    
    // Finger Indices in Landmarks:
    // Thumb: 1-4 (Tip 4)
    // Index: 5-8 (Tip 8)
    // Middle: 9-12 (Tip 12)
    // Ring: 13-16 (Tip 16)
    // Pinky: 17-20 (Tip 20)

    const fingers = [
      { name: 'thumb', tip: 4, joint: 2, base: 0 },   // Thumb uses different joints
      { name: 'index', tip: 8, joint: 6, base: 5 },
      { name: 'middle', tip: 12, joint: 10, base: 9 },
      { name: 'ring', tip: 16, joint: 14, base: 13 },
      { name: 'pinky', tip: 20, joint: 18, base: 17 }
    ];

    // Check for Fist (All 5 fingers bent? Or at least 4?)
    let bentCount = 0;
    fingers.forEach((finger, idx) => {
         if (this.isFingerBent(landmarks, finger, idx === 0)) bentCount++;
    });

    const isFist = bentCount >= 4;

    fingers.forEach((finger, fingerIndex) => {
      const isBent = this.isFingerBent(landmarks, finger, fingerIndex === 0);
      const fingerId = `${handedness}-${fingerIndex}`;
      
      let state = this.fingerStates.get(fingerId);
      if (!state) {
        state = { isActive: false, startY: 0, smoothingY: [] };
        this.fingerStates.set(fingerId, state);
      }

      const tipY = landmarks[finger.tip].y;

      // Note Mapping
      let noteIndex = 0;
      let octave = 4; 

      if (handedness === 'Right') {
        // Model "Right" = Visual Right (User's Right Hand in Mirror Mode)
        // User wants Right Hand = High Octave
        octave = 5; // Treble (High)
        noteIndex = fingerIndex; // Thumb=0 (Piano style for right hand)
      } else {
        // Model "Left" = Visual Left (User's Left Hand in Mirror Mode)
        // User wants Left Hand = Low Octave
        octave = 3; // Bass (Low)
        noteIndex = 4 - fingerIndex; // Pinky=0
      }

      // Logic:
      // If Fist -> Stop All (Force Note Off)
      // Else -> Normal Logic
      
      if (isFist) {
          if (state.isActive) {
             // Stop
             state.isActive = false;
             this.emit({
                type: 'stop',
                fingerId,
                noteIndex,
                octave,
                velocity: 0
             });
          }
          // Do nothing if already stopped
      } else {
          // Normal Play Logic
          if (isBent && !state.isActive) {
            // Trigger Note ON
            state.isActive = true;
            state.startY = tipY;
            state.smoothingY = [tipY];
            
            this.emit({
              type: 'start',
              fingerId,
              noteIndex,
              octave,
              velocity: 0.8 
            });

          } else if (isBent && state.isActive) {
            // Modulation
            // Calculate vertical movement relative to start
            // Moving UP (negative delta) -> Pitch Bend UP
            // Moving DOWN (positive delta) -> Pitch Bend DOWN
            const deltaY = state.startY - tipY; // Positive = Moved Up
            const pitchBend = Math.max(-1, Math.min(1, deltaY * 2)); // Scale factor
            
            this.emit({
              type: 'modulate',
              fingerId,
              noteIndex,
              octave,
              velocity: 0.8,
              pitchBend
            });

          } else if (!isBent && state.isActive) {
            // Trigger Note OFF
            state.isActive = false;
            this.emit({
              type: 'stop',
              fingerId,
              noteIndex,
              octave,
              velocity: 0
            });
          }
      }
    });
  }

  private isFingerBent(landmarks: HandLandmark[], finger: any, isThumb: boolean): boolean {
    const tip = landmarks[finger.tip];
    const joint = landmarks[finger.joint];
    const base = landmarks[finger.base];

    // Calculate vectors
    const v1 = { x: joint.x - base.x, y: joint.y - base.y, z: joint.z - base.z };
    const v2 = { x: tip.x - joint.x, y: tip.y - joint.y, z: tip.z - joint.z };

    // Calculate angle using dot product
    // cos(theta) = (v1 . v2) / (|v1| * |v2|)
    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
    
    const angleRad = Math.acos(dot / (mag1 * mag2));
    const angleDeg = angleRad * (180 / Math.PI);

    // Thresholds
    // Adjust for thumb (it behaves differently)
    const threshold = isThumb ? 30 : 50; 
    
    return Math.abs(angleDeg) > threshold;
  }

  private emit(event: GestureEvent) {
    if (this.onGestureCallback) {
      this.onGestureCallback(event);
    }
  }

  private drawHand(landmarks: HandLandmark[], handedness: string): void {
    // Draw connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],  // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],  // Index
      [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
      [0, 13], [13, 14], [14, 15], [15, 16],  // Ring
      [0, 17], [17, 18], [18, 19], [19, 20],  // Pinky
      [5, 9], [9, 13], [13, 17], [0, 17] // Palm
    ];

    this.canvasCtx.lineWidth = 2;

    connections.forEach(([start, end]) => {
      this.canvasCtx.strokeStyle = handedness === 'Left' ? '#00FF00' : '#00FFFF'; // Different color per hand
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      this.canvasCtx.beginPath();
      this.canvasCtx.moveTo(startPoint.x * this.canvasElement.width, startPoint.y * this.canvasElement.height);
      this.canvasCtx.lineTo(endPoint.x * this.canvasElement.width, endPoint.y * this.canvasElement.height);
      this.canvasCtx.stroke();
    });

    // Draw landmarks
    landmarks.forEach((landmark, index) => {
        // Highlight tips
        const isTip = [4, 8, 12, 16, 20].includes(index);
        
        if (isTip) {
            // Determine finger index for state lookup
            let fingerIndex = -1;
            if (index === 4) fingerIndex = 0;
            else if (index === 8) fingerIndex = 1;
            else if (index === 12) fingerIndex = 2;
            else if (index === 16) fingerIndex = 3;
            else if (index === 20) fingerIndex = 4;

            const id = `${handedness}-${fingerIndex}`;
            const isActive = this.fingerStates.get(id)?.isActive;

            this.canvasCtx.fillStyle = isActive ? '#FF0000' : '#FFFF00';
            this.canvasCtx.beginPath();
            this.canvasCtx.arc(
                landmark.x * this.canvasElement.width,
                landmark.y * this.canvasElement.height,
                isActive ? 8 : 4, 0, 2 * Math.PI
            );
            this.canvasCtx.fill();
        } else {
            this.canvasCtx.fillStyle = '#FFFFFF';
            this.canvasCtx.beginPath();
            this.canvasCtx.arc(
                landmark.x * this.canvasElement.width,
                landmark.y * this.canvasElement.height,
                2, 0, 2 * Math.PI
            );
            this.canvasCtx.fill();
        }
    });
  }

  onGesture(callback: (event: GestureEvent) => void): void {
    this.onGestureCallback = callback;
  }

  stop(): void {
    this.isProcessing = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Stop camera stream
    if (this.videoElement.srcObject) {
        const stream = this.videoElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        this.videoElement.srcObject = null;
    }
    
    // Cleanup MediaPipe
    if (this.handLandmarker) {
        this.handLandmarker.close();
        this.handLandmarker = undefined;
    }
  }
}
