import { createBaseEntity, nowIso, type Decision, type Objective, type StrategicPriority, type Vision, type Workspace } from "@nex/core";

import type {
  DecisionRepository,
  ObjectiveRepository,
  StrategicPriorityRepository,
  VisionRepository,
  WorkspaceRepository,
} from "../repositories/mission-repository";
import type { EventRepository } from "../repositories/memory-repository";
import type { ProjectRepository, SprintRepository } from "../repositories/execution-repository";
import type { PlanRepository } from "../repositories/plan-repository";
import type { EventService } from "./event-service";
import type { ExecutionService } from "./execution-service";
import type { PlanService } from "./plan-service";
import type { ToolProviderService } from "./tool-provider-service";
import type { TruthSyncService } from "./truth-sync-service";

export interface SeedReport {
  workspaceId: string;
  projectId: string;
  planId: string;
  sprintId: string;
}

export class FounderSeedService {
  constructor(
    private readonly workspaces: WorkspaceRepository,
    private readonly visions: VisionRepository,
    private readonly priorities: StrategicPriorityRepository,
    private readonly objectives: ObjectiveRepository,
    private readonly decisions: DecisionRepository,
    private readonly plans: PlanRepository,
    private readonly projects: ProjectRepository,
    private readonly sprints: SprintRepository,
    private readonly eventRecords: EventRepository,
    private readonly planService: PlanService,
    private readonly executionService: ExecutionService,
    private readonly toolProviders: ToolProviderService,
    private readonly events: EventService,
    private readonly sync: TruthSyncService,
  ) {}

  async ensureFounderOsSeed(): Promise<SeedReport> {
    const timestamp = nowIso();
    const existingWorkspace = await this.workspaces.getCurrent();
    const workspace = existingWorkspace ?? (await this.workspaces.save(this.createWorkspace(timestamp)));

    if (!existingWorkspace) {
      await this.events.record({
        workspaceId: workspace.id,
        scopeType: "workspace",
        scopeId: workspace.id,
        eventType: "workspace_seeded",
        actorType: "system",
        actorRef: "SEED",
        summary: `Workspace seeded: ${workspace.name}`,
        payload: {
          slug: workspace.slug,
        },
      });
    }

    await Promise.all([
      this.ensureVision(workspace.id, timestamp),
      this.ensurePriorities(workspace.id, timestamp),
      this.ensureObjective(workspace.id, timestamp),
      this.ensureDecision(workspace.id, timestamp),
      this.ensureToolProviders(workspace.id),
    ]);

    let project = await this.projects.getBySlug("nex-founder-os-v1");

    if (!project) {
      project = await this.executionService.createProject({
        workspaceId: workspace.id,
        planId: null,
        name: "NEX Founder OS v1",
        slug: "nex-founder-os-v1",
        summary: "Execution memory, proof, and control spine for founder operations.",
        status: "DRAFT",
        riskLevel: "MEDIUM",
      });
    }

    let plan = (await this.plans.listByProject(project.id)).find((item) => item.name === "NEX Founder OS v1");

    if (!plan) {
      const createdPlan = await this.planService.createPlan({
        workspaceId: workspace.id,
        projectId: project.id,
        name: "NEX Founder OS v1",
        goal: "Build the founder execution operating system in strict truth-first sprint order.",
        status: "ACTIVE",
        changeReason: "Initial strategic and execution spine seed.",
        createdBy: "FOUNDER",
        sections: [
          {
            title: "Strategic Spine",
            intent: "Establish the founder workspace, mission layer, and plan model.",
            actions: [
              {
                title: "Model founder workspace",
                description: "Create persistent founder workspace and mission layer objects.",
                ownerKind: "TOOL",
                ownerRef: "CODEX",
                priorityWeight: 3,
                constraints: ["Workspace must be persistent.", "Mission layer must not live only in chat."],
                acceptanceCriteria: ["Workspace loads from canonical store.", "Vision and priorities are queryable."],
              },
              {
                title: "Version plans by law",
                description: "Persist plans with append-only version snapshots.",
                ownerKind: "TOOL",
                ownerRef: "CODEX",
                priorityWeight: 4,
                constraints: ["No in-place history loss."],
                acceptanceCriteria: ["Plan create produces version 1.", "Plan update produces a new version."],
              },
            ],
          },
          {
            title: "Execution Spine",
            intent: "Build project, sprint, phase, task, and dependency graph structures.",
            actions: [
              {
                title: "Create execution hierarchy",
                description: "Persist projects, sprints, phases, and tasks with parent linkage.",
                ownerKind: "TOOL",
                ownerRef: "CODEX",
                priorityWeight: 5,
                constraints: ["No orphan sprint or task."],
                acceptanceCriteria: ["Hierarchy reads cleanly in project and sprint views."],
              },
              {
                title: "Enforce owner and transition discipline",
                description: "Require explicit owner and valid state transitions for every task.",
                ownerKind: "TOOL",
                ownerRef: "CODEX",
                priorityWeight: 5,
                constraints: ["No task without owner.", "No fake closure path."],
                acceptanceCriteria: ["Invalid transitions fail.", "Proof states remain locked until Sprint 02."],
              },
            ],
          },
        ],
      });

      plan = createdPlan.plan;
      await this.projects.save({
        ...project,
        planId: plan.id,
        updatedAt: nowIso(),
      });
      project = (await this.projects.getById(project.id)) ?? project;
    }

    let sprint = (await this.sprints.listByPlan(plan.id))[0] ?? null;

    if (!sprint) {
      sprint = (await this.executionService.convertPlanToSprint(plan.id)).sprint;
    }

    await this.bootstrapLegacyEventsIfNeeded(workspace.id);
    await this.sync.refreshSprintScope(sprint.id);

    return {
      workspaceId: workspace.id,
      projectId: project.id,
      planId: plan.id,
      sprintId: sprint.id,
    };
  }

