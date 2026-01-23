# Implementation Tasks: Pentatonic Synth

## Overview

This document outlines the step-by-step plan to build the modular Pentatonic Synth. The tasks move from core audio foundations to touch interface, visual feedback, and finally integration and polish.

## Phase 1: Foundation & Audio Core

- [ ] **1. Project Setup**
    - [x] Create basic HTML/CSS structure.
    - [x] Initialize Web Audio API context.
    - [ ] Configure audio context suspension handling.
    - _Requirements: 3.1, 8.2_

- [ ] **2. Pentatonic Scale Logic**
    - [ ] **2.1 ScaleManager Component**: Implement frequency calculations and transposition.
        - `generatePentatonicFrequencies(root, octave)`
        - `transposeScale(newRoot)`
        - `getFrequency(noteIndex, octave)`
    - [ ] *2.2 Test: Property 6 (Scale Accuracy)*
    - [ ] *2.3 Test: Property 7 (Transposition)*
    - [ ] *2.4 Test: Property 8 (Octave Relations)*
    - _Requirements: 4.1, 4.2, 4.4_

- [ ] **3. Synthesis Engine**
    - [ ] **3.1 SynthesisEngine Component**: Implement oscillator and voice management.
        - `createOscillator(freq, waveform)`
        - ADSR Envelope implementation (`applyEnvelope`)
        - Voice pool (limit 10+ voices, recycling strategy)
    - [ ] *3.2 Test: Property 1 (Audio Latency)*
    - [ ] *3.3 Test: Unit tests for voice management*
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

## Phase 2: Input & Interaction

- [ ] **4. Touch Handling**
    - [ ] **4.1 TouchHandler Component**: Manage multi-touch and gestures.
        - `handleTouchStart`, `Move`, `End`
        - Pressure detection (with fallback)
        - Coordinate normalization
    - [ ] *4.2 Test: Property 2 (Multi-touch)*
    - [ ] *4.3 Test: Property 5 (Filtering)*
    - [ ] *4.4 Test: Property 4 (Pressure)*
    - _Requirements: 2.1 - 2.5, 8.5_

- [ ] **5. Visual Interface**
    - [ ] **5.1 VisualRenderer Component**: Canvas-based rendering.
        - `renderNoteAreas()` (responsive)
        - `updateTouchFeedback()` (animations)
        - `animateNoteActivation()`
    - [ ] *5.2 Test: Property 9 (Layout Consistency)*
    - [ ] *5.3 Test: Property 1 (Visual Feedback)*
    - [ ] *5.4 Test: Property 3 (Release Behavior)*
    - _Requirements: 1.1 - 1.5, 5.1 - 5.5_

## Phase 3: Integration & Features

- [ ] **6. System Integration**
    - [ ] **6.1 EventProcessor**: Wire components together.
        - Connect `TouchHandler` -> `ScaleManager` -> `SynthesisEngine`
        - Sync Visuals with Audio events.
    - [ ] *6.2 Test: End-to-end pipeline integration*

- [ ] **7. Advanced Controls**
    - [ ] **7.1 UI Controls**: Parameter adjustment.
        - Waveform, Envelope, Filter, Volume controls.
        - Preset system.
    - [ ] *7.2 Test: Property 10 (Real-time Parameters)*
    - [ ] *7.3 Test: Property 11 (Presets)*
    - _Requirements: 6.1 - 6.5_

## Phase 4: Optimization & Polish

- [ ] **8. Performance & Compatibility**
    - [ ] **8.1 Optimization**:
        - Object pooling for visuals.
        - Graceful degradation (polyphony reduction).
    - [ ] **8.2 Device Adaptation**:
        - Capability detection (Audio/Touch).
    - [ ] *8.3 Test: Property 12 (Performance)*
    - [ ] *8.4 Test: Property 13 (Resource Mgmt)*
    - [ ] *8.5 Test: Property 14 (Compatibility)*
    - _Requirements: 7.1 - 7.5, 8.1 - 8.5_

## Notes
- Tasks marked with `*` involve writing property-based or unit tests.
- Checked items `[x]` indicate functionality that is likely partially covered by the current MVP but may need refactoring to meet the modular design.
