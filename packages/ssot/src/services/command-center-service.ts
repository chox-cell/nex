import type {
  Project,
  ProjectProjectionState,
  SprintProjectionState,
  TaskProjectionState,
} from "@nex/core";

import type { MissionService, WorkspaceMissionSummary } from "./mission-service";
import type { ProjectionService } from "./projection-service";
import type { ToolProviderService } from "./tool-provider-service";
import type { ExecutionService } from "./execution-service";

export interface BlockerEntry {
  text: string;
  context: string;
}

export interface CommandCenterSummary {
  mission: {
    title: string;
    objective: string;
    strategicFocus: string;
  };
  priorities: {
    title: string;
    status: string;
    rank: number;
  }[];
  project: {
    name: string;
    status: string;
    riskLevel: string;
    progressScore: number;
    progressSummary: string;
  } | null;
  sprint: {
    name: string;
    status: string;
    progressScore: number;
    phaseSummary: string;
  } | null;
  task: {
    name: string;
    status: string;
    blockerState: string;
    dependencySummary: string;
  } | null;
  ownerTool: {
    name: string;
    providerType: string;
    status: string;
    readiness: string;
  } | null;
  blockers: BlockerEntry[];
  lastVerifiedProof: string | null;
  nextRequiredMove: {
    action: string;
    reason: string;
  };
}

export class CommandCenterService {
  constructor(
    private readonly mission: MissionService,
    private readonly projections: ProjectionService,
    private readonly tools: ToolProviderService,
    private readonly execution: ExecutionService,
  ) {}

  async getCommandCenterSummary(): Promise<CommandCenterSummary | null> {
    const missionSummary = await this.mission.getFounderSummary();
    if (!missionSummary) return null;

    const projects = await this.execution.listProjects(missionSummary.workspace.id);
    const activeProject =
      projects.find((p) => p.project.status === "ACTIVE")?.project ??
      projects[0]?.project ??
      null;

    let projectProjection: ProjectProjectionState | null = null;
    let sprintProjection: SprintProjectionState | null = null;
    let taskProjection: TaskProjectionState | null = null;

    if (activeProject) {
      projectProjection = await this.projections.refreshProjectProjection(activeProject.id);
      if (projectProjection.currentSprintId) {
        sprintProjection = await this.projections.refreshSprintProjection(projectProjection.currentSprintId);
        if (sprintProjection.currentTaskId) {
          taskProjection = await this.projections.refreshTaskProjection(sprintProjection.currentTaskId);
        }
      }
    }

    const toolRegistry = await this.tools.getFounderRegistrySummary();
    const activeTool = taskProjection
      ? toolRegistry?.providers.find((p) => p.providerType.toUpperCase() === taskProjection?.ownerRef) ?? null
      : null;

    const blockers: BlockerEntry[] = [];
    if (taskProjection?.blockers) {
      taskProjection.blockers.forEach((b) => blockers.push({ text: b, context: `Task: ${taskProjection?.taskTitle}` }));
    }
    if (sprintProjection?.blockers) {
      // Avoid duplicates if task blockers are already in sprint blockers
      sprintProjection.blockers.forEach((b) => {
        if (!blockers.some((existing) => existing.text === b)) {
          blockers.push({ text: b, context: `Sprint: ${sprintProjection?.sprintName}` });
        }
      });
    }

    const nextMove = this.deriveNextMove({
      activeProject,
      projectProjection,
      sprintProjection,
      taskProjection,
    });

    return {
      mission: {
        title: missionSummary.workspace.name,
        objective: missionSummary.vision?.narrative ?? "No active objective statement.",
        strategicFocus: missionSummary.priorities[0]?.title ?? "General operational stability.",
      },
      priorities: missionSummary.priorities.map((p) => ({
        title: p.title,
        status: p.status,
        rank: p.rank,
      })),
      project: activeProject
        ? {
            name: activeProject.name,
            status: activeProject.status,
            riskLevel: activeProject.riskLevel,
            progressScore: projectProjection?.progressScore ?? 0,
            progressSummary: `${(projectProjection?.progressScore ?? 0).toFixed(0)}% truth coverage across active sprint.`,
          }
        : null,
      sprint: sprintProjection
        ? {
            name: sprintProjection.sprintName,
            status: sprintProjection.sprintStatus,
            progressScore: sprintProjection.progressScore,
            phaseSummary: `${sprintProjection.phaseProgress.length} phases, current: ${
              sprintProjection.phaseProgress.find((p) => p.phaseId === sprintProjection?.currentPhaseId)?.phaseName ?? "N/A"
            }`,
          }
        : null,
      task: taskProjection
        ? {
            name: taskProjection.taskTitle,
            status: taskProjection.taskStatus,
            blockerState: taskProjection.blockers.length > 0 ? "BLOCKED" : "CLEAR",
            dependencySummary: taskProjection.pendingDependencies.length > 0
              ? `Waiting on: ${taskProjection.pendingDependencies.join(", ")}`
              : "No pending internal dependencies.",
          }
        : null,
      ownerTool: activeTool
        ? {
            name: activeTool.name,
            providerType: activeTool.providerType,
            status: activeTool.status,
            readiness: activeTool.status === "active" ? "READY" : "OFFLINE",
          }
        : null,
      blockers,
      lastVerifiedProof: taskProjection?.lastProof ?? sprintProjection?.lastProof ?? null,
      nextRequiredMove: nextMove,
    };
  }

