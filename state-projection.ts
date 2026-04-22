import type { BaseRecord } from "../../lib/db";
import type { ScopeType } from "./event";

export interface StateProjection extends BaseRecord {
  scope_type: ScopeType;
  scope_id: string;
  current_state_json: Record<string, unknown>;
  version: number;
  computed_at: string;
}
