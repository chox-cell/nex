import type { BaseRecord } from "../../lib/db";

export type RunStatus = "PENDING" | "RUNNING" | "PASS" | "FAIL" | "BLOCKED";

export interface Run extends BaseRecord {
  task_id: string;
  tool_provider_id: string | null;
  run_type: string;
  status: RunStatus;
  summary: string;
  started_at: string | null;
  finished_at: string | null;
}
