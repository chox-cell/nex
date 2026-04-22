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
      <div>
        <header className="route-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="route-kicker">Task Runtime</p>
            <h1>{detail.task.title}</h1>
            <p className="route-copy">{detail.task.objective}</p>
          </div>
          <div style={{ marginTop: '2.5rem' }}>
            <StateBadge status={detail.task.status} />
          </div>
        </header>

        {/* TIER 1: EXECUTION FOCUS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5fr', marginBottom: '2.5rem' }}>
          <Panel eyebrow="Strategic Action" title="Next Required Move">
            <div style={{ padding: '1.5rem', background: 'var(--bronze-muted)', border: '1px solid var(--bronze)', borderRadius: 'var(--radius-l)' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-ivory)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                {taskProjection.nextRequiredAction}
              </p>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <form action={transitionTaskAction} style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                  <input name="taskId" type="hidden" value={detail.task.id} />
                  <select className="os-select" name="nextStatus" required style={{ flex: 1 }}>
                    {availableTransitions.map((status) => (
                      <option key={status} value={status}>{status.toUpperCase()}</option>
                    ))}
                  </select>
                  <button className="os-button" type="submit" disabled={!availableTransitions.length}>
                    Transition
                  </button>
                </form>
              </div>
            </div>
          </Panel>

          <Panel eyebrow="Operational Health" title="Status & Blockers">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-graphite)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Progress Score</span>
                <span style={{ fontWeight: 800, color: 'var(--bronze)' }}>{taskProjection.progressScore}%</span>
              </div>
              {taskProjection.blockers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {taskProjection.blockers.map((blocker) => (
                    <div key={blocker} style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid var(--danger)', borderRadius: 'var(--radius-m)', fontSize: '0.85rem' }}>
                      {blocker}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-m)', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  No active blockers detected.
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* TIER 2: TRUTH & PROOF */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <Panel eyebrow="Evidence" title="Artifact Ledger">
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                 <span style={{ color: 'var(--text-graphite)' }}>Count</span>
                 <span style={{ fontWeight: 600 }}>{taskProjection.evidenceCount}</span>
               </div>
               <form action={attachEvidenceAction} className="form-stack">
                 <input name="taskId" type="hidden" value={detail.task.id} />
                 <input className="os-input" name="title" placeholder="Evidence Title" required />
                 <textarea className="os-textarea" name="content" placeholder="Paste evidence content..." style={{ minHeight: '80px' }} required />
                 <button className="os-button" style={{ width: '100%', padding: '0.5rem' }} type="submit">Attach Evidence</button>
               </form>
             </div>
          </Panel>

          <Panel eyebrow="Verification" title="Formal Checks">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                 <div className="badge badge-done" style={{ textAlign: 'center' }}>{taskProjection.verificationSummary.passCount} PASS</div>
                 <div className="badge badge-fail" style={{ textAlign: 'center' }}>{taskProjection.verificationSummary.failCount} FAIL</div>
               </div>
               <form action={recordVerificationAction} className="form-stack">
                 <input name="taskId" type="hidden" value={detail.task.id} />
                 <select className="os-select" name="status" required>
                   <option value="PASS">PASS</option>
                   <option value="FAIL">FAIL</option>
                   <option value="WARNING">WARNING</option>
                 </select>
                 <input className="os-input" name="summary" placeholder="Verification Summary" required />
                 <button className="os-button" style={{ width: '100%', padding: '0.5rem' }} type="submit">Log Verification</button>
               </form>
            </div>
          </Panel>

          <Panel eyebrow="Governance" title="Gate Decision">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               <div style={{ padding: '0.75rem', background: 'var(--bg-obsidian)', borderRadius: 'var(--radius-m)', textAlign: 'center' }}>
                 <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Current Gate</span>
                 <StateBadge status={taskProjection.latestGateDecision || "OPEN"} />
               </div>
               <form action={decideGateAction} className="form-stack">
                 <input name="taskId" type="hidden" value={detail.task.id} />
                 <select className="os-select" name="decision" required>
                   <option value="PASS">PASS</option>
                   <option value="FAIL">FAIL</option>
                 </select>
                 <textarea className="os-textarea" name="rationale" placeholder="Decision rationale..." style={{ minHeight: '80px' }} required />
                 <button className="os-button" style={{ width: '100%', padding: '0.5rem' }} type="submit">Record Decision</button>
               </form>
            </div>
          </Panel>
        </div>

        {/* TIER 3: RUNTIME CONNECTORS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <Panel eyebrow="Automation" title="Codex Connector">
             {codexPacket ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div style={{ padding: '1rem', background: 'var(--bg-graphite)', borderRadius: 'var(--radius-l)', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--bronze)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Packet Preview</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{codexPacket.objective}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-graphite)', marginTop: '0.5rem' }}>Target: {detail.task.ownerRef}</p>
                 </div>
                 <form action={recordCodexResultAction} className="form-stack">
                    <input name="taskId" type="hidden" value={detail.task.id} />
                    <input className="os-input" name="codexOutcome" placeholder="Outcome (e.g. success, blocked)" required />
                    <textarea className="os-textarea" name="codexSummary" placeholder="Codex result summary..." required />
                    <button className="os-button" type="submit">Normalize Result</button>
                 </form>
               </div>
             ) : (
               <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '2rem 0' }}>Codex provider not linked.</p>
             )}
          </Panel>

          <Panel eyebrow="Infrastructure" title="Source Truth">
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                 <div style={{ padding: '1rem', background: 'var(--bg-graphite)', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)' }}>
                   <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Repo Refs</p>
                   <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{repoReferences.length}</p>
                 </div>
                 <div style={{ padding: '1rem', background: 'var(--bg-graphite)', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)' }}>
                   <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Terminal Logs</p>
                   <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{terminalReferences.length}</p>
                 </div>
               </div>
               <form action={recordRepoReferenceAction} className="form-stack">
                 <input name="taskId" type="hidden" value={detail.task.id} />
                 {repoProvider && <input name="repoProviderId" type="hidden" value={repoProvider.id} />}
                 <input className="os-input" name="repoLabel" placeholder="Repo Label (e.g. founder-os)" required />
                 <textarea className="os-textarea" name="repoSummary" placeholder="Diff summary or branch context..." required />
                 <button className="os-button" type="submit">Log Repo Reference</button>
               </form>
             </div>
          </Panel>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Task detail load error:", error);
    notFound();
  }
}
