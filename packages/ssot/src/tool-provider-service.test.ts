import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { createNexRuntime } from "./runtime/create-nex-runtime";

async function createTestRuntime() {
  const filePath = path.join(tmpdir(), `nex-tools-${randomUUID()}.json`);
  const runtime = createNexRuntime(filePath);
  await runtime.store.ensure();

  return {
    runtime,
    cleanup: async () => {
      await rm(filePath, { force: true });
    },
  };
}

test("founder seed creates a provider registry with active repo, terminal, and codex providers only when backing structure exists", async () => {
  const { runtime, cleanup } = await createTestRuntime();

  try {
    const seed = await runtime.services.seed.ensureFounderOsSeed();
    const registry = await runtime.services.tools.getFounderRegistrySummary();
    const events = await runtime.repositories.events.listByWorkspace(seed.workspaceId);

    assert.ok(registry);
    assert.equal(registry?.providers.length, 7);
    assert.equal(registry?.statusCounts.configured, 3);
    assert.equal(registry?.statusCounts.planned, 1);
    assert.equal(registry?.statusCounts.active, 3);
    assert.equal(registry?.statusCounts.inactive, 0);
    assert.equal(registry?.truthSurfaceCount, 2);
    assert.ok(registry?.providers.some((provider) => provider.providerType === "repo" && provider.capabilities.includes("repo_truth")));
    assert.ok(registry?.providers.some((provider) => provider.providerType === "terminal" && provider.capabilities.includes("proof_surface")));
    assert.ok(events.some((event) => event.eventType === "tool_provider_saved"));
  } finally {
    await cleanup();
  }
});

test("provider seeding is idempotent across repeated founder seed runs", async () => {
  const { runtime, cleanup } = await createTestRuntime();

  try {
    await runtime.services.seed.ensureFounderOsSeed();
    await runtime.services.seed.ensureFounderOsSeed();

    const registry = await runtime.services.tools.getFounderRegistrySummary();

    assert.ok(registry);
    assert.equal(registry?.providers.length, 7);
    assert.equal(registry?.providers.filter((provider) => provider.providerType === "codex").length, 1);
  } finally {
    await cleanup();
  }
});
