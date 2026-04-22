import Link from "next/link";
import { createPlanAction } from "../actions";
import { Panel } from "../../../src/components/panel";
import { StateBadge } from "../../../src/components/state-badge";
import { formatTimestamp } from "../../../src/lib/format";
import { ensureNexSeed, nexRuntime } from "../../../src/lib/nex-runtime";

export default async function PlansPage() {
  const seed = await ensureNexSeed();
  const [plans, projects] = await Promise.all([
    nexRuntime.services.planning.listPlans(seed.workspaceId),
    nexRuntime.services.execution.listProjects(seed.workspaceId),
  ]);

  return (
    <div>
      <header className="route-header">
        <p className="route-kicker">Strategic Governance</p>
        <h1>Plan Center</h1>
        <p className="route-copy">
          Versioned execution blueprints. Plans capture strategic intent as immutable snapshots before conversion into live sprints.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', marginBottom: '3rem' }}>
        <Panel eyebrow="Strategic Architecture" title="Initialize New Plan">
          <form action={createPlanAction} className="form-stack">
            <div className="form-grid-2">
              <div className="input-group">
                <label className="input-label">Identification</label>
                <input className="os-input" name="name" placeholder="e.g. Q3 Growth Strategy" required />
              </div>
              <div className="input-group">
                <label className="input-label">Execution Linkage</label>
                <select className="os-select" name="projectId" required>
                  {projects.map((entry) => (
                    <option key={entry.project.id} value={entry.project.id}>
                      {entry.project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Core Objective</label>
              <textarea 
                className="os-textarea" 
                name="goal" 
                placeholder="Define the primary truth outcome this plan must achieve." 
                style={{ minHeight: '100px', fontSize: '1.1rem', fontWeight: 500 }} 
                required 
              />
            </div>

            <div className="form-grid-2">
              <div className="input-group">
                <label className="input-label">Initial Phase</label>
                <input className="os-input" name="sectionTitle" placeholder="e.g. Infrastructure" required />
              </div>
              <div className="input-group">
                <label className="input-label">First Action</label>
                <input className="os-input" name="actionTitle" placeholder="e.g. Resource provisioning" required />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="os-button" type="submit" style={{ width: '200px' }}>
                BOOTSTRAP_PLAN
              </button>
            </div>
          </form>
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Panel eyebrow="Versioning Law" title="Governance Rules">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-ivory)', marginBottom: '0.25rem' }}>IMMUTABLE_SNAPSHOTS</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-graphite)', lineHeight: '1.5' }}>
                  Strategic updates create new versions. NEX maintains a perfect trail of every pivot.
                </p>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--bronze-muted)', border: '1px solid var(--bronze)', borderRadius: 'var(--radius-m)' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--bronze)', marginBottom: '0.25rem' }}>CONVERSION_READY</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-silver)', lineHeight: '1.4' }}>
                  Plans require a goal and first action before conversion to live sprints.
                </p>
              </div>
            </div>
          </Panel>
          
          <div style={{ padding: '1.25rem', background: 'var(--bg-graphite)', borderRadius: 'var(--radius-l)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '1rem' }}>PLANNING_METRICS</p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '1.2rem', fontWeight: 800 }}>{plans.length}</p>
                <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>TOTAL_BLUEPRINTS</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 800 }}>{plans.filter(p => p.plan.status === 'ACTIVE').length}</p>
                <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>ACTIVE_DRAFTS</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>
          Canonical Blueprint Inventory
        </h2>
        {plans.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {plans.map((detail) => (
              <Link key={detail.plan.id} href={`/nex/plans/${detail.plan.id}`} className="plan-card" style={{ borderLeft: '3px solid var(--border)' }}>
                <div className="plan-card-header">
                  <div>
                    <h3 className="plan-card-title">{detail.plan.name}</h3>
                    <span className="plan-card-meta">VERSION_{detail.versions.length}</span>
                  </div>
                  <StateBadge status={detail.plan.status} />
                </div>
                
                <p className="plan-card-body" style={{ minHeight: '4.5rem' }}>{detail.plan.goal || "No strategic objective defined."}</p>
                
                <div className="plan-card-footer">
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    UPDATED_{formatTimestamp(detail.plan.updatedAt).toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--bronze)', textTransform: 'uppercase' }}>
                    INSPECT_PLAN →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ padding: '5rem 0', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-xl)' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>No blueprints recorded in the strategic layer.</p>
          </div>
        )}
      </div>
    </div>
  );
}
