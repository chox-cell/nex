import type { Phase, Project, Sprint, Task } from "@nex/core";

import type { PhaseRepository, ProjectRepository, SprintRepository, TaskRepository } from "../repositories/execution-repository";

export interface ResolvedTaskScope {
  task: Task;
  phase: Phase;
  sprint: Sprint;
  project: Project;
  workspaceId: string;
}

export interface ResolvedSprintScope {
  sprint: Sprint;
  project: Project;
  workspaceId: string;
}

export interface ResolvedProjectScope {
  project: Project;
  workspaceId: string;
}

export class TaskScopeService {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly phases: PhaseRepository,
    private readonly sprints: SprintRepository,
    private readonly projects: ProjectRepository,
  ) {}

  async resolveTask(taskId: string): Promise<ResolvedTaskScope> {
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

    return {
      task,
      phase,
      sprint,
      project,
      workspaceId: project.workspaceId,
    };
  }

  async resolveSprint(sprintId: string): Promise<ResolvedSprintScope | null> {
    const sprint = await this.sprints.getById(sprintId);

    if (!sprint) {
      return null;
    }

    const project = await this.projects.getById(sprint.projectId);

    if (!project) {
      return null;
    }

    return {
      sprint,
      project,
      workspaceId: project.workspaceId,
    };
  }

  async resolveProject(projectId: string): Promise<ResolvedProjectScope> {
    const project = await this.projects.getById(projectId);

    if (!project) {
      throw new Error(`Project ${projectId} was not found.`);
    }

    return {
      project,
      workspaceId: project.workspaceId,
    };
  }
}

