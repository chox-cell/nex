import type { BaseRecord } from "../../lib/db";
import type { ScopeType } from "./event";

export interface AuditRecord extends BaseRecord {
  scope_type: ScopeType;
  scope_id: string;
  summary: string;
  failures_json: Record<string, unknown>;
  fixes_json: Record<string, unknown>;
  system_status: string;
  ready_for_next: boolean;
}
