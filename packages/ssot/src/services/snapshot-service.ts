import { createBaseEntity, createId, nowIso, type Snapshot } from "@nex/core";

import type { SnapshotRepository } from "../repositories/truth-repository";
import type { EventService } from "./event-service";
import type { ProjectionService } from "./projection-service";
import type { TaskScopeService } from "./task-scope-service";
import type { TruthSyncService } from "./truth-sync-service";

export interface SaveTaskSnapshotInput {
  taskId: string;
  label: string;
  summary: string;
  createdBy: string;
}

export class SnapshotService {
  constructor(
    private readonly snapshots: SnapshotRepository,
    private readonly scope: TaskScopeService,
    private readonly projections: ProjectionService,
    private readonly events: EventService,
    private readonly sync: TruthSyncService,
  ) {}

  async saveTaskSnapshot(input: SaveTaskSnapshotInput): Promise<Snapshot> {
    const resolved = await this.scope.resolveTask(input.taskId);
    const taskProjection = (await this.projections.getTaskProjection(resolved.task.id)) ?? (await this.projections.refreshTaskProjection(resolved.task.id));
    const sprintProjection =
      (await this.projections.getSprintProjection(resolved.sprint.id)) ?? (await this.projections.refreshSprintProjection(resolved.sprint.id));

    const record: Snapshot = {
      ...createBaseEntity(createId("snapshot"), nowIso()),
      workspaceId: resolved.workspaceId,
      scopeType: "task",
      scopeId: resolved.task.id,
      taskId: resolved.task.id,
      sprintId: resolved.sprint.id,
      projectId: resolved.project.id,
      label: input.label,
      summary: input.summary,
      payload: {
        task: resolved.task,
        taskProjection,
        sprintProjection,
      },
      createdBy: input.createdBy,
    };

    await this.snapshots.save(record);
    await this.events.record({
      workspaceId: resolved.workspaceId,
      scopeType: "task",
      scopeId: resolved.task.id,
      eventType: "snapshot_saved",
      actorType: "founder",
      actorRef: input.createdBy,
      summary: `Snapshot saved: ${input.label}`,
      payload: {
        label: input.label,
      },
    });
    await this.sync.refreshTaskScope(resolved.task.id);

    return record;
  }
}
