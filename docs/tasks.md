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

## Phase 5: Preset System
- [ ] **11. Sound Persistence**
    - [ ] 11.1 Create Factory Preset bank.
    - [ ] 11.2 Implement LocalStorage Save/Load for User Patches.
    - [ ] 11.3 Add Preset Selection UI component.

## Phase 6: Optimization
- [ ] **12. Performance**
    - [ ] 12.1 Object pooling for visuals.
    - [ ] 12.2 Audio voice recycling optimizations.
