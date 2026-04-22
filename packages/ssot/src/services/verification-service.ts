import { createBaseEntity, createId, nowIso, type Verification, type VerificationStatus, type VerificationType } from "@nex/core";

import type { VerificationRepository } from "../repositories/truth-repository";
import type { EventService } from "./event-service";
import { summarizeVerificationRecords } from "./projection-service";
import type { TaskScopeService } from "./task-scope-service";
import type { TruthSyncService } from "./truth-sync-service";

export interface RecordTaskVerificationInput {
  taskId: string;
  verificationType: VerificationType;
  status: VerificationStatus;
  summary: string;
  detail: string;
  verifiedBy: string;
}

export class VerificationService {
  constructor(
    private readonly verifications: VerificationRepository,
    private readonly scope: TaskScopeService,
    private readonly events: EventService,
    private readonly sync: TruthSyncService,
  ) {}

  async recordTaskVerification(input: RecordTaskVerificationInput): Promise<Verification> {
    const resolved = await this.scope.resolveTask(input.taskId);
    const record: Verification = {
      ...createBaseEntity(createId("verification"), nowIso()),
      workspaceId: resolved.workspaceId,
      scopeType: "task",
      scopeId: resolved.task.id,
      taskId: resolved.task.id,
      runId: null,
      verificationType: input.verificationType,
      status: input.status,
      summary: input.summary,
      detail: input.detail,
      verifiedBy: input.verifiedBy,
    };

    await this.verifications.save(record);
    await this.events.record({
      workspaceId: resolved.workspaceId,
      scopeType: "task",
      scopeId: resolved.task.id,
      eventType: "verification_recorded",
      actorType: "founder",
      actorRef: input.verifiedBy,
      summary: `Verification recorded: ${input.verificationType} (${input.status})`,
      payload: {
        verificationType: input.verificationType,
        status: input.status,
      },
    });
    await this.sync.refreshTaskScope(resolved.task.id);

    return record;
  }

  static summarize(records: Verification[]) {
    return summarizeVerificationRecords(records);
  }
}

