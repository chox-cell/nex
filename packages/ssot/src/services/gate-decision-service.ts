import { createBaseEntity, createId, nowIso, type GateDecision, type GateDecisionValue } from "@nex/core";

import type { GateDecisionRepository } from "../repositories/truth-repository";
import type { EventService } from "./event-service";
import type { TaskScopeService } from "./task-scope-service";
import type { TruthSyncService } from "./truth-sync-service";

export interface DecideTaskGateInput {
  taskId: string;
  decision: GateDecisionValue;
  rationale: string;
  blockers: string[];
  decidedBy: string;
}

export class GateDecisionService {
  constructor(
    private readonly gates: GateDecisionRepository,
    private readonly scope: TaskScopeService,
    private readonly events: EventService,
    private readonly sync: TruthSyncService,
  ) {}

  async decideTaskGate(input: DecideTaskGateInput): Promise<GateDecision> {
    const resolved = await this.scope.resolveTask(input.taskId);
    const record: GateDecision = {
      ...createBaseEntity(createId("gate"), nowIso()),
      workspaceId: resolved.workspaceId,
      scopeType: "task",
      scopeId: resolved.task.id,
      taskId: resolved.task.id,
      sprintId: null,
      gateType: "task_close",
      decision: input.decision,
      rationale: input.rationale,
      blockers: input.blockers,
      decidedBy: input.decidedBy,
    };

    await this.gates.save(record);
    await this.events.record({
      workspaceId: resolved.workspaceId,
      scopeType: "task",
      scopeId: resolved.task.id,
      eventType: "gate_decided",
      actorType: "founder",
      actorRef: input.decidedBy,
      summary: `Gate decision recorded: ${input.decision}`,
      payload: {
        decision: input.decision,
        blockers: input.blockers,
      },
    });
    await this.sync.refreshTaskScope(resolved.task.id);

    return record;
  }
}

