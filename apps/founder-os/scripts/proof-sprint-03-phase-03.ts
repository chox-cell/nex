import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { createNexRuntime } from "@nex/ssot";

async function main() {
  const runtimeFilePath = path.join(tmpdir(), `nex-truth-surface-proof-${randomUUID()}.json`);
  const runtime = createNexRuntime(runtimeFilePath);
  await runtime.store.ensure();

  try {
    const seed = await runtime.services.seed.ensureFounderOsSeed();
    const sprint = await runtime.services.execution.getSprintDetail(seed.sprintId);
    const repoTask = sprint.phases[0]?.tasks[0];
    const terminalTask = sprint.phases[0]?.tasks[1];
    const repoProvider = await runtime.repositories.toolProviders.getByProviderType(seed.workspaceId, "repo");
    const terminalProvider = await runtime.repositories.toolProviders.getByProviderType(seed.workspaceId, "terminal");

    if (!repoTask || !terminalTask || !repoProvider || !terminalProvider) {
      throw new Error("Sprint 03 Phase 03 proof could not find the seeded tasks or truth-surface providers.");
    }

    await runtime.services.governance.transitionTask(repoTask.id, "IN_PROGRESS");
    await runtime.services.governance.transitionTask(repoTask.id, "BUILT");

    await runtime.services.repoReferences.recordTaskReference({
      taskId: repoTask.id,
      toolProviderId: repoProvider.id,
      repoLabel: "founder-os",
      branchName: "feature/s3-p3",
      gitRef: "refs/heads/feature/s3-p3",
      diffRef: "manual://diff/s3-p3",
      filesTouched: ["packages/core/src/surfaces.ts", "packages/ssot/src/services/repo-reference-service.ts"],
      summary: "Repo truth reference captured without creating evidence.",
      note: "This remains a proof-capable surface only.",
      recordedBy: "FOUNDER",
    });

    await runtime.services.terminalReferences.recordTaskReference({
      taskId: terminalTask.id,
      toolProviderId: terminalProvider.id,
      commandSummary: "Build log capture",
      commands: ["pnpm test", "pnpm build"],
      cwd: "/Users/chox/Projects/nex",
      stdoutRef: "manual://stdout/build",
      logRef: "manual://terminal/build-run",
      logExcerpt: "Build completed and logs were captured for later review.",
      summary: "Terminal truth reference captured with an explicit linked evidence record.",
      outcome: "captured",
      createEvidence: {
        title: "Terminal build log",
        summary: "Explicit evidence created from the saved terminal reference.",
        content: "pnpm build completed successfully.",
        createdBy: "FOUNDER",
      },
      recordedBy: "FOUNDER",
    });

    const [repoReferences, terminalReferences, repoTaskTransitions, repoTaskEvidence, terminalTaskEvidence] = await Promise.all([
      runtime.services.repoReferences.listByWorkspace(seed.workspaceId),
      runtime.services.terminalReferences.listByWorkspace(seed.workspaceId),
      runtime.services.governance.getAvailableTransitions(repoTask.id),
      runtime.repositories.evidence.listByTask(repoTask.id),
      runtime.repositories.evidence.listByTask(terminalTask.id),
    ]);

    const proof = {
      seed,
      repoProviderStatus: repoProvider.status,
      terminalProviderStatus: terminalProvider.status,
      repoReferenceCount: repoReferences.length,
      terminalReferenceCount: terminalReferences.length,
      repoReferenceSample: repoReferences[0] ?? null,
      terminalReferenceSample: terminalReferences[0] ?? null,
      repoTaskAvailableTransitions: repoTaskTransitions,
      repoTaskEvidenceCount: repoTaskEvidence.length,
      terminalTaskEvidenceCount: terminalTaskEvidence.length,
      routes: ["/nex/tasks/:taskId", "/nex/proof"],
    };

    const proofDir = path.join(process.cwd(), "data", "proofs");
    await mkdir(proofDir, { recursive: true });
    const proofPath = path.join(proofDir, "sprint-03-phase-03-proof.json");
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
