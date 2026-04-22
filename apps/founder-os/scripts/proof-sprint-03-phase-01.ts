import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { ensureNexSeed, nexRuntime } from "../src/lib/nex-runtime";

async function main() {
  const seed = await ensureNexSeed();
  const registry = await nexRuntime.services.tools.getFounderRegistrySummary();

  if (!registry) {
    throw new Error("Tool registry proof could not be generated because the founder workspace is missing.");
  }

  const proof = {
    seed,
    providerCount: registry.providers.length,
    statusCounts: registry.statusCounts,
    truthSurfaceCount: registry.truthSurfaceCount,
    providers: registry.providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      providerType: provider.providerType,
      status: provider.status,
      capabilities: provider.capabilities,
    })),
    routes: ["/nex/tools"],
  };

  const proofDir = path.join(process.cwd(), "data", "proofs");
  await mkdir(proofDir, { recursive: true });
  const proofPath = path.join(proofDir, "sprint-03-phase-01-proof.json");
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
