import type { BaseEntity } from "./base";

export type WorkspaceStatus = "ACTIVE" | "ARCHIVED";
export type VisionStatus = "ACTIVE" | "ARCHIVED";
export type StrategicPriorityStatus = "PLANNED" | "ACTIVE" | "BLOCKED" | "DONE";
export type ObjectiveStatus = "ACTIVE" | "BLOCKED" | "DONE";
export type DecisionStatus = "OPEN" | "DECIDED" | "SUPERSEDED";

export interface Workspace extends BaseEntity {
  slug: string;
  name: string;
  status: WorkspaceStatus;
  timezone: string;
}

export interface Vision extends BaseEntity {
  workspaceId: string;
  title: string;
  narrative: string;
  status: VisionStatus;
}

export interface StrategicPriority extends BaseEntity {
  workspaceId: string;
  title: string;
  rationale: string;
  rank: number;
  status: StrategicPriorityStatus;
}

export interface Objective extends BaseEntity {
  workspaceId: string;
  priorityId: string | null;
  title: string;
  targetOutcome: string;
  status: ObjectiveStatus;
}

export interface Decision extends BaseEntity {
  workspaceId: string;
  title: string;
  summary: string;
  status: DecisionStatus;
}

