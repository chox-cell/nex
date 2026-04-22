import type { Decision, Objective, StrategicPriority, Vision, Workspace } from "@nex/core";

import type { FileNexStore } from "../store/file-nex-store";
import { sortByCreatedAtDesc, sortByRank, upsertById } from "./helpers";

export class WorkspaceRepository {
  constructor(private readonly store: FileNexStore) {}

  async list(): Promise<Workspace[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.workspaces);
  }

  async getCurrent(): Promise<Workspace | null> {
    const workspaces = await this.list();
    return workspaces.find((workspace) => workspace.status === "ACTIVE") ?? null;
  }

  async getById(id: string): Promise<Workspace | null> {
    const database = await this.store.read();
    return database.workspaces.find((workspace) => workspace.id === id) ?? null;
  }

  async save(workspace: Workspace): Promise<Workspace> {
    await this.store.update((database) => {
      upsertById(database.workspaces, workspace);
    });

    return workspace;
  }
}

export class VisionRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByWorkspace(workspaceId: string): Promise<Vision[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.visions.filter((vision) => vision.workspaceId === workspaceId));
  }

  async getActiveByWorkspace(workspaceId: string): Promise<Vision | null> {
    const visions = await this.listByWorkspace(workspaceId);
    return visions.find((vision) => vision.status === "ACTIVE") ?? null;
  }

  async save(vision: Vision): Promise<Vision> {
    await this.store.update((database) => {
      upsertById(database.visions, vision);
    });

    return vision;
  }
}

export class StrategicPriorityRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByWorkspace(workspaceId: string): Promise<StrategicPriority[]> {
    const database = await this.store.read();
    return sortByRank(database.strategicPriorities.filter((priority) => priority.workspaceId === workspaceId));
  }

  async save(priority: StrategicPriority): Promise<StrategicPriority> {
    await this.store.update((database) => {
      upsertById(database.strategicPriorities, priority);
    });

    return priority;
  }
}

export class ObjectiveRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByWorkspace(workspaceId: string): Promise<Objective[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.objectives.filter((objective) => objective.workspaceId === workspaceId));
  }

  async save(objective: Objective): Promise<Objective> {
    await this.store.update((database) => {
      upsertById(database.objectives, objective);
    });

    return objective;
  }
}

export class DecisionRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByWorkspace(workspaceId: string): Promise<Decision[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.decisions.filter((decision) => decision.workspaceId === workspaceId));
  }

  async save(decision: Decision): Promise<Decision> {
    await this.store.update((database) => {
      upsertById(database.decisions, decision);
    });

    return decision;
  }
}

