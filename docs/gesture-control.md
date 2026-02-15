# Gesture Control - Proof of Concept

## Overview

The Pentatonic Synth now includes experimental camera-based hand gesture control using MediaPipe Hands for real-time hand tracking.

## How It Works

1. Click the "📷 Camera Control" button in the bottom-right corner
2. Allow camera permissions when prompted
3. Position your hand in front of the camera
4. Use these gestures to play:

### Gesture Mapping

- **Index Finger X Position**: Controls which of the 5 pentatonic notes to play
  - Left edge = Note 1
  - Right edge = Note 5
  
- **Index Finger Y Position**: Controls octave (3 levels)
  - Top of frame = Octave 5 (high)
  - Middle = Octave 4 (mid)
  - Bottom = Octave 3 (low)

- **Pinch (Thumb + Index)**: Activates/plays the note
  - Bring thumb and index finger together to trigger sound
  - Release to stop the note

- **Z Depth**: Controls velocity/volume
  - Closer to camera = louder
  - Further from camera = quieter

## Technical Details

### Dependencies

- MediaPipe Hands (loaded via CDN)
- MediaPipe Camera Utils (loaded via CDN)

### Implementation

- `GestureController.ts`: Main gesture tracking and mapping logic
- Hand landmark detection using 21 key points
- Real-time gesture extraction at camera frame rate
- Visual feedback showing hand skeleton overlay

### Performance

- Model Complexity: 0 (fastest, less accurate - suitable for prototype)
- Detection Confidence: 0.5
- Tracking Confidence: 0.5
- Max Hands: 1

## Limitations (Proof of Concept)

- Single hand tracking only
- Requires good lighting conditions
- Pinch detection threshold may need tuning
- No gesture smoothing/filtering (can be jittery)
- Camera must remain active while panel is open

## Future Improvements

- Multi-hand support for polyphonic playing
- Gesture smoothing and prediction
- Custom gesture training
- Hand orientation for additional parameters
- Finger spread for chord voicing
- Palm distance for effects control
