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

        <div className="page-grid two">
          <Panel eyebrow="Update plan" title="Append a new version snapshot">
            <form action={updatePlanAction} className="form-stack">
              <input name="planId" type="hidden" value={detail.plan.id} />
              <label>
                Plan name
                <input className="input" defaultValue={detail.plan.name} name="name" required />
              </label>
              <label>
                Goal
                <textarea className="textarea" defaultValue={detail.plan.goal} name="goal" required />
              </label>
              <div className="form-grid">
                <label>
                  Status
                  <select className="select" defaultValue={detail.plan.status} name="status" required>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </label>
                <label>
                  Change reason
                  <input className="input" name="changeReason" placeholder="Why is this plan changing?" required />
                </label>
              </div>
              <div className="actions-row">
                <button className="button" type="submit">
                  Append version
                </button>
              </div>
            </form>
          </Panel>

          <Panel eyebrow="Plan conversion" title="Move strategy into execution">
            <p>
              Conversion creates a sprint under the linked project, derives phases from plan sections, derives tasks from plan actions, and
              records dependency edges from action order.
            </p>
            <form action={convertPlanToSprintAction}>
              <input name="planId" type="hidden" value={detail.plan.id} />
              <div className="actions-row">
                <button className="button" type="submit">
                  Convert plan to sprint
                </button>
              </div>
            </form>
            {linkedSprints.length ? (
              <div className="link-list">
                {linkedSprints.map((sprint) => (
                  <Link className="link-card" href={`/nex/sprints/${sprint.id}`} key={sprint.id}>
                    {sprint.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="empty-state">No sprint has been derived from this plan yet.</p>
            )}
          </Panel>
        </div>

        <div className="page-grid two">
          <Panel eyebrow="Plan structure" title="Sections and actions">
            <div className="stack-list">
              {detail.sections.map(({ section, actions }) => (
                <article className="stack-card" key={section.id}>
                  <header>
                    <div>
                      <h3>
                        {section.position}. {section.title}
                      </h3>
                      <p>{section.intent}</p>
                    </div>
                    <span className="mono">{actions.length} actions</span>
                  </header>
                  <ul>
                    {actions.map((action) => (
                      <li key={action.id}>
                        {action.title} · owner {action.ownerRef} · weight {action.priorityWeight}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Version history" title="Append-only snapshots">
            <div className="version-list">
              {detail.versions.map((version) => (
                <article className="stack-card" key={version.id}>
                  <header>
                    <div>
                      <h3>Version {version.versionNumber}</h3>
                      <p>{version.changeReason}</p>
                    </div>
                    <span className="mono">{formatTimestamp(version.createdAt)}</span>
                  </header>
                  <p className="muted-text">Created by {version.createdBy}. Snapshot contains plan, sections, and actions.</p>
                </article>
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

