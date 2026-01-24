# Implementation Tasks: Pentatonic Synth

## Overview

This document outlines the step-by-step plan to build the modular Pentatonic Synth. The tasks move from core audio foundations to touch interface, visual feedback, and finally integration and polish.

## Phase 1: Infrastructure & Refactoring Strategy (COMPLETED)

This phase focused on modernizing the stack and extracting logic from legacy monolithic files.

- [x] **1. Infrastructure Migration**
    - [x] 1.1 Initialize `package.json` and install dependencies (Vite, TypeScript).
    - [x] 1.2 Setup testing harness (Vitest, fast-check).
    - [x] 1.3 Setup CI/CD pipeline (GitHub Actions for GH Pages).

- [x] **2. Core Logic Extraction (Refactoring)**
    - [x] **2.1 ScaleManager**: Migrate scale logic to a pure TypeScript module.
        - [x] Support 12 roots and 5 scale types (Major, Minor, Blues, Yo, Hirajoshi).
        - [x] Implement chromatic harmonic expansion (ChordType selection).
    - [x] **2.2 AudioEngine (SynthesisEngine)**: Migrate audio synthesis to TypeScript.
        - [x] Implement lazy AudioContext initialization (Start Overlay).
        - [x] Support chords and looping arpeggiators.
    - [x] **2.3 VisualRenderer**: Migrate canvas drawing to TypeScript.
        - [x] Implement 3-octave split layout (5x3 grid).
        - [x] Add high-DPI and responsive scaling.

## Phase 2: Input & Interaction (COMPLETED)

- [x] **3. Enhanced Input Handling**
    - [x] **3.1 TouchHandler**: Implement multi-touch and glissando (mouse).
    - [x] **3.2 Accessibility**: Keyboard mapping (A-S-D-F-G) and ARIA labels.
- [x] **4. Custom Controls**
    - [x] **4.1 MultiRangeSlider**: Custom widget for independent octave row control.
    - [x] **4.2 UI Widgets**: Chromatic root strip and tactile harmony mode tabs.
- [x] **5. Event Coordination**
    - [x] **5.1 EventProcessor**: Implement Pub/Sub pattern to decouple subsystems.

## Phase 3: Advanced Sound Controls (COMPLETED)

- [x] **6. Tone Shaping**
    - [x] **6.1 Synthesis Parameters**: Add Filter (Cutoff/Resonance) to the audio chain.
    - [x] **6.2 UI Controls**: Implement sliders for Waveform, ADSR Envelope, and Filter.
    - [x] *6.3 Test: Property 10 (Real-time Parameters).*

- [ ] **7. Preset System**
    - [ ] **7.1 Configuration Management**: Save/Load sound states.
    - [ ] _Requirements: 6.4_

## Phase 4: Optimization & Polish

- [ ] **8. Performance & Compatibility**
    - [ ] **8.1 Optimization**: Object pooling for visuals and voice recycling improvements.
    - [ ] **8.2 Device Adaptation**: Advanced capability detection.
    - [ ] *8.3 Test: Property 12, 13 (Performance & Resources).*