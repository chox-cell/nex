import type { BaseEntity } from "./base";

export type ToolProviderType = "gpt_chat" | "claude" | "codex" | "cursor" | "antigravity" | "terminal" | "repo";

export type ToolProviderStatus = "configured" | "active" | "inactive" | "planned";

export type ToolCapability =
  | "advise"
  | "critique"
  | "build"
  | "execute_local"
  | "mission_run"
  | "command_execution"
  | "repo_truth"
  | "evidence_source"
  | "proof_surface";

export type ToolProviderConfigValue = string | number | boolean | null;
export type ToolProviderConfig = Record<string, ToolProviderConfigValue>;
export type ToolPacketMetadataValue = string | number | boolean | null;
export type ToolPacketMetadata = Record<string, ToolPacketMetadataValue>;

export interface ToolProvider extends BaseEntity {
  workspaceId: string;
  name: string;
  providerType: ToolProviderType;
  status: ToolProviderStatus;
  capabilities: ToolCapability[];
  config: ToolProviderConfig;
}

export interface ToolPacket extends BaseEntity {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  taskId: string;
  phaseId: string | null;
  toolProviderId: string | null;
  toolName: string;
  role: string;
  objective: string;
  summary: string;
  filesTouched: string[];
  commandsRun: string[];
  evidenceRefs: string[];
  outcome: string;
  notes: string;
  nextSuggestedAction: string | null;
  metadata: ToolPacketMetadata;
}
