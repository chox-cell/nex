import type { ToolPacket, ToolProvider, ToolProviderType } from "@nex/core";

import type { FileNexStore } from "../store/file-nex-store";
import { sortByCreatedAtDesc, upsertById } from "./helpers";

function sortByName(records: ToolProvider[]): ToolProvider[] {
  return [...records].sort((left, right) => left.name.localeCompare(right.name));
}

export class ToolProviderRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByWorkspace(workspaceId: string): Promise<ToolProvider[]> {
    const database = await this.store.read();
    return sortByName(database.toolProviders.filter((provider) => provider.workspaceId === workspaceId));
  }

  async getById(id: string): Promise<ToolProvider | null> {
    const database = await this.store.read();
    return database.toolProviders.find((provider) => provider.id === id) ?? null;
  }

  async getByProviderType(workspaceId: string, providerType: ToolProviderType): Promise<ToolProvider | null> {
    const database = await this.store.read();
    return database.toolProviders.find((provider) => provider.workspaceId === workspaceId && provider.providerType === providerType) ?? null;
  }

  async save(provider: ToolProvider): Promise<ToolProvider> {
    await this.store.update((database) => {
      upsertById(database.toolProviders, provider);
    });

    return provider;
  }
}

export class ToolPacketRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByWorkspace(workspaceId: string): Promise<ToolPacket[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.toolPackets.filter((packet) => packet.workspaceId === workspaceId));
  }

  async listByTask(taskId: string): Promise<ToolPacket[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.toolPackets.filter((packet) => packet.taskId === taskId));
  }

  async listByToolProvider(workspaceId: string, toolProviderId: string): Promise<ToolPacket[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(
      database.toolPackets.filter((packet) => packet.workspaceId === workspaceId && packet.toolProviderId === toolProviderId),
    );
  }

  async save(packet: ToolPacket): Promise<ToolPacket> {
    await this.store.update((database) => {
      upsertById(database.toolPackets, packet);
    });

    return packet;
  }
}
