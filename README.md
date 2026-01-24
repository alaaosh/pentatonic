# Pentatonic Synth

**Pentatonic Synth** is an original virtual instrument designed to bridge the gap between intuitive playability and sophisticated musical complexity. It leverages the accessible, "never-wrong" nature of the pentatonic scale for user interaction while exploiting the full richness of music theory to produce complex, multi-layered harmonic outputs.

## Philosophy

The core design principle is **Intuitive Interface, Sophisticated Output**. 

Pentatonic Synth seeks to **democratize complex musical expression**. By exploiting the "never-wrong" nature of the pentatonic scale, it provides a gateway for users without formal musical training to explore and perform sophisticated, chromatic harmonies. The instrument handles the complexity of music theory under the hood, allowing the user to focus on pure creative intuition while producing professional-grade musical results.

## Features

- **Intuitive Pentatonic Input**: A streamlined touch interface based on major, minor, blues, and traditional Japanese scales.
- **Rich Harmonic Synthesis**: Real-time generation of complex harmonies that transcend the 5-note scale, providing professional-grade musical depth.
- **Multi-touch & Glissando**: Support for expressive gestures, allowing for fluid melodic runs and powerful chordal stacks.
- **Looping Arpeggiator**: Dynamic, time-based note patterns that respond to touch duration and pressure.
- **Keyboard Mapping**: Professional desktop support via mapped keys (`A`, `S`, `D`, `F`, `G`).

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

To start the development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Production Build

To create an optimized production build:

```bash
npm run build
```

The output will be generated in the `dist/` directory.

### Running Tests

Execute unit and property-based tests using Vitest:

```bash
npm run test
```

## Controls

- **Touch/Mouse**: Tap or click the colored note areas. Slide across areas to play glissando.
- **Keyboard**:
  - `A`: Root Note
  - `S`: Second
  - `D`: Third
  - `F`: Fifth
  - `G`: Sixth

## Documentation

- [Design Architecture](./docs/design.md)
- [Requirements](./docs/requirements.md)
- [Implementation Tasks](./docs/tasks.md)

## License



GPLv3 or later


