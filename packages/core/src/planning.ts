import type { BaseEntity } from "./base";
import type { TaskOwnerKind, TaskOwnerRef } from "./execution";

export type PlanStatus = "DRAFT" | "ACTIVE" | "BLOCKED" | "ARCHIVED";
export type PlanActionStatus = "PLANNED" | "READY" | "BLOCKED" | "DONE";

export interface Plan extends BaseEntity {
  workspaceId: string;
  projectId: string | null;
  name: string;
  goal: string;
  status: PlanStatus;
}

export interface PlanVersion extends BaseEntity {
  planId: string;
  versionNumber: number;
  changeReason: string;
  snapshot: PlanSnapshot;
  createdBy: string;
}

export interface PlanSection extends BaseEntity {
  planId: string;
  title: string;
  intent: string;
  position: number;
}

export interface PlanAction extends BaseEntity {
  planId: string;
  sectionId: string;
  title: string;
  description: string;
  position: number;
  ownerKind: TaskOwnerKind;
  ownerRef: TaskOwnerRef;
  status: PlanActionStatus;
  priorityWeight: number;
  constraints: string[];
  acceptanceCriteria: string[];
}

export interface PlanSnapshot {
  plan: Plan;
  sections: PlanSection[];
  actions: PlanAction[];
}

