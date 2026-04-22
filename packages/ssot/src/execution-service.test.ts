import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { createNexRuntime } from "./runtime/create-nex-runtime";

async function createTestRuntime() {
  const filePath = path.join(tmpdir(), `nex-execution-${randomUUID()}.json`);
  const runtime = createNexRuntime(filePath);
  await runtime.store.ensure();

  return {
    runtime,
    cleanup: async () => {
      await rm(filePath, { force: true });
    },
  };
}

test("plan-to-sprint conversion preserves plan and project linkage", async () => {
  const { runtime, cleanup } = await createTestRuntime();

  try {
    const seed = await runtime.services.seed.ensureFounderOsSeed();

    const detail = await runtime.services.planning.createPlan({
      workspaceId: seed.workspaceId,
      projectId: seed.projectId,
      name: "Sprint 02 Memory Spine",
      goal: "Install memory and proof models on top of Sprint 01.",
      status: "DRAFT",
      changeReason: "Created for conversion test.",
      createdBy: "FOUNDER",
      sections: [
        {
          title: "Memory foundation",
          intent: "Persist event and projection state.",
          actions: [
            {
              title: "Create events schema",
              description: "Add the event store object.",
              ownerKind: "TOOL",
              ownerRef: "CODEX",
              priorityWeight: 3,
              constraints: ["Events must be queryable by scope."],
              acceptanceCriteria: ["Events persist and can be listed."],
            },
            {
              title: "Create projections",
              description: "Add state projections and resume packets.",
              ownerKind: "TOOL",
              ownerRef: "CODEX",
              priorityWeight: 4,
              constraints: ["Resume packets must include blockers."],
              acceptanceCriteria: ["Projection and resume services compile."],
            },
          ],
        },
      ],
    });

    const sprint = await runtime.services.execution.convertPlanToSprint(detail.plan.id);

    assert.equal(sprint.sprint.planId, detail.plan.id);
    assert.equal(sprint.sprint.projectId, seed.projectId);
    assert.equal(sprint.phases.length, 1);
    assert.equal(sprint.phases[0]?.tasks.length, 2);
    assert.equal(sprint.edges.length, 1);
  } finally {
    await cleanup();
  }
});

test("task edges reject self-invalid dependencies", async () => {
  const { runtime, cleanup } = await createTestRuntime();

  try {
    const seed = await runtime.services.seed.ensureFounderOsSeed();
    const sprint = await runtime.services.execution.getSprintDetail(seed.sprintId);
    const task = sprint.phases[0]?.tasks[0];

    assert.ok(task);

    await assert.rejects(
      runtime.services.execution.createTaskEdge({
        fromTaskId: task.id,
        toTaskId: task.id,
        type: "blocks",
        rationale: "Invalid self dependency",
      }),
      /self-reference/,
    );
  } finally {
    await cleanup();
  }
});

