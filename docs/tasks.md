# Implementation Tasks: Pentatonic Synth

## Overview

This document outlines the step-by-step plan to build the modular Pentatonic Synth. The tasks move from core audio foundations to touch interface, visual feedback, and finally integration and polish.

## Phase 1: Infrastructure & Refactoring Strategy

This phase focuses on modernizing the stack and extracting logic from the legacy monolithic files into the new modular architecture.

- [ ] **1. Infrastructure Migration**
    - [ ] 1.1 Initialize `package.json` and install dependencies (Vite, TypeScript).
    - [ ] 1.2 Setup testing harness (Vitest, fast-check).
    - [ ] 1.3 Configure Linting & Formatting (ESLint, Prettier).
    - [ ] 1.4 Setup CI/CD pipeline (GitHub Actions).

- [ ] **2. Core Logic Extraction (Refactoring)**
    - [ ] **2.1 Extract ScaleManager**: Migrate scale logic from `instrument.js` to a pure TypeScript module.
        - Implement `generatePentatonicFrequencies`, `transposeScale`.
        - *Test: Properties 6, 7, 8 (Scale Accuracy).*
    - [ ] **2.2 Extract AudioEngine**: Migrate audio synthesis from `audio-engine.js` to TypeScript.
        - Implement `SynthesisEngine` class with strict typing.
        - *Test: Property 1 & Unit tests for voice management.*
    - [ ] **2.3 Extract VisualRenderer**: Migrate canvas drawing from `instrument.js` to `VisualRenderer.ts`.
        - *Test: Property 9 (Layout).*

## Phase 2: Input & Interaction

- [ ] **3. Enhanced Input Handling**
    - [ ] **3.1 TouchHandler Component**: Implement robust multi-touch processing.
        - Pressure normalization.
        - *Test: Property 2, 4, 5.*
    - [ ] **3.2 Accessibility Layer (New)**:
        - Implement Keyboard mapping (A-S-D-F-G).
        - Add ARIA labels and focus management.
        - *Test: Verify keyboard interaction & screen reader support.*

- [ ] **4. Event Coordination**
    - [ ] **4.1 EventProcessor**: Implement Pub/Sub pattern.
        - Decouple Touch/Keyboard events from Audio/Visual consumers.
    - [ ] *4.2 Test: End-to-end integration.*


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
