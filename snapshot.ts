import type { BaseRecord } from "../../lib/db";
import type { ScopeType } from "./event";

export interface Snapshot extends BaseRecord {
  scope_type: ScopeType;
  scope_id: string;
  workspace_id: string;
  snapshot_ref: string;
  audit_ref: string | null;
  restorable: boolean;
}
