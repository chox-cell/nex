import type { CommandCenterSummary } from "@nex/ssot";
import { StateBadge } from "../state-badge";

export function CommandStrip({ summary }: { summary: CommandCenterSummary }) {
  const progressScore = summary.sprint?.progressScore ?? summary.project?.progressScore ?? 0;

  return (
    <div className="cockpit-tier-1" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', marginBottom: '2rem' }}>
      <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2.5rem', background: 'var(--bg-graphite)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-l)' }}>
        <div style={{ display: 'flex', gap: '3rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>ACTIVE_TASK</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-ivory)' }}>{summary.task?.name || "Initializing Spine..."}</div>
          </div>
          <div style={{ width: '1px', background: 'var(--border)', height: '32px', alignSelf: 'center' }} />
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>TRUTH_VELOCITY</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--bronze)' }}>{progressScore.toFixed(1)}%</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>RUNTIME_STATE</div>
          <StateBadge status={summary.task?.status || "IDLE"} />
        </div>
      </div>

      <div className="panel" style={{ background: 'var(--bronze-muted)', border: '1px solid var(--bronze)', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRadius: 'var(--radius-l)' }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--bronze)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>REQUIRED_MOVE</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-ivory)', lineHeight: '1.4' }}>{summary.nextRequiredMove.action}</div>
      </div>
    </div>
  );
}
