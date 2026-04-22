import type { ProjectProjectionState, SprintProjectionState, TaskProjectionState } from "@nex/core";

import type { PatternService } from "./pattern-service";
import type { ProjectionService } from "./projection-service";
import type { ResumePacketService } from "./resume-packet-service";

export class TruthSyncService {
  constructor(
    private readonly projections: ProjectionService,
    private readonly resumePackets: ResumePacketService,
    private readonly patterns: PatternService,
  ) {}

  async refreshTaskScope(taskId: string): Promise<{
    taskProjection: TaskProjectionState;
    sprintProjection: SprintProjectionState;
    projectProjection: ProjectProjectionState;
  }> {
    const taskProjection = await this.projections.refreshTaskProjection(taskId);
    const sprintProjection = await this.projections.refreshSprintProjection(taskProjection.sprintId);
    const projectProjection = await this.projections.refreshProjectProjection(taskProjection.projectId);

    await this.resumePackets.saveTaskPacket(taskProjection);
    await this.resumePackets.saveSprintPacket(sprintProjection);
    await this.patterns.refreshWorkspacePatterns(taskProjection.workspaceId);

    return {
      taskProjection,
      sprintProjection,
      projectProjection,
    };
  }

  async refreshSprintScope(sprintId: string): Promise<{
    sprintProjection: SprintProjectionState;
    projectProjection: ProjectProjectionState;
  }> {
    await this.projections.refreshTaskProjectionsForSprint(sprintId);
    const sprintProjection = await this.projections.refreshSprintProjection(sprintId);
    const projectProjection = await this.projections.refreshProjectProjection(sprintProjection.projectId);

    await this.resumePackets.saveSprintPacket(sprintProjection);
    await this.patterns.refreshWorkspacePatterns(sprintProjection.workspaceId);

    return {
      sprintProjection,
      projectProjection,
    };
  }

  async refreshProjectScope(projectId: string): Promise<ProjectProjectionState> {
    const projectProjection = await this.projections.refreshProjectProjection(projectId);
    await this.patterns.refreshWorkspacePatterns(projectProjection.workspaceId);
    return projectProjection;
  }
}
