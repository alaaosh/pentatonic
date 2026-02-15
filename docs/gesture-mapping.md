# Gesture Control Mapping (Air Piano)

## Visual Guide

The "Air Piano" mapping uses your 10 fingers to play notes. The progression is linear from left to right, similar to a piano keyboard.

```
       LEFT HAND (Bass)                     RIGHT HAND (Melody)
      (Octave 3 - Low)                      (Octave 5 - High)

      Pinky Ring Mid  Idx  Thumb       Thumb Idx  Mid  Ring Pinky
      ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐       ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
Note: │ 0 │ │ 1 │ │ 2 │ │ 3 │ │ 4 │       │ 0 │ │ 1 │ │ 2 │ │ 3 │ │ 4 │
      └───┘ └───┘ └───┘ └───┘ └───┘       └───┘ └───┘ └───┘ └───┘ └───┘
```

## Gesture Detection Logic

### 1. Finger Bend (Trigger)
Instead of tracking position on a grid, the system detects when you **bend a finger**.

- **Straight Finger (Angle ~180°)**: Note OFF
- **Bent Finger (Angle < 150°)**: Note ON

### 2. Pitch Modulation (Vibrato)
While a finger is held bent (Note ON):
- **Move Hand UP**: Bends pitch UP (+1 semitone max)
- **Move Hand DOWN**: Bends pitch DOWN (-1 semitone max)

### 3. Special Gestures
- **Closed Fist**: Making a fist (bending 4 or more fingers simultaneously) will **Stop/Fade** all notes on that hand. This is useful for quickly cutting sound.
- **Hands Outside Frame**: If your hands leave the camera view, all sound stops immediately.

## Hand Landmarks Used

MediaPipe Hands tracks 21 landmarks. We calculate the angle between three points for each finger to detect bending.

**Example: Index Finger**
- **Base**: Landmark 5 (MCP)
- **Joint**: Landmark 6 (PIP) - *We measure the angle here*
- **Tip**: Landmark 8 (TIP)

## Troubleshooting

- **False Triggers**: If notes play when your fingers are straight, try moving further from the camera.
- **Missing Notes**: If bending doesn't trigger a note, ensure the lighting is good and the camera can see your finger joints clearly.
- **Thumb Issues**: Thumbs move differently than fingers. Try bending the tip of your thumb inward clearly.
