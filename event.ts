import type { BaseRecord } from "../../lib/db";

export type ScopeType = "workspace" | "project" | "sprint" | "phase" | "task" | "run";

export interface EventRecord extends BaseRecord {
  workspace_id: string;
  scope_type: ScopeType;
  scope_id: string;
  event_type: string;
  payload_json: Record<string, unknown>;
  actor_type: string;
  actor_ref: string | null;
}
