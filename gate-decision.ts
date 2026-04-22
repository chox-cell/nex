import type { BaseRecord } from "../../lib/db";
import type { ScopeType } from "./event";

export type GateDecisionValue = "GO" | "NO_GO";

export interface GateDecision extends BaseRecord {
  scope_type: ScopeType;
  scope_id: string;
  decision: GateDecisionValue;
  reason: string;
  metadata_json: Record<string, unknown>;
}
