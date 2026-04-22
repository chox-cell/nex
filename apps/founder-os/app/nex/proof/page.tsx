import Link from "next/link";
import { Panel } from "../../../src/components/panel";
import { StateBadge } from "../../../src/components/state-badge";
import { formatTimestamp } from "../../../src/lib/format";
import { ensureNexSeed, nexRuntime } from "../../../src/lib/nex-runtime";

export default async function ProofPage() {
  const seed = await ensureNexSeed();
  const [evidence, verifications, repoReferences, terminalReferences] = await Promise.all([
    nexRuntime.repositories.evidence.listByWorkspace(seed.workspaceId),
    nexRuntime.repositories.verifications.listByWorkspace(seed.workspaceId),
    nexRuntime.services.repoReferences.listByWorkspace(seed.workspaceId),
    nexRuntime.services.terminalReferences.listByWorkspace(seed.workspaceId),
  ]);
  const evidenceById = new Map(evidence.map((record) => [record.id, record]));

  return (
    <div>
      <header className="route-header">
        <p className="route-kicker">Truth Infrastructure</p>
        <h1>Proof Vault</h1>
        <p className="route-copy">
          Canonical evidence and verification records. The proof vault anchors operational truth by linking raw execution artifacts (Repo, Terminal) to formal verification claims.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
        {[
          { label: "Evidence Records", value: evidence.length },
          { label: "Formal Checks", value: verifications.length },
          { label: "Repo Truth", value: repoReferences.length },
          { label: "Terminal Truth", value: terminalReferences.length },
        ].map((stat) => (
          <div key={stat.label} style={{ padding: '1.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-l)' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{stat.label}</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <Panel eyebrow="Evidence Layer" title="Canonical Artifacts">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {evidence.map((record) => (
              <div key={record.id} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-l)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{record.title || "Unnamed Artifact"}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{record.summary}</p>
                  </div>
                  <StateBadge status={record.evidenceType} />
                </div>
                <div style={{ padding: '0.75rem', background: 'var(--bg-soft)', borderRadius: 'var(--radius-m)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                  {record.content}
                </div>
                {record.taskId && (
                  <Link href={`/nex/tasks/${record.taskId}`} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                    Open Task Runtime →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Verification Layer" title="Formal Truth Checks">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {verifications.map((record) => (
              <div key={record.id} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-l)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{record.verificationType}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{record.summary}</p>
                  </div>
                  <StateBadge status={record.status} />
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '0.75rem' }}>{record.detail}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{formatTimestamp(record.createdAt)}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <Panel eyebrow="Source Truth" title="Repo References">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {repoReferences.map((record) => (
              <div key={record.id} style={{ padding: '1.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-l)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{record.repoLabel}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{formatTimestamp(record.createdAt)}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8rem' }}>
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem' }}>Branch</p>
                    <p>{record.branchName || "Main"}</p>
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem' }}>Ref</p>
                    <p style={{ fontFamily: 'var(--font-mono)' }}>{record.gitRef?.slice(0, 7) || "None"}</p>
                  </div>
                </div>
                {record.note && <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{record.note}</p>}
              </div>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Execution Truth" title="Terminal References">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {terminalReferences.map((record) => (
              <div key={record.id} style={{ padding: '1.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-l)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{record.commandSummary}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{formatTimestamp(record.executedAt)}</p>
                </div>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-m)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  {record.commands.join(" && ")}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{record.summary}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