  private createWorkspace(timestamp: string): Workspace {
    return {
      ...createBaseEntity("workspace_founder", timestamp),
      slug: "founder-os",
      name: "Founder Workspace",
      status: "ACTIVE",
      timezone: "Europe/Paris",
    };
  }

  private async ensureVision(workspaceId: string, timestamp: string): Promise<void> {
    const currentVision = await this.visions.getActiveByWorkspace(workspaceId);

    if (currentVision) {
      return;
    }

    const vision: Vision = {
      ...createBaseEntity("vision_nex", timestamp),
      workspaceId,
      title: "Single command system for founder execution truth",
      narrative: "Unify strategy, execution, memory, proof, and control into a single recoverable operating system.",
      status: "ACTIVE",
    };

    await this.visions.save(vision);
    await this.events.record({
      workspaceId,
      scopeType: "workspace",
      scopeId: workspaceId,
      eventType: "vision_saved",
      actorType: "system",
      actorRef: "SEED",
      summary: `Vision created: ${vision.title}`,
      payload: {},
    });
  }

  private async ensurePriorities(workspaceId: string, timestamp: string): Promise<void> {
    const existing = await this.priorities.listByWorkspace(workspaceId);

    if (existing.length >= 3) {
      return;
    }

    const records: StrategicPriority[] = [
      {
        ...createBaseEntity("priority_truth_spine", timestamp),
        workspaceId,
        title: "Truth-first execution spine",
        rationale: "Canonical work structure must exist before automation.",
        rank: 1,
        status: "ACTIVE",
      },
      {
        ...createBaseEntity("priority_memory_spine", timestamp),
        workspaceId,
        title: "Memory and recovery",
        rationale: "Important state must be recoverable and resumable.",
        rank: 2,
        status: "PLANNED",
      },
      {
        ...createBaseEntity("priority_tool_control", timestamp),
        workspaceId,
        title: "Tool control visibility",
        rationale: "External builders emit signals, but NEX keeps truth.",
        rank: 3,
        status: "PLANNED",
      },
    ];

    await Promise.all(
      records.map(async (record) => {
        await this.priorities.save(record);
        await this.events.record({
          workspaceId,
          scopeType: "workspace",
          scopeId: workspaceId,
          eventType: "priority_saved",
          actorType: "system",
          actorRef: "SEED",
          summary: `Priority created: ${record.title}`,
          payload: {
            rank: record.rank,
          },
        });
      }),
    );
  }

