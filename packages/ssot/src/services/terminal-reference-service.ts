import { createBaseEntity, createId, nowIso, type Evidence, type TerminalRunReference } from "@nex/core";

import type { TerminalRunReferenceRepository } from "../repositories/surface-repository";
import type { ToolPacketRepository, ToolProviderRepository } from "../repositories/tooling-repository";
import type { EventService } from "./event-service";
import type { EvidenceService } from "./evidence-service";
import type { TaskScopeService } from "./task-scope-service";

export interface CreateTerminalEvidenceInput {
  title: string;
  summary: string;
  content: string;
  createdBy: string;
}

export interface RecordTerminalRunReferenceInput {
  taskId: string;
  toolProviderId?: string;
  toolPacketId?: string;
  commandSummary: string;
  commands: string[];
  cwd?: string;
  stdoutRef?: string;
  stderrRef?: string;
  logRef?: string;
  logExcerpt: string;
  executedAt?: string;
  summary: string;
  outcome: string;
  note?: string;
  createEvidence?: CreateTerminalEvidenceInput;
  recordedBy: string;
}

export class TerminalReferenceService {
  constructor(
    private readonly references: TerminalRunReferenceRepository,
    private readonly providers: ToolProviderRepository,
    private readonly toolPackets: ToolPacketRepository,
    private readonly scope: TaskScopeService,
    private readonly evidence: EvidenceService,
    private readonly events: EventService,
  ) {}

  async listByWorkspace(workspaceId: string): Promise<TerminalRunReference[]> {
    return this.references.listByWorkspace(workspaceId);
  }

  async listByTask(taskId: string): Promise<TerminalRunReference[]> {
    return this.references.listByTask(taskId);
  }

  async recordTaskReference(input: RecordTerminalRunReferenceInput): Promise<TerminalRunReference> {
    const resolved = await this.scope.resolveTask(input.taskId);

    if (input.toolProviderId) {
      const provider = await this.providers.getById(input.toolProviderId);

      if (!provider) {
        throw new Error(`Tool provider ${input.toolProviderId} was not found.`);
      }

      if (provider.providerType !== "terminal") {
        throw new Error(`Tool provider ${provider.id} is not the Terminal truth surface.`);
      }
    }

    if (input.toolPacketId) {
      const packets = await this.toolPackets.listByTask(input.taskId);
      const packet = packets.find((candidate) => candidate.id === input.toolPacketId) ?? null;

      if (!packet) {
        throw new Error(`Tool packet ${input.toolPacketId} was not found for task ${input.taskId}.`);
      }
    }

    const timestamp = nowIso();
    const record: TerminalRunReference = {
      ...createBaseEntity(createId("terminal_run_reference"), timestamp),
      workspaceId: resolved.workspaceId,
      projectId: resolved.project.id,
      sprintId: resolved.sprint.id,
      taskId: resolved.task.id,
      phaseId: resolved.phase.id,
      toolProviderId: input.toolProviderId ?? null,
      toolPacketId: input.toolPacketId ?? null,
      commandSummary: input.commandSummary,
      commands: input.commands,
      cwd: input.cwd?.trim() || null,
      stdoutRef: input.stdoutRef?.trim() || null,
      stderrRef: input.stderrRef?.trim() || null,
      logRef: input.logRef?.trim() || null,
      logExcerpt: input.logExcerpt,
      executedAt: input.executedAt ?? timestamp,
      summary: input.summary,
      outcome: input.outcome,
      note: input.note?.trim() ?? "",
      linkedEvidenceIds: [],
    };

    const linkedEvidence = input.createEvidence ? await this.createEvidenceRecord(input, record) : null;

    if (linkedEvidence) {
      record.linkedEvidenceIds = [linkedEvidence.id];
    }

    await this.references.save(record);
    await this.events.record({
      workspaceId: resolved.workspaceId,
      scopeType: "terminal_run_reference",
      scopeId: record.id,
      eventType: "terminal_run_reference_saved",
      actorType: "founder",
      actorRef: input.recordedBy,
      summary: `Terminal reference saved: ${record.commandSummary}`,
      payload: {
        taskId: resolved.task.id,
        cwd: record.cwd,
        outcome: record.outcome,
        linkedEvidenceCount: record.linkedEvidenceIds.length,
      },
    });

    return record;
  }

  private async createEvidenceRecord(input: RecordTerminalRunReferenceInput, record: TerminalRunReference): Promise<Evidence> {
    const sourceUri = record.logRef ?? record.stdoutRef ?? record.stderrRef ?? record.cwd ?? null;

    return this.evidence.attachTaskEvidence({
      taskId: input.taskId,
      evidenceType: "terminal_log",
      title: input.createEvidence!.title,
      summary: input.createEvidence!.summary,
      sourceUri: sourceUri ?? undefined,
      content: input.createEvidence!.content,
      createdBy: input.createEvidence!.createdBy,
    });
  }
}
