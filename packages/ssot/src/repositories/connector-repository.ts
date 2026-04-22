import type { CodexResultPacket } from "@nex/core";

import type { FileNexStore } from "../store/file-nex-store";
import { sortByCreatedAtDesc, upsertById } from "./helpers";

export class CodexResultPacketRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByWorkspace(workspaceId: string): Promise<CodexResultPacket[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.codexResultPackets.filter((record) => record.workspaceId === workspaceId));
  }

  async listByTask(taskId: string): Promise<CodexResultPacket[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.codexResultPackets.filter((record) => record.taskId === taskId));
  }

  async save(record: CodexResultPacket): Promise<CodexResultPacket> {
    await this.store.update((database) => {
      upsertById(database.codexResultPackets, record);
    });

    return record;
  }
}