  private async ensureObjective(workspaceId: string, timestamp: string): Promise<void> {
    const existing = await this.objectives.listByWorkspace(workspaceId);

    if (existing.length) {
      return;
    }

    const objective: Objective = {
      ...createBaseEntity("objective_sprint_01", timestamp),
      workspaceId,
      priorityId: "priority_truth_spine",
      title: "Ship Sprint 01 strategic and execution spine",
      targetOutcome: "NEX can persist and render plan -> sprint -> phase -> task -> edge.",
      status: "ACTIVE",
    };

    await this.objectives.save(objective);
    await this.events.record({
      workspaceId,
      scopeType: "workspace",
      scopeId: workspaceId,
      eventType: "objective_saved",
      actorType: "system",
      actorRef: "SEED",
      summary: `Objective created: ${objective.title}`,
      payload: {},
    });
  }

  private async ensureDecision(workspaceId: string, timestamp: string): Promise<void> {
    const existing = await this.decisions.listByWorkspace(workspaceId);

    if (existing.length) {
      return;
    }

    const decision: Decision = {
      ...createBaseEntity("decision_file_backed_ssot", timestamp),
      workspaceId,
      title: "Use file-backed SSOT for v1 stabilization",
      summary: "Persist the founder OS in a file-backed canonical store first, then migrate to a database after the truth model stabilizes.",
      status: "DECIDED",
    };

    await this.decisions.save(decision);
    await this.events.record({
      workspaceId,
      scopeType: "workspace",
      scopeId: workspaceId,
      eventType: "decision_saved",
      actorType: "system",
      actorRef: "SEED",
      summary: `Decision created: ${decision.title}`,
      payload: {},
    });
  }

  private async ensureToolProviders(workspaceId: string): Promise<void> {
    await Promise.all([
      this.toolProviders.ensureProvider({
        id: "tool_provider_gpt_chat",
        workspaceId,
        name: "GPT Chat",
        providerType: "gpt_chat",
        status: "configured",
        capabilities: ["advise"],
        config: {
          registryMode: "manual",
          packetReady: false,
          truthSurface: false,
          notes: "Provider registry exists, but packet logging and connector automation are still gated.",
        },
        actorRef: "SEED",
      }),
      this.toolProviders.ensureProvider({
        id: "tool_provider_claude",
        workspaceId,
        name: "Claude",
        providerType: "claude",
        status: "configured",
        capabilities: ["critique"],
        config: {
          registryMode: "manual",
          packetReady: false,
          truthSurface: false,
          notes: "Critic role is registered before manual packet logging is enabled.",
        },
        actorRef: "SEED",
      }),
      this.toolProviders.ensureProvider({
        id: "tool_provider_codex",
        workspaceId,
        name: "Codex",
        providerType: "codex",
        status: "active",
        capabilities: ["build"],
        config: {
          registryMode: "manual",
          packetReady: true,
          truthSurface: false,
          notes: "Codex now has a modeled connector contract and normalized result shape, but live execution remains intentionally disabled.",
        },
        actorRef: "SEED",
      }),
      this.toolProviders.ensureProvider({
        id: "tool_provider_cursor",
        workspaceId,
        name: "Cursor",
        providerType: "cursor",
        status: "configured",
        capabilities: ["build", "execute_local"],
        config: {
          registryMode: "manual",
          packetReady: false,
          truthSurface: false,
          notes: "Local execution support is registered without implying a live bridge.",
        },
        actorRef: "SEED",
      }),
      this.toolProviders.ensureProvider({
        id: "tool_provider_antigravity",
        workspaceId,
        name: "Antigravity",
        providerType: "antigravity",
        status: "planned",
        capabilities: ["mission_run"],
        config: {
          registryMode: "manual",
          packetReady: false,
          truthSurface: false,
          notes: "Mission worker bridge is intentionally deferred until the registry and packet model are stable.",
        },
        actorRef: "SEED",
      }),
      this.toolProviders.ensureProvider({
        id: "tool_provider_terminal",
        workspaceId,
        name: "Terminal",
        providerType: "terminal",
        status: "active",
        capabilities: ["command_execution", "evidence_source", "proof_surface"],
        config: {
          registryMode: "manual",
          packetReady: true,
          truthSurface: true,
          notes: "Terminal is now a modeled proof surface with persisted run/log references, but it is not a live executor.",
        },
        actorRef: "SEED",
      }),
      this.toolProviders.ensureProvider({
        id: "tool_provider_repo",
        workspaceId,
        name: "Repo",
        providerType: "repo",
        status: "active",
        capabilities: ["repo_truth", "evidence_source", "proof_surface"],
        config: {
          registryMode: "manual",
          packetReady: true,
          truthSurface: true,
          notes: "Repo is now a modeled truth surface with persisted references, but it does not perform live git sync or mutation.",
        },
        actorRef: "SEED",
      }),
    ]);
  }

