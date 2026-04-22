import { Panel } from "../panel";
import { StateBadge } from "../state-badge";

// Real interface from CommandCenterService
export interface CommandCenterSummary {
  mission: { title: string; objective: string; strategicFocus: string; };
  priorities: { title: string; status: string; rank: number; }[];
  project: { name: string; status: string; riskLevel: string; progressScore: number; progressSummary: string; } | null;
  sprint: { name: string; status: string; progressScore: number; phaseSummary: string; } | null;
  task: { name: string; status: string; blockerState: string; dependencySummary: string; } | null;
  ownerTool: { name: string; providerType: string; status: string; readiness: string; } | null;
  blockers: { text: string; context: string; }[];
  lastVerifiedProof: string | null;
  nextRequiredMove: { action: string; reason: string; };
}

interface PanelProps {
  summary: CommandCenterSummary;
}

export function NextMovePanel({ summary }: PanelProps) {
  return (
    <Panel eyebrow="Strategic Execution" title="Next Required Move" zone="action">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-ivory)', lineHeight: '1.5' }}>
          {summary.nextRequiredMove.action}
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-graphite)' }}>Strategic move derived from active execution state.</p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
           <button className="os-button" style={{ flex: 1 }}>EXECUTE_NOW</button>
           <button className="action-trigger" style={{ padding: '0.85rem' }}>DELEGATE</button>
        </div>
      </div>
    </Panel>
  );
}

export function TaskFocusPanel({ summary }: PanelProps) {
  const task = summary.task;
  if (!task) return null;

  return (
    <Panel eyebrow="Active Runtime" title="Current Focus" zone="action">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--bronze)' }}>{task.name.toUpperCase()}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-graphite)' }}>Status</span>
              <span style={{ fontWeight: 700 }}>{task.status}</span>
           </div>
           <p style={{ fontSize: '0.8rem', color: 'var(--text-silver)' }}>{task.dependencySummary}</p>
        </div>
      </div>
    </Panel>
  );
}

export function BlockerPanel({ summary }: PanelProps) {
  return (
    <Panel eyebrow="Operational Health" title="Active Blockers" zone="action">
      {summary.blockers.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {summary.blockers.map((blocker, i) => (
            <div key={i} style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid var(--danger)', borderRadius: 'var(--radius-m)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-ivory)', fontWeight: 500 }}>{blocker.text}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>{blocker.context}</p>
            </div>
          ))}
          <button className="os-button" style={{ background: 'var(--danger)', color: '#fff', marginTop: '0.5rem' }}>RESOLVE_ALL</button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p style={{ color: 'var(--text-graphite)', fontSize: '0.85rem' }}>No blockers detected in the execution spine.</p>
        </div>
      )}
    </Panel>
  );
}

export function ContextPanel({ summary }: PanelProps) {
  return (
    <Panel eyebrow="Execution Context" title="Active Envelope" zone="context">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Current Sprint</span>
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>{summary.sprint?.name || "N/A"}</p>
          {summary.sprint && <p style={{ fontSize: '0.8rem', color: 'var(--text-graphite)' }}>{summary.sprint.phaseSummary}</p>}
        </div>
        <div>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Active Project</span>
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>{summary.project?.name || "N/A"}</p>
          {summary.project && <p style={{ fontSize: '0.8rem', color: 'var(--text-graphite)' }}>{summary.project.progressSummary}</p>}
        </div>
        <div>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Owner Tool</span>
          <p style={{ fontSize: '0.9rem', color: 'var(--bronze)', fontWeight: 700 }}>
            {summary.ownerTool ? `${summary.ownerTool.name} [${summary.ownerTool.readiness}]` : "UNASSIGNED"}
          </p>
        </div>
      </div>
    </Panel>
  );
}

export function MissionPanel({ summary }: PanelProps) {
  return (
    <Panel eyebrow="Strategic Alignment" title="North Star" zone="strategy">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-silver)', lineHeight: '1.6', fontStyle: 'italic' }}>
          "{summary.mission.objective}"
        </p>
        <div style={{ padding: '1rem', background: 'var(--bg-obsidian)', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)' }}>
           <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-dim)', marginBottom: '0.5rem' }}>STRATEGIC_FOCUS</p>
           <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{summary.mission.strategicFocus}</p>
        </div>
      </div>
    </Panel>
  );
}
