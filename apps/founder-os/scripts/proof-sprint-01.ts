import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { ensureNexSeed, nexRuntime } from "../src/lib/nex-runtime";

async function main() {
  const seed = await ensureNexSeed();
  const mission = await nexRuntime.services.mission.getFounderSummary();
  const planDetails = await nexRuntime.services.planning.listPlans(seed.workspaceId);
  const projectDetails = await nexRuntime.services.execution.listProjects(seed.workspaceId);
  const sprintDetail = await nexRuntime.services.execution.getSprintDetail(seed.sprintId);
  const firstTaskId = sprintDetail.phases[0]?.tasks[0]?.id;

  if (!firstTaskId) {
    throw new Error("No Sprint 01 task exists to generate proof from.");
  }

  const taskDetail = await nexRuntime.services.execution.getTaskDetail(firstTaskId);

  const proof = {
    seed,
    workspace: mission?.workspace ?? null,
    priorityCount: mission?.priorities.length ?? 0,
    planCount: planDetails.length,
    firstPlanVersions: planDetails[0]?.versions.length ?? 0,
    projectCount: projectDetails.length,
    sprintName: sprintDetail.sprint.name,
    phaseCount: sprintDetail.phases.length,
    taskCount: sprintDetail.phases.flatMap((phase) => phase.tasks).length,
    edgeCount: sprintDetail.edges.length,
    firstTask: taskDetail.task.title,
    firstTaskAllowedTransitions: await nexRuntime.services.governance.getAvailableTransitions(taskDetail.task.id),
  };

  const proofDir = path.join(process.cwd(), "data", "proofs");
  await mkdir(proofDir, { recursive: true });
  const proofPath = path.join(proofDir, "sprint-01-proof.json");
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
