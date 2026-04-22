import {
  createBaseEntity,
  createId,
  nowIso,
  type Phase,
  type PhaseStatus,
  type PlanAction,
  type Project,
  type ProjectStatus,
  type Sprint,
  type SprintStatus,
  type Task,
  type TaskEdge,
  type TaskEdgeType,
  type TaskStatus,
} from "@nex/core";

import type {
  PhaseRepository,
  ProjectRepository,
  SprintRepository,
  TaskEdgeRepository,
  TaskRepository,
} from "../repositories/execution-repository";
import type { PlanActionRepository, PlanRepository, PlanSectionRepository } from "../repositories/plan-repository";
import type { WorkspaceRepository } from "../repositories/mission-repository";
import type { EventService } from "./event-service";
import type { TaskGovernanceService } from "./task-governance-service";
import type { TruthSyncService } from "./truth-sync-service";

export interface CreateProjectInput {
  workspaceId: string;
  planId: string | null;
  name: string;
  slug: string;
  summary: string;
  status: ProjectStatus;
  riskLevel: Project["riskLevel"];
}

export interface CreateSprintInput {
  projectId: string;
  planId: string | null;
  name: string;
  goal: string;
  status: SprintStatus;
}

export interface CreatePhaseInput {
  sprintId: string;
  name: string;
  goal: string;
  status: PhaseStatus;
  order: number;
  weight: number;
}

export interface CreateTaskInput {
  phaseId: string;
  title: string;
  objective: string;
  description: string;
  status: TaskStatus;
  ownerKind: Task["ownerKind"];
  ownerRef: Task["ownerRef"];
  priorityWeight: number;
  constraints: string[];
  acceptanceCriteria: string[];
  requiredProof: string[];
}

export interface CreateTaskEdgeInput {
  fromTaskId: string;
  toTaskId: string;
  type: TaskEdgeType;
  rationale: string;
}

export interface AssignTaskOwnerInput {
  taskId: string;
  ownerKind: Task["ownerKind"];
  ownerRef: Task["ownerRef"];
  assignedBy: string;
}

export interface ProjectSummary {
  project: Project;
  sprintCount: number;
  planCount: number;
}

export interface ProjectDetail {
  project: Project;
  sprints: Sprint[];
  activeSprint: Sprint | null;
  planIds: string[];
}

export interface SprintDetail {
  sprint: Sprint;
  project: Project;
  phases: Array<{
    phase: Phase;
    tasks: Task[];
  }>;
  edges: TaskEdge[];
}

export interface TaskDetail {
  task: Task;
  phase: Phase;
  sprint: Sprint;
  project: Project;
  inboundEdges: TaskEdge[];
  outboundEdges: TaskEdge[];
}

export class ExecutionService {
  constructor(
    private readonly workspaces: WorkspaceRepository,
    private readonly projects: ProjectRepository,
    private readonly sprints: SprintRepository,
    private readonly phases: PhaseRepository,
    private readonly tasks: TaskRepository,
    private readonly edges: TaskEdgeRepository,
    private readonly plans: PlanRepository,
    private readonly planSections: PlanSectionRepository,
    private readonly planActions: PlanActionRepository,
    private readonly governance: TaskGovernanceService,
    private readonly events: EventService,
    private readonly sync: TruthSyncService,
  ) {}

  async listProjects(workspaceId: string): Promise<ProjectSummary[]> {
    const [projects, workspacePlans] = await Promise.all([
      this.projects.listByWorkspace(workspaceId),
      this.plans.listByWorkspace(workspaceId),
    ]);

    return Promise.all(
      projects.map(async (project) => ({
        project,
        sprintCount: (await this.sprints.listByProject(project.id)).length,
        planCount: workspacePlans.filter((plan) => plan.projectId === project.id).length,
      })),
    );
  }

  async getProjectDetail(projectId: string): Promise<ProjectDetail> {
    const project = await this.projects.getById(projectId);

    if (!project) {
      throw new Error(`Project ${projectId} was not found.`);
    }

    const sprints = await this.sprints.listByProject(project.id);
    const activeSprint = project.currentSprintId ? await this.sprints.getById(project.currentSprintId) : null;

    return {
      project,
      sprints,
      activeSprint,
      planIds: (await this.plans.listByProject(project.id)).map((plan) => plan.id),
    };
  }

