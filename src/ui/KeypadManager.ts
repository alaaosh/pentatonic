const STORAGE_KEY = 'pentatonic-keypad-name';
const DEFAULT_NAME = 'Pentatonic Synth';

export class KeypadManager {
  private _storage: Storage;
  private _name: string;

  constructor(storage: Storage = localStorage) {
    this._storage = storage;
    this._name = storage.getItem(STORAGE_KEY) ?? DEFAULT_NAME;
  }

  get name(): string {
    return this._name;
  }

  rename(newName: string): void {
    const trimmed = newName.trim();
    this._name = trimmed.length > 0 ? trimmed : DEFAULT_NAME;
    this._storage.setItem(STORAGE_KEY, this._name);
  }
}
