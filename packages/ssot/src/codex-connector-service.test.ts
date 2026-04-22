import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { createNexRuntime } from "./runtime/create-nex-runtime";

async function createTestRuntime() {
  const filePath = path.join(tmpdir(), `nex-codex-connector-${randomUUID()}.json`);
  const runtime = createNexRuntime(filePath);
  await runtime.store.ensure();

  return {
    runtime,
    cleanup: async () => {
      await rm(filePath, { force: true });
    },
  };
}

test("codex connector builds a packet preview from real task, mission, and resume data", async () => {
  const { runtime, cleanup } = await createTestRuntime();

  try {
    const seed = await runtime.services.seed.ensureFounderOsSeed();
    const sprint = await runtime.services.execution.getSprintDetail(seed.sprintId);
    const task = sprint.phases[0]?.tasks[0];

    assert.ok(task);

    const packet = await runtime.services.codexConnector.buildTaskPacket(task.id);
    const lifecycle = await runtime.services.codexConnector.getLifecycleState(task.id);

    assert.equal(packet.taskId, task.id);
    assert.equal(packet.providerName, "Codex");
    assert.equal(packet.currentState, task.status);
    assert.ok(packet.constraints.length > 0);
    assert.ok(packet.acceptanceCriteria.length > 0);
    assert.ok(packet.requiredProof.length > 0);
    assert.ok(packet.relevantContext.projectName.length > 0);
    assert.ok(packet.missionContext?.priorityTitles.length);
    assert.equal(lifecycle, "packet_ready");
  } finally {
    await cleanup();
  }
});

test("codex owner assignment and normalized results stay separate from evidence and proof transitions", async () => {
  const { runtime, cleanup } = await createTestRuntime();

  try {
    const seed = await runtime.services.seed.ensureFounderOsSeed();
    const sprint = await runtime.services.execution.getSprintDetail(seed.sprintId);
    const task = sprint.phases[0]?.tasks[0];
    const codexProvider = await runtime.repositories.toolProviders.getByProviderType(seed.workspaceId, "codex");

    assert.ok(task);
    assert.ok(codexProvider);

    await runtime.services.execution.assignTaskOwner({
      taskId: task.id,
      ownerKind: "TOOL",
      ownerRef: "CURSOR",
      assignedBy: "FOUNDER",
    });

    let lifecycle = await runtime.services.codexConnector.getLifecycleState(task.id);
    assert.equal(lifecycle, "modeled");

    await runtime.services.execution.assignTaskOwner({
      taskId: task.id,
      ownerKind: "TOOL",
      ownerRef: "CODEX",
      assignedBy: "FOUNDER",
    });

    lifecycle = await runtime.services.codexConnector.getLifecycleState(task.id);
    assert.equal(lifecycle, "packet_ready");

    await runtime.services.governance.transitionTask(task.id, "IN_PROGRESS");
    await runtime.services.governance.transitionTask(task.id, "BUILT");

    const beforeAvailable = await runtime.services.governance.getAvailableTransitions(task.id);

    await runtime.services.codexConnector.normalizeResult({
      taskId: task.id,
      providerId: codexProvider.id,
      summary: "Codex prepared a patch and command summary.",
      filesTouched: ["packages/core/src/connectors.ts", "packages/ssot/src/services/codex-connector-service.ts"],
      commandsRun: ["pnpm test", "pnpm build"],
      outcome: "result_captured",
      notes: "Normalized connector output only.",
      evidenceRefs: ["manual://candidate/evidence"],
      repoRefs: ["manual://candidate/repo"],
      terminalRefs: ["manual://candidate/terminal"],
      suggestedNextAction: "Create explicit evidence if closure should advance.",
      warnings: ["No automatic proof was created."],
      resultStatus: "normalized",
      recordedBy: "FOUNDER",
    });

    const [afterAvailable, evidence, projection, results, events] = await Promise.all([
      runtime.services.governance.getAvailableTransitions(task.id),
      runtime.repositories.evidence.listByTask(task.id),
      runtime.services.projections.refreshTaskProjection(task.id),
      runtime.services.codexConnector.listResultsByTask(task.id),
      runtime.repositories.events.listByWorkspace(seed.workspaceId),
    ]);

    assert.deepEqual(beforeAvailable, afterAvailable);
    assert.ok(!afterAvailable.includes("PROOF_ATTACHED"));
    assert.equal(evidence.length, 0);
    assert.equal(projection.evidenceCount, 0);
    assert.equal(results.length, 1);
    assert.equal(results[0]?.providerName, "Codex");
    assert.ok(events.some((event) => event.eventType === "task_owner_assigned"));
    assert.ok(events.some((event) => event.eventType === "codex_result_normalized"));
  } finally {
    await cleanup();
  }
});
