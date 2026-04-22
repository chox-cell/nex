import { createBaseEntity, createId, nowIso, type ToolPacket, type ToolPacketMetadata } from "@nex/core";

import type { ToolPacketRepository, ToolProviderRepository } from "../repositories/tooling-repository";
import type { EventService } from "./event-service";
import type { TaskScopeService } from "./task-scope-service";

export interface RecordTaskToolPacketInput {
  taskId: string;
  toolProviderId?: string;
  toolName?: string;
  role: string;
  objective: string;
  summary: string;
  filesTouched: string[];
  commandsRun: string[];
  evidenceRefs: string[];
  outcome: string;
  notes?: string;
  nextSuggestedAction?: string;
  metadata?: ToolPacketMetadata;
  recordedBy: string;
}

export class ToolPacketService {
  constructor(
    private readonly packets: ToolPacketRepository,
    private readonly providers: ToolProviderRepository,
    private readonly scope: TaskScopeService,
    private readonly events: EventService,
  ) {}

  async listByWorkspace(workspaceId: string): Promise<ToolPacket[]> {
    return this.packets.listByWorkspace(workspaceId);
  }

  async listByTask(taskId: string): Promise<ToolPacket[]> {
    return this.packets.listByTask(taskId);
  }

  async listByToolProvider(workspaceId: string, toolProviderId: string): Promise<ToolPacket[]> {
    return this.packets.listByToolProvider(workspaceId, toolProviderId);
  }

  async recordTaskPacket(input: RecordTaskToolPacketInput): Promise<ToolPacket> {
    const resolved = await this.scope.resolveTask(input.taskId);
    const provider = input.toolProviderId ? await this.providers.getById(input.toolProviderId) : null;

    if (input.toolProviderId && !provider) {
      throw new Error(`Tool provider ${input.toolProviderId} was not found.`);
    }

    if (provider && provider.workspaceId !== resolved.workspaceId) {
      throw new Error(`Tool provider ${provider.id} does not belong to workspace ${resolved.workspaceId}.`);
    }

    const toolName = provider?.name ?? input.toolName?.trim();

    if (!toolName) {
      throw new Error("A tool provider or tool name is required.");
    }

    const timestamp = nowIso();
    const packet: ToolPacket = {
      ...createBaseEntity(createId("tool_packet"), timestamp),
      workspaceId: resolved.workspaceId,
      projectId: resolved.project.id,
      sprintId: resolved.sprint.id,
      taskId: resolved.task.id,
      phaseId: resolved.phase.id,
      toolProviderId: provider?.id ?? null,
      toolName,
      role: input.role,
      objective: input.objective,
      summary: input.summary,
      filesTouched: input.filesTouched,
      commandsRun: input.commandsRun,
      evidenceRefs: input.evidenceRefs,
      outcome: input.outcome,
      notes: input.notes?.trim() ?? "",
      nextSuggestedAction: input.nextSuggestedAction?.trim() || null,
      metadata: input.metadata ?? {},
    };

    await this.packets.save(packet);
    await this.events.record({
      workspaceId: resolved.workspaceId,
      scopeType: "task",
      scopeId: resolved.task.id,
      eventType: "tool_packet_logged",
      actorType: "founder",
      actorRef: input.recordedBy,
      summary: `Tool packet logged: ${toolName}`,
      payload: {
        toolProviderId: packet.toolProviderId,
        toolName: packet.toolName,
        role: packet.role,
        evidenceRefCount: packet.evidenceRefs.length,
      },
    });

    return packet;
  }
}