  async getSprintDetail(sprintId: string): Promise<SprintDetail> {
    const sprint = await this.sprints.getById(sprintId);

    if (!sprint) {
      throw new Error(`Sprint ${sprintId} was not found.`);
    }

    const project = await this.projects.getById(sprint.projectId);

    if (!project) {
      throw new Error(`Project ${sprint.projectId} was not found.`);
    }

    const phases = await this.phases.listBySprint(sprint.id);
    const tasks = await this.tasks.listByPhases(phases.map((phase) => phase.id));
    const edges = await this.edges.listBySprintTaskIds(tasks.map((task) => task.id));

    return {
      sprint,
      project,
      phases: phases.map((phase) => ({
        phase,
        tasks: tasks.filter((task) => task.phaseId === phase.id),
      })),
      edges,
    };
  }

  async getTaskDetail(taskId: string): Promise<TaskDetail> {
    const task = await this.tasks.getById(taskId);

    if (!task) {
      throw new Error(`Task ${taskId} was not found.`);
    }

    const phase = await this.phases.getById(task.phaseId);

    if (!phase) {
      throw new Error(`Phase ${task.phaseId} was not found.`);
    }

    const sprint = await this.sprints.getById(phase.sprintId);

    if (!sprint) {
      throw new Error(`Sprint ${phase.sprintId} was not found.`);
    }

    const project = await this.projects.getById(sprint.projectId);

    if (!project) {
      throw new Error(`Project ${sprint.projectId} was not found.`);
    }

    const relatedEdges = await this.edges.listByTask(task.id);

    return {
      task,
      phase,
      sprint,
      project,
      inboundEdges: relatedEdges.filter((edge) => edge.toTaskId === task.id),
      outboundEdges: relatedEdges.filter((edge) => edge.fromTaskId === task.id),
    };
  }

  async assignTaskOwner(input: AssignTaskOwnerInput): Promise<Task> {
    this.governance.assertOwner({
      ownerKind: input.ownerKind,
      ownerRef: input.ownerRef,
    });

    const detail = await this.getTaskDetail(input.taskId);
    const updatedTask: Task = {
      ...detail.task,
      ownerKind: input.ownerKind,
      ownerRef: input.ownerRef,
      updatedAt: nowIso(),
    };

    await this.tasks.save(updatedTask);
    await this.events.record({
      workspaceId: detail.project.workspaceId,
      scopeType: "task",
      scopeId: detail.task.id,
      eventType: "task_owner_assigned",
      actorType: "founder",
      actorRef: input.assignedBy,
      summary: `Task owner assigned: ${input.ownerKind} / ${input.ownerRef}`,
      payload: {
        previousOwnerKind: detail.task.ownerKind,
        previousOwnerRef: detail.task.ownerRef,
        nextOwnerKind: updatedTask.ownerKind,
        nextOwnerRef: updatedTask.ownerRef,
      },
    });
    await this.sync.refreshTaskScope(detail.task.id);

    return updatedTask;
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const workspace = await this.workspaces.getById(input.workspaceId);

    if (!workspace) {
      throw new Error(`Workspace ${input.workspaceId} was not found.`);
    }

    const timestamp = nowIso();
    const project: Project = {
      ...createBaseEntity(createId("project"), timestamp),
      workspaceId: input.workspaceId,
      planId: input.planId,
      name: input.name,
      slug: input.slug,
      summary: input.summary,
      status: input.status,
      currentSprintId: null,
      riskLevel: input.riskLevel,
    };

    await this.projects.save(project);
    await this.events.record({
      workspaceId: input.workspaceId,
      scopeType: "project",
      scopeId: project.id,
      eventType: "project_created",
      actorType: "tool",
      actorRef: "CODEX",
      summary: `Project created: ${project.name}`,
      payload: {
        riskLevel: project.riskLevel,
      },
    });
    await this.sync.refreshProjectScope(project.id);
    return project;
  }

