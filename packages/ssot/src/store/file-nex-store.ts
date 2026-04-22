import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createEmptyNexDatabase, type NexDatabase } from "@nex/core";

function normalizeDatabase(parsed: Partial<NexDatabase>): NexDatabase {
  const empty = createEmptyNexDatabase();

  return {
    ...empty,
    ...parsed,
    version: 1,
    workspaces: parsed.workspaces ?? empty.workspaces,
    visions: parsed.visions ?? empty.visions,
    strategicPriorities: parsed.strategicPriorities ?? empty.strategicPriorities,
    objectives: parsed.objectives ?? empty.objectives,
    decisions: parsed.decisions ?? empty.decisions,
    plans: parsed.plans ?? empty.plans,
    planVersions: parsed.planVersions ?? empty.planVersions,
    planSections: parsed.planSections ?? empty.planSections,
    planActions: parsed.planActions ?? empty.planActions,
    projects: parsed.projects ?? empty.projects,
    sprints: parsed.sprints ?? empty.sprints,
    phases: parsed.phases ?? empty.phases,
    tasks: parsed.tasks ?? empty.tasks,
    taskEdges: parsed.taskEdges ?? empty.taskEdges,
    runs: parsed.runs ?? empty.runs,
    runSteps: parsed.runSteps ?? empty.runSteps,
    events: parsed.events ?? empty.events,
    stateProjections: parsed.stateProjections ?? empty.stateProjections,
    resumePackets: parsed.resumePackets ?? empty.resumePackets,
    patternRecords: parsed.patternRecords ?? empty.patternRecords,
    toolProviders: parsed.toolProviders ?? empty.toolProviders,
    toolPackets: parsed.toolPackets ?? empty.toolPackets,
    codexResultPackets: parsed.codexResultPackets ?? empty.codexResultPackets,
    repoReferences: parsed.repoReferences ?? empty.repoReferences,
    terminalRunReferences: parsed.terminalRunReferences ?? empty.terminalRunReferences,
    evidence: parsed.evidence ?? empty.evidence,
    verifications: parsed.verifications ?? empty.verifications,
    gateDecisions: parsed.gateDecisions ?? empty.gateDecisions,
    auditRecords: parsed.auditRecords ?? empty.auditRecords,
    snapshots: parsed.snapshots ?? empty.snapshots,
  };
}

export class FileNexStore {
  private pending: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async ensure(seed = createEmptyNexDatabase()): Promise<void> {
    const operation = this.pending.then(async () => {
      await mkdir(path.dirname(this.filePath), { recursive: true });

      try {
        await readFile(this.filePath, "utf8");
      } catch {
        await this.writeUnlocked(seed);
      }
    });

    this.pending = operation.then(() => undefined, () => undefined);
    await operation;
  }

  async read(): Promise<NexDatabase> {
    await this.pending;
    return this.readUnlocked();
  }

  async write(database: NexDatabase): Promise<void> {
    const operation = this.pending.then(() => this.writeUnlocked(database));
    this.pending = operation.then(() => undefined, () => undefined);
    await operation;
  }

  async update(mutator: (database: NexDatabase) => void | NexDatabase): Promise<NexDatabase> {
    const operation = this.pending.then(async () => {
      const database = await this.readUnlocked();
      const draft = structuredClone(database);
      const result = mutator(draft);
      const next = result ?? draft;
      await this.writeUnlocked(next);
      return next;
    });

    this.pending = operation.then(() => undefined, () => undefined);
    return operation;
  }

  private async readUnlocked(): Promise<NexDatabase> {
    await mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      const raw = await readFile(this.filePath, "utf8");
      return normalizeDatabase(JSON.parse(raw) as Partial<NexDatabase>);
    } catch {
      const empty = createEmptyNexDatabase();
      await this.writeUnlocked(empty);
      return empty;
    }
  }

  private async writeUnlocked(database: NexDatabase): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(database, null, 2), "utf8");
  }
}
