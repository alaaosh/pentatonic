# Pentatonic Synth

**Pentatonic Synth** is an original virtual instrument designed to bridge the gap between intuitive playability and sophisticated musical complexity. It leverages the accessible, "never-wrong" nature of the pentatonic scale for user interaction while exploiting the full richness of music theory to produce complex, multi-layered harmonic outputs.

## Philosophy

The core design principle is **Intuitive Interface, Sophisticated Output**. 

Pentatonic Synth seeks to **democratize complex musical expression**. By exploiting the "never-wrong" nature of the pentatonic scale, it provides a gateway for users without formal musical training to explore and perform sophisticated, chromatic harmonies. The instrument handles the complexity of music theory under the hood, allowing the user to focus on pure creative intuition while producing professional-grade musical results.

## Features

- **Intuitive Pentatonic Input**: A streamlined touch interface supporting Major, Minor, Blues, Yo, and Hirajoshi scales.
- **Independent Multi-Octave Range**: A unique 3-octave vertical split layout (25%/50%/25%) allowing simultaneous playback across different registers.
- **Rich Harmonic Synthesis**: Real-time generation of complex chromatic harmonies (Maj7, Min9, Sus4, etc.) that transcend the 5-note scale.
- **Custom Musical Widgets**:
    - **Chromatic Root Strip**: A 12-note grid for instant transposition.
    - **Performance Mode Tabs**: Tactile segmented controls for switching between Single, Chord, Power, and Arpeggio modes.
    - **Multi-Handle Octave Slider**: A single-track controller with shading-matched pegs for defining the range of each UI row.
- **Looping Arpeggiator**: Dynamic, time-based note patterns that respond to touch duration.
- **Responsive Workspace**: Landscape-optimized layout with sidebar-hosted controls, collapsing into a clean stack for mobile portrait use.
- **Audio Safety**: Explicit "Start Instrument" overlay to comply with browser autoplay policies and ensure immediate sound.

## Technology Stack

- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Audio**: [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- **Visuals**: [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- **Testing**: [Vitest](https://vitest.dev/) & [fast-check](https://fast-check.dev/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (usually comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/alaaosh/pentatonic.git
   cd pentatonic
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

To start the development server:
```bash
npm run dev
```

### Production Build

```bash
npm run build
```

## Controls

- **Touch/Mouse**: Tap/click the colored zones. Vertical position determines the octave (Bottom/Mid/Top).
- **Keyboard**: Keys `A`, `S`, `D`, `F`, `G` map to the five pentatonic notes (Center Octave).
- **Camera Gestures** (Experimental): Click the camera button to enable hand gesture control. Move your index finger to select notes, pinch thumb+index to play.
- **UI Widgets**:
    - **Root Grid**: Select the fundamental key.
    - **Octave Slider**: Move the three pegs (Dark/Mid/Light grey) to set the octave for each UI row.
    - **Harmony Tabs**: Choose the trigger mode (Single, Chord, Power, Arp).

## Documentation

- [Design Architecture](./docs/design.md)
- [Requirements](./docs/requirements.md)
- [Implementation Tasks](./docs/tasks.md)
- [Gesture Control (Experimental)](./docs/gesture-control.md)

## License

GPLv3 or later