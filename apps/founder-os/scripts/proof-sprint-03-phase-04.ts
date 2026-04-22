import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { createNexRuntime } from "@nex/ssot";

async function main() {
  const runtimeFilePath = path.join(tmpdir(), `nex-codex-contract-proof-${randomUUID()}.json`);
  const runtime = createNexRuntime(runtimeFilePath);
  await runtime.store.ensure();

  try {
    const seed = await runtime.services.seed.ensureFounderOsSeed();
    const sprint = await runtime.services.execution.getSprintDetail(seed.sprintId);
    const task = sprint.phases[0]?.tasks[0];
    const codexProvider = await runtime.repositories.toolProviders.getByProviderType(seed.workspaceId, "codex");

    if (!task || !codexProvider) {
      throw new Error("Sprint 03 Phase 04 proof could not find the seeded task or Codex provider.");
    }

    await runtime.services.execution.assignTaskOwner({
      taskId: task.id,
      ownerKind: "TOOL",
      ownerRef: "CURSOR",
      assignedBy: "FOUNDER",
    });
    await runtime.services.codexConnector.assignTaskOwner(task.id, "FOUNDER");

    const ownerDetail = await runtime.services.execution.getTaskDetail(task.id);
    const lifecycleBefore = await runtime.services.codexConnector.getLifecycleState(task.id);
    const packet = await runtime.services.codexConnector.buildTaskPacket(task.id);

    await runtime.services.governance.transitionTask(task.id, "IN_PROGRESS");
    await runtime.services.governance.transitionTask(task.id, "BUILT");

    const beforeTransitions = await runtime.services.governance.getAvailableTransitions(task.id);

    await runtime.services.codexConnector.normalizeResult({
      taskId: task.id,
      providerId: codexProvider.id,
      summary: "Codex contract result normalized for later proof review.",
      filesTouched: ["packages/core/src/connectors.ts", "packages/ssot/src/services/codex-connector-service.ts"],
      commandsRun: ["pnpm test", "pnpm build"],
      outcome: "result_captured",
      notes: "This remains a connector result packet only.",
      evidenceRefs: ["manual://candidate/evidence"],
      repoRefs: ["manual://candidate/repo"],
      terminalRefs: ["manual://candidate/terminal"],
      suggestedNextAction: "Promote real proof explicitly if closure should advance.",
      warnings: ["No evidence, verification, gate, audit, or snapshot was created automatically."],
      resultStatus: "normalized",
      recordedBy: "FOUNDER",
    });

    const [lifecycleAfter, afterTransitions, evidence, projection, results, events] = await Promise.all([
      runtime.services.codexConnector.getLifecycleState(task.id),
      runtime.services.governance.getAvailableTransitions(task.id),
      runtime.repositories.evidence.listByTask(task.id),
      runtime.services.projections.refreshTaskProjection(task.id),
      runtime.services.codexConnector.listResultsByTask(task.id),
      runtime.repositories.events.listByWorkspace(seed.workspaceId),
    ]);

    const proof = {
      seed,
      codexProviderStatus: codexProvider.status,
      ownerAfterAssignment: {
        ownerKind: ownerDetail.task.ownerKind,
        ownerRef: ownerDetail.task.ownerRef,
      },
      lifecycleBefore,
      lifecycleAfter,
      packetPreview: {
        providerName: packet.providerName,
        objective: packet.objective,
        currentState: packet.currentState,
        requiredProof: packet.requiredProof,
        nextRequiredAction: packet.nextRequiredAction,
        suggestedTruthSurfaces: packet.suggestedTruthSurfaces,
      },
      resultPacketCount: results.length,
      latestResult: results[0]
        ? {
            summary: results[0].summary,
            resultStatus: results[0].resultStatus,
            repoRefs: results[0].repoRefs,
            terminalRefs: results[0].terminalRefs,
            evidenceRefs: results[0].evidenceRefs,
          }
        : null,
      transitionsBefore: beforeTransitions,
      transitionsAfter: afterTransitions,
      evidenceCount: evidence.length,
      projectionEvidenceCount: projection.evidenceCount,
      eventTypes: events
        .filter((event) => event.scopeId === task.id)
        .map((event) => event.eventType),
      routes: ["/nex/tasks/:taskId"],
    };

    const proofDir = path.join(process.cwd(), "data", "proofs");
    await mkdir(proofDir, { recursive: true });
    const proofPath = path.join(proofDir, "sprint-03-phase-04-proof.json");
    await writeFile(proofPath, JSON.stringify(proof, null, 2), "utf8");

    console.log(
      JSON.stringify(
        {
          status: "proof_written",
          proofPath,
          proof,
        },
        null,
        2,
      ),
    );
  } finally {
    await rm(runtimeFilePath, { force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
