import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { createNexRuntime } from "./runtime/create-nex-runtime";

async function createTestRuntime() {
  const filePath = path.join(tmpdir(), `nex-truth-surfaces-${randomUUID()}.json`);
  const runtime = createNexRuntime(filePath);
  await runtime.store.ensure();

  return {
    runtime,
    cleanup: async () => {
      await rm(filePath, { force: true });
    },
  };
}

test("repo and terminal truth surfaces persist against task scope and can link explicit evidence", async () => {
  const { runtime, cleanup } = await createTestRuntime();

  try {
    const seed = await runtime.services.seed.ensureFounderOsSeed();
    const sprint = await runtime.services.execution.getSprintDetail(seed.sprintId);
    const repoTask = sprint.phases[0]?.tasks[0];
    const terminalTask = sprint.phases[0]?.tasks[1];
    const repoProvider = await runtime.repositories.toolProviders.getByProviderType(seed.workspaceId, "repo");
    const terminalProvider = await runtime.repositories.toolProviders.getByProviderType(seed.workspaceId, "terminal");

    assert.ok(repoTask);
    assert.ok(terminalTask);
    assert.ok(repoProvider);
    assert.ok(terminalProvider);

    const repoReference = await runtime.services.repoReferences.recordTaskReference({
      taskId: repoTask.id,
      toolProviderId: repoProvider.id,
      repoLabel: "founder-os",
      branchName: "feature/s3-p3",
      gitRef: "refs/heads/feature/s3-p3",
      diffRef: "manual://diff/s3-p3",
      filesTouched: ["packages/core/src/surfaces.ts", "packages/ssot/src/services/repo-reference-service.ts"],
      summary: "Recorded diff-ready repo context.",
      note: "Reference only. No proof closure is implied.",
      recordedBy: "FOUNDER",
    });

    const terminalReference = await runtime.services.terminalReferences.recordTaskReference({
      taskId: terminalTask.id,
      toolProviderId: terminalProvider.id,
      commandSummary: "Test and build run",
      commands: ["pnpm test", "pnpm build"],
      cwd: "/Users/chox/Projects/nex",
      stdoutRef: "manual://logs/stdout",
      logExcerpt: "All checks passed.",
      summary: "Captured terminal context for review.",
      outcome: "captured",
      createEvidence: {
        title: "Terminal build log",
        summary: "Explicit evidence created from a terminal reference.",
        content: "pnpm build completed successfully.",
        createdBy: "FOUNDER",
      },
      recordedBy: "FOUNDER",
    });

    const [repoTaskRefs, terminalTaskRefs, workspaceRepoRefs, workspaceTerminalRefs, evidence] = await Promise.all([
      runtime.services.repoReferences.listByTask(repoTask.id),
      runtime.services.terminalReferences.listByTask(terminalTask.id),
      runtime.services.repoReferences.listByWorkspace(seed.workspaceId),
      runtime.services.terminalReferences.listByWorkspace(seed.workspaceId),
      runtime.repositories.evidence.listByTask(terminalTask.id),
    ]);

    assert.equal(repoReference.taskId, repoTask.id);
    assert.equal(repoReference.toolProviderId, repoProvider.id);
    assert.equal(repoTaskRefs.length, 1);
    assert.equal(workspaceRepoRefs.length, 1);
    assert.equal(terminalReference.taskId, terminalTask.id);
    assert.equal(terminalReference.toolProviderId, terminalProvider.id);
    assert.equal(terminalReference.linkedEvidenceIds.length, 1);
    assert.equal(terminalTaskRefs.length, 1);
    assert.equal(workspaceTerminalRefs.length, 1);
    assert.equal(evidence.length, 1);
    assert.equal(evidence[0]?.evidenceType, "terminal_log");
  } finally {
    await cleanup();
  }
});

test("repo and terminal references do not unlock proof transitions unless explicit evidence exists", async () => {
  const { runtime, cleanup } = await createTestRuntime();

  try {
    const seed = await runtime.services.seed.ensureFounderOsSeed();
    const sprint = await runtime.services.execution.getSprintDetail(seed.sprintId);
    const task = sprint.phases[0]?.tasks[0];
    const repoProvider = await runtime.repositories.toolProviders.getByProviderType(seed.workspaceId, "repo");
    const terminalProvider = await runtime.repositories.toolProviders.getByProviderType(seed.workspaceId, "terminal");

    assert.ok(task);
    assert.ok(repoProvider);
    assert.ok(terminalProvider);

    await runtime.services.governance.transitionTask(task.id, "IN_PROGRESS");
    await runtime.services.governance.transitionTask(task.id, "BUILT");

    const beforeAvailable = await runtime.services.governance.getAvailableTransitions(task.id);

    await runtime.services.repoReferences.recordTaskReference({
      taskId: task.id,
      toolProviderId: repoProvider.id,
      repoLabel: "founder-os",
      diffRef: "manual://diff/no-evidence",
      filesTouched: ["packages/ssot/src/services/repo-reference-service.ts"],
      summary: "Repo reference without explicit evidence.",
      recordedBy: "FOUNDER",
    });

    await runtime.services.terminalReferences.recordTaskReference({
      taskId: task.id,
      toolProviderId: terminalProvider.id,
      commandSummary: "Build output capture",
      commands: ["pnpm build"],
      logExcerpt: "Build output captured for later review.",
      summary: "Terminal reference without explicit evidence.",
      outcome: "captured",
      recordedBy: "FOUNDER",
    });

    const [afterAvailable, evidence, projection, repoTaskRefs, terminalTaskRefs] = await Promise.all([
      runtime.services.governance.getAvailableTransitions(task.id),
      runtime.repositories.evidence.listByTask(task.id),
      runtime.services.projections.refreshTaskProjection(task.id),
      runtime.services.repoReferences.listByTask(task.id),
      runtime.services.terminalReferences.listByTask(task.id),
    ]);

    assert.deepEqual(beforeAvailable, afterAvailable);
    assert.ok(!afterAvailable.includes("PROOF_ATTACHED"));
    assert.equal(evidence.length, 0);
    assert.equal(projection.evidenceCount, 0);
    assert.equal(repoTaskRefs.length, 1);
    assert.equal(terminalTaskRefs.length, 1);
  } finally {
    await cleanup();
  }
});
