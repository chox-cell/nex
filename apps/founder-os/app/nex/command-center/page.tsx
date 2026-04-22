import { nexRuntime, ensureNexSeed } from "../../../src/lib/nex-runtime";
import { 
  NextMovePanel, 
  TaskFocusPanel, 
  BlockerPanel, 
  ContextPanel, 
  MissionPanel 
} from "../../../src/components/command-center/CommandCenterPanels";
import { CommandStrip } from "../../../src/components/command-center/CommandStrip";

export default async function CommandCenterPage() {
  const seed = await ensureNexSeed();
  const summary = await nexRuntime.services.commandCenter.getCommandCenterSummary();
  if (!summary) {
    return <div>Initializing Command Center...</div>;
  }

  return (
    <div>
      <header className="route-header">
        <p className="route-kicker">Operating Core</p>
        <h1>Command Center</h1>
        <p className="route-copy">
          The operational cockpit for the founder. Real-time execution telemetry, strategic alignment, and high-velocity action triggers.
        </p>
      </header>

      <CommandStrip summary={summary} />

      {/* TIER 1: EXECUTION & URGENCY */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>
          Tier 1 // Execution & Urgency
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <NextMovePanel summary={summary} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <TaskFocusPanel summary={summary} />
              <BlockerPanel summary={summary} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             <Panel eyebrow="Proof of Truth" title="Last Verified Artifact" zone="truth">
                <div style={{ padding: '1rem', background: 'var(--bg-obsidian)', borderRadius: 'var(--radius-m)', border: '1px dashed var(--border-strong)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-silver)', marginBottom: '1rem' }}>
                    {summary.lastVerifiedProof || "Awaiting truth verification..."}
                  </p>
                  <button className="action-trigger" style={{ width: '100%' }}>INSPECT_TRUTH_LOG</button>
                </div>
             </Panel>
             <div style={{ padding: '1.5rem', background: 'var(--bronze-muted)', borderRadius: 'var(--radius-l)', border: '1px solid var(--bronze-glow)' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--bronze)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>FOUNDER_FOCUS</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-ivory)' }}>Eliminate execution noise and push to closure.</p>
             </div>
          </div>
        </div>
      </section>

      {/* TIER 2 & 3: CONTEXT & STRATEGY */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
        <section>
          <h2 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>
            Tier 2 // Execution Context
          </h2>
          <ContextPanel summary={summary} />
        </section>
        
        <section>
          <h2 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>
            Tier 3 // Strategic Alignment
          </h2>
          <MissionPanel summary={summary} />
        </section>
      </div>
    </div>
  );
}

/* --- Temporary Internal Panel for proof --- */
function Panel({ children, title, eyebrow, zone = "context" }: any) {
  const zoneClass = `zone-${zone}`;
  return (
    <div className={`panel ${zoneClass}`}>
      <div className="panel-header">
        {eyebrow && <span className="route-kicker" style={{ fontSize: '0.65rem', marginBottom: '0.25rem' }}>{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      <div className="panel-body">{children}</div>
    </div>
  );
}
