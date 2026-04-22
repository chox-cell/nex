import type { RepoReference, TerminalRunReference } from "@nex/core";

import type { FileNexStore } from "../store/file-nex-store";
import { sortByCreatedAtDesc, upsertById } from "./helpers";

export class RepoReferenceRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByWorkspace(workspaceId: string): Promise<RepoReference[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.repoReferences.filter((record) => record.workspaceId === workspaceId));
  }

  async listByTask(taskId: string): Promise<RepoReference[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.repoReferences.filter((record) => record.taskId === taskId));
  }

  async save(record: RepoReference): Promise<RepoReference> {
    await this.store.update((database) => {
      upsertById(database.repoReferences, record);
    });

    return record;
  }
}

export class TerminalRunReferenceRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByWorkspace(workspaceId: string): Promise<TerminalRunReference[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.terminalRunReferences.filter((record) => record.workspaceId === workspaceId));
  }

  async listByTask(taskId: string): Promise<TerminalRunReference[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.terminalRunReferences.filter((record) => record.taskId === taskId));
  }

  async save(record: TerminalRunReference): Promise<TerminalRunReference> {
    await this.store.update((database) => {
      upsertById(database.terminalRunReferences, record);
    });

    return record;
  }
}
