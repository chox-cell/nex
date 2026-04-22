import { createBaseEntity, createId, nowIso, type Evidence, type RepoReference } from "@nex/core";

import type { RepoReferenceRepository } from "../repositories/surface-repository";
import type { ToolPacketRepository, ToolProviderRepository } from "../repositories/tooling-repository";
import type { EventService } from "./event-service";
import type { EvidenceService } from "./evidence-service";
import type { TaskScopeService } from "./task-scope-service";

export interface CreateLinkedEvidenceInput {
  title: string;
  summary: string;
  content: string;
  createdBy: string;
}

export interface RecordRepoReferenceInput {
  taskId: string;
  toolProviderId?: string;
  toolPacketId?: string;
  repoLabel: string;
  sourceLabel?: string;
  branchName?: string;
  gitRef?: string;
  commitSha?: string;
  diffRef?: string;
  sourcePath?: string;
  filesTouched: string[];
  summary: string;
  note?: string;
  createEvidence?: CreateLinkedEvidenceInput;
  recordedBy: string;
}

export class RepoReferenceService {
  constructor(
    private readonly references: RepoReferenceRepository,
    private readonly providers: ToolProviderRepository,
    private readonly toolPackets: ToolPacketRepository,
    private readonly scope: TaskScopeService,
    private readonly evidence: EvidenceService,
    private readonly events: EventService,
  ) {}

  async listByWorkspace(workspaceId: string): Promise<RepoReference[]> {
    return this.references.listByWorkspace(workspaceId);
  }

  async listByTask(taskId: string): Promise<RepoReference[]> {
    return this.references.listByTask(taskId);
  }

  async recordTaskReference(input: RecordRepoReferenceInput): Promise<RepoReference> {
    const resolved = await this.scope.resolveTask(input.taskId);

    if (input.toolProviderId) {
      const provider = await this.providers.getById(input.toolProviderId);

      if (!provider) {
        throw new Error(`Tool provider ${input.toolProviderId} was not found.`);
      }

      if (provider.providerType !== "repo") {
        throw new Error(`Tool provider ${provider.id} is not the Repo truth surface.`);
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
    const record: RepoReference = {
      ...createBaseEntity(createId("repo_reference"), timestamp),
      workspaceId: resolved.workspaceId,
      projectId: resolved.project.id,
      sprintId: resolved.sprint.id,
      taskId: resolved.task.id,
      phaseId: resolved.phase.id,
      toolProviderId: input.toolProviderId ?? null,
      toolPacketId: input.toolPacketId ?? null,
      repoLabel: input.repoLabel,
      sourceLabel: input.sourceLabel?.trim() || null,
      branchName: input.branchName?.trim() || null,
      gitRef: input.gitRef?.trim() || null,
      commitSha: input.commitSha?.trim() || null,
      diffRef: input.diffRef?.trim() || null,
      sourcePath: input.sourcePath?.trim() || null,
      filesTouched: input.filesTouched,
      summary: input.summary,
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
      scopeType: "repo_reference",
      scopeId: record.id,
      eventType: "repo_reference_saved",
      actorType: "founder",
      actorRef: input.recordedBy,
      summary: `Repo reference saved: ${record.repoLabel}`,
      payload: {
        taskId: resolved.task.id,
        branchName: record.branchName,
        diffRef: record.diffRef,
        linkedEvidenceCount: record.linkedEvidenceIds.length,
      },
    });

    return record;
  }

  private async createEvidenceRecord(input: RecordRepoReferenceInput, record: RepoReference): Promise<Evidence> {
    const sourceUri = record.diffRef ?? record.gitRef ?? record.sourcePath ?? null;

    return this.evidence.attachTaskEvidence({
      taskId: input.taskId,
      evidenceType: "repo_diff",
      title: input.createEvidence!.title,
      summary: input.createEvidence!.summary,
      sourceUri: sourceUri ?? undefined,
      content: input.createEvidence!.content,
      createdBy: input.createEvidence!.createdBy,
    });
  }
}
