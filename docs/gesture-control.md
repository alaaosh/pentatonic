# Gesture Control - Air Piano

## Overview

The Pentatonic Synth features a revolutionary "Air Piano" interface that allows you to play using natural hand gestures. By tracking the bending of individual fingers, the system enables full polyphonic expression without touching the screen.

## How It Works

1. Click the "📷 Camera Control" button in the bottom-right corner.
2. Allow camera permissions.
3. Position **both hands** in front of the camera.
4. **Bend a finger** to play a note.
5. **Straighten** the finger to stop the note.
6. **Move your hand up/down** while holding a note to bend the pitch (vibrato).

## Finger Mapping (10 Notes)

The system maps your 10 fingers to two octaves of the pentatonic scale, creating a linear progression from left to right.

### Left Hand (Bass - Octave 3)

| Finger | Note Index | Role |
| :--- | :--- | :--- |
| **Pinky** | 0 | Root |
| **Ring** | 1 | 2nd |
| **Middle** | 2 | 3rd |
| **Index** | 3 | 5th |
| **Thumb** | 4 | 6th |

### Right Hand (Melody - Octave 5)

| Finger | Note Index | Role |
| :--- | :--- | :--- |
| **Thumb** | 0 | Root |
| **Index** | 1 | 2nd |
| **Middle** | 2 | 3rd |
| **Ring** | 3 | 5th |
| **Pinky** | 4 | 6th |

## Visual Feedback

- **Skeleton Overlay**: Shows the real-time tracking of your hand joints.
- **Yellow Dots**: Inactive fingers.
- **Red Dots**: Active (playing) fingers.

## Technical Implementation

- **Library**: MediaPipe Hands (via CDN)
- **Detection**: Joint-angle calculation (dot product of vectors)
- **Polyphony**: Independent state tracking for all 10 fingers
- **Modulation**: Relative Y-axis movement during active state triggers pitch bend

## Tips for Performance

- **Lighting**: Ensure your hands are well-lit.
- **Background**: A plain background helps tracking stability.
- **Distance**: Keep hands about 1-2 feet from the camera.
- **Separation**: Try to keep fingers slightly separated so the camera can see the joints clearly.
