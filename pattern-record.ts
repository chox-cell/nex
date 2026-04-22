import type { BaseRecord } from "../../lib/db";

export interface PatternRecord extends BaseRecord {
  workspace_id: string;
  pattern_type: string;
  subject_ref: string;
  score: number;
  evidence_json: Record<string, unknown>;
}
