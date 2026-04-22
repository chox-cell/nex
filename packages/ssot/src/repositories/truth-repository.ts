import type { AuditRecord, Evidence, GateDecision, Snapshot, Verification } from "@nex/core";

import type { FileNexStore } from "../store/file-nex-store";
import { sortByCreatedAtDesc, upsertById } from "./helpers";

export class EvidenceRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByWorkspace(workspaceId: string): Promise<Evidence[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.evidence.filter((record) => record.workspaceId === workspaceId));
  }

  async listByTask(taskId: string): Promise<Evidence[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.evidence.filter((record) => record.taskId === taskId));
  }

  async listByScope(scopeType: Evidence["scopeType"], scopeId: string): Promise<Evidence[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.evidence.filter((record) => record.scopeType === scopeType && record.scopeId === scopeId));
  }

  async save(record: Evidence): Promise<Evidence> {
    await this.store.update((database) => {
      upsertById(database.evidence, record);
    });

    return record;
  }
}

export class VerificationRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByWorkspace(workspaceId: string): Promise<Verification[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.verifications.filter((record) => record.workspaceId === workspaceId));
  }

  async listByTask(taskId: string): Promise<Verification[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.verifications.filter((record) => record.taskId === taskId));
  }

  async listByScope(scopeType: Verification["scopeType"], scopeId: string): Promise<Verification[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(
      database.verifications.filter((record) => record.scopeType === scopeType && record.scopeId === scopeId),
    );
  }

  async save(record: Verification): Promise<Verification> {
    await this.store.update((database) => {
      upsertById(database.verifications, record);
    });

    return record;
  }
}

export class GateDecisionRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByWorkspace(workspaceId: string): Promise<GateDecision[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.gateDecisions.filter((record) => record.workspaceId === workspaceId));
  }

  async listByTask(taskId: string): Promise<GateDecision[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.gateDecisions.filter((record) => record.taskId === taskId));
  }

  async getLatestTaskDecision(taskId: string): Promise<GateDecision | null> {
    const decisions = await this.listByTask(taskId);
    return decisions[0] ?? null;
  }

  async save(record: GateDecision): Promise<GateDecision> {
    await this.store.update((database) => {
      upsertById(database.gateDecisions, record);
    });

    return record;
  }
}

export class AuditRecordRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByWorkspace(workspaceId: string): Promise<AuditRecord[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.auditRecords.filter((record) => record.workspaceId === workspaceId));
  }

  async listByTask(taskId: string): Promise<AuditRecord[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.auditRecords.filter((record) => record.taskId === taskId));
  }

  async save(record: AuditRecord): Promise<AuditRecord> {
    await this.store.update((database) => {
      upsertById(database.auditRecords, record);
    });

    return record;
  }
}

export class SnapshotRepository {
  constructor(private readonly store: FileNexStore) {}

  async listByWorkspace(workspaceId: string): Promise<Snapshot[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.snapshots.filter((record) => record.workspaceId === workspaceId));
  }

  async listByTask(taskId: string): Promise<Snapshot[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.snapshots.filter((record) => record.taskId === taskId));
  }

  async listBySprint(sprintId: string): Promise<Snapshot[]> {
    const database = await this.store.read();
    return sortByCreatedAtDesc(database.snapshots.filter((record) => record.sprintId === sprintId));
  }

  async save(record: Snapshot): Promise<Snapshot> {
    await this.store.update((database) => {
      upsertById(database.snapshots, record);
    });

    return record;
  }
}

