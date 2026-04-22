import type { BaseEntity } from "./base";
import type { NexScopeType } from "./memory";

export type EvidenceType =
  | "repo_diff"
  | "terminal_log"
  | "test_result"
  | "screenshot"
  | "file_output"
  | "audit_note"
  | "snapshot_ref";

export type VerificationType =
  | "build_check"
  | "proof_check"
  | "test_check"
  | "critic_check"
  | "founder_review"
  | "gate_check";

export type VerificationStatus = "pass" | "warning" | "fail" | "blocking";
export type GateDecisionValue = "GO" | "NO_GO";

export interface Evidence extends BaseEntity {
  workspaceId: string;
  scopeType: Extract<NexScopeType, "task" | "run">;
  scopeId: string;
  taskId: string | null;
  runId: string | null;
  evidenceType: EvidenceType;
  title: string;
  summary: string;
  sourceUri: string | null;
  content: string;
  createdBy: string;
}

export interface Verification extends BaseEntity {
  workspaceId: string;
  scopeType: Extract<NexScopeType, "task" | "run">;
  scopeId: string;
  taskId: string | null;
  runId: string | null;
  verificationType: VerificationType;
  status: VerificationStatus;
  summary: string;
  detail: string;
  verifiedBy: string;
}

export interface GateDecision extends BaseEntity {
  workspaceId: string;
  scopeType: Extract<NexScopeType, "task" | "sprint">;
  scopeId: string;
  taskId: string | null;
  sprintId: string | null;
  gateType: "task_close" | "phase_verify" | "sprint_review";
  decision: GateDecisionValue;
  rationale: string;
  blockers: string[];
  decidedBy: string;
}

export interface AuditRecord extends BaseEntity {
  workspaceId: string;
  scopeType: Extract<NexScopeType, "task" | "sprint">;
  scopeId: string;
  taskId: string | null;
  sprintId: string | null;
  summary: string;
  findings: string[];
  author: string;
}

export interface Snapshot extends BaseEntity {
  workspaceId: string;
  scopeType: Extract<NexScopeType, "task" | "sprint" | "project">;
  scopeId: string;
  taskId: string | null;
  sprintId: string | null;
  projectId: string | null;
  label: string;
  summary: string;
  payload: Record<string, unknown>;
  createdBy: string;
}

