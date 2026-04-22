import type { BaseEntity } from "./base";

export type ProjectStatus = "DRAFT" | "ACTIVE" | "BLOCKED" | "STABLE" | "ARCHIVED";
export type SprintStatus = "DRAFT" | "PLANNED" | "ACTIVE" | "BLOCKED" | "REVIEW" | "CLOSED";
export type PhaseStatus = "DRAFT" | "READY" | "IN_PROGRESS" | "BLOCKED" | "VERIFIED" | "DONE";
export type TaskStatus =
  | "DRAFT"
  | "READY"
  | "IN_PROGRESS"
  | "BUILT"
  | "PROOF_ATTACHED"
  | "VERIFIED"
  | "AUDITED"
  | "SNAPSHOT_SAVED"
  | "DONE"
  | "FAIL";

export type TaskOwnerKind = "TOOL" | "FOUNDER_ACTION";
export type TaskOwnerRef =
  | "CODEX"
  | "CLAUDE"
  | "CURSOR"
  | "ANTIGRAVITY"
  | "TERMINAL"
  | "REPO"
  | "GPT_ADVISOR"
  | "FOUNDER";

export type TaskEdgeType = "blocks" | "requires" | "follows" | "informs";
export type RunStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
export type RunStepStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface Project extends BaseEntity {
  workspaceId: string;
  planId: string | null;
  name: string;
  slug: string;
  summary: string;
  status: ProjectStatus;
  currentSprintId: string | null;
  riskLevel: RiskLevel;
}

export interface Sprint extends BaseEntity {
  projectId: string;
  planId: string | null;
  name: string;
  goal: string;
  status: SprintStatus;
  currentPhaseId: string | null;
}

export interface Phase extends BaseEntity {
  sprintId: string;
  name: string;
  goal: string;
  status: PhaseStatus;
  order: number;
  weight: number;
}

export interface Task extends BaseEntity {
  phaseId: string;
  title: string;
  objective: string;
  description: string;
  status: TaskStatus;
  ownerKind: TaskOwnerKind;
  ownerRef: TaskOwnerRef;
  priorityWeight: number;
  constraints: string[];
  acceptanceCriteria: string[];
  requiredProof: string[];
}

export interface TaskEdge extends BaseEntity {
  fromTaskId: string;
  toTaskId: string;
  type: TaskEdgeType;
  rationale: string;
}

export interface Run extends BaseEntity {
  taskId: string;
  ownerRef: TaskOwnerRef;
  status: RunStatus;
  summary: string;
}

export interface RunStep extends BaseEntity {
  runId: string;
  label: string;
  status: RunStepStatus;
  detail: string;
}

