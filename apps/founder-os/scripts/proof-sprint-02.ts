import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { ensureNexSeed, nexRuntime } from "../src/lib/nex-runtime";

async function main() {
  const seed = await ensureNexSeed();
  const sprint = await nexRuntime.services.execution.getSprintDetail(seed.sprintId);
  const firstTaskId = sprint.phases[0]?.tasks[0]?.id;

  if (!firstTaskId) {
    throw new Error("No task exists to generate Sprint 02 proof from.");
  }

  await nexRuntime.services.sync.refreshTaskScope(firstTaskId);

  const [events, taskProjection, sprintProjection, taskPacket, evidence, verifications, gates, audits, snapshots] = await Promise.all([
    nexRuntime.repositories.events.listByWorkspace(seed.workspaceId),
    nexRuntime.services.projections.getTaskProjection(firstTaskId),
    nexRuntime.services.projections.getSprintProjection(seed.sprintId),
    nexRuntime.services.resumePackets.getTaskPacket(firstTaskId),
    nexRuntime.repositories.evidence.listByTask(firstTaskId),
    nexRuntime.repositories.verifications.listByTask(firstTaskId),
    nexRuntime.repositories.gates.listByTask(firstTaskId),
    nexRuntime.repositories.audits.listByTask(firstTaskId),
    nexRuntime.repositories.snapshots.listByTask(firstTaskId),
  ]);

  const proof = {
    seed,
    eventCount: events.length,
    firstTaskProjection: taskProjection,
    sprintProjection,
    taskPacket,
    evidenceCount: evidence.length,
    verificationCount: verifications.length,
    gateDecisionCount: gates.length,
    auditCount: audits.length,
    snapshotCount: snapshots.length,
    routes: ["/nex/memory", "/nex/proof", "/nex/gates", "/nex/snapshots"],
  };

  const proofDir = path.join(process.cwd(), "data", "proofs");
  await mkdir(proofDir, { recursive: true });
  const proofPath = path.join(proofDir, "sprint-02-proof.json");
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
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
