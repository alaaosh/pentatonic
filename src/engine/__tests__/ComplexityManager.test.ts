import { describe, it, expect, vi } from 'vitest';
import { ComplexityManager } from '../ComplexityManager';

describe('ComplexityManager', () => {
  it('should initialize with complexity 0', () => {
    const cm = new ComplexityManager();
    expect(cm.complexity).toBe(0);
  });

  it('should clamp values to 0–1 range', () => {
    const cm = new ComplexityManager();
    cm.setComplexity(-0.5);
    expect(cm.complexity).toBe(0);
    cm.setComplexity(1.5);
    expect(cm.complexity).toBe(1);
  });

  it('should report zero intensity for all modules at complexity 0', () => {
    const cm = new ComplexityManager();
    cm.setComplexity(0);
    const { shifter, weaver, cloud } = cm.intensity;
    expect(shifter).toBe(0);
    expect(weaver).toBe(0);
    expect(cloud).toBe(0);
  });

  it('should report full intensity for all modules at complexity 1', () => {
    const cm = new ComplexityManager();
    cm.setComplexity(1);
    const { shifter, weaver, cloud } = cm.intensity;
    expect(shifter).toBe(1);
    expect(weaver).toBe(1);
    expect(cloud).toBe(1);
  });

  it('should activate shifter before weaver before cloud', () => {
    const cm = new ComplexityManager();

    // At 0.15: only shifter should be active
    cm.setComplexity(0.15);
    expect(cm.intensity.shifter).toBeGreaterThan(0);
    expect(cm.intensity.weaver).toBe(0);
    expect(cm.intensity.cloud).toBe(0);

    // At 0.35: shifter and weaver active, cloud still off
    cm.setComplexity(0.35);
    expect(cm.intensity.shifter).toBeGreaterThan(0);
    expect(cm.intensity.weaver).toBeGreaterThan(0);
    expect(cm.intensity.cloud).toBe(0);

    // At 0.5: all three active
    cm.setComplexity(0.5);
    expect(cm.intensity.shifter).toBeGreaterThan(0);
    expect(cm.intensity.weaver).toBeGreaterThan(0);
    expect(cm.intensity.cloud).toBeGreaterThan(0);
  });

  it('should produce monotonically increasing intensities', () => {
    const cm = new ComplexityManager();
    let prevShifter = 0, prevWeaver = 0, prevCloud = 0;

    for (let i = 0; i <= 100; i++) {
      cm.setComplexity(i / 100);
      const { shifter, weaver, cloud } = cm.intensity;
      expect(shifter).toBeGreaterThanOrEqual(prevShifter);
      expect(weaver).toBeGreaterThanOrEqual(prevWeaver);
      expect(cloud).toBeGreaterThanOrEqual(prevCloud);
      prevShifter = shifter;
      prevWeaver = weaver;
      prevCloud = cloud;
    }
  });

  it('should notify listeners on change', () => {
    const cm = new ComplexityManager();
    const callback = vi.fn();
    cm.onChange(callback);
    cm.setComplexity(0.5);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(cm.intensity, 0.5);
  });

  it('should allow unsubscribing', () => {
    const cm = new ComplexityManager();
    const callback = vi.fn();
    const unsub = cm.onChange(callback);
    unsub();
    cm.setComplexity(0.5);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should return appropriate harmony modes at different levels', () => {
    const cm = new ComplexityManager();

    cm.setComplexity(0.1);
    expect(cm.getHarmonyMode()).toBe('none');

    cm.setComplexity(0.3);
    expect(cm.getHarmonyMode()).toBe('power');

    cm.setComplexity(0.6);
    expect(cm.getHarmonyMode()).toBe('chord');

    cm.setComplexity(0.85);
    expect(cm.getHarmonyMode()).toBe('arpeggio');
  });

  it('should return appropriate waveforms at different levels', () => {
    const cm = new ComplexityManager();

    cm.setComplexity(0.1);
    expect(cm.getWaveform()).toBe('sine');

    cm.setComplexity(0.35);
    expect(cm.getWaveform()).toBe('triangle');

    cm.setComplexity(0.6);
    expect(cm.getWaveform()).toBe('sawtooth');

    cm.setComplexity(0.9);
    expect(cm.getWaveform()).toBe('square');
  });
});
