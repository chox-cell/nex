import type { BaseRecord } from "../../lib/db";

export type PlanStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface Plan extends BaseRecord {
  workspace_id: string;
  project_id: string | null;
  name: string;
  goal: string;
  status: PlanStatus;
}

export interface PlanVersion extends BaseRecord {
  plan_id: string;
  version_number: number;
  change_reason: string;
  plan_snapshot_json: Record<string, unknown>;
}
