import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { createNexRuntime } from "@nex/ssot";

async function main() {
  const runtimeFilePath = path.join(tmpdir(), `nex-tool-packet-proof-${randomUUID()}.json`);
  const runtime = createNexRuntime(runtimeFilePath);
  await runtime.store.ensure();

  try {
    const seed = await runtime.services.seed.ensureFounderOsSeed();
    const sprint = await runtime.services.execution.getSprintDetail(seed.sprintId);
    const task = sprint.phases[0]?.tasks[0];
    const codex = await runtime.repositories.toolProviders.getByProviderType(seed.workspaceId, "codex");

    if (!task || !codex) {
      throw new Error("Sprint 03 Phase 02 proof could not find the seeded task or Codex provider.");
    }

    await runtime.services.toolPackets.recordTaskPacket({
      taskId: task.id,
      toolProviderId: codex.id,
      role: "builder",
      objective: "Demonstrate manual tool packet persistence.",
      summary: "Logged structured execution output without altering task closure state.",
      filesTouched: ["packages/ssot/src/services/tool-packet-service.ts", "apps/founder-os/app/nex/tasks/[taskId]/page.tsx"],
      commandsRun: ["pnpm test", "pnpm build"],
      evidenceRefs: ["manual://proof/tool-packet-phase-02"],
      outcome: "work_logged",
      notes: "Packet points at proof candidates only and does not become proof automatically.",
      nextSuggestedAction: "Attach evidence separately if closure should advance.",
      recordedBy: "FOUNDER",
    });

    await runtime.services.governance.transitionTask(task.id, "IN_PROGRESS");
    await runtime.services.governance.transitionTask(task.id, "BUILT");

    const [taskPackets, providerPackets, workspacePackets, availableTransitions, evidence, events] = await Promise.all([
      runtime.services.toolPackets.listByTask(task.id),
      runtime.services.toolPackets.listByToolProvider(seed.workspaceId, codex.id),
      runtime.services.toolPackets.listByWorkspace(seed.workspaceId),
      runtime.services.governance.getAvailableTransitions(task.id),
      runtime.repositories.evidence.listByTask(task.id),
      runtime.repositories.events.listByWorkspace(seed.workspaceId),
    ]);

    const proof = {
      seed,
      packetCount: workspacePackets.length,
      taskPacketCount: taskPackets.length,
      providerPacketCount: providerPackets.length,
      packetSample: taskPackets[0] ?? null,
      availableTransitions,
      evidenceCount: evidence.length,
      packetEventCount: events.filter((event) => event.eventType === "tool_packet_logged").length,
      routes: [`/nex/tasks/${task.id}`],
    };

    const proofDir = path.join(process.cwd(), "data", "proofs");
    await mkdir(proofDir, { recursive: true });
    const proofPath = path.join(proofDir, "sprint-03-phase-02-proof.json");
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
