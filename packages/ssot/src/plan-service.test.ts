import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { createNexRuntime } from "./runtime/create-nex-runtime";

async function createTestRuntime() {
  const filePath = path.join(tmpdir(), `nex-plan-${randomUUID()}.json`);
  const runtime = createNexRuntime(filePath);
  await runtime.store.ensure();

  return {
    runtime,
    cleanup: async () => {
      await rm(filePath, { force: true });
    },
  };
}

test("plan updates append a new version snapshot", async () => {
  const { runtime, cleanup } = await createTestRuntime();

  try {
    const seed = await runtime.services.seed.ensureFounderOsSeed();
    const before = await runtime.services.planning.getPlanDetail(seed.planId);

    await runtime.services.planning.updatePlan(seed.planId, {
      name: "NEX Founder OS v1 Updated",
      goal: "Tighten the execution spine before memory work.",
      status: "ACTIVE",
      changeReason: "Sharpened Sprint 01 scope.",
      createdBy: "FOUNDER",
    });

    const after = await runtime.services.planning.getPlanDetail(seed.planId);

    assert.equal(before.versions.length + 1, after.versions.length);
    assert.equal(after.plan.name, "NEX Founder OS v1 Updated");
    assert.equal(after.versions[0]?.changeReason, "Sharpened Sprint 01 scope.");
    assert.equal(after.versions[0]?.snapshot.plan.goal, "Tighten the execution spine before memory work.");
  } finally {
    await cleanup();
  }
});

