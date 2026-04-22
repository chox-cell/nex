import type { BaseRecord } from "../../lib/db";

export type SprintStatus = "DRAFT" | "PLANNED" | "ACTIVE" | "BLOCKED" | "REVIEW" | "CLOSED";

export interface Sprint extends BaseRecord {
  project_id: string;
  plan_id: string | null;
  name: string;
  goal: string;
  status: SprintStatus;
  current_phase_id: string | null;
}
