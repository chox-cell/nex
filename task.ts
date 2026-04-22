import type { BaseRecord } from "../../lib/db";

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

export interface Task extends BaseRecord {
  phase_id: string;
  name: string;
  description: string;
  owner_type: string;
  owner_ref: string | null;
  status: TaskStatus;
  priority: number;
  constraints_json: Record<string, unknown>;
  acceptance_criteria_json: Record<string, unknown>;
  required_proof_json: Record<string, unknown>;
  required_tests_json: Record<string, unknown>;
}
