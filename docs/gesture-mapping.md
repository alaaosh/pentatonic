# Gesture Control Mapping

## Visual Guide

```
Camera View (640x480)
┌─────────────────────────────────────────┐
│  Octave 5 (High)                        │
│  ┌───┬───┬───┬───┬───┐                  │
│  │ 1 │ 2 │ 3 │ 4 │ 5 │  ← Index X Pos  │
│  └───┴───┴───┴───┴───┘                  │
├─────────────────────────────────────────┤
│  Octave 4 (Mid)                         │
│  ┌───┬───┬───┬───┬───┐                  │
│  │ 1 │ 2 │ 3 │ 4 │ 5 │  ← Index Y Pos  │
│  └───┴───┴───┴───┴───┘                  │
├─────────────────────────────────────────┤
│  Octave 3 (Low)                         │
│  ┌───┬───┬───┬───┬───┐                  │
│  │ 1 │ 2 │ 3 │ 4 │ 5 │                  │
│  └───┴───┴───┴───┴───┘                  │
└─────────────────────────────────────────┘
```

## Hand Landmarks Used

MediaPipe Hands provides 21 landmarks per hand:

```
        8 (Index Tip) ← Primary control point
       /
      7
     /
    6
   /
  5
   \
    \  4 (Thumb Tip) ← Pinch detection
     \
      3
       \
        2
         \
          1
           \
            0 (Wrist)
```

## Gesture Detection Logic

### Note Selection
```typescript
// X position (0-1) → Note index (0-4)
noteIndex = floor(indexTip.x * 5)
// Maps: 0.0-0.2 → 0, 0.2-0.4 → 1, etc.
```

### Octave Selection
```typescript
// Y position (0-1) → Octave (5-3)
octave = floor(5 - indexTip.y * 2)
// Maps: 0.0-0.33 → 5, 0.33-0.66 → 4, 0.66-1.0 → 3
```

### Pinch Detection
```typescript
// Distance between thumb tip and index tip
distance = sqrt((thumb.x - index.x)² + (thumb.y - index.y)²)
isActive = distance < 0.08  // Threshold
```

### Velocity/Volume
```typescript
// Z depth (closer = louder)
velocity = 1 - (indexTip.z + 0.1)
// Clamped to 0-1 range
```

## Tips for Best Results

1. **Lighting**: Ensure good, even lighting on your hand
2. **Background**: Plain backgrounds work best
3. **Distance**: Keep hand 1-2 feet from camera
4. **Orientation**: Palm facing camera works best
5. **Movement**: Smooth, deliberate movements reduce jitter
6. **Pinch**: Clear pinch gesture (thumb and index touching)

## Troubleshooting

- **No hand detected**: Check lighting and camera permissions
- **Jittery notes**: Move hand more slowly, consider adding smoothing
- **Wrong notes**: Calibrate by testing each zone systematically
- **No sound**: Ensure pinch gesture is clear (fingers touching)
- **Latency**: Close other applications, use faster device
