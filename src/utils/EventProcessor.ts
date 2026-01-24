import { HarmonyType, ChordType } from '../audio/ScaleManager';

export enum EventType {
  NOTE_ON = 'NOTE_ON',
  NOTE_OFF = 'NOTE_OFF',
  NOTE_MODULATE = 'NOTE_MODULATE',
  PARAM_CHANGE = 'PARAM_CHANGE'
}

export interface NoteOnEvent {
  index: number;
  frequency: number;
  velocity: number;
  harmonyType: HarmonyType;
  chordType: ChordType;
  octave: number;
}

export interface NoteOffEvent {
  index: number;
  octave: number;
}

export interface NoteModulateEvent {
  index: number;
  octave: number;
  pitchBend: number; // -1 to 1 (semitones)
  timbre: number;   // 0 to 1 (filter offset)
}

export interface ParamChangeEvent {
  param: string;
  value: any;
}

type Callback<T> = (data: T) => void;

export class EventProcessor {
  private subscribers: Map<EventType, Callback<any>[]> = new Map();

  subscribe<T>(type: EventType, callback: Callback<T>) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, []);
    }
    this.subscribers.get(type)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const list = this.subscribers.get(type);
      if (list) {
        this.subscribers.set(type, list.filter(cb => cb !== callback));
      }
    };
  }

  emit<T>(type: EventType, data: T) {
    const list = this.subscribers.get(type);
    if (list) {
      list.forEach(cb => cb(data));
    }
  }
}

export const globalEvents = new EventProcessor();
