import { describe, it, expect, beforeEach } from 'vitest';
import { KeypadManager } from '../KeypadManager';

class MockStorage implements Storage {
  private store: Record<string, string> = {};
  get length() { return Object.keys(this.store).length; }
  key(index: number) { return Object.keys(this.store)[index] ?? null; }
  getItem(key: string) { return this.store[key] ?? null; }
  setItem(key: string, value: string) { this.store[key] = value; }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

describe('KeypadManager', () => {
  let storage: MockStorage;

  beforeEach(() => {
    storage = new MockStorage();
  });

  it('returns the default name when no name is stored', () => {
    const manager = new KeypadManager(storage);
    expect(manager.name).toBe('Pentatonic Synth');
  });

  it('loads a previously saved name from storage', () => {
    storage.setItem('pentatonic-keypad-name', 'My Keypad');
    const manager = new KeypadManager(storage);
    expect(manager.name).toBe('My Keypad');
  });

  it('renames the keypad and persists to storage', () => {
    const manager = new KeypadManager(storage);
    manager.rename('Jazz Pad');
    expect(manager.name).toBe('Jazz Pad');
    expect(storage.getItem('pentatonic-keypad-name')).toBe('Jazz Pad');
  });

  it('trims whitespace from the new name', () => {
    const manager = new KeypadManager(storage);
    manager.rename('  Blues Riff  ');
    expect(manager.name).toBe('Blues Riff');
  });

  it('falls back to the default name when given an empty string', () => {
    const manager = new KeypadManager(storage);
    manager.rename('');
    expect(manager.name).toBe('Pentatonic Synth');
  });

  it('falls back to the default name when given only whitespace', () => {
    const manager = new KeypadManager(storage);
    manager.rename('   ');
    expect(manager.name).toBe('Pentatonic Synth');
  });

  it('persists the default name when empty string is provided', () => {
    const manager = new KeypadManager(storage);
    manager.rename('');
    expect(storage.getItem('pentatonic-keypad-name')).toBe('Pentatonic Synth');
  });
});
