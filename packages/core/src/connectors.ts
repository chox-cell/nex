import type { BaseEntity, IsoDateString } from "./base";
import type { TaskStatus } from "./execution";

export type ConnectorLifecycleState = "unavailable" | "modeled" | "packet_ready" | "result_received" | "normalized" | "failed";
export type ConnectorProviderName = "Codex";
export type CodexResultStatus = "received" | "normalized" | "warning" | "failed";
export type ConnectorMetadataValue = string | number | boolean | null;
export type ConnectorMetadata = Record<string, ConnectorMetadataValue>;

export interface CodexTaskDependencyEdge {
  direction: "inbound" | "outbound";
  type: string;
  taskId: string;
}

export interface CodexTaskPacket {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  phaseId: string | null;
  taskId: string;
  ownerProviderId: string | null;
  providerName: ConnectorProviderName;
  objective: string;
  constraints: string[];
  acceptanceCriteria: string[];
  requiredProof: string[];
  currentState: TaskStatus;
  relevantContext: {
    taskTitle: string;
    taskDescription: string;
    projectName: string;
    projectSummary: string;
    sprintName: string;
    sprintGoal: string;
    phaseName: string;
    phaseGoal: string;
    priorityWeight: number;
    currentOwnerRef: string;
  };
  dependencySummary: {
    pendingDependencies: string[];
    relevantTaskEdges: CodexTaskDependencyEdge[];
  };
  relevantResumeContext: {
    blockers: string[];
    completedSteps: string[];
    failedSteps: string[];
    lastProof: string | null;
    nextRequiredAction: string;
    relevantConstraints: string[];
  } | null;
  suggestedTruthSurfaces: string[];
  createdAt: IsoDateString;
  priority: number;
  notes: string[];
  nextRequiredAction: string;
  missionContext: {
    visionTitle: string | null;
    priorityTitles: string[];
  } | null;
}

export interface CodexResultPacket extends BaseEntity {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  phaseId: string | null;
  taskId: string;
  providerId: string | null;
  providerName: ConnectorProviderName;
  summary: string;
  filesTouched: string[];
  commandsRun: string[];
  outcome: string;
  notes: string;
  evidenceRefs: string[];
  repoRefs: string[];
  terminalRefs: string[];
  suggestedNextAction: string | null;
  receivedAt: IsoDateString;
  rawPayloadRef: string | null;
  warnings: string[];
  resultStatus: CodexResultStatus;
  metadata: ConnectorMetadata;
}
