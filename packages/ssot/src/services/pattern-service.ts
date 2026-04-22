import { createBaseEntity, nowIso, type PatternRecord, type TaskProjectionState } from "@nex/core";

import type { EventRepository, PatternRecordRepository } from "../repositories/memory-repository";
import type { ProjectionService } from "./projection-service";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export class PatternService {
  constructor(
    private readonly patterns: PatternRecordRepository,
    private readonly events: EventRepository,
    private readonly projections: ProjectionService,
  ) {}

  async refreshWorkspacePatterns(workspaceId: string): Promise<PatternRecord[]> {
    const [taskProjections, existing] = await Promise.all([
      this.projections.listTaskProjectionsByWorkspace(workspaceId),
      this.patterns.listByWorkspace(workspaceId),
    ]);

    const nextIds = new Set<string>();
    const results: PatternRecord[] = [];

    for (const projection of taskProjections) {
      const records = await this.detectTaskPatterns(projection);
      for (const record of records) {
        nextIds.add(record.id);
        results.push(await this.saveOrUpdate(record, existing.find((candidate) => candidate.id === record.id) ?? null));
      }
    }

    for (const record of existing) {
      if (record.status === "OPEN" && !nextIds.has(record.id)) {
        await this.patterns.save({
          ...record,
          status: "RESOLVED",
          updatedAt: nowIso(),
        });
      }
    }

    return this.patterns.listOpenByWorkspace(workspaceId);
  }

  private async detectTaskPatterns(projection: TaskProjectionState): Promise<PatternRecord[]> {
    const records: PatternRecord[] = [];
    const taskEvents = await this.events.listByScope("task", projection.taskId);
    const failEvents = taskEvents.filter((event) => event.eventType === "task_transitioned" && event.payload.toStatus === "FAIL").length;
    const latestEvent = taskEvents[0];

    if (failEvents >= 2) {
      records.push(this.createPattern(projection.workspaceId, projection.taskId, "repeated_blocker", failEvents, "Task has entered FAIL repeatedly."));
    }

    if (projection.taskStatus === "DONE" && !projection.canMoveToDone) {
      records.push(this.createPattern(projection.workspaceId, projection.taskId, "silent_drift", 1, "Task is marked DONE without satisfying truth closure."));
    }

    if (
      projection.taskStatus === "IN_PROGRESS" &&
      latestEvent &&
      Date.now() - new Date(latestEvent.createdAt).getTime() > ONE_DAY_MS
    ) {
      records.push(this.createPattern(projection.workspaceId, projection.taskId, "stalled_task", 1, "Task is in progress without recent state change."));
    }

    return records;
  }

  private createPattern(
    workspaceId: string,
    taskId: string,
    patternType: PatternRecord["patternType"],
    occurrenceCount: number,
    summary: string,
  ): PatternRecord {
    const timestamp = nowIso();

    return {
      ...createBaseEntity(`pattern_${patternType}_${taskId}`, timestamp),
      workspaceId,
      scopeType: "task",
      scopeId: taskId,
      patternType,
      summary,
      occurrenceCount,
      status: "OPEN",
    };
  }

  private async saveOrUpdate(next: PatternRecord, existing: PatternRecord | null): Promise<PatternRecord> {
    const record = existing
      ? {
          ...existing,
          summary: next.summary,
          occurrenceCount: next.occurrenceCount,
          status: "OPEN" as const,
          updatedAt: nowIso(),
        }
      : next;

    await this.patterns.save(record);
    return record;
  }
}

