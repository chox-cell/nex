import {
  calculateTaskProgressScore,
  createBaseEntity,
  createId,
  nowIso,
  type Evidence,
  type GateDecision,
  type ProjectProjectionState,
  type SprintProjectionState,
  type StateProjection,
  type Task,
  type TaskProjectionState,
  type Verification,
  type VerificationSummary,
} from "@nex/core";

import type { EventRepository, ProjectionRepository } from "../repositories/memory-repository";
import type { PhaseRepository, ProjectRepository, SprintRepository, TaskEdgeRepository, TaskRepository } from "../repositories/execution-repository";
import type {
  AuditRecordRepository,
  EvidenceRepository,
  GateDecisionRepository,
  SnapshotRepository,
  VerificationRepository,
} from "../repositories/truth-repository";
import { TaskScopeService } from "./task-scope-service";

const BLOCKING_EDGE_TYPES = new Set(["blocks", "requires", "follows"]);

function summarizeVerificationRecords(records: Verification[]): VerificationSummary {
  return {
    passCount: records.filter((record) => record.status === "pass").length,
    warningCount: records.filter((record) => record.status === "warning").length,
    failCount: records.filter((record) => record.status === "fail").length,
    blockingCount: records.filter((record) => record.status === "blocking").length,
    total: records.length,
  };
}

function hasBuildComplete(status: Task["status"]): boolean {
  return ["BUILT", "PROOF_ATTACHED", "VERIFIED", "AUDITED", "SNAPSHOT_SAVED", "DONE"].includes(status);
}

function buildNextRequiredAction(input: {
  task: Task;
  pendingDependencies: string[];
  evidenceCount: number;
  verificationSummary: VerificationSummary;
  latestGate: GateDecision | null;
  auditCount: number;
  snapshotCount: number;
  progressScore: number;
}): string {
  const { task, pendingDependencies, evidenceCount, verificationSummary, latestGate, auditCount, snapshotCount, progressScore } = input;

  switch (task.status) {
    case "DRAFT":
      return "Move the task to READY once the execution slice is approved.";
    case "READY":
      return pendingDependencies.length
        ? `Wait for dependencies to clear: ${pendingDependencies.join(", ")}`
        : "Start execution and move the task to IN_PROGRESS.";
    case "IN_PROGRESS":
      return "Complete the build and move the task to BUILT.";
    case "BUILT":
      return evidenceCount
        ? "Evidence exists. Move the task to PROOF_ATTACHED."
        : "Attach at least one real evidence record before proof attachment.";
    case "PROOF_ATTACHED":
      if (verificationSummary.blockingCount || verificationSummary.failCount) {
        return "Resolve blocking or failed verifications before continuing.";
      }
      return verificationSummary.passCount
        ? "Verification passed. Move the task to VERIFIED."
        : "Record a verification before moving to VERIFIED.";
    case "VERIFIED":
      if (!latestGate) {
        return "Write a gate decision before audit closure.";
      }
      if (latestGate.decision === "NO_GO") {
        return "Resolve the NO_GO gate blockers before continuing.";
      }
      return auditCount ? "Audit exists. Move the task to AUDITED." : "Write an audit record, then move the task to AUDITED.";
    case "AUDITED":
      return snapshotCount ? "Snapshot exists. Move the task to SNAPSHOT_SAVED." : "Save a snapshot before moving forward.";
    case "SNAPSHOT_SAVED":
      return progressScore === 100 ? "All truth requirements are satisfied. Move the task to DONE." : "Complete the remaining closure requirements.";
    case "FAIL":
      return "Recover from the blocker, then move the task back to READY.";
    case "DONE":
      return "Task is fully closed with evidence, verification, gate, audit, and snapshot coverage.";
  }
}

export class ProjectionService {
  private readonly scopeResolver: TaskScopeService;

  constructor(
    private readonly projections: ProjectionRepository,
    private readonly events: EventRepository,
    private readonly projects: ProjectRepository,
    private readonly sprints: SprintRepository,
    private readonly phases: PhaseRepository,
    private readonly tasks: TaskRepository,
    private readonly edges: TaskEdgeRepository,
    private readonly evidence: EvidenceRepository,
    private readonly verifications: VerificationRepository,
    private readonly gates: GateDecisionRepository,
    private readonly audits: AuditRecordRepository,
    private readonly snapshots: SnapshotRepository,
  ) {
    this.scopeResolver = new TaskScopeService(this.tasks, this.phases, this.sprints, this.projects);
  }

