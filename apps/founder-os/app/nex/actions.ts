"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ensureNexSeed, nexRuntime } from "../../src/lib/nex-runtime";

function getRequiredField(formData: FormData, field: string): string {
  const value = formData.get(field);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Field ${field} is required.`);
  }

  return value.trim();
}

function getOptionalField(formData: FormData, field: string): string | null {
  const value = formData.get(field);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getLines(value: string | null): string[] {
  return (value ?? "")
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

interface OptionalEvidenceDraft {
  title: string;
  summary: string;
  content: string;
}

function getOptionalEvidenceDraft(formData: FormData, prefix: string): OptionalEvidenceDraft | undefined {
  const title = getOptionalField(formData, `${prefix}EvidenceTitle`);
  const summary = getOptionalField(formData, `${prefix}EvidenceSummary`);
  const content = getOptionalField(formData, `${prefix}EvidenceContent`);

  if (!title && !summary && !content) {
    return undefined;
  }

  if (!title || !summary || !content) {
    throw new Error(`Fields ${prefix}EvidenceTitle, ${prefix}EvidenceSummary, and ${prefix}EvidenceContent must all be provided together.`);
  }

  return {
    title,
    summary,
    content,
  };
}

async function revalidateTaskTruthPaths(taskId: string) {
  const detail = await nexRuntime.services.execution.getTaskDetail(taskId);

  revalidatePath(`/nex/tasks/${taskId}`);
  revalidatePath(`/nex/sprints/${detail.sprint.id}`);
  revalidatePath(`/nex/projects/${detail.project.id}`);
  revalidatePath("/nex/projects");
  revalidatePath("/nex/memory");
  revalidatePath("/nex/proof");
  revalidatePath("/nex/gates");
  revalidatePath("/nex/snapshots");
}

async function revalidateTaskPacketPaths(taskId: string) {
  revalidatePath(`/nex/tasks/${taskId}`);
  revalidatePath("/nex/memory");
}

async function revalidateTaskSurfacePaths(taskId: string) {
  revalidatePath(`/nex/tasks/${taskId}`);
  revalidatePath("/nex/memory");
  revalidatePath("/nex/proof");
}

async function revalidateTaskConnectorPaths(taskId: string) {
  revalidatePath(`/nex/tasks/${taskId}`);
  revalidatePath("/nex/memory");
}

export async function createPlanAction(formData: FormData) {
  const seed = await ensureNexSeed();

  const created = await nexRuntime.services.planning.createPlan({
    workspaceId: seed.workspaceId,
    projectId: getRequiredField(formData, "projectId"),
    name: getRequiredField(formData, "name"),
    goal: getRequiredField(formData, "goal"),
    status: "DRAFT",
    changeReason: "Created from Plan Center.",
    createdBy: "FOUNDER",
    sections: [
      {
        title: getRequiredField(formData, "sectionTitle"),
        intent: "Initial phase slice derived from the founder plan.",
        actions: [
          {
            title: getRequiredField(formData, "actionTitle"),
            description: getRequiredField(formData, "goal"),
            ownerKind: "TOOL",
            ownerRef: "CODEX",
            priorityWeight: 3,
            constraints: ["Use the canonical NEX state model."],
            acceptanceCriteria: ["Plan can be converted into an execution sprint."],
          },
        ],
      },
    ],
  });

  revalidatePath("/nex/plans");
  redirect(`/nex/plans/${created.plan.id}`);
}

export async function updatePlanAction(formData: FormData) {
  const planId = getRequiredField(formData, "planId");

  await nexRuntime.services.planning.updatePlan(planId, {
    name: getRequiredField(formData, "name"),
    goal: getRequiredField(formData, "goal"),
    status: getRequiredField(formData, "status") as "DRAFT" | "ACTIVE" | "BLOCKED" | "ARCHIVED",
    changeReason: getRequiredField(formData, "changeReason"),
    createdBy: "FOUNDER",
  });

  revalidatePath("/nex/plans");
  revalidatePath(`/nex/plans/${planId}`);
}

export async function convertPlanToSprintAction(formData: FormData) {
  const planId = getRequiredField(formData, "planId");
  const sprint = await nexRuntime.services.execution.convertPlanToSprint(planId);

  revalidatePath("/nex/projects");
  revalidatePath(`/nex/plans/${planId}`);
  redirect(`/nex/sprints/${sprint.sprint.id}`);
}

export async function transitionTaskAction(formData: FormData) {
  const taskId = getRequiredField(formData, "taskId");
  const nextStatus = getRequiredField(formData, "nextStatus") as
    | "READY"
    | "IN_PROGRESS"
    | "BUILT"
    | "FAIL"
    | "PROOF_ATTACHED"
    | "VERIFIED"
    | "AUDITED"
    | "SNAPSHOT_SAVED"
    | "DONE";

  await nexRuntime.services.governance.transitionTask(taskId, nextStatus);

  await revalidateTaskTruthPaths(taskId);
}

export async function attachEvidenceAction(formData: FormData) {
  const taskId = getRequiredField(formData, "taskId");

  await nexRuntime.services.evidence.attachTaskEvidence({
    taskId,
    evidenceType: getRequiredField(formData, "evidenceType") as
      | "repo_diff"
      | "terminal_log"
      | "test_result"
      | "screenshot"
      | "file_output"
      | "audit_note"
      | "snapshot_ref",
    title: getRequiredField(formData, "title"),
    summary: getRequiredField(formData, "summary"),
    sourceUri: getOptionalField(formData, "sourceUri") ?? undefined,
    content: getRequiredField(formData, "content"),
    createdBy: "FOUNDER",
  });

  await revalidateTaskTruthPaths(taskId);
}

export async function recordVerificationAction(formData: FormData) {
  const taskId = getRequiredField(formData, "taskId");

  await nexRuntime.services.verifications.recordTaskVerification({
    taskId,
    verificationType: getRequiredField(formData, "verificationType") as
      | "build_check"
      | "proof_check"
      | "test_check"
      | "critic_check"
      | "founder_review"
      | "gate_check",
    status: getRequiredField(formData, "status") as "pass" | "warning" | "fail" | "blocking",
    summary: getRequiredField(formData, "summary"),
    detail: getRequiredField(formData, "detail"),
    verifiedBy: "FOUNDER",
  });

  await revalidateTaskTruthPaths(taskId);
}

export async function decideGateAction(formData: FormData) {
  const taskId = getRequiredField(formData, "taskId");

  await nexRuntime.services.gates.decideTaskGate({
    taskId,
    decision: getRequiredField(formData, "decision") as "GO" | "NO_GO",
    rationale: getRequiredField(formData, "rationale"),
    blockers: getLines(getOptionalField(formData, "blockers")),
    decidedBy: "FOUNDER",
  });

  await revalidateTaskTruthPaths(taskId);
}

export async function writeAuditAction(formData: FormData) {
  const taskId = getRequiredField(formData, "taskId");

  await nexRuntime.services.audits.writeTaskAudit({
    taskId,
    summary: getRequiredField(formData, "summary"),
    findings: getLines(getRequiredField(formData, "findings")),
    author: "FOUNDER",
  });

  await revalidateTaskTruthPaths(taskId);
}

export async function saveSnapshotAction(formData: FormData) {
  const taskId = getRequiredField(formData, "taskId");

  await nexRuntime.services.snapshots.saveTaskSnapshot({
    taskId,
    label: getRequiredField(formData, "label"),
    summary: getRequiredField(formData, "summary"),
    createdBy: "FOUNDER",
  });

  await revalidateTaskTruthPaths(taskId);
}

export async function logToolPacketAction(formData: FormData) {
  const taskId = getRequiredField(formData, "taskId");

  await nexRuntime.services.toolPackets.recordTaskPacket({
    taskId,
    toolProviderId: getRequiredField(formData, "toolProviderId"),
    role: getRequiredField(formData, "role"),
    objective: getRequiredField(formData, "objective"),
    summary: getRequiredField(formData, "summary"),
    filesTouched: getLines(getOptionalField(formData, "filesTouched")),
    commandsRun: getLines(getOptionalField(formData, "commandsRun")),
    evidenceRefs: getLines(getOptionalField(formData, "evidenceRefs")),
    outcome: getRequiredField(formData, "outcome"),
    notes: getOptionalField(formData, "notes") ?? "",
    nextSuggestedAction: getOptionalField(formData, "nextSuggestedAction") ?? undefined,
    recordedBy: "FOUNDER",
  });

  await revalidateTaskPacketPaths(taskId);
}

export async function recordRepoReferenceAction(formData: FormData) {
  const taskId = getRequiredField(formData, "taskId");
  const evidenceDraft = getOptionalEvidenceDraft(formData, "repo");

  await nexRuntime.services.repoReferences.recordTaskReference({
    taskId,
    toolProviderId: getRequiredField(formData, "repoProviderId"),
    repoLabel: getRequiredField(formData, "repoLabel"),
    sourceLabel: getOptionalField(formData, "repoSourceLabel") ?? undefined,
    branchName: getOptionalField(formData, "repoBranchName") ?? undefined,
    gitRef: getOptionalField(formData, "repoGitRef") ?? undefined,
    commitSha: getOptionalField(formData, "repoCommitSha") ?? undefined,
    diffRef: getOptionalField(formData, "repoDiffRef") ?? undefined,
    sourcePath: getOptionalField(formData, "repoSourcePath") ?? undefined,
    filesTouched: getLines(getOptionalField(formData, "repoFilesTouched")),
    summary: getRequiredField(formData, "repoSummary"),
    note: getOptionalField(formData, "repoNote") ?? "",
    createEvidence: evidenceDraft
      ? {
          ...evidenceDraft,
          createdBy: "FOUNDER",
        }
      : undefined,
    recordedBy: "FOUNDER",
  });

  await revalidateTaskSurfacePaths(taskId);
}

export async function recordTerminalReferenceAction(formData: FormData) {
  const taskId = getRequiredField(formData, "taskId");
  const evidenceDraft = getOptionalEvidenceDraft(formData, "terminal");

  await nexRuntime.services.terminalReferences.recordTaskReference({
    taskId,
    toolProviderId: getRequiredField(formData, "terminalProviderId"),
    commandSummary: getRequiredField(formData, "terminalCommandSummary"),
    commands: getLines(getOptionalField(formData, "terminalCommands")),
    cwd: getOptionalField(formData, "terminalCwd") ?? undefined,
    stdoutRef: getOptionalField(formData, "terminalStdoutRef") ?? undefined,
    stderrRef: getOptionalField(formData, "terminalStderrRef") ?? undefined,
    logRef: getOptionalField(formData, "terminalLogRef") ?? undefined,
    logExcerpt: getRequiredField(formData, "terminalLogExcerpt"),
    executedAt: getOptionalField(formData, "terminalExecutedAt") ?? undefined,
    summary: getRequiredField(formData, "terminalSummary"),
    outcome: getRequiredField(formData, "terminalOutcome"),
    note: getOptionalField(formData, "terminalNote") ?? "",
    createEvidence: evidenceDraft
      ? {
          ...evidenceDraft,
          createdBy: "FOUNDER",
        }
      : undefined,
    recordedBy: "FOUNDER",
  });

  await revalidateTaskSurfacePaths(taskId);
}

export async function assignCodexOwnerAction(formData: FormData) {
  const taskId = getRequiredField(formData, "taskId");

  await nexRuntime.services.codexConnector.assignTaskOwner(taskId, "FOUNDER");
  await revalidateTaskConnectorPaths(taskId);
}

export async function recordCodexResultAction(formData: FormData) {
  const taskId = getRequiredField(formData, "taskId");

  await nexRuntime.services.codexConnector.normalizeResult({
    taskId,
    providerId: getOptionalField(formData, "codexProviderId") ?? undefined,
    summary: getRequiredField(formData, "codexSummary"),
    filesTouched: getLines(getOptionalField(formData, "codexFilesTouched")),
    commandsRun: getLines(getOptionalField(formData, "codexCommandsRun")),
    outcome: getRequiredField(formData, "codexOutcome"),
    notes: getOptionalField(formData, "codexNotes") ?? "",
    evidenceRefs: getLines(getOptionalField(formData, "codexEvidenceRefs")),
    repoRefs: getLines(getOptionalField(formData, "codexRepoRefs")),
    terminalRefs: getLines(getOptionalField(formData, "codexTerminalRefs")),
    suggestedNextAction: getOptionalField(formData, "codexSuggestedNextAction") ?? undefined,
    rawPayloadRef: getOptionalField(formData, "codexRawPayloadRef") ?? undefined,
    warnings: getLines(getOptionalField(formData, "codexWarnings")),
    resultStatus: getRequiredField(formData, "codexResultStatus") as "received" | "normalized" | "warning" | "failed",
    recordedBy: "FOUNDER",
  });

  await revalidateTaskConnectorPaths(taskId);
}