  private async bootstrapLegacyEventsIfNeeded(workspaceId: string): Promise<void> {
    const existingEvents = await this.eventRecords.listByWorkspace(workspaceId);

    if (existingEvents.length) {
      return;
    }

    const workspace = await this.workspaces.getById(workspaceId);

    if (workspace) {
      await this.events.record({
        workspaceId,
        scopeType: "workspace",
        scopeId: workspace.id,
        eventType: "workspace_seeded",
        actorType: "system",
        actorRef: "BACKFILL",
        summary: `Legacy workspace imported into event store: ${workspace.name}`,
        payload: {},
      });
    }

    const plans = await this.plans.listByWorkspace(workspaceId);
    for (const plan of plans) {
      await this.events.record({
        workspaceId,
        scopeType: "plan",
        scopeId: plan.id,
        eventType: "plan_created",
        actorType: "system",
        actorRef: "BACKFILL",
        summary: `Legacy plan imported: ${plan.name}`,
        payload: {},
      });
    }

    const projects = await this.projects.listByWorkspace(workspaceId);
    for (const project of projects) {
      await this.events.record({
        workspaceId,
        scopeType: "project",
        scopeId: project.id,
        eventType: "project_created",
        actorType: "system",
        actorRef: "BACKFILL",
        summary: `Legacy project imported: ${project.name}`,
        payload: {},
      });

      const sprints = await this.sprints.listByProject(project.id);
      for (const sprint of sprints) {
        await this.events.record({
          workspaceId,
          scopeType: "sprint",
          scopeId: sprint.id,
          eventType: "sprint_created",
          actorType: "system",
          actorRef: "BACKFILL",
          summary: `Legacy sprint imported: ${sprint.name}`,
          payload: {},
        });

        const detail = await this.executionService.getSprintDetail(sprint.id);

        for (const phase of detail.phases) {
          await this.events.record({
            workspaceId,
            scopeType: "phase",
            scopeId: phase.phase.id,
            eventType: "phase_created",
            actorType: "system",
            actorRef: "BACKFILL",
            summary: `Legacy phase imported: ${phase.phase.name}`,
            payload: {},
          });

          for (const task of phase.tasks) {
            await this.events.record({
              workspaceId,
              scopeType: "task",
              scopeId: task.id,
              eventType: "task_created",
              actorType: "system",
              actorRef: "BACKFILL",
              summary: `Legacy task imported: ${task.title}`,
              payload: {
                status: task.status,
              },
            });
          }
        }

        for (const edge of detail.edges) {
          await this.events.record({
            workspaceId,
            scopeType: "task",
            scopeId: edge.toTaskId,
            eventType: "task_edge_created",
            actorType: "system",
            actorRef: "BACKFILL",
            summary: `Legacy dependency imported for ${edge.toTaskId}`,
            payload: {
              fromTaskId: edge.fromTaskId,
              type: edge.type,
            },
          });
        }
      }
    }
  }
}
