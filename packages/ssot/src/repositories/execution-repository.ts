import type { Phase, Project, Sprint, Task, TaskEdge } from "@nex/core";

import type { FileNexStore } from "../store/file-nex-store";
import { sortByCreatedAtDesc, sortByOrder, upsertById } from "./helpers";

export class ProjectRepository {
  constructor(private readonly store: FileNexStore) {}

  async listAll(): Promise<Project[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.projects);
  }

  async listByWorkspace(workspaceId: string): Promise<Project[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.projects.filter((project) => project.workspaceId === workspaceId));
  }

  async getById(id: string): Promise<Project | null> {
    const database = await this.store.read();
    return database.projects.find((project) => project.id === id) ?? null;
  }

  async getBySlug(slug: string): Promise<Project | null> {
    const database = await this.store.read();
    return database.projects.find((project) => project.slug === slug) ?? null;
  }

  async save(project: Project): Promise<Project> {
    await this.store.update((database) => {
      upsertById(database.projects, project);
    });

    return project;
  }
}

export class SprintRepository {
  constructor(private readonly store: FileNexStore) {}

  async listAll(): Promise<Sprint[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.sprints);
  }

  async listByProject(projectId: string): Promise<Sprint[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.sprints.filter((sprint) => sprint.projectId === projectId));
  }

  async listByPlan(planId: string): Promise<Sprint[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.sprints.filter((sprint) => sprint.planId === planId));
  }

  async getById(id: string): Promise<Sprint | null> {
    const database = await this.store.read();
    return database.sprints.find((sprint) => sprint.id === id) ?? null;
  }

  async save(sprint: Sprint): Promise<Sprint> {
    await this.store.update((database) => {
      upsertById(database.sprints, sprint);
    });

    return sprint;
  }
}

export class PhaseRepository {
  constructor(private readonly store: FileNexStore) {}

  async listAll(): Promise<Phase[]> {
    const database = await this.store.read();
    return sortByOrder(database.phases);
  }

  async listBySprint(sprintId: string): Promise<Phase[]> {
    const database = await this.store.read();
    return sortByOrder(database.phases.filter((phase) => phase.sprintId === sprintId));
  }

  async getById(id: string): Promise<Phase | null> {
    const database = await this.store.read();
    return database.phases.find((phase) => phase.id === id) ?? null;
  }

  async saveMany(phases: Phase[]): Promise<Phase[]> {
    await this.store.update((database) => {
      for (const phase of phases) {
        upsertById(database.phases, phase);
      }
    });

    return phases;
  }

  async save(phase: Phase): Promise<Phase> {
    await this.store.update((database) => {
      upsertById(database.phases, phase);
    });

    return phase;
  }
}

export class TaskRepository {
  constructor(private readonly store: FileNexStore) {}

  async listAll(): Promise<Task[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.tasks).reverse();
  }

  async listByPhase(phaseId: string): Promise<Task[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.tasks.filter((task) => task.phaseId === phaseId)).reverse();
  }

  async listByPhases(phaseIds: string[]): Promise<Task[]> {
    const database = await this.store.read();
    return database.tasks.filter((task) => phaseIds.includes(task.phaseId));
  }

  async getById(id: string): Promise<Task | null> {
    const database = await this.store.read();
    return database.tasks.find((task) => task.id === id) ?? null;
  }

  async getByIds(ids: string[]): Promise<Task[]> {
    const database = await this.store.read();
    return database.tasks.filter((task) => ids.includes(task.id));
  }

  async save(task: Task): Promise<Task> {
    await this.store.update((database) => {
      upsertById(database.tasks, task);
    });

    return task;
  }

  async saveMany(tasks: Task[]): Promise<Task[]> {
    await this.store.update((database) => {
      for (const task of tasks) {
        upsertById(database.tasks, task);
      }
    });

    return tasks;
  }
}

export class TaskEdgeRepository {
  constructor(private readonly store: FileNexStore) {}

  async listAll(): Promise<TaskEdge[]> {
    const database = await this.store.read();
    return database.taskEdges;
  }

  async listBySprintTaskIds(taskIds: string[]): Promise<TaskEdge[]> {
    const database = await this.store.read();
    return database.taskEdges.filter((edge) => taskIds.includes(edge.fromTaskId) || taskIds.includes(edge.toTaskId));
  }

  async listByTask(taskId: string): Promise<TaskEdge[]> {
    const database = await this.store.read();
    return database.taskEdges.filter((edge) => edge.fromTaskId === taskId || edge.toTaskId === taskId);
  }

  async save(edge: TaskEdge): Promise<TaskEdge> {
    await this.store.update((database) => {
      upsertById(database.taskEdges, edge);
    });

    return edge;
  }
}
