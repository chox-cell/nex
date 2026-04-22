import { NexEvent } from './types';

export class EventWriter {
  static create(input: Omit<NexEvent, 'id' | 'createdAt'>): NexEvent {
    return {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...input,
    };
  }
}
