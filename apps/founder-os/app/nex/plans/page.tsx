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
    <div className="page-grid">
      <header className="route-header">
        <div>
          <p className="route-kicker">Sprint 01 / Planning layer</p>
          <h1>Plan Center</h1>
          <p className="route-copy">
            Plans are first-class versioned objects. Every create or update path writes a snapshot trail before Sprint 01 moves on.
          </p>
        </div>
      </header>

      <div className="page-grid two">
        <Panel eyebrow="Create plan" title="Open a new versioned plan" description="The create flow captures enough structure for later plan-to-sprint conversion.">
          <form action={createPlanAction} className="form-stack">
            <div className="form-grid">
              <label>
                Plan name
                <input className="input" name="name" placeholder="NEX Founder OS Sprint 02" required />
              </label>
              <label>
                Project
                <select className="select" name="projectId" required>
                  {projects.map((entry) => (
                    <option key={entry.project.id} value={entry.project.id}>
                      {entry.project.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Goal
              <textarea className="textarea" name="goal" placeholder="Describe the execution outcome this plan must create." required />
            </label>
            <div className="form-grid">
              <label>
                First section
                <input className="input" name="sectionTitle" placeholder="Memory + Truth Spine" required />
              </label>
              <label>
                First action
                <input className="input" name="actionTitle" placeholder="Create event and evidence models" required />
              </label>
            </div>
            <div className="actions-row">
              <button className="button" type="submit">
                Create plan
              </button>
            </div>
          </form>
        </Panel>

        <Panel eyebrow="Versioning law" title="Plan rules">
          <div className="stack-list">
            <article className="stack-card">
              <h3>No plan without version trail</h3>
              <p>Each plan creates version 1 on insert and appends another version whenever the update flow runs.</p>
            </article>
            <article className="stack-card">
              <h3>No conversion without structure</h3>
              <p>Plan-to-sprint flow requires at least one section and one action so the sprint graph is derived from real planning state.</p>
            </article>
            <article className="stack-card">
              <h3>No orphan project linkage</h3>
              <p>Every plan binds to the founder workspace and may attach to a project before it can be converted into execution.</p>
            </article>
          </div>
        </Panel>
      </div>

      <Panel eyebrow="Canonical plans" title="Versioned plan inventory">
        <div className="link-list">
          {plans.map((detail) => (
            <Link className="link-card" href={`/nex/plans/${detail.plan.id}`} key={detail.plan.id}>
              <div className="split-header">
                <div>
                  <h3>{detail.plan.name}</h3>
                  <p>{detail.plan.goal}</p>
                </div>
                <StateBadge status={detail.plan.status} />
              </div>
              <p className="muted-text mono">
                {detail.versions.length} versions • {detail.sections.length} sections • updated {formatTimestamp(detail.plan.updatedAt)}
              </p>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}

