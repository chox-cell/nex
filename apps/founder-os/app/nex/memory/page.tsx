import Link from "next/link";
import { Panel } from "../../../src/components/panel";
import { StateBadge } from "../../../src/components/state-badge";
import { formatTimestamp } from "../../../src/lib/format";
import { ensureNexSeed, nexRuntime } from "../../../src/lib/nex-runtime";

export default async function MemoryPage() {
  const seed = await ensureNexSeed();
  const [events, packets, patterns, sprintProjections] = await Promise.all([
    nexRuntime.repositories.events.listByWorkspace(seed.workspaceId),
    nexRuntime.repositories.resumePackets.listByWorkspace(seed.workspaceId),
    nexRuntime.repositories.patterns.listOpenByWorkspace(seed.workspaceId),
    nexRuntime.services.projections.listSprintProjectionsByWorkspace(seed.workspaceId),
  ]);

  return (
    <div>
      <header className="route-header">
        <p className="route-kicker">Canonical Timeline</p>
        <h1>Memory Timeline</h1>
        <p className="route-copy">
          The persistent record of all execution events, resume packets, and behavioral patterns. NEX ensures that operational context remains stable across sessions and execution phases.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <Panel eyebrow="State Recovery" title="Active Resume Packets">
          {packets.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {packets.map((packet) => (
                <div key={packet.id} style={{ padding: '1.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-l)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{packet.scopeType}</p>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{packet.currentTask || packet.currentObjective || "Unnamed Scope"}</h3>
                    </div>
                    <StateBadge status={packet.currentState} />
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{packet.nextRequiredAction}</p>
                  {packet.blockers.length > 0 && (
                    <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-m)', border: '1px solid var(--danger)' }}>
                      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Recovery Blockers</p>
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {packet.blockers.map((blocker) => (
                          <li key={blocker}>{blocker}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>No active resume packets recorded.</p>
          )}
        </Panel>

        <Panel eyebrow="Behavioral Analysis" title="Open Patterns">
          {patterns.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {patterns.map((pattern) => (
                <div key={pattern.id} style={{ padding: '1.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-l)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{pattern.patternType}</h3>
                    <span className="badge badge-muted">{pattern.occurrenceCount} Occurrences</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{pattern.summary}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>No recurring drift or stall patterns detected.</p>
          )}
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem' }}>
        <Panel eyebrow="Execution Stream" title="Event Store">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {events.slice(0, 20).map((event) => (
              <div key={event.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{event.summary}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{event.eventType} • {event.actorRef}</p>
                </div>
                <p style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{formatTimestamp(event.createdAt)}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Projection History" title="Sprint Truth">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sprintProjections.map((projection) => (
              <div key={projection.sprintId} style={{ padding: '1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-l)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{projection.sprintName}</h3>
                  <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent)' }}>{projection.progressScore.toFixed(1)}%</p>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{projection.nextRequiredAction}</p>
                {projection.currentTaskId && (
                  <Link href={`/nex/tasks/${projection.currentTaskId}`} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                    Open Current Task →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
