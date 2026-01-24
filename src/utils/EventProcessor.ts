import { HarmonyType } from '../audio/ScaleManager';

export enum EventType {
  NOTE_ON = 'NOTE_ON',
  NOTE_OFF = 'NOTE_OFF',
  PARAM_CHANGE = 'PARAM_CHANGE'
}

export interface NoteOnEvent {
  index: number;
  frequency: number;
  velocity: number;
  harmonyType: HarmonyType;
}

export interface NoteOffEvent {
  index: number;
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
