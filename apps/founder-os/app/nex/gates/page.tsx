import Link from "next/link";
import { Panel } from "../../../src/components/panel";
import { StateBadge } from "../../../src/components/state-badge";
import { ensureNexSeed, nexRuntime } from "../../../src/lib/nex-runtime";

export default async function GatesPage() {
  const seed = await ensureNexSeed();
  const [taskProjections, sprintProjections, gateDecisions] = await Promise.all([
    nexRuntime.services.projections.listTaskProjectionsByWorkspace(seed.workspaceId),
    nexRuntime.services.projections.listSprintProjectionsByWorkspace(seed.workspaceId),
    nexRuntime.repositories.gates.listByWorkspace(seed.workspaceId),
  ]);

  const blockedTasks = taskProjections.filter((projection) => projection.blockers.length > 0 || projection.taskStatus === "FAIL");
  const blockedPhases = sprintProjections.flatMap((projection) =>
    projection.phaseProgress
      .filter((phase) => phase.blockedTaskIds.length > 0)
      .map((phase) => ({ sprintName: projection.sprintName, ...phase })),
  );

  return (
    <div>
      <header className="route-header">
        <p className="route-kicker">Risk Governance</p>
        <h1>Gates & Blockers</h1>
        <p className="route-copy">
          System governance ensures that forward movement stops when truth requirements are not met. Manage operational stalls and review the audit trail of gate decisions.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <Panel eyebrow="Execution Stalls" title="Active Task Blockers">
          {blockedTasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {blockedTasks.map((projection) => (
                <div key={projection.taskId} style={{ padding: '1.25rem', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid var(--danger)', borderRadius: 'var(--radius-l)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{projection.taskTitle || "Unnamed Task"}</h3>
                    <StateBadge status={projection.taskStatus} />
                  </div>
                  <ul style={{ paddingLeft: '1.25rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {projection.blockers.map((blocker) => (
                      <li key={blocker} style={{ marginBottom: '0.25rem' }}>{blocker}</li>
                    ))}
                  </ul>
                  <Link href={`/nex/tasks/${projection.taskId}`} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                    Inspect Task Runtime →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>All active tasks are currently clear.</p>
          )}
        </Panel>

        <Panel eyebrow="Cascading Impact" title="Blocked Phases">
          {blockedPhases.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {blockedPhases.map((phase) => (
                <div key={phase.phaseId} style={{ padding: '1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-l)' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{phase.sprintName}</p>
                  <p style={{ fontSize: '1rem', fontWeight: 600 }}>{phase.phaseName}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '0.5rem' }}>{phase.blockedTaskIds.length} dependent tasks are stalled.</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>No phase-level stalls projected.</p>
          )}
        </Panel>
      </div>

      <Panel eyebrow="Closure Trail" title="Gate Decisions">
        {gateDecisions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {gateDecisions.map((decision) => (
              <div key={decision.id} style={{ padding: '1.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-l)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{decision.gateType}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{decision.rationale}</p>
                  </div>
                  <StateBadge status={decision.decision} />
                </div>
                {decision.blockers.length > 0 && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-m)' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Resolved Blockers</p>
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {decision.blockers.map((blocker) => (
                        <li key={blocker}>{blocker}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>No gate closure decisions recorded.</p>
        )}
      </Panel>
    </div>
  );
}
