import { notFound } from "next/navigation";

import {
  attachEvidenceAction,
  assignCodexOwnerAction,
  decideGateAction,
  logToolPacketAction,
  recordCodexResultAction,
  recordRepoReferenceAction,
  recordTerminalReferenceAction,
  recordVerificationAction,
  saveSnapshotAction,
  transitionTaskAction,
  writeAuditAction,
} from "../../actions";
import { Panel } from "../../../../src/components/panel";
import { StateBadge } from "../../../../src/components/state-badge";
import { formatTimestamp } from "../../../../src/lib/format";
import { ensureNexSeed, nexRuntime } from "../../../../src/lib/nex-runtime";

interface TaskDetailPageProps {
  params: Promise<{ taskId: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  await ensureNexSeed();
  const { taskId } = await params;

  try {
    const detail = await nexRuntime.services.execution.getTaskDetail(taskId);
    const { taskProjection } = await nexRuntime.services.sync.refreshTaskScope(taskId);
    const [
      availableTransitions,
      resumePacket,
      toolProviders,
      codexResults,
      toolPackets,
      repoReferences,
      terminalReferences,
      evidence,
      verifications,
      gateDecisions,
      audits,
      snapshots,
    ] = await Promise.all([
      nexRuntime.services.governance.getAvailableTransitions(taskId),
      nexRuntime.services.resumePackets.getTaskPacket(taskId),
      nexRuntime.services.tools.listByWorkspace(detail.project.workspaceId),
      nexRuntime.services.codexConnector.listResultsByTask(taskId),
      nexRuntime.services.toolPackets.listByTask(taskId),
      nexRuntime.services.repoReferences.listByTask(taskId),
      nexRuntime.services.terminalReferences.listByTask(taskId),
      nexRuntime.repositories.evidence.listByTask(taskId),
      nexRuntime.repositories.verifications.listByTask(taskId),
      nexRuntime.repositories.gates.listByTask(taskId),
      nexRuntime.repositories.audits.listByTask(taskId),
      nexRuntime.repositories.snapshots.listByTask(taskId),
    ]);
    const latestGate = gateDecisions[0] ?? null;
    const codexProvider = toolProviders.find((provider) => provider.providerType === "codex") ?? null;
    const repoProvider = toolProviders.find((provider) => provider.providerType === "repo") ?? null;
    const terminalProvider = toolProviders.find((provider) => provider.providerType === "terminal") ?? null;
    const evidenceById = new Map(evidence.map((record) => [record.id, record]));
    const [codexLifecycle, codexPacket] = codexProvider
      ? await Promise.all([
          nexRuntime.services.codexConnector.getLifecycleState(taskId),
          nexRuntime.services.codexConnector.buildTaskPacket(taskId),
        ])
      : ["unavailable" as const, null];

    return (
      <div className="page-grid">
        <header className="route-header">
          <div>
            <p className="route-kicker">Task runtime</p>
            <h1>{detail.task.title}</h1>
            <p className="route-copy">{detail.task.objective}</p>
          </div>
          <StateBadge status={detail.task.status} />
        </header>

        <div className="page-grid two">
          <Panel eyebrow="Execution truth" title="Task context">
            <dl className="detail-list">
              <div>
                <dt>Owner</dt>
                <dd>
                  {detail.task.ownerKind} / {detail.task.ownerRef}
                </dd>
              </div>
              <div>
                <dt>Priority weight</dt>
                <dd>{detail.task.priorityWeight}</dd>
              </div>
              <div>
                <dt>Phase</dt>
                <dd>{detail.phase.name}</dd>
              </div>
              <div>
                <dt>Sprint</dt>
                <dd>{detail.sprint.name}</dd>
              </div>
              <div>
                <dt>Project</dt>
                <dd>{detail.project.name}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{formatTimestamp(detail.task.updatedAt)}</dd>
              </div>
            </dl>
          </Panel>

          <Panel eyebrow="Truth readiness" title="Real closure state">
            <dl className="detail-list">
              <div>
                <dt>Progress score</dt>
                <dd>{taskProjection.progressScore} / 100</dd>
              </div>
              <div>
                <dt>Evidence</dt>
                <dd>{taskProjection.evidenceCount}</dd>
              </div>
              <div>
                <dt>Verification</dt>
                <dd>
                  {taskProjection.verificationSummary.passCount} pass / {taskProjection.verificationSummary.warningCount} warning /{" "}
                  {taskProjection.verificationSummary.failCount} fail / {taskProjection.verificationSummary.blockingCount} blocking
                </dd>
              </div>
              <div>
                <dt>Gate</dt>
                <dd>{taskProjection.latestGateDecision ?? "No decision"}</dd>
              </div>
              <div>
                <dt>Audit records</dt>
                <dd>{taskProjection.auditCount}</dd>
              </div>
              <div>
                <dt>Snapshots</dt>
                <dd>{taskProjection.snapshotCount}</dd>
              </div>
            </dl>
            <p>{taskProjection.nextRequiredAction}</p>
            {taskProjection.blockers.length ? (
              <ul>
                {taskProjection.blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No active blockers are projected for this task right now.</p>
            )}
          </Panel>
        </div>

        <div className="page-grid two">
          <Panel eyebrow="Status discipline" title="Allowed transitions">
            <p>
              Sprint 02 unlocks the proof states only when their persisted truth prerequisites exist. This route will not offer proof or closure
              transitions early.
            </p>
            <form action={transitionTaskAction} className="form-stack">
              <input name="taskId" type="hidden" value={detail.task.id} />
              <label>
                Next status
                <select className="select" name="nextStatus" required>
                  {availableTransitions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <div className="actions-row">
                <button className="button" disabled={!availableTransitions.length} type="submit">
                  Apply transition
                </button>
              </div>
            </form>
            {!availableTransitions.length ? <p className="empty-state">No manual transition is currently allowed from this state.</p> : null}
          </Panel>

          <Panel eyebrow="Resume packet" title="Recovery payload">
            {resumePacket ? (
              <div className="stack-list">
                <article className="stack-card">
                  <h3>Next required action</h3>
                  <p>{resumePacket.nextRequiredAction}</p>
                </article>
                <article className="stack-card">
                  <h3>Completed steps</h3>
                  {resumePacket.completedSteps.length ? (
                    <ul>
                      {resumePacket.completedSteps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-state">No completed execution steps recorded yet.</p>
                  )}
                </article>
                <article className="stack-card">
                  <h3>Failed steps</h3>
                  {resumePacket.failedSteps.length ? (
                    <ul>
                      {resumePacket.failedSteps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-state">No failed steps recorded.</p>
                  )}
                </article>
              </div>
            ) : (
              <p className="empty-state">Resume packet has not been built yet.</p>
            )}
          </Panel>
        </div>

        <div className="page-grid two">
          <Panel eyebrow="Constraints" title="Guardrails">
            <ul>
              {detail.task.constraints.map((constraint) => (
                <li key={constraint}>{constraint}</li>
              ))}
            </ul>
          </Panel>

          <Panel eyebrow="Acceptance" title="Task proof expectations">
            <ul>
              {detail.task.acceptanceCriteria.map((criterion) => (
                <li key={criterion}>{criterion}</li>
              ))}
            </ul>
            <p className="muted-text">Required proof references are now backed by evidence, verification, gate, audit, and snapshot services.</p>
          </Panel>
        </div>

        <div className="page-grid two">
          <Panel eyebrow="Codex connector contract" title="Owner path and packet preview">
            <p className="muted-text">
              This is a contract preview only. NEX can prepare a Codex-ready packet and normalize a Codex-like result, but it does not execute
              Codex live and it does not treat Codex output as proof by default.
            </p>
            <dl className="detail-list">
              <div>
                <dt>Connector lifecycle</dt>
                <dd>
                  <StateBadge status={codexLifecycle} />
                </dd>
              </div>
              <div>
                <dt>Provider status</dt>
                <dd>{codexProvider ? <StateBadge status={codexProvider.status} /> : "Codex provider unavailable"}</dd>
              </div>
              <div>
                <dt>Current owner</dt>
                <dd>
                  {detail.task.ownerKind} / {detail.task.ownerRef}
                </dd>
              </div>
              <div>
                <dt>Suggested truth surfaces</dt>
                <dd>{codexPacket ? codexPacket.suggestedTruthSurfaces.join(", ") : "No preview available"}</dd>
              </div>
            </dl>
            {codexProvider && detail.task.ownerRef !== "CODEX" ? (
              <form action={assignCodexOwnerAction} className="form-stack">
                <input name="taskId" type="hidden" value={detail.task.id} />
                <div className="actions-row">
                  <button className="button" type="submit">
                    Assign Codex owner
                  </button>
                </div>
              </form>
            ) : null}
            {codexPacket ? (
              <div className="stack-list">
                <article className="stack-card">
                  <h3>{codexPacket.relevantContext.taskTitle}</h3>
                  <p>{codexPacket.objective}</p>
                </article>
                <article className="stack-card">
                  <h3>Execution context</h3>
                  <p>
                    {codexPacket.relevantContext.projectName} / {codexPacket.relevantContext.sprintName} / {codexPacket.relevantContext.phaseName}
                  </p>
                  <p className="muted-text">{codexPacket.relevantContext.projectSummary}</p>
                  <p className="muted-text">{codexPacket.relevantContext.sprintGoal}</p>
                </article>
                <article className="stack-card">
                  <h3>Constraints</h3>
                  <ul>
                    {codexPacket.constraints.map((constraint) => (
                      <li key={constraint}>{constraint}</li>
                    ))}
                  </ul>
                </article>
                <article className="stack-card">
                  <h3>Acceptance criteria</h3>
                  <ul>
                    {codexPacket.acceptanceCriteria.map((criterion) => (
                      <li key={criterion}>{criterion}</li>
                    ))}
                  </ul>
                </article>
                <article className="stack-card">
                  <h3>Required proof</h3>
                  <ul>
                    {codexPacket.requiredProof.map((proof) => (
                      <li key={proof}>{proof}</li>
                    ))}
                  </ul>
                </article>
                <article className="stack-card">
                  <h3>Dependency summary</h3>
                  <p>
                    Pending:{" "}
                    {codexPacket.dependencySummary.pendingDependencies.length
                      ? codexPacket.dependencySummary.pendingDependencies.join(", ")
                      : "No pending dependencies"}
                  </p>
                  <p>
                    Edges:{" "}
                    {codexPacket.dependencySummary.relevantTaskEdges.length
                      ? codexPacket.dependencySummary.relevantTaskEdges
                          .map((edge) => `${edge.direction} ${edge.type} ${edge.taskId}`)
                          .join(" | ")
                      : "No relevant edges"}
                  </p>
                </article>
                <article className="stack-card">
                  <h3>Resume context</h3>
                  <p>{codexPacket.relevantResumeContext?.nextRequiredAction ?? codexPacket.nextRequiredAction}</p>
                  <p className="muted-text">
                    {codexPacket.relevantResumeContext?.blockers.length
                      ? codexPacket.relevantResumeContext.blockers.join(" | ")
                      : "No active resume blockers"}
                  </p>
                </article>
              </div>
            ) : (
              <p className="empty-state">Codex packet preview is unavailable because the provider is not modeled in this workspace.</p>
            )}
          </Panel>

          <Panel eyebrow="Codex connector contract" title="Normalized result preview">
            <p className="muted-text">
              A normalized Codex result is still only an input to the truth system. It is not evidence, not verification, and not closure
              authority.
            </p>
            <form action={recordCodexResultAction} className="form-stack">
              <input name="taskId" type="hidden" value={detail.task.id} />
              {codexProvider ? <input name="codexProviderId" type="hidden" value={codexProvider.id} /> : null}
              <div className="form-grid">
                <label>
                  Result status
                  <select className="select" name="codexResultStatus" required>
                    <option value="normalized">normalized</option>
                    <option value="received">received</option>
                    <option value="warning">warning</option>
                    <option value="failed">failed</option>
                  </select>
                </label>
                <label>
                  Outcome
                  <input className="input" name="codexOutcome" placeholder="result_captured, blocked, draft_ready" required />
                </label>
              </div>
              <label>
                Summary
                <textarea className="textarea" name="codexSummary" placeholder="What Codex output produced or proposed." required />
              </label>
              <label>
                Files touched
                <textarea className="textarea" name="codexFilesTouched" placeholder="One file path per line." />
              </label>
              <label>
                Commands run
                <textarea className="textarea" name="codexCommandsRun" placeholder="One command per line." />
              </label>
              <div className="form-grid">
                <label>
                  Repo refs
                  <textarea className="textarea" name="codexRepoRefs" placeholder="One repo ref per line." />
                </label>
                <label>
                  Terminal refs
                  <textarea className="textarea" name="codexTerminalRefs" placeholder="One terminal ref per line." />
                </label>
              </div>
              <label>
                Evidence refs
                <textarea className="textarea" name="codexEvidenceRefs" placeholder="One evidence ref per line. These do not create evidence." />
              </label>
              <label>
                Suggested next action
                <input className="input" name="codexSuggestedNextAction" placeholder="Optional follow-up move." />
              </label>
              <label>
                Raw payload ref
                <input className="input" name="codexRawPayloadRef" placeholder="Optional raw payload reference." />
              </label>
              <label>
                Warnings
                <textarea className="textarea" name="codexWarnings" placeholder="One warning per line." />
              </label>
              <label>
                Notes
                <textarea className="textarea" name="codexNotes" placeholder="Optional normalization notes." />
              </label>
              <div className="actions-row">
                <button className="button" type="submit">
                  Save Codex result
                </button>
              </div>
            </form>
            <div className="stack-list">
              {codexResults.map((result) => (
                <article className="stack-card" key={result.id}>
                  <header>
                    <div>
                      <h3>{result.summary}</h3>
                      <p>{result.outcome}</p>
                    </div>
                    <StateBadge status={result.resultStatus} />
                  </header>
                  <dl className="detail-list">
                    <div>
                      <dt>Files touched</dt>
                      <dd>{result.filesTouched.length ? result.filesTouched.join(", ") : "No files recorded"}</dd>
                    </div>
                    <div>
                      <dt>Commands run</dt>
                      <dd>{result.commandsRun.length ? result.commandsRun.join(" | ") : "No commands recorded"}</dd>
                    </div>
                    <div>
                      <dt>Repo refs</dt>
                      <dd>{result.repoRefs.length ? result.repoRefs.join(", ") : "No repo refs"}</dd>
                    </div>
                    <div>
                      <dt>Terminal refs</dt>
                      <dd>{result.terminalRefs.length ? result.terminalRefs.join(", ") : "No terminal refs"}</dd>
                    </div>
                    <div>
                      <dt>Evidence refs</dt>
                      <dd>{result.evidenceRefs.length ? result.evidenceRefs.join(", ") : "No evidence refs"}</dd>
                    </div>
                    <div>
                      <dt>Suggested next action</dt>
                      <dd>{result.suggestedNextAction ?? "No next action recorded"}</dd>
                    </div>
                  </dl>
                  {result.warnings.length ? <p className="muted-text">{result.warnings.join(" | ")}</p> : null}
                  {result.notes ? <p className="muted-text pre-wrap">{result.notes}</p> : null}
                </article>
              ))}
              {!codexResults.length ? <p className="empty-state">No normalized Codex result packets have been stored for this task yet.</p> : null}
            </div>
          </Panel>
        </div>

        <div className="page-grid two">
          <Panel eyebrow="Tool packets" title="Log execution signals">
            <p className="muted-text">
              Tool packets preserve structured execution notes from external work surfaces. They can point at evidence refs, but they do not
              create evidence, pass verification, or advance closure on their own.
            </p>
            <form action={logToolPacketAction} className="form-stack">
              <input name="taskId" type="hidden" value={detail.task.id} />
              <div className="form-grid">
                <label>
                  Provider
                  <select className="select" name="toolProviderId" required>
                    {toolProviders.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name} ({provider.providerType})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Role
                  <input className="input" name="role" placeholder="builder, critic, advisor, executor" required />
                </label>
              </div>
              <label>
                Objective
                <input className="input" name="objective" placeholder="What the tool was trying to achieve" required />
              </label>
              <label>
                Summary
                <textarea className="textarea" name="summary" placeholder="Concise execution summary." required />
              </label>
              <div className="form-grid">
                <label>
                  Outcome
                  <input className="input" name="outcome" placeholder="work_logged, blocked, draft_patch_ready" required />
                </label>
                <label>
                  Next suggested action
                  <input className="input" name="nextSuggestedAction" placeholder="Optional follow-up move" />
                </label>
              </div>
              <label>
                Files touched
                <textarea className="textarea" name="filesTouched" placeholder="One file path per line." />
              </label>
              <label>
                Commands run
                <textarea className="textarea" name="commandsRun" placeholder="One command per line." />
              </label>
              <label>
                Evidence refs
                <textarea
                  className="textarea"
                  name="evidenceRefs"
                  placeholder="One evidence ref per line. These refs do not create evidence records automatically."
                />
              </label>
              <label>
                Notes
                <textarea className="textarea" name="notes" placeholder="Anything worth preserving for review or recovery." />
              </label>
              <div className="actions-row">
                <button className="button" type="submit">
                  Log tool packet
                </button>
              </div>
            </form>
          </Panel>

          <Panel eyebrow="Tool packets" title="Packet history">
            {toolPackets.length ? (
              <div className="stack-list">
                {toolPackets.map((packet) => (
                  <article className="stack-card" key={packet.id}>
                    <header>
                      <div>
                        <h3>
                          {packet.toolName} / {packet.role}
                        </h3>
                        <p>{packet.summary}</p>
                      </div>
                      <p className="muted-text mono">{formatTimestamp(packet.createdAt)}</p>
                    </header>
                    <dl className="detail-list">
                      <div>
                        <dt>Objective</dt>
                        <dd>{packet.objective}</dd>
                      </div>
                      <div>
                        <dt>Outcome</dt>
                        <dd>{packet.outcome}</dd>
                      </div>
                      <div>
                        <dt>Files touched</dt>
                        <dd>{packet.filesTouched.length ? packet.filesTouched.join(", ") : "No files recorded"}</dd>
                      </div>
                      <div>
                        <dt>Commands run</dt>
                        <dd>{packet.commandsRun.length ? packet.commandsRun.join(" | ") : "No commands recorded"}</dd>
                      </div>
                      <div>
                        <dt>Evidence refs</dt>
                        <dd>{packet.evidenceRefs.length ? packet.evidenceRefs.join(", ") : "No linked refs"}</dd>
                      </div>
                      <div>
                        <dt>Next suggested action</dt>
                        <dd>{packet.nextSuggestedAction ?? "No next action recorded"}</dd>
                      </div>
                    </dl>
                    {packet.notes ? <p className="muted-text pre-wrap">{packet.notes}</p> : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state">No tool packets have been logged for this task yet.</p>
            )}
          </Panel>
        </div>

        <div className="page-grid two">
          <Panel eyebrow="Repo truth surface" title="Attach repo reference">
            <p className="muted-text">
              Repo references preserve diff, ref, and branch context as a reviewable truth surface. They do not become proof unless you also
              create an evidence record explicitly.
            </p>
            {repoProvider ? (
              <form action={recordRepoReferenceAction} className="form-stack">
                <input name="taskId" type="hidden" value={detail.task.id} />
                <input name="repoProviderId" type="hidden" value={repoProvider.id} />
                <div className="form-grid">
                  <label>
                    Repo label
                    <input className="input" name="repoLabel" placeholder="founder-os" required />
                  </label>
                  <label>
                    Source label
                    <input className="input" name="repoSourceLabel" placeholder="origin or local clone label" />
                  </label>
                </div>
                <div className="form-grid">
                  <label>
                    Branch name
                    <input className="input" name="repoBranchName" placeholder="feature/s3-p3" />
                  </label>
                  <label>
                    Git ref
                    <input className="input" name="repoGitRef" placeholder="refs/heads/feature/s3-p3" />
                  </label>
                </div>
                <div className="form-grid">
                  <label>
                    Commit SHA
                    <input className="input" name="repoCommitSha" placeholder="abc1234" />
                  </label>
                  <label>
                    Diff ref
                    <input className="input" name="repoDiffRef" placeholder="manual://diff/ref" />
                  </label>
                </div>
                <label>
                  Source path
                  <input className="input" name="repoSourcePath" placeholder="packages/ssot/src/services/repo-reference-service.ts" />
                </label>
                <label>
                  Files touched
                  <textarea className="textarea" name="repoFilesTouched" placeholder="One file path per line." />
                </label>
                <label>
                  Summary
                  <textarea className="textarea" name="repoSummary" placeholder="What this repo reference captures." required />
                </label>
                <label>
                  Notes
                  <textarea className="textarea" name="repoNote" placeholder="Optional repo context or review notes." />
                </label>
                <label>
                  Evidence title
                  <input className="input" name="repoEvidenceTitle" placeholder="Optional. Leave all evidence fields blank to save a reference only." />
                </label>
                <label>
                  Evidence summary
                  <input className="input" name="repoEvidenceSummary" placeholder="What the explicit evidence would prove." />
                </label>
                <label>
                  Evidence content
                  <textarea className="textarea" name="repoEvidenceContent" placeholder="Paste the explicit diff excerpt or repo note to create evidence." />
                </label>
                <div className="actions-row">
                  <button className="button" type="submit">
                    Save repo reference
                  </button>
                </div>
              </form>
            ) : (
              <p className="empty-state">Repo provider is not available in the registry yet.</p>
            )}
            <div className="stack-list">
              {repoReferences.map((record) => {
                const linkedEvidence = record.linkedEvidenceIds
                  .map((id) => evidenceById.get(id) ?? null)
                  .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));

                return (
                  <article className="stack-card" key={record.id}>
                    <header>
                      <div>
                        <h3>{record.repoLabel}</h3>
                        <p>{record.summary}</p>
                      </div>
                      <p className="muted-text mono">{formatTimestamp(record.createdAt)}</p>
                    </header>
                    <dl className="detail-list">
                      <div>
                        <dt>Branch</dt>
                        <dd>{record.branchName ?? "No branch recorded"}</dd>
                      </div>
                      <div>
                        <dt>Git ref</dt>
                        <dd className="mono">{record.gitRef ?? "No ref recorded"}</dd>
                      </div>
                      <div>
                        <dt>Commit SHA</dt>
                        <dd className="mono">{record.commitSha ?? "No commit recorded"}</dd>
                      </div>
                      <div>
                        <dt>Diff ref</dt>
                        <dd className="mono">{record.diffRef ?? "No diff ref recorded"}</dd>
                      </div>
                      <div>
                        <dt>Files touched</dt>
                        <dd>{record.filesTouched.length ? record.filesTouched.join(", ") : "No files recorded"}</dd>
                      </div>
                      <div>
                        <dt>Linked evidence</dt>
                        <dd>{linkedEvidence.length ? linkedEvidence.map((item) => item.title).join(", ") : "No linked evidence"}</dd>
                      </div>
                    </dl>
                    {record.note ? <p className="muted-text pre-wrap">{record.note}</p> : null}
                  </article>
                );
              })}
              {!repoReferences.length ? <p className="empty-state">No repo truth references have been recorded for this task yet.</p> : null}
            </div>
          </Panel>

          <Panel eyebrow="Terminal truth surface" title="Attach terminal reference">
            <p className="muted-text">
              Terminal references preserve command and log context as a truth surface. They remain reviewable artifacts, not a claim that NEX
              executed anything on its own.
            </p>
            {terminalProvider ? (
              <form action={recordTerminalReferenceAction} className="form-stack">
                <input name="taskId" type="hidden" value={detail.task.id} />
                <input name="terminalProviderId" type="hidden" value={terminalProvider.id} />
                <div className="form-grid">
                  <label>
                    Command summary
                    <input className="input" name="terminalCommandSummary" placeholder="Test and build run" required />
                  </label>
                  <label>
                    Outcome
                    <input className="input" name="terminalOutcome" placeholder="captured, blocked, warning" required />
                  </label>
                </div>
                <label>
                  Commands
                  <textarea className="textarea" name="terminalCommands" placeholder="One command per line." />
                </label>
                <div className="form-grid">
                  <label>
                    Working directory
                    <input className="input" name="terminalCwd" placeholder="/Users/chox/Projects/nex" />
                  </label>
                  <label>
                    Executed at
                    <input className="input" name="terminalExecutedAt" placeholder="Optional ISO timestamp" />
                  </label>
                </div>
                <div className="form-grid">
                  <label>
                    Stdout ref
                    <input className="input" name="terminalStdoutRef" placeholder="manual://stdout/log" />
                  </label>
                  <label>
                    Stderr ref
                    <input className="input" name="terminalStderrRef" placeholder="manual://stderr/log" />
                  </label>
                </div>
                <label>
                  Log ref
                  <input className="input" name="terminalLogRef" placeholder="manual://terminal/run" />
                </label>
                <label>
                  Log excerpt
                  <textarea className="textarea" name="terminalLogExcerpt" placeholder="Paste the relevant command output excerpt." required />
                </label>
                <label>
                  Summary
                  <textarea className="textarea" name="terminalSummary" placeholder="What this terminal reference captures." required />
                </label>
                <label>
                  Notes
                  <textarea className="textarea" name="terminalNote" placeholder="Optional execution context or warnings." />
                </label>
                <label>
                  Evidence title
                  <input
                    className="input"
                    name="terminalEvidenceTitle"
                    placeholder="Optional. Leave all evidence fields blank to save a reference only."
                  />
                </label>
                <label>
                  Evidence summary
                  <input className="input" name="terminalEvidenceSummary" placeholder="What the explicit terminal evidence would prove." />
                </label>
                <label>
                  Evidence content
                  <textarea
                    className="textarea"
                    name="terminalEvidenceContent"
                    placeholder="Paste the explicit terminal output excerpt to create evidence."
                  />
                </label>
                <div className="actions-row">
                  <button className="button" type="submit">
                    Save terminal reference
                  </button>
                </div>
              </form>
            ) : (
              <p className="empty-state">Terminal provider is not available in the registry yet.</p>
            )}
            <div className="stack-list">
              {terminalReferences.map((record) => {
                const linkedEvidence = record.linkedEvidenceIds
                  .map((id) => evidenceById.get(id) ?? null)
                  .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));

                return (
                  <article className="stack-card" key={record.id}>
                    <header>
                      <div>
                        <h3>{record.commandSummary}</h3>
                        <p>{record.summary}</p>
                      </div>
                      <p className="muted-text mono">{formatTimestamp(record.executedAt)}</p>
                    </header>
                    <dl className="detail-list">
                      <div>
                        <dt>Outcome</dt>
                        <dd>{record.outcome}</dd>
                      </div>
                      <div>
                        <dt>Working directory</dt>
                        <dd className="mono">{record.cwd ?? "No cwd recorded"}</dd>
                      </div>
                      <div>
                        <dt>Commands</dt>
                        <dd>{record.commands.length ? record.commands.join(" | ") : "No commands recorded"}</dd>
                      </div>
                      <div>
                        <dt>Log ref</dt>
                        <dd className="mono">{record.logRef ?? record.stdoutRef ?? record.stderrRef ?? "No log ref recorded"}</dd>
                      </div>
                      <div>
                        <dt>Linked evidence</dt>
                        <dd>{linkedEvidence.length ? linkedEvidence.map((item) => item.title).join(", ") : "No linked evidence"}</dd>
                      </div>
                    </dl>
                    <p className="muted-text pre-wrap">{record.logExcerpt}</p>
                    {record.note ? <p className="muted-text pre-wrap">{record.note}</p> : null}
                  </article>
                );
              })}
              {!terminalReferences.length ? <p className="empty-state">No terminal truth references have been recorded for this task yet.</p> : null}
            </div>
          </Panel>
        </div>

        <div className="page-grid two">
          <Panel eyebrow="Evidence" title="Attach proof artifacts">
            <form action={attachEvidenceAction} className="form-stack">
              <input name="taskId" type="hidden" value={detail.task.id} />
              <div className="form-grid">
                <label>
                  Evidence type
                  <select className="select" name="evidenceType" required>
                    <option value="repo_diff">repo_diff</option>
                    <option value="terminal_log">terminal_log</option>
                    <option value="test_result">test_result</option>
                    <option value="screenshot">screenshot</option>
                    <option value="file_output">file_output</option>
                    <option value="audit_note">audit_note</option>
                    <option value="snapshot_ref">snapshot_ref</option>
                  </select>
                </label>
                <label>
                  Title
                  <input className="input" name="title" placeholder="Passing build output" required />
                </label>
              </div>
              <label>
                Summary
                <input className="input" name="summary" placeholder="What this evidence proves" required />
              </label>
              <label>
                Source URI
                <input className="input" name="sourceUri" placeholder="/tmp/build.log or git diff ref" />
              </label>
              <label>
                Content
                <textarea className="textarea" name="content" placeholder="Paste the relevant proof excerpt or note." required />
              </label>
              <div className="actions-row">
                <button className="button" type="submit">
                  Attach evidence
                </button>
              </div>
            </form>
            <div className="stack-list">
              {evidence.map((record) => (
                <article className="stack-card" key={record.id}>
                  <header>
                    <div>
                      <h3>{record.title}</h3>
                      <p>{record.summary}</p>
                    </div>
                    <StateBadge status={record.evidenceType} />
                  </header>
                  <p className="muted-text pre-wrap">{record.content}</p>
                </article>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Verification" title="Record checks">
            <form action={recordVerificationAction} className="form-stack">
              <input name="taskId" type="hidden" value={detail.task.id} />
              <div className="form-grid">
                <label>
                  Check type
                  <select className="select" name="verificationType" required>
                    <option value="build_check">build_check</option>
                    <option value="proof_check">proof_check</option>
                    <option value="test_check">test_check</option>
                    <option value="critic_check">critic_check</option>
                    <option value="founder_review">founder_review</option>
                    <option value="gate_check">gate_check</option>
                  </select>
                </label>
                <label>
                  Status
                  <select className="select" name="status" required>
                    <option value="pass">pass</option>
                    <option value="warning">warning</option>
                    <option value="fail">fail</option>
                    <option value="blocking">blocking</option>
                  </select>
                </label>
              </div>
              <label>
                Summary
                <input className="input" name="summary" placeholder="Build succeeded with green tests" required />
              </label>
              <label>
                Detail
                <textarea className="textarea" name="detail" placeholder="Explain the verification result." required />
              </label>
              <div className="actions-row">
                <button className="button" type="submit">
                  Record verification
                </button>
              </div>
            </form>
            <div className="stack-list">
              {verifications.map((record) => (
                <article className="stack-card" key={record.id}>
                  <header>
                    <div>
                      <h3>{record.verificationType}</h3>
                      <p>{record.summary}</p>
                    </div>
                    <StateBadge status={record.status} />
                  </header>
                  <p className="muted-text pre-wrap">{record.detail}</p>
                </article>
              ))}
            </div>
          </Panel>
        </div>

        <div className="page-grid two">
          <Panel eyebrow="Gate decision" title="Closure control">
            <form action={decideGateAction} className="form-stack">
              <input name="taskId" type="hidden" value={detail.task.id} />
              <div className="form-grid">
                <label>
                  Decision
                  <select className="select" name="decision" required>
                    <option value="GO">GO</option>
                    <option value="NO_GO">NO_GO</option>
                  </select>
                </label>
                <label>
                  Rationale
                  <input className="input" name="rationale" placeholder="Why this task can or cannot close" required />
                </label>
              </div>
              <label>
                Blockers
                <textarea className="textarea" name="blockers" placeholder="One blocker per line." />
              </label>
              <div className="actions-row">
                <button className="button" type="submit">
                  Record gate decision
                </button>
              </div>
            </form>
            {latestGate ? (
              <article className="stack-card">
                <header>
                  <div>
                    <h3>{latestGate.gateType}</h3>
                    <p>{latestGate.rationale}</p>
                  </div>
                  <StateBadge status={latestGate.decision} />
                </header>
                {latestGate.blockers.length ? (
                  <ul>
                    {latestGate.blockers.map((blocker) => (
                      <li key={blocker}>{blocker}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">No blockers recorded on the latest gate decision.</p>
                )}
              </article>
            ) : (
              <p className="empty-state">No gate decision has been recorded yet.</p>
            )}
          </Panel>

          <Panel eyebrow="Audit + snapshot" title="Recovery artifacts">
            <form action={writeAuditAction} className="form-stack">
              <input name="taskId" type="hidden" value={detail.task.id} />
              <label>
                Audit summary
                <input className="input" name="summary" placeholder="Task satisfies scope and no hidden blockers remain" required />
              </label>
              <label>
                Findings
                <textarea className="textarea" name="findings" placeholder="One finding per line." required />
              </label>
              <div className="actions-row">
                <button className="button-secondary" type="submit">
                  Write audit
                </button>
              </div>
            </form>
            <form action={saveSnapshotAction} className="form-stack">
              <input name="taskId" type="hidden" value={detail.task.id} />
              <div className="form-grid">
                <label>
                  Snapshot label
                  <input className="input" name="label" placeholder="Task close candidate" required />
                </label>
                <label>
                  Summary
                  <input className="input" name="summary" placeholder="Why this snapshot matters" required />
                </label>
              </div>
              <div className="actions-row">
                <button className="button" type="submit">
                  Save snapshot
                </button>
              </div>
            </form>
            <div className="stack-list">
              {audits.map((record) => (
                <article className="stack-card" key={record.id}>
                  <h3>{record.summary}</h3>
                  <ul>
                    {record.findings.map((finding) => (
                      <li key={finding}>{finding}</li>
                    ))}
                  </ul>
                </article>
              ))}
              {snapshots.map((record) => (
                <article className="stack-card" key={record.id}>
                  <h3>{record.label}</h3>
                  <p>{record.summary}</p>
                  <p className="muted-text mono">{formatTimestamp(record.createdAt)}</p>
                </article>
              ))}
            </div>
          </Panel>
        </div>

        <div className="page-grid two">
          <Panel eyebrow="Inbound edges" title="What blocks this task">
            {detail.inboundEdges.length ? (
              <ul>
                {detail.inboundEdges.map((edge) => (
                  <li key={edge.id}>
                    {edge.type} from <span className="mono">{edge.fromTaskId}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No inbound edges recorded.</p>
            )}
          </Panel>

          <Panel eyebrow="Outbound edges" title="What this task influences">
            {detail.outboundEdges.length ? (
              <ul>
                {detail.outboundEdges.map((edge) => (
                  <li key={edge.id}>
                    {edge.type} to <span className="mono">{edge.toTaskId}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No outbound edges recorded.</p>
            )}
          </Panel>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
