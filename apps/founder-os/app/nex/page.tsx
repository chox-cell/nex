import Link from "next/link";

import { Panel } from "../../src/components/panel";
import { StateBadge } from "../../src/components/state-badge";
import { ensureNexSeed, nexRuntime } from "../../src/lib/nex-runtime";

export default async function NexWorkspacePage() {
  await ensureNexSeed();

  const [mission, toolRegistry] = await Promise.all([
    nexRuntime.services.mission.getFounderSummary(),
    nexRuntime.services.tools.getFounderRegistrySummary(),
  ]);

  if (!mission) {
    throw new Error("Founder workspace seed failed.");
  }

  const projects = await nexRuntime.services.execution.listProjects(mission.workspace.id);
  const activeProject = projects.find((entry) => entry.project.status === "ACTIVE") ?? projects[0] ?? null;
  const activeSprint = activeProject?.project.currentSprintId
    ? await nexRuntime.repositories.sprints.getById(activeProject.project.currentSprintId)
    : null;
  const sprintDetail = activeSprint ? await nexRuntime.services.execution.getSprintDetail(activeSprint.id) : null;
  const sprintProjection = activeSprint ? await nexRuntime.services.projections.refreshSprintProjection(activeSprint.id) : null;
  const currentTask =
    sprintDetail?.phases.flatMap((phase) => phase.tasks).find((task) => task.status !== "DONE" && task.status !== "FAIL") ?? null;
  const currentTaskPacket = currentTask ? await nexRuntime.services.resumePackets.getTaskPacket(currentTask.id) : null;

  return (
    <div className="page-grid">
      <header className="route-header">
        <div>
          <p className="route-kicker">Founder workspace</p>
          <h1>NEX Founder Workspace</h1>
          <p className="route-copy">
            Mission, execution, memory, truth, and the tool registry now read from the same canonical founder workspace. This surface remains
            grounded in persisted state, not chat memory or mocked control widgets.
          </p>
        </div>
      </header>

      <section className="metric-grid">
        <article className="metric-card">
          <span className="panel-eyebrow">Strategic priorities</span>
          <strong>{mission.priorities.length}</strong>
          <p>Ranked priorities persisted under the founder workspace.</p>
        </article>
        <article className="metric-card">
          <span className="panel-eyebrow">Plans</span>
          <strong>{(await nexRuntime.repositories.plans.listByWorkspace(mission.workspace.id)).length}</strong>
          <p>Versioned plans available for conversion to execution.</p>
        </article>
        <article className="metric-card">
          <span className="panel-eyebrow">Projects</span>
          <strong>{projects.length}</strong>
          <p>Execution containers currently tracked inside NEX.</p>
        </article>
        <article className="metric-card">
          <span className="panel-eyebrow">Tool providers</span>
          <strong>{toolRegistry?.providers.length ?? 0}</strong>
          <p>Seeded founder work surfaces now tracked inside NEX.</p>
        </article>
      </section>

      <div className="page-grid two">
        <Panel
          eyebrow="Mission layer"
          title={mission.workspace.name}
          description="Founder workspace persists operational truth and anchors every plan and execution object."
        >
          <dl className="detail-list">
            <div>
              <dt>Workspace slug</dt>
              <dd className="mono">{mission.workspace.slug}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StateBadge status={mission.workspace.status} />
              </dd>
            </div>
            <div>
              <dt>Timezone</dt>
              <dd>{mission.workspace.timezone}</dd>
            </div>
            <div>
              <dt>Active vision</dt>
              <dd>{mission.vision?.title ?? "No active vision"}</dd>
            </div>
          </dl>
        </Panel>

        <Panel eyebrow="Current execution" title={activeProject?.project.name ?? "No active project"} description="Current operational focus projected from the execution spine.">
          {activeProject ? (
            <dl className="detail-list">
              <div>
                <dt>Project status</dt>
                <dd>
                  <StateBadge status={activeProject.project.status} />
                </dd>
              </div>
              <div>
                <dt>Active sprint</dt>
                <dd>{activeSprint?.name ?? "No sprint linked yet"}</dd>
              </div>
              <div>
                <dt>Current task</dt>
                <dd>{currentTask?.title ?? "No active task found"}</dd>
              </div>
              <div>
                <dt>Next move</dt>
                <dd>{currentTaskPacket?.nextRequiredAction ?? sprintProjection?.nextRequiredAction ?? "Convert a plan into a sprint."}</dd>
              </div>
              <div>
                <dt>Truth progress</dt>
                <dd>{sprintProjection ? `${sprintProjection.progressScore.toFixed(2)}%` : "No projection yet"}</dd>
              </div>
              <div>
                <dt>Last proof</dt>
                <dd>{sprintProjection?.lastProof ?? "No proof attached yet"}</dd>
              </div>
            </dl>
          ) : (
            <p className="empty-state">No active project is available yet.</p>
          )}
        </Panel>
      </div>

      <div className="page-grid two">
        <Panel eyebrow="Strategic priorities" title="Ranked founder priorities">
          <div className="stack-list">
            {mission.priorities.map((priority) => (
              <article className="stack-card" key={priority.id}>
                <header>
                  <div>
                    <h3>
                      {priority.rank}. {priority.title}
                    </h3>
                    <p>{priority.rationale}</p>
                  </div>
                  <StateBadge status={priority.status} />
                </header>
              </article>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Objectives + decisions" title="Mission control context">
          <div className="stack-list">
            {mission.objectives.map((objective) => (
              <article className="stack-card" key={objective.id}>
                <header>
                  <div>
                    <h3>{objective.title}</h3>
                    <p>{objective.targetOutcome}</p>
                  </div>
                  <StateBadge status={objective.status} />
                </header>
              </article>
            ))}
            {mission.decisions.map((decision) => (
              <article className="stack-card" key={decision.id}>
                <header>
                  <div>
                    <h3>{decision.title}</h3>
                    <p>{decision.summary}</p>
                  </div>
                  <StateBadge status={decision.status} />
                </header>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <Panel eyebrow="Operating surfaces" title="Current founder routes">
        <div className="link-list">
          <Link className="link-card" href="/nex/plans">
            Open Plan Center
          </Link>
          <Link className="link-card" href="/nex/projects">
            Open Project Board
          </Link>
          <Link className="link-card" href="/nex/tools">
            Open Tool Registry
          </Link>
          <Link className="link-card" href="/nex/memory">
            Open Memory Timeline
          </Link>
          <Link className="link-card" href="/nex/proof">
            Open Proof Vault
          </Link>
          <Link className="link-card" href="/nex/gates">
            Open Gates & Blockers
          </Link>
          {activeSprint ? (
            <Link className="link-card" href={`/nex/sprints/${activeSprint.id}`}>
              Review active sprint
            </Link>
          ) : null}
          {currentTask ? (
            <Link className="link-card" href={`/nex/tasks/${currentTask.id}`}>
              Inspect current task runtime
            </Link>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
