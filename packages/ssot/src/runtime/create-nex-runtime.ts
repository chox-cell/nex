import { CodexResultPacketRepository } from "../repositories/connector-repository";
import { FileNexStore } from "../store/file-nex-store";
import { EventRepository, PatternRecordRepository, ProjectionRepository, ResumePacketRepository } from "../repositories/memory-repository";
import {
  DecisionRepository,
  ObjectiveRepository,
  StrategicPriorityRepository,
  VisionRepository,
  WorkspaceRepository,
} from "../repositories/mission-repository";
import {
  PhaseRepository,
  ProjectRepository,
  SprintRepository,
  TaskEdgeRepository,
  TaskRepository,
} from "../repositories/execution-repository";
import { PlanActionRepository, PlanRepository, PlanSectionRepository, PlanVersionRepository } from "../repositories/plan-repository";
import { RepoReferenceRepository, TerminalRunReferenceRepository } from "../repositories/surface-repository";
import {
  AuditRecordRepository,
  EvidenceRepository,
  GateDecisionRepository,
  SnapshotRepository,
  VerificationRepository,
} from "../repositories/truth-repository";
import { ToolPacketRepository, ToolProviderRepository } from "../repositories/tooling-repository";
import { AuditService } from "../services/audit-service";
import { CodexConnectorService } from "../services/codex-connector-service";
import { GateDecisionService } from "../services/gate-decision-service";
import { EventService } from "../services/event-service";
import { EvidenceService } from "../services/evidence-service";
import { ExecutionService } from "../services/execution-service";
import { FounderSeedService } from "../services/founder-seed-service";
import { MissionService } from "../services/mission-service";
import { PatternService } from "../services/pattern-service";
import { PlanService } from "../services/plan-service";
import { ProjectionService } from "../services/projection-service";
import { RepoReferenceService } from "../services/repo-reference-service";
import { ResumePacketService } from "../services/resume-packet-service";
import { SnapshotService } from "../services/snapshot-service";
import { TaskScopeService } from "../services/task-scope-service";
import { TaskGovernanceService } from "../services/task-governance-service";
import { TerminalReferenceService } from "../services/terminal-reference-service";
import { ToolPacketService } from "../services/tool-packet-service";
import { ToolProviderService } from "../services/tool-provider-service";
import { TruthSyncService } from "../services/truth-sync-service";
import { VerificationService } from "../services/verification-service";