  async listTaskProjectionsByWorkspace(workspaceId: string): Promise<TaskProjectionState[]> {
    const projections = await this.projections.listByWorkspace(workspaceId, "task_runtime");
    return projections.map((projection) => projection.state as unknown as TaskProjectionState);
  }

  async listSprintProjectionsByWorkspace(workspaceId: string): Promise<SprintProjectionState[]> {
    const projections = await this.projections.listByWorkspace(workspaceId, "sprint_runtime");
    return projections.map((projection) => projection.state as unknown as SprintProjectionState);
  }

  async listProjectProjectionsByWorkspace(workspaceId: string): Promise<ProjectProjectionState[]> {
    const projections = await this.projections.listByWorkspace(workspaceId, "project_runtime");
    return projections.map((projection) => projection.state as unknown as ProjectProjectionState);
  }

  async getTaskProjection(taskId: string): Promise<TaskProjectionState | null> {
    const projection = await this.projections.getByScope("task", taskId, "task_runtime");
    return (projection?.state as unknown as TaskProjectionState | undefined) ?? null;
  }

  async getSprintProjection(sprintId: string): Promise<SprintProjectionState | null> {
    const projection = await this.projections.getByScope("sprint", sprintId, "sprint_runtime");
    return (projection?.state as unknown as SprintProjectionState | undefined) ?? null;
  }

  async getProjectProjection(projectId: string): Promise<ProjectProjectionState | null> {
    const projection = await this.projections.getByScope("project", projectId, "project_runtime");
    return (projection?.state as unknown as ProjectProjectionState | undefined) ?? null;
  }

  async refreshTaskProjection(taskId: string): Promise<TaskProjectionState> {
    const state = await this.buildTaskProjectionState(taskId);
    await this.saveProjection("task", taskId, state.workspaceId, "task_runtime", state);
    return state;
  }

  async refreshTaskProjectionsForSprint(sprintId: string): Promise<TaskProjectionState[]> {
    const phases = await this.phases.listBySprint(sprintId);
    const tasks = await this.tasks.listByPhases(phases.map((phase) => phase.id));
    return Promise.all(tasks.map((task) => this.refreshTaskProjection(task.id)));
  }

  async refreshSprintProjection(sprintId: string): Promise<SprintProjectionState> {
    const state = await this.buildSprintProjectionState(sprintId);
    await this.saveProjection("sprint", sprintId, state.workspaceId, "sprint_runtime", state);
    return state;
  }

  async refreshProjectProjection(projectId: string): Promise<ProjectProjectionState> {
    const state = await this.buildProjectProjectionState(projectId);
    await this.saveProjection("project", projectId, state.workspaceId, "project_runtime", state);
    return state;
  }

  private async saveProjection(
    scopeType: StateProjection["scopeType"],
    scopeId: string,
    workspaceId: string,
    projectionType: StateProjection["projectionType"],
    state: object,
  ): Promise<void> {
    const existing = await this.projections.getByScope(scopeType, scopeId, projectionType);
    const timestamp = nowIso();
    const projection: StateProjection = existing
      ? {
          ...existing,
          state: state as Record<string, unknown>,
          updatedAt: timestamp,
        }
      : {
          ...createBaseEntity(createId("projection"), timestamp),
          workspaceId,
          scopeType,
          scopeId,
          projectionType,
          state: state as Record<string, unknown>,
        };

    await this.projections.save(projection);
  }

