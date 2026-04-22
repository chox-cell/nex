import type { CodexResultPacket } from "./connectors";
import type { Decision, Objective, StrategicPriority, Vision, Workspace } from "./mission";
import type { Phase, Project, Run, RunStep, Sprint, Task, TaskEdge } from "./execution";
import type { Plan, PlanAction, PlanSection, PlanVersion } from "./planning";
import type { EventRecord, PatternRecord, ResumePacket, StateProjection } from "./memory";
import type { RepoReference, TerminalRunReference } from "./surfaces";
import type { ToolPacket, ToolProvider } from "./tooling";
import type { AuditRecord, Evidence, GateDecision, Snapshot, Verification } from "./truth";

export interface NexDatabase {
  version: 1;
  workspaces: Workspace[];
  visions: Vision[];
  strategicPriorities: StrategicPriority[];
  objectives: Objective[];
  decisions: Decision[];
  plans: Plan[];
  planVersions: PlanVersion[];
  planSections: PlanSection[];
  planActions: PlanAction[];
  projects: Project[];
  sprints: Sprint[];
  phases: Phase[];
  tasks: Task[];
  taskEdges: TaskEdge[];
  runs: Run[];
  runSteps: RunStep[];
  events: EventRecord[];
  stateProjections: StateProjection[];
  resumePackets: ResumePacket[];
  patternRecords: PatternRecord[];
  toolProviders: ToolProvider[];
  toolPackets: ToolPacket[];
  codexResultPackets: CodexResultPacket[];
  repoReferences: RepoReference[];
  terminalRunReferences: TerminalRunReference[];
  evidence: Evidence[];
  verifications: Verification[];
  gateDecisions: GateDecision[];
  auditRecords: AuditRecord[];
  snapshots: Snapshot[];
}

export function createEmptyNexDatabase(): NexDatabase {
  return {
    version: 1,
    workspaces: [],
    visions: [],
    strategicPriorities: [],
    objectives: [],
    decisions: [],
    plans: [],
    planVersions: [],
    planSections: [],
    planActions: [],
    projects: [],
    sprints: [],
    phases: [],
    tasks: [],
    taskEdges: [],
    runs: [],
    runSteps: [],
    events: [],
    stateProjections: [],
    resumePackets: [],
    patternRecords: [],
    toolProviders: [],
    toolPackets: [],
    codexResultPackets: [],
    repoReferences: [],
    terminalRunReferences: [],
    evidence: [],
    verifications: [],
    gateDecisions: [],
    auditRecords: [],
    snapshots: [],
  };
}
