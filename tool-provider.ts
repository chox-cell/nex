import type { BaseRecord } from "../../lib/db";

export type ProviderStatus = "ACTIVE" | "DISABLED" | "UNHEALTHY";

export interface ToolProvider extends BaseRecord {
  workspace_id: string;
  name: string;
  provider_type: string;
  status: ProviderStatus;
  capabilities_json: string[];
  config_json: Record<string, unknown>;
}
