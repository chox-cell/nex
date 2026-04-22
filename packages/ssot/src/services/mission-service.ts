import type { Decision, Objective, StrategicPriority, Vision, Workspace } from "@nex/core";

import type {
  DecisionRepository,
  ObjectiveRepository,
  StrategicPriorityRepository,
  VisionRepository,
  WorkspaceRepository,
} from "../repositories/mission-repository";

export interface WorkspaceMissionSummary {
  workspace: Workspace;
  vision: Vision | null;
  priorities: StrategicPriority[];
  objectives: Objective[];
  decisions: Decision[];
}

export class MissionService {
  constructor(
    private readonly workspaces: WorkspaceRepository,
    private readonly visions: VisionRepository,
    private readonly priorities: StrategicPriorityRepository,
    private readonly objectives: ObjectiveRepository,
    private readonly decisions: DecisionRepository,
  ) {}

  async getFounderSummary(): Promise<WorkspaceMissionSummary | null> {
    const workspace = await this.workspaces.getCurrent();

    if (!workspace) {
      return null;
    }

    const [vision, priorities, objectives, decisions] = await Promise.all([
      this.visions.getActiveByWorkspace(workspace.id),
      this.priorities.listByWorkspace(workspace.id),
      this.objectives.listByWorkspace(workspace.id),
      this.decisions.listByWorkspace(workspace.id),
    ]);

    return {
      workspace,
      vision,
      priorities,
      objectives,
      decisions,
    };
  }
}

