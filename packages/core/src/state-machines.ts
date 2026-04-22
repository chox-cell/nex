import type { PhaseStatus, ProjectStatus, SprintStatus, TaskStatus } from "./execution";

export const PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: ["ACTIVE"],
  ACTIVE: ["BLOCKED", "STABLE"],
  BLOCKED: ["ACTIVE", "ARCHIVED"],
  STABLE: ["ARCHIVED"],
  ARCHIVED: [],
};

export const SPRINT_TRANSITIONS: Record<SprintStatus, SprintStatus[]> = {
  DRAFT: ["PLANNED"],
  PLANNED: ["ACTIVE"],
  ACTIVE: ["BLOCKED", "REVIEW"],
  BLOCKED: ["ACTIVE"],
  REVIEW: ["CLOSED"],
  CLOSED: [],
};

export const PHASE_TRANSITIONS: Record<PhaseStatus, PhaseStatus[]> = {
  DRAFT: ["READY"],
  READY: ["IN_PROGRESS"],
  IN_PROGRESS: ["BLOCKED", "VERIFIED"],
  BLOCKED: ["IN_PROGRESS"],
  VERIFIED: ["DONE"],
  DONE: [],
};

export const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  DRAFT: ["READY"],
  READY: ["IN_PROGRESS", "FAIL"],
  IN_PROGRESS: ["BUILT", "FAIL"],
  BUILT: ["PROOF_ATTACHED", "FAIL"],
  PROOF_ATTACHED: ["VERIFIED", "FAIL"],
  VERIFIED: ["AUDITED", "FAIL"],
  AUDITED: ["SNAPSHOT_SAVED", "FAIL"],
  SNAPSHOT_SAVED: ["DONE", "FAIL"],
  DONE: [],
  FAIL: ["READY"],
};

export function isValidTaskTransition(currentStatus: TaskStatus, nextStatus: TaskStatus): boolean {
  return TASK_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function getNextTaskStatuses(currentStatus: TaskStatus): TaskStatus[] {
  return TASK_TRANSITIONS[currentStatus];
}

