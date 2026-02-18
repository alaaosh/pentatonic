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
  timbre?: number; // 0 to 1 (horizontal)
  resonance?: number; // 0 to 1 (rotation)
}

interface FingerState {
  isActive: boolean;
  startY: number;
  startX: number; // Added for horizontal modulation
  smoothingY: number[]; 
  currentAngle: number; 
  octaveAtStart: number; 
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
      // Use relative paths for GitHub Pages compatibility
      const vision = await FilesetResolver.forVisionTasks(
        'mediapipe/wasm' // Relative path
      );

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'mediapipe/models/hand_landmarker.task', // Relative path
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
        const handednessEntry = results.handedness[index][0];
        const handednessLabel = handednessEntry.categoryName; 

        // Draw Octave Indicator near the wrist
        const wrist = landmarks[0];
        const middleMCP = landmarks[9];
        const vectorY = middleMCP.y - wrist.y;
        
        let base = (handednessLabel === 'Right') ? 5 : 2;
        let shift = 0;
        
        if (vectorY < -0.15) shift = 1;
        else if (vectorY > 0.15) shift = -1;
        
        const currentOctave = base + shift;
        
        // Draw Text
        this.canvasCtx.fillStyle = '#4ECDC4';
        this.canvasCtx.font = 'bold 16px Arial';
        this.canvasCtx.fillText(
            `Oct ${currentOctave}`, 
            wrist.x * this.canvasElement.width, 
            wrist.y * this.canvasElement.height + 30 
        );

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
              // NOTE: For 6-octave, we need to know the octave it started at. 
              // Since we stopAllFingers on hand loss, we might not have current orientation.
              // We should rely on state.octaveAtStart if available.
              
              let octave = state.octaveAtStart;
              let noteIndex = 0;
              
