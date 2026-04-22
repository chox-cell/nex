import { createBaseEntity, createId, nowIso, type AuditRecord } from "@nex/core";

import type { AuditRecordRepository } from "../repositories/truth-repository";
import type { EventService } from "./event-service";
import type { TaskScopeService } from "./task-scope-service";
import type { TruthSyncService } from "./truth-sync-service";

export interface WriteTaskAuditInput {
  taskId: string;
  summary: string;
  findings: string[];
  author: string;
}

export class AuditService {
  constructor(
    private readonly audits: AuditRecordRepository,
    private readonly scope: TaskScopeService,
    private readonly events: EventService,
    private readonly sync: TruthSyncService,
  ) {}

  async writeTaskAudit(input: WriteTaskAuditInput): Promise<AuditRecord> {
    const resolved = await this.scope.resolveTask(input.taskId);
    const record: AuditRecord = {
      ...createBaseEntity(createId("audit"), nowIso()),
      workspaceId: resolved.workspaceId,
      scopeType: "task",
      scopeId: resolved.task.id,
      taskId: resolved.task.id,
      sprintId: null,
      summary: input.summary,
      findings: input.findings,
      author: input.author,
    };

    await this.audits.save(record);
    await this.events.record({
      workspaceId: resolved.workspaceId,
      scopeType: "task",
      scopeId: resolved.task.id,
      eventType: "audit_recorded",
      actorType: "founder",
      actorRef: input.author,
      summary: `Audit recorded: ${input.summary}`,
      payload: {
        findings: input.findings,
      },
    });
    await this.sync.refreshTaskScope(resolved.task.id);

    return record;
  }
}

