import Link from "next/link";
import { notFound } from "next/navigation";

import { convertPlanToSprintAction, updatePlanAction } from "../../actions";
import { Panel } from "../../../../src/components/panel";
import { StateBadge } from "../../../../src/components/state-badge";
import { formatTimestamp } from "../../../../src/lib/format";
import { ensureNexSeed, nexRuntime } from "../../../../src/lib/nex-runtime";

interface PlanDetailPageProps {
  params: Promise<{ planId: string }>;
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  await ensureNexSeed();
  const { planId } = await params;

  try {
    const [detail, linkedSprints] = await Promise.all([
      nexRuntime.services.planning.getPlanDetail(planId),
      nexRuntime.repositories.sprints.listByPlan(planId),
    ]);

    return (
      <div className="page-grid">
        <header className="route-header">
          <div>
            <p className="route-kicker">Sprint 01 / Plan detail</p>
            <h1>{detail.plan.name}</h1>
            <p className="route-copy">{detail.plan.goal}</p>
          </div>
          <StateBadge status={detail.plan.status} />
        </header>

        <div className="form-grid-2">
          <Panel eyebrow="Strategic Update" title="Plan Snapshot">
            <form action={updatePlanAction} className="form-stack">
              <input name="planId" type="hidden" value={detail.plan.id} />
              
              <div className="input-group">
                <label className="input-label">Identification</label>
                <input className="os-input" defaultValue={detail.plan.name} name="name" required />
              </div>

              <div className="input-group">
                <label className="input-label">Primary Objective</label>
                <textarea 
                  className="os-textarea" 
                  defaultValue={detail.plan.goal} 
                  name="goal" 
                  style={{ minHeight: '120px' }}
                  required 
                />
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Governance State</label>
                  <select className="os-select" defaultValue={detail.plan.status} name="status" required>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Revision Rationale</label>
                  <input className="os-input" name="changeReason" placeholder="Rationale for this snapshot..." required />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="os-button" type="submit" style={{ width: '220px' }}>
                  APPEND_VERSION
                </button>
              </div>
            </form>
          </Panel>

          <Panel eyebrow="Strategic Shift" title="Execution Conversion">
            <p style={{ fontSize: '0.9rem', color: 'var(--text-graphite)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Converting this blueprint will instantiate a live sprint within the execution layer. 
              Sections are mapped to phases, and actions are converted to truth-tracked tasks.
            </p>
            <form action={convertPlanToSprintAction}>
              <input name="planId" type="hidden" value={detail.plan.id} />
              <button className="os-button" type="submit" style={{ width: '100%', background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--text-silver)' }}>
                INITIATE_CONVERSION
              </button>
            </form>

            <div style={{ marginTop: '2rem' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '1rem' }}>Linked Sprints</p>
              {linkedSprints.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {linkedSprints.map((sprint) => (
                    <Link 
                      key={sprint.id}
                      href={`/nex/sprints/${sprint.id}`} 
                      className="plan-card" 
                      style={{ padding: '1rem 1.25rem', borderLeft: '3px solid var(--success)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sprint.name}</span>
                        <StateBadge status={sprint.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '2rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-l)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>No sprints instantiated from this blueprint.</p>
                </div>
              )}
            </div>
          </Panel>
        </div>

        <div className="form-grid-2" style={{ marginTop: '2rem' }}>
          <Panel eyebrow="Strategic Spine" title="Sections & Actions">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {detail.sections.map(({ section, actions }) => (
                <div key={section.id} className="plan-card" style={{ padding: '1.5rem' }}>
                  <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-ivory)' }}>
                        {section.position}. {section.title}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-graphite)', marginTop: '0.25rem' }}>{section.intent}</p>
                    </div>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', fontWeight: 700 }}>
                      {actions.length} ACTIONS
                    </span>
                  </header>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {actions.map((action) => (
                      <div key={action.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.5rem 0', borderTop: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-silver)' }}>{action.title}</span>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>W:{action.priorityWeight} // {action.ownerRef}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Audit Trail" title="Immutable History">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {detail.versions.map((version) => (
                <div key={version.id} className="plan-card" style={{ padding: '1.5rem', borderLeft: '3px solid var(--border)' }}>
                  <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>SNAPSHOT_v{version.versionNumber}</h3>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                      {formatTimestamp(version.createdAt).toUpperCase()}
                    </span>
                  </header>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-silver)', lineHeight: '1.5' }}>{version.changeReason}</p>
                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    PERSISTED_BY: {version.createdBy.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}