  private async buildTaskProjectionState(taskId: string): Promise<TaskProjectionState> {
    const { task, project, sprint } = await this.scopeResolver.resolveTask(taskId);
    const [taskEvents, edges, evidence, verifications, latestGate, audits, snapshots] = await Promise.all([
      this.events.listByScope("task", task.id),
      this.edges.listByTask(task.id),
      this.evidence.listByTask(task.id),
      this.verifications.listByTask(task.id),
      this.gates.getLatestTaskDecision(task.id),
      this.audits.listByTask(task.id),
      this.snapshots.listByTask(task.id),
    ]);

    const inboundEdges = edges.filter((edge) => edge.toTaskId === task.id && BLOCKING_EDGE_TYPES.has(edge.type));
    const inboundTasks = await this.tasks.getByIds(inboundEdges.map((edge) => edge.fromTaskId));
    const pendingDependencies = inboundTasks.filter((candidate) => candidate.status !== "DONE").map((candidate) => candidate.title);
    const verificationSummary = summarizeVerificationRecords(verifications);
    const gateGo = latestGate?.decision === "GO";
    const verificationPassed = verificationSummary.passCount > 0 && !verificationSummary.failCount && !verificationSummary.blockingCount;
    const progressScore = calculateTaskProgressScore({
      buildComplete: hasBuildComplete(task.status),
      proofAttached: evidence.length > 0,
      verificationPassed,
      gateGo,
      auditWritten: audits.length > 0,
      snapshotSaved: snapshots.length > 0,
    });
    const chronologicalEvents = [...taskEvents].reverse();
    const completedSteps = chronologicalEvents
      .filter((event) => event.eventType === "task_transitioned" && event.payload.toStatus !== "FAIL")
      .map((event) => `Task moved to ${String(event.payload.toStatus)}`);
    const failedSteps = chronologicalEvents
      .filter(
        (event) =>
          (event.eventType === "task_transitioned" && event.payload.toStatus === "FAIL") ||
          (event.eventType === "verification_recorded" &&
            (event.payload.status === "blocking" || event.payload.status === "fail")) ||
          (event.eventType === "gate_decided" && event.payload.decision === "NO_GO"),
      )
      .map((event) => event.summary);

    const blockers: string[] = [];

    if (task.status === "FAIL") {
      blockers.push("Task is currently failed and requires recovery.");
    }
    for (const dependency of pendingDependencies) {
      blockers.push(`Dependency pending: ${dependency}`);
    }
    if (task.status === "BUILT" && evidence.length === 0) {
      blockers.push("Evidence missing for proof attachment.");
    }
    if (task.status === "PROOF_ATTACHED" && verificationSummary.total === 0) {
      blockers.push("Verification is missing.");
    }
    if (verificationSummary.blockingCount > 0) {
      blockers.push("Blocking verification present.");
    }
    if (verificationSummary.failCount > 0) {
      blockers.push("Failed verification present.");
    }
    if (task.status === "VERIFIED" && !latestGate) {
      blockers.push("Gate decision missing.");
    }
    if (latestGate?.decision === "NO_GO") {
      blockers.push("Latest gate decision is NO_GO.");
    }
    if (task.status === "VERIFIED" && audits.length === 0) {
      blockers.push("Audit record missing.");
    }
    if (task.status === "AUDITED" && snapshots.length === 0) {
      blockers.push("Snapshot missing.");
    }
    if (task.status === "SNAPSHOT_SAVED" && progressScore < 100) {
      blockers.push("Truth closure requirements are incomplete.");
    }

    const state: TaskProjectionState = {
      workspaceId: project.workspaceId,
      projectId: project.id,
      sprintId: sprint.id,
      phaseId: task.phaseId,
      taskId: task.id,
      taskTitle: task.title,
      taskStatus: task.status,
      ownerRef: task.ownerRef,
      evidenceCount: evidence.length,
      verificationSummary,
      latestGateDecision: latestGate?.decision ?? null,
      auditCount: audits.length,
      snapshotCount: snapshots.length,
      pendingDependencies,
      blockers,
      completedSteps,
      failedSteps,
      lastProof: evidence[0] ? formatEvidenceRef(evidence[0]) : null,
      nextRequiredAction: buildNextRequiredAction({
        task,
        pendingDependencies,
        evidenceCount: evidence.length,
        verificationSummary,
        latestGate,
        auditCount: audits.length,
        snapshotCount: snapshots.length,
        progressScore,
      }),
      progressScore,
      canMoveToProofAttached: evidence.length > 0,
      canMoveToVerified: verificationPassed,
      canMoveToAudited: gateGo && audits.length > 0 && !verificationSummary.failCount && !verificationSummary.blockingCount,
      canMoveToSnapshotSaved: snapshots.length > 0,
      canMoveToDone: progressScore === 100 && gateGo && !verificationSummary.failCount && !verificationSummary.blockingCount,
    };

    return state;
  }

