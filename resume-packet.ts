import type { BaseRecord } from "../../lib/db";
import type { ScopeType } from "./event";

export interface ResumePacket extends BaseRecord {
  scope_type: ScopeType;
  scope_id: string;
  packet_json: {
    current_objective?: string;
    current_state?: Record<string, unknown>;
    current_task?: string;
    completed_steps?: string[];
    failed_steps?: string[];
    blockers?: string[];
    pending_dependencies?: string[];
    last_proof?: string[];
    next_required_action?: string;
    relevant_constraints?: string[];
  };
}