  private deriveNextMove(input: {
    activeProject: Project | null;
    projectProjection: ProjectProjectionState | null;
    sprintProjection: SprintProjectionState | null;
    taskProjection: TaskProjectionState | null;
  }): { action: string; reason: string } {
    const { activeProject, sprintProjection, taskProjection } = input;

    if (!activeProject) {
      return {
        action: "Choose or create a project",
        reason: "No active project exists in the founder workspace.",
      };
    }

    if (!sprintProjection) {
      return {
        action: "Convert plan to sprint",
        reason: "The active project has no linked sprint in progress.",
      };
    }

    if (!taskProjection) {
      return {
        action: "Initialize or select task",
        reason: "The current sprint has no active task focus.",
      };
    }

    // Rules from requirements
    if (!taskProjection.ownerRef || taskProjection.ownerRef === "FOUNDER") {
      if (taskProjection.taskStatus === "READY") {
        return {
          action: "Assign owner",
          reason: "Task is ready but has no assigned tool or active founder ownership.",
        };
      }
    }

    if (taskProjection.taskStatus === "IN_PROGRESS" && taskProjection.evidenceCount === 0) {
      return {
        action: "Log work or attach proof",
        reason: "Task is in progress but lacks evidence/packets for truth closure.",
      };
    }

    if (taskProjection.blockers.length > 0) {
      return {
        action: "Resolve blocker",
        reason: `Task is stalled: ${taskProjection.blockers[0]}`,
      };
    }

    if (taskProjection.taskStatus === "PROOF_ATTACHED" && taskProjection.verificationSummary.total === 0) {
      return {
        action: "Run verification",
        reason: "Evidence is attached but no verification record exists.",
      };
    }

    if (taskProjection.taskStatus === "VERIFIED" && !taskProjection.latestGateDecision) {
      return {
        action: "Create gate decision",
        reason: "Verification passed but founder/system gate has not been decided.",
      };
    }

    if (taskProjection.latestGateDecision === "GO" && taskProjection.auditCount === 0) {
      return {
        action: "Write audit",
        reason: "Gate is GO but the final audit record is missing.",
      };
    }

    if (taskProjection.auditCount > 0 && taskProjection.snapshotCount === 0) {
      return {
        action: "Save snapshot",
        reason: "Audit is recorded but truth snapshot hasn't been persisted.",
      };
    }

    if (taskProjection.taskStatus === "DONE" && (sprintProjection?.blockedTaskIds.length ?? 0) > 0) {
      return {
        action: "Address top sprint blocker",
        reason: "Current task is done but the sprint is blocked elsewhere.",
      };
    }

    return {
      action: taskProjection.nextRequiredAction,
      reason: "Action derived from current task projection state.",
    };
  }
}
