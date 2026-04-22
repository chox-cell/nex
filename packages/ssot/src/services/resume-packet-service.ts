import { createBaseEntity, createId, nowIso, type ResumePacket, type SprintProjectionState, type TaskProjectionState } from "@nex/core";

import type { ResumePacketRepository } from "../repositories/memory-repository";
import type { SprintRepository, TaskRepository } from "../repositories/execution-repository";
import type { ProjectionService } from "./projection-service";

export class ResumePacketService {
  constructor(
    private readonly packets: ResumePacketRepository,
    private readonly projections: ProjectionService,
    private readonly tasks: TaskRepository,
    private readonly sprints: SprintRepository,
  ) {}

  async getTaskPacket(taskId: string): Promise<ResumePacket | null> {
    return this.packets.getByScope("task", taskId);
  }

  async getSprintPacket(sprintId: string): Promise<ResumePacket | null> {
    return this.packets.getByScope("sprint", sprintId);
  }

  async saveTaskPacket(projection: TaskProjectionState): Promise<ResumePacket> {
    const existing = await this.packets.getByScope("task", projection.taskId);
    const task = await this.tasks.getById(projection.taskId);

    if (!task) {
      throw new Error(`Task ${projection.taskId} was not found.`);
    }

    const timestamp = nowIso();
    const packet: ResumePacket = existing
      ? {
          ...existing,
          currentObjective: task.objective,
          currentState: task.status,
          currentTask: task.title,
          completedSteps: projection.completedSteps,
          failedSteps: projection.failedSteps,
          blockers: projection.blockers,
          pendingDependencies: projection.pendingDependencies,
          lastProof: projection.lastProof,
          nextRequiredAction: projection.nextRequiredAction,
          relevantConstraints: task.constraints,
          updatedAt: timestamp,
        }
      : {
          ...createBaseEntity(createId("resume"), timestamp),
          workspaceId: projection.workspaceId,
          scopeType: "task",
          scopeId: projection.taskId,
          currentObjective: task.objective,
          currentState: task.status,
          currentTask: task.title,
          completedSteps: projection.completedSteps,
          failedSteps: projection.failedSteps,
          blockers: projection.blockers,
          pendingDependencies: projection.pendingDependencies,
          lastProof: projection.lastProof,
          nextRequiredAction: projection.nextRequiredAction,
          relevantConstraints: task.constraints,
        };

    await this.packets.save(packet);
    return packet;
  }

  async saveSprintPacket(projection: SprintProjectionState): Promise<ResumePacket> {
    const existing = await this.packets.getByScope("sprint", projection.sprintId);
    const sprint = await this.sprints.getById(projection.sprintId);

    if (!sprint) {
      throw new Error(`Sprint ${projection.sprintId} was not found.`);
    }

    const currentTaskProjection = projection.currentTaskId ? await this.projections.getTaskProjection(projection.currentTaskId) : null;
    const timestamp = nowIso();
    const packet: ResumePacket = existing
      ? {
          ...existing,
          currentObjective: sprint.goal,
          currentState: sprint.status,
          currentTask: currentTaskProjection?.taskTitle ?? null,
          completedSteps: projection.phaseProgress
            .filter((phase) => phase.progressScore === 100)
            .map((phase) => `Phase complete: ${phase.phaseName}`),
          failedSteps: currentTaskProjection?.failedSteps ?? [],
          blockers: projection.blockers,
          pendingDependencies: currentTaskProjection?.pendingDependencies ?? [],
          lastProof: projection.lastProof,
          nextRequiredAction: projection.nextRequiredAction,
          relevantConstraints: currentTaskProjection ? [currentTaskProjection.taskTitle] : [sprint.goal],
          updatedAt: timestamp,
        }
      : {
          ...createBaseEntity(createId("resume"), timestamp),
          workspaceId: projection.workspaceId,
          scopeType: "sprint",
          scopeId: projection.sprintId,
          currentObjective: sprint.goal,
          currentState: sprint.status,
          currentTask: currentTaskProjection?.taskTitle ?? null,
          completedSteps: projection.phaseProgress
            .filter((phase) => phase.progressScore === 100)
            .map((phase) => `Phase complete: ${phase.phaseName}`),
          failedSteps: currentTaskProjection?.failedSteps ?? [],
          blockers: projection.blockers,
          pendingDependencies: currentTaskProjection?.pendingDependencies ?? [],
          lastProof: projection.lastProof,
          nextRequiredAction: projection.nextRequiredAction,
          relevantConstraints: currentTaskProjection ? [currentTaskProjection.taskTitle] : [sprint.goal],
        };

    await this.packets.save(packet);
    return packet;
  }
}

