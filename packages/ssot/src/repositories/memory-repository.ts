import type { EventRecord, NexProjectionType, NexScopeType, PatternRecord, ResumePacket, StateProjection } from "@nex/core";

import type { FileNexStore } from "../store/file-nex-store";
import { sortByCreatedAtDesc, upsertById } from "./helpers";

export class EventRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByWorkspace(workspaceId: string): Promise<EventRecord[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.events.filter((event) => event.workspaceId === workspaceId));
  }

  async listByScope(scopeType: NexScopeType, scopeId: string): Promise<EventRecord[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.events.filter((event) => event.scopeType === scopeType && event.scopeId === scopeId));
  }

  async save(event: EventRecord): Promise<EventRecord> {
    await this.store.update((database) => {
      upsertById(database.events, event);
    });

    return event;
  }
}

export class ProjectionRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByWorkspace(workspaceId: string, projectionType?: NexProjectionType): Promise<StateProjection[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(
      database.stateProjections.filter(
        (projection) => projection.workspaceId === workspaceId && (!projectionType || projection.projectionType === projectionType),
      ),
    );
  }

  async getByScope(scopeType: NexScopeType, scopeId: string, projectionType: NexProjectionType): Promise<StateProjection | null> {
    const database = await this.store.read();
    return (
      database.stateProjections.find(
        (projection) =>
          projection.scopeType === scopeType && projection.scopeId === scopeId && projection.projectionType === projectionType,
      ) ?? null
    );
  }

  async save(projection: StateProjection): Promise<StateProjection> {
    await this.store.update((database) => {
      upsertById(database.stateProjections, projection);
    });

    return projection;
  }
}

export class ResumePacketRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByWorkspace(workspaceId: string): Promise<ResumePacket[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.resumePackets.filter((packet) => packet.workspaceId === workspaceId));
  }

  async getByScope(scopeType: ResumePacket["scopeType"], scopeId: string): Promise<ResumePacket | null> {
    const database = await this.store.read();
    return database.resumePackets.find((packet) => packet.scopeType === scopeType && packet.scopeId === scopeId) ?? null;
  }

  async save(packet: ResumePacket): Promise<ResumePacket> {
    await this.store.update((database) => {
      upsertById(database.resumePackets, packet);
    });

    return packet;
  }
}

export class PatternRecordRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByWorkspace(workspaceId: string): Promise<PatternRecord[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.patternRecords.filter((record) => record.workspaceId === workspaceId));
  }

  async listOpenByWorkspace(workspaceId: string): Promise<PatternRecord[]> {
    const records = await this.listByWorkspace(workspaceId);
    return records.filter((record) => record.status === "OPEN");
  }

  async getById(id: string): Promise<PatternRecord | null> {
    const database = await this.store.read();
    return database.patternRecords.find((record) => record.id === id) ?? null;
  }

  async save(record: PatternRecord): Promise<PatternRecord> {
    await this.store.update((database) => {
      upsertById(database.patternRecords, record);
    });

    return record;
  }
}

