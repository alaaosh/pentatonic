# Implementation Tasks: Pentatonic Synth

## Overview

This document outlines the step-by-step plan to build the modular Pentatonic Synth.

## Phase 1: Infrastructure & Refactoring Strategy (COMPLETED)
- [x] 1. Infrastructure Migration (Vite, TS, Vitest)
- [x] 2. Core Logic Extraction (ScaleManager, SynthesisEngine, VisualRenderer)

## Phase 2: Input & Interaction (COMPLETED)
- [x] 3. Enhanced Input Handling (Multi-touch, Glissando, Accessibility)
- [x] 4. Custom Controls (MultiRangeSlider, DialWidget)
- [x] 5. Event Coordination (EventProcessor)

## Phase 3: Tone Shaping & Stability (COMPLETED)
- [x] 6. Synthesis Parameters (ADSR, Filter Resonance, Waveform)
- [x] 7. Voice Lifecycle Fixes (Stuck note resolution, proper release)
- [x] 8. Advanced Keyboard Mapping (3-octave grid: QWERT, ASDFG, ZXCVB)

## Phase 4: Audio Effects & Polish (IN PROGRESS)
- [ ] **9. Effects Chain**
    - [ ] 9.1 Implement Stereo Delay node.
    - [ ] 9.2 Implement Reverb (Convolution/Algorithmic).
    - [ ] 9.3 Add UI controls for Effect Dry/Wet.
- [ ] **10. Visual Feedback Expansion**
    - [ ] 10.1 Implement Modulation "Ripples" on Canvas.
    - [ ] 10.2 Add background FFT Spectrum Visualizer.

## Phase 5: Gesture Control Refinement (COMPLETED)
- [x] **11. Basic Gesture Control (Proof of Concept)**
    - [x] 11.1 Integrate MediaPipe Hands library.
    - [x] 11.2 Implement hand landmark detection and visualization.
    - [x] 11.3 Map index finger position to note/octave selection.
    - [x] 11.4 Implement pinch detection for note triggering.
    - [x] 11.5 Add gesture control UI panel with camera feed.
- [ ] **12. Gesture Smoothing & Stability**
    - [ ] 12.1 Implement Kalman filter for position smoothing.
    - [ ] 12.2 Add exponential moving average for velocity calculations.
    - [ ] 12.3 Implement gesture prediction for latency compensation.
    - [ ] 12.4 Add confidence thresholds to filter low-quality detections.
- [ ] **13. Adaptive Calibration**
    - [ ] 13.1 Auto-detect hand size and adjust pinch thresholds.
    - [ ] 13.2 Create camera distance calibration wizard.
    - [ ] 13.3 Save user calibration profiles to localStorage.
    - [ ] 13.4 Add visual feedback during calibration process.
- [ ] **14. Performance Optimization**
    - [ ] 14.1 Move gesture processing to Web Worker.
    - [ ] 14.2 Implement frame skipping for lower-end devices.
    - [ ] 14.3 Add performance monitoring dashboard.
    - [ ] 14.4 Optimize canvas rendering (only redraw on changes).

## Phase 6: Enhanced Gesture Mapping (IN PROGRESS)
- [x] **15. Multi-Hand Polyphony (Air Piano)**
    - [x] 15.1 Track both hands simultaneously (left/right identification).
    - [x] 15.2 Assign left hand to bass notes (octaves 2-3).
    - [x] 15.3 Assign right hand to melody notes (octaves 4-5).
    - [x] 15.4 Implement finger-bend detection for 10-finger mapping.
    - [x] 15.5 Add visual distinction for each hand in overlay.
    - [x] 15.6 Add pitch modulation via vertical hand movement.
- [ ] **16. Advanced Gesture Parameters**
    - [ ] 16.1 Map palm rotation to filter cutoff frequency.
    - [ ] 16.2 Map wrist angle to resonance amount.
    - [ ] 16.3 Map hand tilt to stereo panning.
    - [ ] 16.4 Map finger spread to chord voicing.
    - [ ] 16.5 Implement dynamic gestures (swipe velocity → attack time).
- [x] **17. Offline Support & Video Interpretation (COMPLETED)**
    - [x] 17.1 Install MediaPipe assets locally (remove CDN dependency).
    - [x] 17.2 Implement "Upload Video" feature for offline analysis.
    - [x] 17.3 Add playback controls for video interpretation.
    - [x] 17.4 Sync gesture processing loop with video playback.
    - [x] 17.5 Refine UI: Move camera toggle to top bar, update icons.
    - [x] 17.6 Implement background play mode (hide panel without stopping).

## Phase 7: Preset System
- [ ] **18. Sound Persistence**
    - [ ] 18.1 Create Factory Preset bank.
    - [ ] 18.2 Implement LocalStorage Save/Load for User Patches.
    - [ ] 18.3 Add Preset Selection UI component.
    - [ ] 18.4 Include gesture mappings in preset schema.

## Phase 8: Optimization & Polish
- [ ] **19. Performance**
    - [ ] 19.1 Object pooling for visuals.
    - [ ] 19.2 Audio voice recycling optimizations.
    - [ ] 19.3 Bundle size optimization and lazy loading.
    - [ ] 19.4 Memory leak prevention and profiling.

## Phase 9: Advanced Features (Long-term)
- [ ] **20. Recording & Looping**
    - [ ] 20.1 Record gesture sequences with timing.
    - [ ] 20.2 Multi-track loop station (4-8 tracks).
    - [ ] 20.3 Overdub and undo functionality.
    - [ ] 20.4 Export to MIDI or audio (WAV).
- [ ] **21. Spatial Audio**
    - [ ] 21.1 Implement Web Audio API Panner nodes.
    - [ ] 21.2 Map hand position to 3D audio position.
    - [ ] 21.3 Add HRTF-based binaural audio.
- [ ] **22. Collaborative Performance**
    - [ ] 22.1 WebRTC peer-to-peer audio streaming.
    - [ ] 22.2 Synchronized playback across devices.
    - [ ] 22.3 Shared session state management.
- [ ] **23. Mobile & Cross-Platform**
    - [ ] 23.1 Optimize for mobile cameras and touch screens.
    - [ ] 23.2 PWA support with offline capabilities.
    - [ ] 23.3 Native app development (Electron/React Native).
- [ ] **24. AI-Assisted Features**
    - [ ] 24.1 AI chord progression suggestions.
    - [ ] 24.2 Style transfer and auto-harmonization.
    - [ ] 24.3 Gesture completion prediction.
    - [ ] 24.4 Personalized preset recommendations.
