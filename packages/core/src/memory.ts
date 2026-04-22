import type { BaseEntity } from "./base";

export type NexScopeType =
  | "workspace"
  | "plan"
  | "project"
  | "sprint"
  | "phase"
  | "task"
  | "run"
  | "tool_provider"
  | "repo_reference"
  | "terminal_run_reference";
export type NexActorType = "system" | "tool" | "founder";
export type NexProjectionType = "project_runtime" | "sprint_runtime" | "task_runtime";
export type NexPatternType = "repeated_blocker" | "stalled_task" | "silent_drift";
export type NexPatternStatus = "OPEN" | "RESOLVED";

export type NexEventType =
  | "workspace_seeded"
  | "vision_saved"
  | "priority_saved"
  | "objective_saved"
  | "decision_saved"
  | "plan_created"
  | "plan_updated"
  | "plan_versioned"
  | "project_created"
  | "sprint_created"
  | "phase_created"
  | "task_created"
  | "task_edge_created"
  | "task_owner_assigned"
  | "task_transitioned"
  | "tool_provider_saved"
  | "tool_packet_logged"
  | "codex_result_normalized"
  | "repo_reference_saved"
  | "terminal_run_reference_saved"
  | "evidence_attached"
  | "verification_recorded"
  | "gate_decided"
  | "audit_recorded"
  | "snapshot_saved"
  | "projection_updated"
  | "resume_packet_built"
  | "pattern_detected";

export interface EventRecord extends BaseEntity {
  workspaceId: string;
  scopeType: NexScopeType;
  scopeId: string;
  eventType: NexEventType;
  actorType: NexActorType;
  actorRef: string;
  summary: string;
  payload: Record<string, unknown>;
}

export interface StateProjection extends BaseEntity {
  workspaceId: string;
  scopeType: NexScopeType;
  scopeId: string;
  projectionType: NexProjectionType;
  state: Record<string, unknown>;
}

export interface ResumePacket extends BaseEntity {
  workspaceId: string;
  scopeType: Extract<NexScopeType, "sprint" | "task">;
  scopeId: string;
  currentObjective: string;
  currentState: string;
  currentTask: string | null;
  completedSteps: string[];
  failedSteps: string[];
  blockers: string[];
  pendingDependencies: string[];
  lastProof: string | null;
  nextRequiredAction: string;
  relevantConstraints: string[];
}

export interface PatternRecord extends BaseEntity {
  workspaceId: string;
  scopeType: NexScopeType;
  scopeId: string;
  patternType: NexPatternType;
  summary: string;
  occurrenceCount: number;
  status: NexPatternStatus;
}

export interface VerificationSummary {
  passCount: number;
  warningCount: number;
  failCount: number;
  blockingCount: number;
  total: number;
}

export interface TaskProjectionState {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  phaseId: string;
  taskId: string;
  taskTitle: string;
  taskStatus: string;
  ownerRef: string;
  evidenceCount: number;
  verificationSummary: VerificationSummary;
  latestGateDecision: "GO" | "NO_GO" | null;
  auditCount: number;
  snapshotCount: number;
  pendingDependencies: string[];
  blockers: string[];
  completedSteps: string[];
  failedSteps: string[];
  lastProof: string | null;
  nextRequiredAction: string;
  progressScore: number;
  canMoveToProofAttached: boolean;
  canMoveToVerified: boolean;
  canMoveToAudited: boolean;
  canMoveToSnapshotSaved: boolean;
  canMoveToDone: boolean;
}

export interface PhaseProgressState {
  phaseId: string;
  phaseName: string;
  progressScore: number;
  weight: number;
  blockedTaskIds: string[];
}

export interface SprintProjectionState {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  sprintName: string;
  sprintStatus: string;
  currentPhaseId: string | null;
  currentTaskId: string | null;
  phaseProgress: PhaseProgressState[];
  blockedTaskIds: string[];
  blockers: string[];
  progressScore: number;
  lastProof: string | null;
  nextRequiredAction: string;
}

export interface ProjectProjectionState {
  workspaceId: string;
  projectId: string;
  projectName: string;
  projectStatus: string;
  currentSprintId: string | null;
  activeTaskId: string | null;
  progressScore: number;
  blockerCount: number;
  lastProof: string | null;
  nextRequiredAction: string;
}
