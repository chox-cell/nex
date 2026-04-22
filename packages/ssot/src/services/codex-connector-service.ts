import { createBaseEntity, createId, nowIso, type CodexResultPacket, type CodexResultStatus, type CodexTaskPacket, type ConnectorLifecycleState } from "@nex/core";

import type { CodexResultPacketRepository } from "../repositories/connector-repository";
import type { ToolProviderRepository } from "../repositories/tooling-repository";
import type { EventService } from "./event-service";
import type { ExecutionService } from "./execution-service";
import type { MissionService } from "./mission-service";
import type { ProjectionService } from "./projection-service";
import type { ProviderConnectorContract } from "./provider-connector-contract";
import type { ResumePacketService } from "./resume-packet-service";

export interface RecordCodexResultInput {
  taskId: string;
  providerId?: string;
  summary: string;
  filesTouched: string[];
  commandsRun: string[];
  outcome: string;
  notes?: string;
  evidenceRefs: string[];
  repoRefs: string[];
  terminalRefs: string[];
  suggestedNextAction?: string;
  rawPayloadRef?: string;
  warnings: string[];
  resultStatus?: CodexResultStatus;
  metadata?: Record<string, string | number | boolean | null>;
  recordedBy: string;
}

export class CodexConnectorService
  implements ProviderConnectorContract<CodexTaskPacket, CodexResultPacket, RecordCodexResultInput>
{
  readonly providerName = "Codex";

  constructor(
    private readonly results: CodexResultPacketRepository,
    private readonly providers: ToolProviderRepository,
    private readonly execution: ExecutionService,
    private readonly mission: MissionService,
    private readonly projections: ProjectionService,
    private readonly resumePackets: ResumePacketService,
    private readonly events: EventService,
  ) {}

  async getLifecycleState(taskId: string): Promise<ConnectorLifecycleState> {
    const detail = await this.execution.getTaskDetail(taskId);
    const provider = await this.providers.getByProviderType(detail.project.workspaceId, "codex");

    if (!provider) {
      return "unavailable";
    }

    const results = await this.results.listByTask(taskId);
    const latestResult = results[0] ?? null;

    if (latestResult?.resultStatus === "failed") {
      return "failed";
    }
    if (latestResult?.resultStatus === "received") {
      return "result_received";
    }
    if (latestResult) {
      return "normalized";
    }
    if (detail.task.ownerRef !== "CODEX") {
      return "modeled";
    }

    return "packet_ready";
  }

  async assignTaskOwner(taskId: string, assignedBy: string) {
    const detail = await this.execution.getTaskDetail(taskId);
    const provider = await this.providers.getByProviderType(detail.project.workspaceId, "codex");

    if (!provider) {
      throw new Error(`Codex provider is not available for workspace ${detail.project.workspaceId}.`);
    }

    return this.execution.assignTaskOwner({
      taskId,
      ownerKind: "TOOL",
      ownerRef: "CODEX",
      assignedBy,
    });
  }

  async buildTaskPacket(taskId: string): Promise<CodexTaskPacket> {
    const detail = await this.execution.getTaskDetail(taskId);
    const [provider, mission, existingProjection, resumePacket] = await Promise.all([
      this.providers.getByProviderType(detail.project.workspaceId, "codex"),
      this.mission.getFounderSummary(),
      this.projections.getTaskProjection(taskId),
      this.resumePackets.getTaskPacket(taskId),
    ]);
    const readiness = existingProjection ?? (await this.projections.refreshTaskProjection(taskId));

    const relevantTaskEdges = [
      ...detail.inboundEdges.map((edge) => ({
        direction: "inbound" as const,
        type: edge.type,
        taskId: edge.fromTaskId,
      })),
      ...detail.outboundEdges.map((edge) => ({
        direction: "outbound" as const,
        type: edge.type,
        taskId: edge.toTaskId,
      })),
    ];

    return {
      workspaceId: detail.project.workspaceId,
      projectId: detail.project.id,
      sprintId: detail.sprint.id,
      phaseId: detail.phase.id,
      taskId: detail.task.id,
      ownerProviderId: provider?.id ?? null,
      providerName: "Codex",
      objective: detail.task.objective,
      constraints: detail.task.constraints,
      acceptanceCriteria: detail.task.acceptanceCriteria,
      requiredProof: detail.task.requiredProof,
      currentState: detail.task.status,
      relevantContext: {
        taskTitle: detail.task.title,
        taskDescription: detail.task.description,
        projectName: detail.project.name,
        projectSummary: detail.project.summary,
        sprintName: detail.sprint.name,
        sprintGoal: detail.sprint.goal,
        phaseName: detail.phase.name,
        phaseGoal: detail.phase.goal,
        priorityWeight: detail.task.priorityWeight,
        currentOwnerRef: detail.task.ownerRef,
      },
      dependencySummary: {
        pendingDependencies: readiness.pendingDependencies,
        relevantTaskEdges,
      },
      relevantResumeContext: resumePacket
        ? {
            blockers: resumePacket.blockers,
            completedSteps: resumePacket.completedSteps,
            failedSteps: resumePacket.failedSteps,
            lastProof: resumePacket.lastProof,
            nextRequiredAction: resumePacket.nextRequiredAction,
            relevantConstraints: resumePacket.relevantConstraints,
          }
        : null,
      suggestedTruthSurfaces: ["repo_reference", "terminal_run_reference"],
      createdAt: nowIso(),
      priority: detail.task.priorityWeight,
      notes: [
        "Codex is modeled as a worker signal emitter only.",
        "Any resulting output still requires evidence, verification, gate, audit, and snapshot coverage before closure.",
      ],
      nextRequiredAction: readiness.nextRequiredAction,
      missionContext: mission
        ? {
            visionTitle: mission.vision?.title ?? null,
            priorityTitles: mission.priorities.map((priority) => priority.title),
          }
        : null,
    };
  }

  async listResultsByTask(taskId: string): Promise<CodexResultPacket[]> {
    return this.results.listByTask(taskId);
  }

  async normalizeResult(input: RecordCodexResultInput): Promise<CodexResultPacket> {
    const detail = await this.execution.getTaskDetail(input.taskId);
    const provider = input.providerId
      ? await this.providers.getById(input.providerId)
      : await this.providers.getByProviderType(detail.project.workspaceId, "codex");

    if (provider && provider.providerType !== "codex") {
      throw new Error(`Tool provider ${provider.id} is not the Codex worker provider.`);
    }

    const timestamp = nowIso();
    const packet: CodexResultPacket = {
      ...createBaseEntity(createId("codex_result"), timestamp),
      workspaceId: detail.project.workspaceId,
      projectId: detail.project.id,
      sprintId: detail.sprint.id,
      phaseId: detail.phase.id,
      taskId: detail.task.id,
      providerId: provider?.id ?? null,
      providerName: "Codex",
      summary: input.summary,
      filesTouched: input.filesTouched,
      commandsRun: input.commandsRun,
      outcome: input.outcome,
      notes: input.notes?.trim() ?? "",
      evidenceRefs: input.evidenceRefs,
      repoRefs: input.repoRefs,
      terminalRefs: input.terminalRefs,
      suggestedNextAction: input.suggestedNextAction?.trim() || null,
      receivedAt: timestamp,
      rawPayloadRef: input.rawPayloadRef?.trim() || null,
      warnings: input.warnings,
      resultStatus: input.resultStatus ?? "normalized",
      metadata: input.metadata ?? {},
    };

    await this.results.save(packet);
    await this.events.record({
      workspaceId: detail.project.workspaceId,
      scopeType: "task",
      scopeId: detail.task.id,
      eventType: "codex_result_normalized",
      actorType: "founder",
      actorRef: input.recordedBy,
      summary: `Codex result normalized: ${packet.summary}`,
      payload: {
        resultStatus: packet.resultStatus,
        repoRefCount: packet.repoRefs.length,
        terminalRefCount: packet.terminalRefs.length,
        evidenceRefCount: packet.evidenceRefs.length,
      },
    });

    return packet;
  }
}
