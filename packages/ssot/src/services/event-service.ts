import { createBaseEntity, createId, nowIso, type EventRecord, type NexActorType, type NexEventType, type NexScopeType } from "@nex/core";

import type { EventRepository } from "../repositories/memory-repository";

export interface RecordEventInput {
  workspaceId: string;
  scopeType: NexScopeType;
  scopeId: string;
  eventType: NexEventType;
  actorType: NexActorType;
  actorRef: string;
  summary: string;
  payload?: Record<string, unknown>;
}

export class EventService {
  constructor(private readonly events: EventRepository) {}

  async record(input: RecordEventInput): Promise<EventRecord> {
    const timestamp = nowIso();
    const event: EventRecord = {
      ...createBaseEntity(createId("event"), timestamp),
      workspaceId: input.workspaceId,
      scopeType: input.scopeType,
      scopeId: input.scopeId,
      eventType: input.eventType,
      actorType: input.actorType,
      actorRef: input.actorRef,
      summary: input.summary,
      payload: input.payload ?? {},
    };

    await this.events.save(event);
    return event;
  }
}