  async createSprint(input: CreateSprintInput): Promise<Sprint> {
    const project = await this.projects.getById(input.projectId);

    if (!project) {
      throw new Error(`Project ${input.projectId} was not found.`);
    }

    if (input.planId) {
      const plan = await this.plans.getById(input.planId);
      if (!plan) {
        throw new Error(`Plan ${input.planId} was not found.`);
      }
    }

    const timestamp = nowIso();
    const sprint: Sprint = {
      ...createBaseEntity(createId("sprint"), timestamp),
      projectId: input.projectId,
      planId: input.planId,
      name: input.name,
      goal: input.goal,
      status: input.status,
      currentPhaseId: null,
    };

    await this.sprints.save(sprint);
    await this.events.record({
      workspaceId: project.workspaceId,
      scopeType: "sprint",
      scopeId: sprint.id,
      eventType: "sprint_created",
      actorType: "tool",
      actorRef: "CODEX",
      summary: `Sprint created: ${sprint.name}`,
      payload: {
        planId: sprint.planId,
      },
    });
    await this.sync.refreshSprintScope(sprint.id);
    return sprint;
  }

  async createPhase(input: CreatePhaseInput): Promise<Phase> {
    const sprint = await this.sprints.getById(input.sprintId);

    if (!sprint) {
      throw new Error(`Sprint ${input.sprintId} was not found.`);
    }

    const phase: Phase = {
      ...createBaseEntity(createId("phase"), nowIso()),
      sprintId: input.sprintId,
      name: input.name,
      goal: input.goal,
      status: input.status,
      order: input.order,
      weight: input.weight,
    };

    await this.phases.save(phase);
    await this.events.record({
      workspaceId: (await this.projects.getById(sprint.projectId))?.workspaceId ?? "",
      scopeType: "phase",
      scopeId: phase.id,
      eventType: "phase_created",
      actorType: "tool",
      actorRef: "CODEX",
      summary: `Phase created: ${phase.name}`,
      payload: {
        sprintId: phase.sprintId,
      },
    });

    if (!sprint.currentPhaseId) {
      await this.sprints.save({
        ...sprint,
        currentPhaseId: phase.id,
        updatedAt: nowIso(),
      });
    }

    await this.sync.refreshSprintScope(phase.sprintId);
    return phase;
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    this.governance.assertOwner({ ownerKind: input.ownerKind, ownerRef: input.ownerRef });

    const phase = await this.phases.getById(input.phaseId);

    if (!phase) {
      throw new Error(`Phase ${input.phaseId} was not found.`);
    }

    const task: Task = {
      ...createBaseEntity(createId("task"), nowIso()),
      phaseId: input.phaseId,
      title: input.title,
      objective: input.objective,
      description: input.description,
      status: input.status,
      ownerKind: input.ownerKind,
      ownerRef: input.ownerRef,
      priorityWeight: input.priorityWeight,
      constraints: input.constraints,
      acceptanceCriteria: input.acceptanceCriteria,
      requiredProof: input.requiredProof,
    };

    await this.tasks.save(task);
    const sprint = await this.sprints.getById(phase.sprintId);
    const project = sprint ? await this.projects.getById(sprint.projectId) : null;

    if (project) {
      await this.events.record({
        workspaceId: project.workspaceId,
        scopeType: "task",
        scopeId: task.id,
        eventType: "task_created",
        actorType: "tool",
        actorRef: "CODEX",
        summary: `Task created: ${task.title}`,
        payload: {
          ownerRef: task.ownerRef,
          phaseId: task.phaseId,
        },
      });
    }
    await this.sync.refreshTaskScope(task.id);
    return task;
  }

