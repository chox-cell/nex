import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { createNexRuntime } from "./runtime/create-nex-runtime";

async function createTestRuntime() {
  const filePath = path.join(tmpdir(), `nex-governance-${randomUUID()}.json`);
  const runtime = createNexRuntime(filePath);
  await runtime.store.ensure();

  return {
    runtime,
    cleanup: async () => {
      await rm(filePath, { force: true });
    },
  };
}

test("task creation requires an explicit owner", async () => {
  const { runtime, cleanup } = await createTestRuntime();

  try {
    const seed = await runtime.services.seed.ensureFounderOsSeed();
    const sprint = await runtime.services.execution.getSprintDetail(seed.sprintId);
    const phase = sprint.phases[0]?.phase;

    assert.ok(phase);

    await assert.rejects(
      runtime.services.execution.createTask({
        phaseId: phase.id,
        title: "Ownerless task",
        objective: "This should not persist.",
        description: "Owner is intentionally blank.",
        status: "READY",
        ownerKind: "TOOL",
        ownerRef: "" as never,
        priorityWeight: 1,
        constraints: [],
        acceptanceCriteria: [],
        requiredProof: [],
      }),
      /explicit owner/,
    );
  } finally {
    await cleanup();
  }
});

test("task transitions require dependency clearance before work can start", async () => {
  const { runtime, cleanup } = await createTestRuntime();

  try {
    const seed = await runtime.services.seed.ensureFounderOsSeed();
    const sprint = await runtime.services.execution.getSprintDetail(seed.sprintId);
    const blockedTask = sprint.phases[0]?.tasks[1];

    assert.ok(blockedTask);

    const available = await runtime.services.governance.getAvailableTransitions(blockedTask.id);
    assert.ok(!available.includes("IN_PROGRESS"));
    await assert.rejects(
      runtime.services.governance.transitionTask(blockedTask.id, "IN_PROGRESS"),
      /required truth conditions/,
    );
  } finally {
    await cleanup();
  }
});