export function createNexRuntime(filePath: string) {
  const store = new FileNexStore(filePath);

  const repositories = {
    workspaces: new WorkspaceRepository(store),
    visions: new VisionRepository(store),
    priorities: new StrategicPriorityRepository(store),
    objectives: new ObjectiveRepository(store),
    decisions: new DecisionRepository(store),
    plans: new PlanRepository(store),
    planVersions: new PlanVersionRepository(store),
    planSections: new PlanSectionRepository(store),
    planActions: new PlanActionRepository(store),
    projects: new ProjectRepository(store),
    sprints: new SprintRepository(store),
    phases: new PhaseRepository(store),
    tasks: new TaskRepository(store),
    taskEdges: new TaskEdgeRepository(store),
    events: new EventRepository(store),
    projections: new ProjectionRepository(store),
    resumePackets: new ResumePacketRepository(store),
    patterns: new PatternRecordRepository(store),
    toolProviders: new ToolProviderRepository(store),
    toolPackets: new ToolPacketRepository(store),
    codexResults: new CodexResultPacketRepository(store),
    repoReferences: new RepoReferenceRepository(store),
    terminalRunReferences: new TerminalRunReferenceRepository(store),
    evidence: new EvidenceRepository(store),
    verifications: new VerificationRepository(store),
    gates: new GateDecisionRepository(store),
    audits: new AuditRecordRepository(store),
    snapshots: new SnapshotRepository(store),
  };

  const services = {
    events: null as unknown as EventService,
    scope: null as unknown as TaskScopeService,
    projections: null as unknown as ProjectionService,
    resumePackets: null as unknown as ResumePacketService,
    patterns: null as unknown as PatternService,
    tools: null as unknown as ToolProviderService,
    toolPackets: null as unknown as ToolPacketService,
    codexConnector: null as unknown as CodexConnectorService,
    repoReferences: null as unknown as RepoReferenceService,
    terminalReferences: null as unknown as TerminalReferenceService,
    sync: null as unknown as TruthSyncService,
    mission: null as unknown as MissionService,
    planning: null as unknown as PlanService,
    execution: null as unknown as ExecutionService,
    evidence: null as unknown as EvidenceService,
    verifications: null as unknown as VerificationService,
    gates: null as unknown as GateDecisionService,
    audits: null as unknown as AuditService,
    snapshots: null as unknown as SnapshotService,
    governance: null as unknown as TaskGovernanceService,
    seed: null as unknown as FounderSeedService,
  };

  services.events = new EventService(repositories.events);
  services.scope = new TaskScopeService(repositories.tasks, repositories.phases, repositories.sprints, repositories.projects);
  services.projections = new ProjectionService(
    repositories.projections,
    repositories.events,
    repositories.projects,
    repositories.sprints,
    repositories.phases,
    repositories.tasks,
    repositories.taskEdges,
    repositories.evidence,
    repositories.verifications,
    repositories.gates,
    repositories.audits,
    repositories.snapshots,
  );
  services.resumePackets = new ResumePacketService(
    repositories.resumePackets,
    services.projections,
    repositories.tasks,
    repositories.sprints,
  );
  services.patterns = new PatternService(repositories.patterns, repositories.events, services.projections);
  services.tools = new ToolProviderService(repositories.workspaces, repositories.toolProviders, services.events);
  services.toolPackets = new ToolPacketService(repositories.toolPackets, repositories.toolProviders, services.scope, services.events);
  services.sync = new TruthSyncService(services.projections, services.resumePackets, services.patterns);
  services.planning = new PlanService(
    repositories.plans,
    repositories.planVersions,
    repositories.planSections,
    repositories.planActions,
    services.events,
  );
  services.governance = new TaskGovernanceService(repositories.tasks, services.projections, services.events, services.sync);

  services.execution = new ExecutionService(
    repositories.workspaces,
    repositories.projects,
    repositories.sprints,
    repositories.phases,
    repositories.tasks,
    repositories.taskEdges,
    repositories.plans,
    repositories.planSections,
    repositories.planActions,
    services.governance,
    services.events,
    services.sync,
  );

  services.mission = new MissionService(
    repositories.workspaces,
    repositories.visions,
    repositories.priorities,
    repositories.objectives,
    repositories.decisions,
  );
  services.evidence = new EvidenceService(repositories.evidence, services.scope, services.events, services.sync);
  services.codexConnector = new CodexConnectorService(
    repositories.codexResults,
    repositories.toolProviders,
    services.execution,
    services.mission,
    services.projections,
    services.resumePackets,
    services.events,
  );
  services.repoReferences = new RepoReferenceService(
    repositories.repoReferences,
    repositories.toolProviders,
    repositories.toolPackets,
    services.scope,
    services.evidence,
    services.events,
  );
  services.terminalReferences = new TerminalReferenceService(
    repositories.terminalRunReferences,
    repositories.toolProviders,
    repositories.toolPackets,
    services.scope,
    services.evidence,
    services.events,
  );
  services.verifications = new VerificationService(repositories.verifications, services.scope, services.events, services.sync);
  services.gates = new GateDecisionService(repositories.gates, services.scope, services.events, services.sync);
  services.audits = new AuditService(repositories.audits, services.scope, services.events, services.sync);
  services.snapshots = new SnapshotService(repositories.snapshots, services.scope, services.projections, services.events, services.sync);

  services.seed = new FounderSeedService(
    repositories.workspaces,
    repositories.visions,
    repositories.priorities,
    repositories.objectives,
    repositories.decisions,
    repositories.plans,
    repositories.projects,
    repositories.sprints,
    repositories.events,
    services.planning,
    services.execution,
    services.tools,
    services.events,
    services.sync,
  );

  return {
    store,
    repositories,
    services,
  };
}
