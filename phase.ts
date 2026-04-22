import type { BaseRecord } from "../../lib/db";

export type PhaseStatus = "DRAFT" | "READY" | "IN_PROGRESS" | "BLOCKED" | "VERIFIED" | "DONE";

export interface Phase extends BaseRecord {
  sprint_id: string;
  name: string;
  order_index: number;
  goal: string;
  status: PhaseStatus;
}
