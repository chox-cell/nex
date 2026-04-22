import { createBaseEntity, createId, nowIso, type Plan, type PlanAction, type PlanSection, type PlanSnapshot, type PlanStatus, type PlanVersion } from "@nex/core";

import type {
  PlanActionRepository,
  PlanRepository,
  PlanSectionRepository,
  PlanVersionRepository,
} from "../repositories/plan-repository";
import type { EventService } from "./event-service";

export interface CreatePlanActionInput {
  title: string;
  description: string;
  ownerKind: PlanAction["ownerKind"];
  ownerRef: PlanAction["ownerRef"];
  priorityWeight: number;
  constraints: string[];
  acceptanceCriteria: string[];
}

export interface CreatePlanSectionInput {
  title: string;
  intent: string;
  actions?: CreatePlanActionInput[];
}

export interface CreatePlanInput {
  workspaceId: string;
  projectId: string | null;
  name: string;
  goal: string;
  status: PlanStatus;
  changeReason: string;
  createdBy: string;
  sections?: CreatePlanSectionInput[];
}

export interface UpdatePlanInput {
  name: string;
  goal: string;
  status: PlanStatus;
  changeReason: string;
  createdBy: string;
}

export interface PlanDetail {
  plan: Plan;
  sections: Array<{
    section: PlanSection;
    actions: PlanAction[];
  }>;
  versions: PlanVersion[];
}

export class PlanService {
  constructor(
    private readonly plans: PlanRepository,
    private readonly versions: PlanVersionRepository,
    private readonly sections: PlanSectionRepository,
    private readonly actions: PlanActionRepository,
    private readonly events: EventService,
  ) {}

  async listPlans(workspaceId: string): Promise<PlanDetail[]> {
    const plans = await this.plans.listByWorkspace(workspaceId);
    return Promise.all(plans.map((plan) => this.getPlanDetail(plan.id)));
  }

  async getPlanDetail(planId: string): Promise<PlanDetail> {
    const plan = await this.plans.getById(planId);

    if (!plan) {
      throw new Error(`Plan ${planId} was not found.`);
    }

    const [sections, actions, versions] = await Promise.all([
      this.sections.listByPlan(planId),
      this.actions.listByPlan(planId),
      this.versions.listByPlan(planId),
    ]);

    return {
      plan,
      sections: sections.map((section) => ({
        section,
        actions: actions.filter((action) => action.sectionId === section.id),
      })),
      versions,
    };
  }

  async createPlan(input: CreatePlanInput): Promise<PlanDetail> {
    const timestamp = nowIso();
    const plan: Plan = {
      ...createBaseEntity(createId("plan"), timestamp),
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      name: input.name,
      goal: input.goal,
      status: input.status,
    };

    const sections: PlanSection[] = [];
    const actions: PlanAction[] = [];

    for (const [sectionIndex, sectionInput] of (input.sections ?? []).entries()) {
      const section: PlanSection = {
        ...createBaseEntity(createId("plan_section"), timestamp),
        planId: plan.id,
        title: sectionInput.title,
        intent: sectionInput.intent,
        position: sectionIndex + 1,
      };

      sections.push(section);

      for (const [actionIndex, actionInput] of (sectionInput.actions ?? []).entries()) {
        actions.push({
          ...createBaseEntity(createId("plan_action"), timestamp),
          planId: plan.id,
          sectionId: section.id,
          title: actionInput.title,
          description: actionInput.description,
          position: actionIndex + 1,
          ownerKind: actionInput.ownerKind,
          ownerRef: actionInput.ownerRef,
          status: "PLANNED",
          priorityWeight: actionInput.priorityWeight,
          constraints: actionInput.constraints,
          acceptanceCriteria: actionInput.acceptanceCriteria,
        });
      }
    }

    await Promise.all([this.plans.save(plan), this.sections.saveMany(sections), this.actions.saveMany(actions)]);
    await this.events.record({
      workspaceId: plan.workspaceId,
      scopeType: "plan",
      scopeId: plan.id,
      eventType: "plan_created",
      actorType: "founder",
      actorRef: input.createdBy,
      summary: `Plan created: ${plan.name}`,
      payload: {
        projectId: plan.projectId,
      },
    });
    await this.writeVersion(plan.id, input.changeReason, input.createdBy);

    return this.getPlanDetail(plan.id);
  }

  async updatePlan(planId: string, input: UpdatePlanInput): Promise<PlanDetail> {
    const existing = await this.plans.getById(planId);

    if (!existing) {
      throw new Error(`Plan ${planId} was not found.`);
    }

    const updatedPlan: Plan = {
      ...existing,
      name: input.name,
      goal: input.goal,
      status: input.status,
      updatedAt: nowIso(),
    };

    await this.plans.save(updatedPlan);
    await this.events.record({
      workspaceId: updatedPlan.workspaceId,
      scopeType: "plan",
      scopeId: updatedPlan.id,
      eventType: "plan_updated",
      actorType: "founder",
      actorRef: input.createdBy,
      summary: `Plan updated: ${updatedPlan.name}`,
      payload: {
        status: updatedPlan.status,
      },
    });
    await this.writeVersion(planId, input.changeReason, input.createdBy);

    return this.getPlanDetail(planId);
  }

  async writeVersion(planId: string, changeReason: string, createdBy: string): Promise<PlanVersion> {
    const snapshot = await this.getPlanSnapshot(planId);
    const latestVersion = await this.versions.getLatestVersion(planId);
    const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
    const timestamp = nowIso();
    const version: PlanVersion = {
      ...createBaseEntity(createId("plan_version"), timestamp),
      planId,
      versionNumber,
      changeReason,
      snapshot,
      createdBy,
    };

    await this.versions.save(version);
    await this.events.record({
      workspaceId: snapshot.plan.workspaceId,
      scopeType: "plan",
      scopeId: planId,
      eventType: "plan_versioned",
      actorType: "founder",
      actorRef: createdBy,
      summary: `Plan version ${versionNumber} written`,
      payload: {
        versionNumber,
        changeReason,
      },
    });
    return version;
  }

  private async getPlanSnapshot(planId: string): Promise<PlanSnapshot> {
    const plan = await this.plans.getById(planId);

    if (!plan) {
      throw new Error(`Plan ${planId} was not found.`);
    }

    const [sections, actions] = await Promise.all([this.sections.listByPlan(planId), this.actions.listByPlan(planId)]);

    return {
      plan,
      sections,
      actions,
    };
  }
}