  async createTaskEdge(input: CreateTaskEdgeInput): Promise<TaskEdge> {
    const [fromTask, toTask] = await Promise.all([this.tasks.getById(input.fromTaskId), this.tasks.getById(input.toTaskId)]);

    if (!fromTask || !toTask) {
      throw new Error("Task edges require existing source and destination tasks.");
    }

    if (fromTask.id === toTask.id) {
      throw new Error("Task edges may not self-reference.");
    }

    const [fromPhase, toPhase] = await Promise.all([this.phases.getById(fromTask.phaseId), this.phases.getById(toTask.phaseId)]);

    if (!fromPhase || !toPhase || fromPhase.sprintId !== toPhase.sprintId) {
      throw new Error("Task edges must connect tasks inside the same sprint.");
    }

    const existingEdges = await this.edges.listByTask(fromTask.id);
    const duplicate = existingEdges.some(
      (edge) => edge.fromTaskId === input.fromTaskId && edge.toTaskId === input.toTaskId && edge.type === input.type,
    );

    if (duplicate) {
      throw new Error("Duplicate task edge detected.");
    }

    const edge: TaskEdge = {
      ...createBaseEntity(createId("task_edge"), nowIso()),
      fromTaskId: input.fromTaskId,
      toTaskId: input.toTaskId,
      type: input.type,
      rationale: input.rationale,
    };

    await this.edges.save(edge);
    const targetTask = await this.tasks.getById(input.toTaskId);

    if (targetTask) {
      const phase = await this.phases.getById(targetTask.phaseId);
      const sprint = phase ? await this.sprints.getById(phase.sprintId) : null;
      const project = sprint ? await this.projects.getById(sprint.projectId) : null;

      if (project) {
        await this.events.record({
          workspaceId: project.workspaceId,
          scopeType: "task",
          scopeId: targetTask.id,
          eventType: "task_edge_created",
          actorType: "tool",
          actorRef: "CODEX",
          summary: `Task dependency added to ${targetTask.title}`,
          payload: {
            fromTaskId: input.fromTaskId,
            type: input.type,
          },
        });
      }

      await this.sync.refreshTaskScope(targetTask.id);
    }

    return edge;
  }

  async convertPlanToSprint(planId: string): Promise<SprintDetail> {
    const plan = await this.plans.getById(planId);

    if (!plan) {
      throw new Error(`Plan ${planId} was not found.`);
    }

    if (!plan.projectId) {
      throw new Error("Plan-to-sprint conversion requires the plan to be linked to a project.");
    }

    const [sections, actions] = await Promise.all([this.planSections.listByPlan(plan.id), this.planActions.listByPlan(plan.id)]);

    if (!sections.length || !actions.length) {
      throw new Error("Plan-to-sprint conversion requires at least one section and one action.");
    }

    const sprint = await this.createSprint({
      projectId: plan.projectId,
      planId: plan.id,
      name: `${plan.name} Sprint`,
      goal: plan.goal,
      status: "PLANNED",
    });

    const phaseMap = new Map<string, Phase>();

    for (const section of sections) {
      const phase = await this.createPhase({
        sprintId: sprint.id,
        name: section.title,
        goal: section.intent,
        status: "READY",
        order: section.position,
        weight: 1,
      });

      phaseMap.set(section.id, phase);
    }

    const createdTasks = new Map<string, Task>();
    const actionsBySection = new Map<string, PlanAction[]>();

    for (const action of actions) {
      const group = actionsBySection.get(action.sectionId) ?? [];
      group.push(action);
      actionsBySection.set(action.sectionId, group);
    }

    for (const section of sections) {
      const phase = phaseMap.get(section.id);

      if (!phase) {
        continue;
      }

      const sectionActions = (actionsBySection.get(section.id) ?? []).sort((left, right) => left.position - right.position);

      for (const action of sectionActions) {
        const task = await this.createTask({
          phaseId: phase.id,
          title: action.title,
          objective: action.description,
          description: action.description,
          status: "READY",
          ownerKind: action.ownerKind,
          ownerRef: action.ownerRef,
          priorityWeight: action.priorityWeight,
          constraints: action.constraints,
          acceptanceCriteria: action.acceptanceCriteria,
          requiredProof: ["Repo diff or execution trace", "Verification result"],
        });

        createdTasks.set(action.id, task);
      }

      const sectionTaskList = sectionActions
        .map((action) => createdTasks.get(action.id))
        .filter((task): task is Task => Boolean(task));

      for (let index = 1; index < sectionTaskList.length; index += 1) {
        const previousTask = sectionTaskList[index - 1];
        const currentTask = sectionTaskList[index];

        if (!previousTask || !currentTask) {
          continue;
        }

        await this.createTaskEdge({
          fromTaskId: previousTask.id,
          toTaskId: currentTask.id,
          type: "follows",
          rationale: "Derived from sequential plan action order.",
        });
      }
    }

    const project = await this.projects.getById(plan.projectId);

    if (!project) {
      throw new Error(`Project ${plan.projectId} was not found.`);
    }

    await this.projects.save({
      ...project,
      currentSprintId: sprint.id,
      status: "ACTIVE",
      updatedAt: nowIso(),
    });
    await this.sync.refreshSprintScope(sprint.id);

    return this.getSprintDetail(sprint.id);
  }
}
