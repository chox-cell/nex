import { nowIso, type Task, type TaskOwnerKind, type TaskOwnerRef, type TaskProjectionState, type TaskStatus } from "@nex/core";
import { getNextTaskStatuses, isValidTaskTransition } from "@nex/core";

import type { TaskRepository } from "../repositories/execution-repository";
import type { EventService } from "./event-service";
import type { ProjectionService } from "./projection-service";
import type { TruthSyncService } from "./truth-sync-service";

export interface TaskOwnerInput {
  ownerKind: TaskOwnerKind;
  ownerRef: TaskOwnerRef;
}

export class TaskGovernanceService {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly projections: ProjectionService,
    private readonly events: EventService,
    private readonly sync: TruthSyncService,
  ) {}

  assertOwner(input: TaskOwnerInput): void {
    if (!input.ownerKind || !input.ownerRef) {
      throw new Error("Every task requires an explicit owner.");
    }
  }

  async getTaskReadiness(taskId: string): Promise<TaskProjectionState> {
    return (await this.projections.getTaskProjection(taskId)) ?? this.projections.refreshTaskProjection(taskId);
  }

  async getAvailableTransitions(taskId: string): Promise<TaskStatus[]> {
    const task = await this.tasks.getById(taskId);

    if (!task) {
      throw new Error(`Task ${taskId} was not found.`);
    }

    const readiness = await this.getTaskReadiness(taskId);
    return getNextTaskStatuses(task.status).filter((nextStatus) => this.canTransition(task.status, nextStatus, readiness));
  }

  async transitionTask(taskId: string, nextStatus: TaskStatus): Promise<Task> {
    const task = await this.tasks.getById(taskId);

    if (!task) {
      throw new Error(`Task ${taskId} was not found.`);
    }

    if (!isValidTaskTransition(task.status, nextStatus)) {
      throw new Error(`Invalid task transition: ${task.status} -> ${nextStatus}.`);
    }

    const available = await this.getAvailableTransitions(taskId);

    if (!available.includes(nextStatus)) {
      throw new Error(`Task ${taskId} cannot move to ${nextStatus} until the required truth conditions are satisfied.`);
    }

    const updatedTask: Task = {
      ...task,
      status: nextStatus,
      updatedAt: nowIso(),
    };

    await this.tasks.save(updatedTask);
    await this.events.record({
      workspaceId: (await this.getTaskReadiness(taskId)).workspaceId,
      scopeType: "task",
      scopeId: task.id,
      eventType: "task_transitioned",
      actorType: "tool",
      actorRef: "CODEX",
      summary: `Task moved from ${task.status} to ${nextStatus}`,
      payload: {
        fromStatus: task.status,
        toStatus: nextStatus,
      },
    });
    await this.sync.refreshTaskScope(task.id);

    return updatedTask;
  }

  private canTransition(currentStatus: TaskStatus, nextStatus: TaskStatus, readiness: TaskProjectionState): boolean {
    if (currentStatus === "READY" && nextStatus === "IN_PROGRESS") {
      return readiness.pendingDependencies.length === 0;
    }
    if (nextStatus === "PROOF_ATTACHED") {
      return readiness.canMoveToProofAttached;
    }
    if (nextStatus === "VERIFIED") {
      return readiness.canMoveToVerified;
    }
    if (nextStatus === "AUDITED") {
      return readiness.canMoveToAudited;
    }
    if (nextStatus === "SNAPSHOT_SAVED") {
      return readiness.canMoveToSnapshotSaved;
    }
    if (nextStatus === "DONE") {
      return readiness.canMoveToDone;
    }

    return true;
  }
}
