import Link from "next/link";
import { Panel } from "../../../src/components/panel";
import { formatTimestamp } from "../../../src/lib/format";
import { ensureNexSeed, nexRuntime } from "../../../src/lib/nex-runtime";

export default async function SnapshotsPage() {
  const seed = await ensureNexSeed();
  const snapshots = await nexRuntime.repositories.snapshots.listByWorkspace(seed.workspaceId);

  return (
    <div>
      <header className="route-header">
        <p className="route-kicker">State Governance</p>
        <h1>Snapshots</h1>
        <p className="route-copy">
          Canonical state recovery points. Task snapshots capture both the raw configuration and the associated truth projections, ensuring that no operational state is lost during pivot or execution.
        </p>
      </header>

      <Panel eyebrow="Snapshot Repository" title="Saved Recovery Points">
        {snapshots.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {snapshots.map((snapshot) => (
              <div key={snapshot.id} style={{ padding: '1.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-l)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{snapshot.label || "Unnamed Snapshot"}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{snapshot.summary}</p>
                  </div>
                  <p style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{formatTimestamp(snapshot.createdAt)}</p>
                </div>
                
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-m)', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Snapshot Scope</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{snapshot.scopeType} / {snapshot.scopeId}</p>
                </div>

                {snapshot.taskId && (
                  <Link href={`/nex/tasks/${snapshot.taskId}`} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                    Inspect Source Task →
                  </Link>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>No state recovery points recorded in the archive.</p>
        )}
      </Panel>
    </div>
  );
}
