import type { BaseRecord } from "../../lib/db";

export interface RunStep extends BaseRecord {
  run_id: string;
  step_type: string;
  status: string;
  payload_json: Record<string, unknown>;
}
