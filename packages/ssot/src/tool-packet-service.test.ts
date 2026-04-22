import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { createNexRuntime } from "./runtime/create-nex-runtime";

async function createTestRuntime() {
  const filePath = path.join(tmpdir(), `nex-tool-packets-${randomUUID()}.json`);
  const runtime = createNexRuntime(filePath);
  await runtime.store.ensure();

  return {
    runtime,
    cleanup: async () => {
      await rm(filePath, { force: true });
    },
  };
}

test("tool packets persist against task scope and remain queryable by task and provider", async () => {
  const { runtime, cleanup } = await createTestRuntime();

  try {
    const seed = await runtime.services.seed.ensureFounderOsSeed();
    const sprint = await runtime.services.execution.getSprintDetail(seed.sprintId);
    const task = sprint.phases[0]?.tasks[0];
    const codex = await runtime.repositories.toolProviders.getByProviderType(seed.workspaceId, "codex");

    assert.ok(task);
    assert.ok(codex);

    const packet = await runtime.services.toolPackets.recordTaskPacket({
      taskId: task.id,
      toolProviderId: codex.id,
      role: "builder",
      objective: "Implement the requested execution slice.",
      summary: "Updated the task runtime and packet persistence layer.",
      filesTouched: ["apps/founder-os/app/nex/tasks/[taskId]/page.tsx", "packages/ssot/src/services/tool-packet-service.ts"],
      commandsRun: ["pnpm test", "pnpm build"],
      evidenceRefs: ["evidence_123", "manual://diff/ref"],
      outcome: "work_logged",
      notes: "Signal recorded only. Truth closure is still pending.",
      recordedBy: "FOUNDER",
    });

    const [taskPackets, providerPackets, workspacePackets, events] = await Promise.all([
      runtime.services.toolPackets.listByTask(task.id),
      runtime.services.toolPackets.listByToolProvider(seed.workspaceId, codex.id),
      runtime.services.toolPackets.listByWorkspace(seed.workspaceId),
      runtime.repositories.events.listByWorkspace(seed.workspaceId),
    ]);

    assert.equal(packet.taskId, task.id);
    assert.equal(packet.projectId, sprint.project.id);
    assert.equal(packet.sprintId, sprint.sprint.id);
    assert.equal(packet.toolProviderId, codex.id);
    assert.equal(packet.toolName, "Codex");
    assert.equal(taskPackets.length, 1);
    assert.equal(providerPackets.length, 1);
    assert.equal(workspacePackets.length, 1);
    assert.ok(events.some((event) => event.eventType === "tool_packet_logged"));
  } finally {
    await cleanup();
  }
});

test("tool packet logging does not unlock proof transitions or count as evidence", async () => {
  const { runtime, cleanup } = await createTestRuntime();

  try {
    const seed = await runtime.services.seed.ensureFounderOsSeed();
    const sprint = await runtime.services.execution.getSprintDetail(seed.sprintId);
    const task = sprint.phases[0]?.tasks[0];
    const codex = await runtime.repositories.toolProviders.getByProviderType(seed.workspaceId, "codex");

    assert.ok(task);
    assert.ok(codex);

    await runtime.services.governance.transitionTask(task.id, "IN_PROGRESS");
    await runtime.services.governance.transitionTask(task.id, "BUILT");

    const beforeAvailable = await runtime.services.governance.getAvailableTransitions(task.id);
    await runtime.services.toolPackets.recordTaskPacket({
      taskId: task.id,
      toolProviderId: codex.id,
      role: "builder",
      objective: "Log build work before proof is attached.",
      summary: "Build completed in the external tool, but no evidence record exists yet.",
      filesTouched: ["packages/core/src/tooling.ts"],
      commandsRun: ["pnpm test"],
      evidenceRefs: ["manual://build-output"],
      outcome: "logged_without_truth",
      notes: "Packet references proof candidates only.",
      recordedBy: "FOUNDER",
    });

    const [afterAvailable, evidence, projection] = await Promise.all([
      runtime.services.governance.getAvailableTransitions(task.id),
      runtime.repositories.evidence.listByTask(task.id),
      runtime.services.projections.refreshTaskProjection(task.id),
    ]);

    assert.deepEqual(beforeAvailable, afterAvailable);
    assert.ok(!afterAvailable.includes("PROOF_ATTACHED"));
    assert.equal(evidence.length, 0);
    assert.equal(projection.evidenceCount, 0);
    assert.equal(projection.progressScore, 20);
  } finally {
    await cleanup();
  }
});
