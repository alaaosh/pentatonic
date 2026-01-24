# Pentatonic Synth

A web-based virtual instrument that transforms touch devices into expressive musical instruments. This synth uses the pentatonic scale to provide an accessible yet musically rich playing experience, featuring real-time synthesis and visual feedback.

## Features

- **Pentatonic Scale Synthesis**: Mathematically accurate pentatonic tuning across multiple keys.
- **Multi-touch Support**: Play chords and melodies simultaneously with a responsive touch interface.
- **Glissando Interaction**: Smoothly slide between notes with both touch and mouse input.
- **Keyboard Mapping**: Play using your computer keyboard (Keys: `A`, `S`, `D`, `F`, `G`).
- **Real-time Visuals**: High-performance Canvas rendering providing immediate feedback for interactions.
- **Modular Architecture**: Clean separation between audio synthesis, input handling, and visual rendering.

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


