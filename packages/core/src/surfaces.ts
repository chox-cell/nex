import type { BaseEntity, IsoDateString } from "./base";

export interface RepoReference extends BaseEntity {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  taskId: string;
  phaseId: string | null;
  toolProviderId: string | null;
  toolPacketId: string | null;
  repoLabel: string;
  sourceLabel: string | null;
  branchName: string | null;
  gitRef: string | null;
  commitSha: string | null;
  diffRef: string | null;
  sourcePath: string | null;
  filesTouched: string[];
  summary: string;
  note: string;
  linkedEvidenceIds: string[];
}

export interface TerminalRunReference extends BaseEntity {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  taskId: string;
  phaseId: string | null;
  toolProviderId: string | null;
  toolPacketId: string | null;
  commandSummary: string;
  commands: string[];
  cwd: string | null;
  stdoutRef: string | null;
  stderrRef: string | null;
  logRef: string | null;
  logExcerpt: string;
  executedAt: IsoDateString;
  summary: string;
  outcome: string;
  note: string;
  linkedEvidenceIds: string[];
}
