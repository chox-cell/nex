import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel } from "../../../../src/components/panel";
import { StateBadge } from "../../../../src/components/state-badge";
import { ensureNexSeed, nexRuntime } from "../../../../src/lib/nex-runtime";

interface ProjectDetailPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  await ensureNexSeed();
  const { projectId } = await params;

  try {
    const detail = await nexRuntime.services.execution.getProjectDetail(projectId);

    return (
      <div>
        <header className="route-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="route-kicker">Execution Architecture</p>
            <h1>{detail.project.name}</h1>
            <p className="route-copy">{detail.project.summary || "No project summary provided."}</p>
          </div>
          <div style={{ marginTop: '2.5rem' }}>
            <StateBadge status={detail.project.status} />
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
          <Panel eyebrow="Execution Focus" title="Active Sprint">
            {detail.activeSprint ? (
              <div style={{ padding: '1.5rem', background: 'var(--bronze-muted)', border: '1px solid var(--bronze)', borderRadius: 'var(--radius-l)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-ivory)' }}>{detail.activeSprint.name}</h3>
                  <StateBadge status={detail.activeSprint.status} />
                </div>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-silver)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                  {detail.activeSprint.goal}
                </p>
                <Link href={`/nex/sprints/${detail.activeSprint.id}`} style={{ display: 'block', textAlign: 'center', padding: '0.75rem', background: 'var(--bronze)', color: '#000', fontWeight: 800, borderRadius: 'var(--radius-m)', textDecoration: 'none', fontSize: '0.85rem' }}>
                  ENTER_SPRINT_RUNTIME
                </Link>
              </div>
            ) : (
              <div style={{ padding: '3rem 0', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-l)' }}>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>No active sprint currently driving this project.</p>
              </div>
            )}
          </Panel>

          <Panel eyebrow="Strategic Governance" title="Project Identity">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Risk Level</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: detail.project.riskLevel === 'HIGH' ? 'var(--danger)' : 'var(--text-ivory)' }}>{detail.project.riskLevel || "LOW"}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>System Slug</p>
                <p style={{ fontSize: '0.9rem', fontFamily: 'var(--font-mono)', color: 'var(--text-silver)' }}>{detail.project.slug}</p>
              </div>
            </div>
            
            <div style={{ marginTop: '2rem' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Linked Plan Blueprints</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {detail.planIds.length > 0 ? detail.planIds.map(id => (
                  <Link key={id} href={`/nex/plans/${id}`} style={{ padding: '0.4rem 0.75rem', background: 'var(--bg-obsidian)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--bronze)' }}>
                    {id.slice(0, 8)}
                  </Link>
                )) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>No blueprints linked.</p>
                )}
              </div>
            </div>
          </Panel>
        </div>

        <Panel eyebrow="Historical Ledger" title="Sprint Archive">
          {detail.sprints.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {detail.sprints.map((sprint) => (
                <Link key={sprint.id} href={`/nex/sprints/${sprint.id}`} style={{ padding: '1.25rem', background: 'var(--bg-graphite)', border: '1px solid var(--border)', borderRadius: 'var(--radius-l)', display: 'block', transition: 'all 200ms ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-ivory)' }}>{sprint.name}</h3>
                    <StateBadge status={sprint.status} />
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-silver)', lineHeight: '1.4' }}>{sprint.goal}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '3rem 0' }}>No historical sprints recorded for this project.</p>
          )}
        </Panel>
      </div>
    );
  } catch {
    notFound();
  }
}
