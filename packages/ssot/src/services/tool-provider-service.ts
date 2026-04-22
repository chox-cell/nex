import { createBaseEntity, nowIso, type ToolCapability, type ToolProvider, type ToolProviderConfig, type ToolProviderStatus } from "@nex/core";

import type { Workspace } from "@nex/core";

import type { WorkspaceRepository } from "../repositories/mission-repository";
import type { ToolProviderRepository } from "../repositories/tooling-repository";
import type { EventService } from "./event-service";

export interface EnsureToolProviderInput {
  id: string;
  workspaceId: string;
  name: string;
  providerType: ToolProvider["providerType"];
  status: ToolProviderStatus;
  capabilities: ToolCapability[];
  config: ToolProviderConfig;
  actorRef?: string;
}

export interface ToolRegistrySummary {
  workspace: Workspace;
  providers: ToolProvider[];
  statusCounts: Record<ToolProviderStatus, number>;
  truthSurfaceCount: number;
}

const EMPTY_STATUS_COUNTS: Record<ToolProviderStatus, number> = {
  configured: 0,
  active: 0,
  inactive: 0,
  planned: 0,
};

function normalizeCapabilities(capabilities: ToolCapability[]): ToolCapability[] {
  return [...new Set(capabilities)].sort();
}

function areConfigsEqual(left: ToolProviderConfig, right: ToolProviderConfig): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export class ToolProviderService {
  constructor(
    private readonly workspaces: WorkspaceRepository,
    private readonly providers: ToolProviderRepository,
    private readonly events: EventService,
  ) {}

  async listByWorkspace(workspaceId: string): Promise<ToolProvider[]> {
    return this.providers.listByWorkspace(workspaceId);
  }

  async getById(id: string): Promise<ToolProvider | null> {
    return this.providers.getById(id);
  }

  async getFounderRegistrySummary(): Promise<ToolRegistrySummary | null> {
    const workspace = await this.workspaces.getCurrent();

    if (!workspace) {
      return null;
    }

    const providers = await this.providers.listByWorkspace(workspace.id);
    const statusCounts = { ...EMPTY_STATUS_COUNTS };

    for (const provider of providers) {
      statusCounts[provider.status] += 1;
    }

    return {
      workspace,
      providers,
      statusCounts,
      truthSurfaceCount: providers.filter(
        (provider) => provider.capabilities.includes("proof_surface") || provider.capabilities.includes("repo_truth"),
      ).length,
    };
  }

  async ensureProvider(input: EnsureToolProviderInput): Promise<ToolProvider> {
    const workspace = await this.workspaces.getById(input.workspaceId);

    if (!workspace) {
      throw new Error(`Workspace ${input.workspaceId} was not found.`);
    }

    const existing = await this.providers.getByProviderType(input.workspaceId, input.providerType);
    const timestamp = nowIso();
    const capabilities = normalizeCapabilities(input.capabilities);

    if (
      existing &&
      existing.name === input.name &&
      existing.status === input.status &&
      JSON.stringify(existing.capabilities) === JSON.stringify(capabilities) &&
      areConfigsEqual(existing.config, input.config)
    ) {
      return existing;
    }

    const provider: ToolProvider = existing
      ? {
          ...existing,
          name: input.name,
          status: input.status,
          capabilities,
          config: input.config,
          updatedAt: timestamp,
        }
      : {
          ...createBaseEntity(input.id, timestamp),
          workspaceId: input.workspaceId,
          name: input.name,
          providerType: input.providerType,
          status: input.status,
          capabilities,
          config: input.config,
        };

    await this.providers.save(provider);
    await this.events.record({
      workspaceId: input.workspaceId,
      scopeType: "tool_provider",
      scopeId: provider.id,
      eventType: "tool_provider_saved",
      actorType: "system",
      actorRef: input.actorRef ?? "SYSTEM",
      summary: existing ? `Tool provider updated: ${provider.name}` : `Tool provider registered: ${provider.name}`,
      payload: {
        providerType: provider.providerType,
        status: provider.status,
        capabilities: provider.capabilities,
      },
    });

    return provider;
  }
}
