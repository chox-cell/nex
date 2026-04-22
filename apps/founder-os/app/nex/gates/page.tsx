import Link from "next/link";

import { Panel } from "../../../src/components/panel";
import { StateBadge } from "../../../src/components/state-badge";
import { ensureNexSeed, nexRuntime } from "../../../src/lib/nex-runtime";

export default async function GatesPage() {
  const seed = await ensureNexSeed();
  const [taskProjections, sprintProjections, gateDecisions] = await Promise.all([
    nexRuntime.services.projections.listTaskProjectionsByWorkspace(seed.workspaceId),
    nexRuntime.services.projections.listSprintProjectionsByWorkspace(seed.workspaceId),
    nexRuntime.repositories.gates.listByWorkspace(seed.workspaceId),
  ]);

  const blockedTasks = taskProjections.filter((projection) => projection.blockers.length > 0 || projection.taskStatus === "FAIL");
  const blockedPhases = sprintProjections.flatMap((projection) =>
    projection.phaseProgress
      .filter((phase) => phase.blockedTaskIds.length > 0)
      .map((phase) => ({ sprintName: projection.sprintName, ...phase })),
  );

  return (
    <div className="page-grid">
      <header className="route-header">
        <div>
          <p className="route-kicker">Sprint 02 / Gates and blockers</p>
          <h1>Gates &amp; Blockers</h1>
          <p className="route-copy">Blockers are now explicit objects in projections and gate decisions. Forward movement stops when truth says it should.</p>
        </div>
      </header>

      <div className="page-grid two">
        <Panel eyebrow="Blocked tasks" title="Open blocker inventory">
          <div className="stack-list">
            {blockedTasks.map((projection) => (
              <article className="stack-card" key={projection.taskId}>
                <header>
                  <div>
                    <h3>{projection.taskTitle}</h3>
                    <p>{projection.nextRequiredAction}</p>
                  </div>
                  <StateBadge status={projection.taskStatus} />
                </header>
                <ul>
                  {projection.blockers.map((blocker) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
                <Link className="link-card" href={`/nex/tasks/${projection.taskId}`}>
                  Open task runtime
                </Link>
              </article>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Blocked phases" title="Phase-level impact">
          {blockedPhases.length ? (
            <div className="stack-list">
              {blockedPhases.map((phase) => (
                <article className="stack-card" key={phase.phaseId}>
                  <h3>
                    {phase.sprintName} / {phase.phaseName}
                  </h3>
                  <p>{phase.blockedTaskIds.length} blocked tasks</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state">No blocked phases are projected right now.</p>
          )}
        </Panel>
      </div>

      <Panel eyebrow="Gate decisions" title="Latest closure decisions">
        <div className="stack-list">
          {gateDecisions.map((decision) => (
            <article className="stack-card" key={decision.id}>
              <header>
                <div>
                  <h3>{decision.gateType}</h3>
                  <p>{decision.rationale}</p>
                </div>
                <StateBadge status={decision.decision} />
              </header>
              {decision.blockers.length ? (
                <ul>
                  {decision.blockers.map((blocker) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
              ) : (
                <p className="empty-state">This decision has no recorded blockers.</p>
              )}
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}

