import type { Plan, PlanAction, PlanSection, PlanVersion } from "@nex/core";

import type { FileNexStore } from "../store/file-nex-store";
import { sortByCreatedAtDesc, sortByPosition, upsertById } from "./helpers";

export class PlanRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByWorkspace(workspaceId: string): Promise<Plan[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.plans.filter((plan) => plan.workspaceId === workspaceId));
  }

  async listByProject(projectId: string): Promise<Plan[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.plans.filter((plan) => plan.projectId === projectId));
  }

  async getById(id: string): Promise<Plan | null> {
    const database = await this.store.read();
    return database.plans.find((plan) => plan.id === id) ?? null;
  }

  async save(plan: Plan): Promise<Plan> {
    await this.store.update((database) => {
      upsertById(database.plans, plan);
    });

    return plan;
  }
}

export class PlanVersionRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByPlan(planId: string): Promise<PlanVersion[]> {
    const database = await this.store.read();
    const versions = database.planVersions.filter((version) => version.planId === planId);
    return [...versions].sort((left, right) => right.versionNumber - left.versionNumber);
  }

  async getLatestVersion(planId: string): Promise<PlanVersion | null> {
    const versions = await this.listByPlan(planId);
    return versions[0] ?? null;
  }

  async save(version: PlanVersion): Promise<PlanVersion> {
    await this.store.update((database) => {
      upsertById(database.planVersions, version);
    });

    return version;
  }
}

export class PlanSectionRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByPlan(planId: string): Promise<PlanSection[]> {
    const database = await this.store.read();
    return sortByPosition(database.planSections.filter((section) => section.planId === planId));
  }

  async saveMany(sections: PlanSection[]): Promise<PlanSection[]> {
    await this.store.update((database) => {
      for (const section of sections) {
        upsertById(database.planSections, section);
      }
    });

    return sections;
  }
}

export class PlanActionRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByPlan(planId: string): Promise<PlanAction[]> {
    const database = await this.store.read();
    return sortByPosition(database.planActions.filter((action) => action.planId === planId));
  }

  async listBySection(sectionId: string): Promise<PlanAction[]> {
    const database = await this.store.read();
    return sortByPosition(database.planActions.filter((action) => action.sectionId === sectionId));
  }

  async saveMany(actions: PlanAction[]): Promise<PlanAction[]> {
    await this.store.update((database) => {
      for (const action of actions) {
        upsertById(database.planActions, action);
      }
    });

    return actions;
  }
}