              if (handedness === 'Right') {
                  noteIndex = fingerIndex;
              } else {
                  noteIndex = 4 - fingerIndex; 
              }
              // If octaveAtStart wasn't set (legacy safety), fallback to base
              if (!octave) {
                  octave = (handedness === 'Right') ? 5 : 3;
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
         const angle = this.calculateFingerAngle(landmarks, finger);
         if (angle > (idx === 0 ? 45 : 85)) bentCount++;
    });

    const isFist = bentCount >= 4;

    fingers.forEach((finger, fingerIndex) => {
      // REMOVED: const isBent = this.isFingerBent(...) -> We calculate this below with hysteresis
      
      const fingerId = `${handedness}-${fingerIndex}`;
      
      let state = this.fingerStates.get(fingerId);
      if (!state) {
        state = { isActive: false, startY: 0, startX: 0, smoothingY: [], currentAngle: 0, octaveAtStart: 0 };
        this.fingerStates.set(fingerId, state);
      }


      const tipY = landmarks[finger.tip].y;
      const tipX = landmarks[finger.tip].x; // Track horizontal
      
      // Calculate current angle
      const rawAngle = this.calculateFingerAngle(landmarks, finger);
      
      // Simple smoothing (EMA)
      if (state.currentAngle === undefined) state.currentAngle = rawAngle;
      state.currentAngle = (rawAngle * 0.5) + (state.currentAngle * 0.5);

      // Determine "isBent" using Hysteresis
      const isThumb = fingerIndex === 0;
      const triggerThreshold = isThumb ? 45 : 85; 
      const releaseThreshold = isThumb ? 30 : 65;

      let isBent = false;
      if (state.isActive) {
          isBent = state.currentAngle > releaseThreshold;
      } else {
          isBent = state.currentAngle > triggerThreshold;
      }

      // Determine Octave based on Hand Orientation (3 Zones)
      // Vector from Wrist(0) to MiddleMCP(9)
      const wrist = landmarks[0];
      const middleMCP = landmarks[9];
      const handVectorY = middleMCP.y - wrist.y;
      
      // handVectorY:
      // Negative (< -0.1) = Pointing UP (Screen: bottom to top is negative Y in most coords, wait)
      // MediaPipe: Y=0 is Top, Y=1 is Bottom.
      // So Wrist > MiddleMCP (Positive > Smaller) -> Y decreases -> Pointing UP.
      // Wait, if Wrist Y is 0.8 and MCP Y is 0.5, Vector = 0.5 - 0.8 = -0.3. Correct.
      
      let orientationOctaveShift = 0;
      // UP: < -0.15
      // DOWN: > 0.15
      // FORWARD: between
      
      if (handVectorY < -0.15) orientationOctaveShift = 1; // High
      else if (handVectorY > 0.15) orientationOctaveShift = -1; // Low
      else orientationOctaveShift = 0; // Mid

      // Base Octave Mapping (Standard)
      let baseOctave = 4;
      let noteIndex = 0;

      if (handedness === 'Right') {
        baseOctave = 5; // Treble
        noteIndex = fingerIndex; 
      } else {
        baseOctave = 2; // Bass (Shifted down for 6-octave range: 1, 2, 3)
        noteIndex = 4 - fingerIndex; 
      }
      
      // Calculate Final Octave
      let finalOctave = baseOctave + orientationOctaveShift;
      
      // Logic:
      // If Fist -> Stop All
      if (isFist) {
          if (state.isActive) {
             state.isActive = false;
             // Use stored octave to stop correct note
             this.emit({
                type: 'stop',
                fingerId,
                noteIndex,
                octave: state.octaveAtStart,
                velocity: 0
             });
          }
      } else {
          // Normal Play Logic
          if (isBent && !state.isActive) {
            // Trigger Note ON
            state.isActive = true;
            state.startY = tipY;
            state.startX = tipX;
            state.smoothingY = [tipY];
            state.octaveAtStart = finalOctave; // Lock octave
            
            this.emit({
              type: 'start',
              fingerId,
              noteIndex,
              octave: finalOctave,
              velocity: 0.8 
            });

          } else if (isBent && state.isActive) {
            // Modulation
            
            // 1. Pitch Bend (Vertical)
            const deltaY = state.startY - tipY; 
            const pitchBend = Math.max(-1, Math.min(1, deltaY * 2)); 
            
            // 2. Timbre (Horizontal) - "Wah-Wah"
            const deltaX = Math.abs(state.startX - tipX);
            const timbre = Math.min(1, deltaX * 5); // Sensitivity: 20% screen width = full open

            // 3. Resonance (Rotation) - "Scream"
            // Calculate Roll angle: Difference in Z or Y between Index MCP(5) and Pinky MCP(17)
            // Simpler: Check angle of the Palm line (Landmark 5 to 17)
            const indexMCP = landmarks[5];
            const pinkyMCP = landmarks[17];
            
            // Roll: Atan2 of deltaY/deltaX? No, that's in-plane rotation.
            // We want roll "into" the screen or twist.
            // Let's use the difference in Z depth between Index and Pinky knuckles.
            // If hand is flat, Z difference is small. If rotated (thumb up), Index is higher/lower than Pinky.
            // Actually, MediaPipe World Landmarks are better for this, but we only have screen landmarks.
            // Approximation: Use the slope of the line connecting knuckles (5-9-13-17).
            
            // Let's try simple X-distance check? If hand rotates, width decreases? Unreliable.
            // Let's try Y-difference between Knuckles. 
            // Flat hand: Knuckles are roughly horizontal (same Y).
            // Rotated hand: Index Knuckle is above/below Pinky Knuckle.
            const knuckleDeltaY = Math.abs(indexMCP.y - pinkyMCP.y);
            // Threshold: 0 (flat) to 0.15 (rotated 90 deg approx)
            const resonance = Math.min(1, Math.max(0, (knuckleDeltaY - 0.02) * 8));

            this.emit({
              type: 'modulate',
              fingerId,
              noteIndex,
              octave: state.octaveAtStart, 
              velocity: 0.8,
              pitchBend,
              timbre,
              resonance
            });

          } else if (!isBent && state.isActive) {
            // Trigger Note OFF
            state.isActive = false;
            this.emit({
              type: 'stop',
              fingerId,
              noteIndex,
              octave: state.octaveAtStart, // Use locked octave
              velocity: 0
            });
          }
      }
    });
  }

  private calculateFingerAngle(landmarks: HandLandmark[], finger: any): number {
    const tip = landmarks[finger.tip];
    const joint = landmarks[finger.joint];
    const base = landmarks[finger.base];

    // Calculate vectors
    const v1 = { x: joint.x - base.x, y: joint.y - base.y, z: joint.z - base.z };
    const v2 = { x: tip.x - joint.x, y: tip.y - joint.y, z: tip.z - joint.z };

    // Calculate angle using dot product
    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
    
    // Angle in radians
    const angleRad = Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2))));
    // Convert to degrees
    return angleRad * (180 / Math.PI);
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
