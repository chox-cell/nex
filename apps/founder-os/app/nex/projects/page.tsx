import Link from "next/link";
import { Panel } from "../../../src/components/panel";
import { StateBadge } from "../../../src/components/state-badge";
import { ensureNexSeed, nexRuntime } from "../../../src/lib/nex-runtime";

export default async function ProjectsPage() {
  const seed = await ensureNexSeed();
  const [projects, projections] = await Promise.all([
    nexRuntime.services.execution.listProjects(seed.workspaceId),
    nexRuntime.services.projections.listProjectProjectionsByWorkspace(seed.workspaceId),
  ]);

  return (
    <div>
      <header className="route-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="route-kicker">Execution Layer</p>
          <h1>Execution Board</h1>
          <p className="route-copy">
            Projects are the primary containers for strategic execution. They anchor the sprint hierarchy and provide the real-time truth signals used by the founder cockpit.
          </p>
        </div>
        <div style={{ marginTop: '2.5rem' }}>
           <button className="os-button">INITIALIZE_PROJECT</button>
        </div>
      </header>

      <Panel eyebrow="Execution Inventory" title="Canonical Projects" zone="context">
        {projects.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {projects.map((entry) => {
              const projection = projections.find((candidate) => candidate.projectId === entry.project.id);

              return (
                <Link key={entry.project.id} href={`/nex/projects/${entry.project.id}`} className="plan-card" style={{ borderLeft: '3px solid var(--border-strong)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-ivory)' }}>{entry.project.name || "Unnamed Project"}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-graphite)', marginTop: '0.25rem', lineHeight: '1.4' }}>{entry.project.summary || "No project summary provided."}</p>
                    </div>
                    <StateBadge status={entry.project.status} />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', margin: '1rem 0' }}>
                    <div>
                      <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Truth Progress</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--bronze)' }}>{projection?.progressScore.toFixed(1) ?? "0.0"}%</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Active Blockers</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 900, color: (projection?.blockerCount ?? 0) > 0 ? 'var(--danger)' : 'var(--text-silver)' }}>{projection?.blockerCount ?? 0}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {entry.sprintCount} SPRINTS // {entry.planCount} PLANS
                    </p>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: entry.project.riskLevel === 'HIGH' ? 'var(--danger)' : 'var(--text-graphite)', textTransform: 'uppercase' }}>
                      Risk: {entry.project.riskLevel || "LOW"}
                    </span>
                  </div>
                  
                  <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--bronze)', textTransform: 'uppercase' }}>OPEN_BOARD →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '5rem 0', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-xl)' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>No execution containers exist in the workspace.</p>
          </div>
        )}
      </Panel>
    </div>
  );
}
