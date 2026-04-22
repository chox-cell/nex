import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { createNexRuntime } from "./runtime/create-nex-runtime";

async function createTestRuntime() {
  const filePath = path.join(tmpdir(), `nex-truth-${randomUUID()}.json`);
  const runtime = createNexRuntime(filePath);
  await runtime.store.ensure();

  return {
    runtime,
    cleanup: async () => {
      await rm(filePath, { force: true });
    },
  };
}

test("event store and projections persist for seeded execution scopes", async () => {
  const { runtime, cleanup } = await createTestRuntime();

  try {
    const seed = await runtime.services.seed.ensureFounderOsSeed();
    const events = await runtime.repositories.events.listByWorkspace(seed.workspaceId);
    const sprintProjection = await runtime.services.projections.getSprintProjection(seed.sprintId);
    const taskProjection = await runtime.services.projections.getTaskProjection(
      (await runtime.services.execution.getSprintDetail(seed.sprintId)).phases[0]?.tasks[0]?.id ?? "",
    );
    const sprintPacket = await runtime.services.resumePackets.getSprintPacket(seed.sprintId);

    assert.ok(events.length > 0);
    assert.ok(events.some((event) => event.eventType === "sprint_created"));
    assert.ok(sprintProjection);
    assert.ok(taskProjection);
    assert.ok(sprintPacket);
  } finally {
    await cleanup();
  }
});

test("truth services unlock the full task close path only after evidence, verification, gate, audit, and snapshot exist", async () => {
  const { runtime, cleanup } = await createTestRuntime();

  try {
    const seed = await runtime.services.seed.ensureFounderOsSeed();
    const sprint = await runtime.services.execution.getSprintDetail(seed.sprintId);
    const task = sprint.phases[0]?.tasks[0];

    assert.ok(task);

    await runtime.services.governance.transitionTask(task.id, "IN_PROGRESS");
    await runtime.services.governance.transitionTask(task.id, "BUILT");

    let available = await runtime.services.governance.getAvailableTransitions(task.id);
    assert.ok(!available.includes("PROOF_ATTACHED"));

    await runtime.services.evidence.attachTaskEvidence({
      taskId: task.id,
      evidenceType: "test_result",
      title: "Green task proof",
      summary: "Evidence proving the build completed.",
      content: "All checks passed.",
      createdBy: "FOUNDER",
    });

    available = await runtime.services.governance.getAvailableTransitions(task.id);
    assert.ok(available.includes("PROOF_ATTACHED"));

    await runtime.services.governance.transitionTask(task.id, "PROOF_ATTACHED");

    await runtime.services.verifications.recordTaskVerification({
      taskId: task.id,
      verificationType: "test_check",
      status: "pass",
      summary: "Tests passed",
      detail: "All required tests passed against the evidence.",
      verifiedBy: "FOUNDER",
    });

    await runtime.services.governance.transitionTask(task.id, "VERIFIED");

    available = await runtime.services.governance.getAvailableTransitions(task.id);
    assert.ok(!available.includes("AUDITED"));

    await runtime.services.gates.decideTaskGate({
      taskId: task.id,
      decision: "GO",
      rationale: "Closure criteria are satisfied.",
      blockers: [],
      decidedBy: "FOUNDER",
    });
    await runtime.services.audits.writeTaskAudit({
      taskId: task.id,
      summary: "Task audit complete",
      findings: ["No hidden blockers remain."],
      author: "FOUNDER",
    });

    available = await runtime.services.governance.getAvailableTransitions(task.id);
    assert.ok(available.includes("AUDITED"));
    await runtime.services.governance.transitionTask(task.id, "AUDITED");

    await runtime.services.snapshots.saveTaskSnapshot({
      taskId: task.id,
      label: "Task close candidate",
      summary: "Capture task state before closure.",
      createdBy: "FOUNDER",
    });

    available = await runtime.services.governance.getAvailableTransitions(task.id);
    assert.ok(available.includes("SNAPSHOT_SAVED"));
    await runtime.services.governance.transitionTask(task.id, "SNAPSHOT_SAVED");

    available = await runtime.services.governance.getAvailableTransitions(task.id);
    assert.ok(available.includes("DONE"));
    const doneTask = await runtime.services.governance.transitionTask(task.id, "DONE");
    const taskProjection = await runtime.services.projections.getTaskProjection(task.id);
    const taskPacket = await runtime.services.resumePackets.getTaskPacket(task.id);

    assert.equal(doneTask.status, "DONE");
    assert.equal(taskProjection?.progressScore, 100);
    assert.equal(taskProjection?.latestGateDecision, "GO");
    assert.ok(taskPacket);
    assert.equal(taskPacket?.currentState, "DONE");
  } finally {
    await cleanup();
  }
});

test("blocking verification prevents proof progression and surfaces blockers", async () => {
  const { runtime, cleanup } = await createTestRuntime();

  try {
    const seed = await runtime.services.seed.ensureFounderOsSeed();
    const sprint = await runtime.services.execution.getSprintDetail(seed.sprintId);
    const task = sprint.phases[0]?.tasks[0];

    assert.ok(task);

    await runtime.services.governance.transitionTask(task.id, "IN_PROGRESS");
    await runtime.services.governance.transitionTask(task.id, "BUILT");
    await runtime.services.evidence.attachTaskEvidence({
      taskId: task.id,
      evidenceType: "repo_diff",
      title: "Diff proof",
      summary: "Actual implementation diff.",
      content: "diff --git a/file.ts b/file.ts",
      createdBy: "FOUNDER",
    });
    await runtime.services.governance.transitionTask(task.id, "PROOF_ATTACHED");
    await runtime.services.verifications.recordTaskVerification({
      taskId: task.id,
      verificationType: "critic_check",
      status: "blocking",
      summary: "Critical issue found",
      detail: "A blocking issue remains.",
      verifiedBy: "FOUNDER",
    });

    const available = await runtime.services.governance.getAvailableTransitions(task.id);
    const projection = await runtime.services.projections.getTaskProjection(task.id);

    assert.ok(!available.includes("VERIFIED"));
    assert.ok(projection?.blockers.includes("Blocking verification present."));
  } finally {
    await cleanup();
  }
});