  private async buildSprintProjectionState(sprintId: string): Promise<SprintProjectionState> {
    const { sprint, project, workspaceId } = await this.scopeResolver.resolveSprint(sprintId);
    const phases = await this.phases.listBySprint(sprint.id);
    const tasks = await this.tasks.listByPhases(phases.map((phase) => phase.id));
    const taskStates = await Promise.all(tasks.map((task) => this.buildTaskProjectionState(task.id)));
    const phaseProgress = phases.map((phase) => {
      const phaseTasks = tasks.filter((task) => task.phaseId === phase.id);
      const phaseTaskStates = taskStates.filter((state) => state.phaseId === phase.id);
      const totalWeight = phaseTasks.reduce((sum, task) => sum + task.priorityWeight, 0);
      const weightedScore =
        totalWeight === 0
          ? 0
          : phaseTasks.reduce((sum, task) => {
              const taskState = phaseTaskStates.find((state) => state.taskId === task.id);
              return sum + (taskState?.progressScore ?? 0) * task.priorityWeight;
            }, 0) / totalWeight;

      return {
        phaseId: phase.id,
        phaseName: phase.name,
        progressScore: Number(weightedScore.toFixed(2)),
        weight: phase.weight,
        blockedTaskIds: phaseTaskStates.filter((state) => state.blockers.length > 0 || state.taskStatus === "FAIL").map((state) => state.taskId),
      };
    });

    const totalPhaseWeight = phaseProgress.reduce((sum, phase) => sum + phase.weight, 0);
    const progressScore =
      totalPhaseWeight === 0
        ? 0
        : phaseProgress.reduce((sum, phase) => sum + phase.progressScore * phase.weight, 0) / totalPhaseWeight;
    const orderedTaskStates = phases.flatMap((phase) => taskStates.filter((state) => state.phaseId === phase.id));
    const currentTask = orderedTaskStates.find((state) => state.taskStatus !== "DONE");
    const blockedTaskIds = orderedTaskStates.filter((state) => state.blockers.length > 0 || state.taskStatus === "FAIL").map((state) => state.taskId);
    const blockers = [...new Set(orderedTaskStates.flatMap((state) => state.blockers))];

    return {
      workspaceId,
      projectId: project.id,
      sprintId: sprint.id,
      sprintName: sprint.name,
      sprintStatus: sprint.status,
      currentPhaseId: sprint.currentPhaseId,
      currentTaskId: currentTask?.taskId ?? null,
      phaseProgress,
      blockedTaskIds,
      blockers,
      progressScore: Number(progressScore.toFixed(2)),
      lastProof: orderedTaskStates.find((state) => Boolean(state.lastProof))?.lastProof ?? null,
      nextRequiredAction: currentTask?.nextRequiredAction ?? "Sprint is fully closed.",
    };
  }

  private async buildProjectProjectionState(projectId: string): Promise<ProjectProjectionState> {
    const { project, workspaceId } = await this.scopeResolver.resolveProject(projectId);
    const activeSprintId = project.currentSprintId ?? (await this.sprints.listByProject(project.id))[0]?.id ?? null;
    const sprintProjection = activeSprintId ? await this.buildSprintProjectionState(activeSprintId) : null;

    return {
      workspaceId,
      projectId: project.id,
      projectName: project.name,
      projectStatus: project.status,
      currentSprintId: activeSprintId,
      activeTaskId: sprintProjection?.currentTaskId ?? null,
      progressScore: sprintProjection?.progressScore ?? 0,
      blockerCount: sprintProjection?.blockedTaskIds.length ?? 0,
      lastProof: sprintProjection?.lastProof ?? null,
      nextRequiredAction: sprintProjection?.nextRequiredAction ?? "Create or activate a sprint to continue execution.",
    };
  }
}

function formatEvidenceRef(evidence: Evidence): string {
  return evidence.sourceUri ? `${evidence.title} (${evidence.sourceUri})` : evidence.title;
}

export { summarizeVerificationRecords };
