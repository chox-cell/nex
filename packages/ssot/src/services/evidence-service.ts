import { createBaseEntity, createId, nowIso, type Evidence, type EvidenceType } from "@nex/core";

import type { EvidenceRepository } from "../repositories/truth-repository";
import type { EventService } from "./event-service";
import type { TaskScopeService } from "./task-scope-service";
import type { TruthSyncService } from "./truth-sync-service";

export interface AttachTaskEvidenceInput {
  taskId: string;
  evidenceType: EvidenceType;
  title: string;
  summary: string;
  sourceUri?: string;
  content: string;
  createdBy: string;
}

export class EvidenceService {
  constructor(
    private readonly evidence: EvidenceRepository,
    private readonly scope: TaskScopeService,
    private readonly events: EventService,
    private readonly sync: TruthSyncService,
  ) {}

  async attachTaskEvidence(input: AttachTaskEvidenceInput): Promise<Evidence> {
    const resolved = await this.scope.resolveTask(input.taskId);
    const record: Evidence = {
      ...createBaseEntity(createId("evidence"), nowIso()),
      workspaceId: resolved.workspaceId,
      scopeType: "task",
      scopeId: resolved.task.id,
      taskId: resolved.task.id,
      runId: null,
      evidenceType: input.evidenceType,
      title: input.title,
      summary: input.summary,
      sourceUri: input.sourceUri ?? null,
      content: input.content,
      createdBy: input.createdBy,
    };

    await this.evidence.save(record);
    await this.events.record({
      workspaceId: resolved.workspaceId,
      scopeType: "task",
      scopeId: resolved.task.id,
      eventType: "evidence_attached",
      actorType: "founder",
      actorRef: input.createdBy,
      summary: `Evidence attached: ${input.title}`,
      payload: {
        evidenceType: input.evidenceType,
        title: input.title,
      },
    });
    await this.sync.refreshTaskScope(resolved.task.id);

    return record;
  }
}

