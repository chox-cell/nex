import type { BaseRecord } from "../../lib/db";

export type EvidenceType =
  | "note"
  | "log"
  | "diff"
  | "screenshot"
  | "file"
  | "test_result"
  | "repo_diff_ref"
  | "terminal_log_ref"
  | "snapshot_ref";

export interface Evidence extends BaseRecord {
  task_id: string;
  run_id: string | null;
  evidence_type: EvidenceType;
  label: string;
  value_json: Record<string, unknown>;
  source_ref: string | null;
}
