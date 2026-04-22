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
    <div className="page-grid">
      <header className="route-header">
        <div>
          <p className="route-kicker">Sprint 01 / Execution layer</p>
          <h1>Project Board</h1>
          <p className="route-copy">Projects hold the execution hierarchy and expose the current sprint link used by the founder workspace.</p>
        </div>
      </header>

      <Panel eyebrow="Execution inventory" title="Canonical projects">
        <div className="link-list">
          {projects.map((entry) => (
            <Link className="link-card" href={`/nex/projects/${entry.project.id}`} key={entry.project.id}>
              {(() => {
                const projection = projections.find((candidate) => candidate.projectId === entry.project.id);

                return (
                  <>
                    <div className="split-header">
                      <div>
                        <h3>{entry.project.name}</h3>
                        <p>{entry.project.summary}</p>
                      </div>
                      <StateBadge status={entry.project.status} />
                    </div>
                    <p className="muted-text mono">
                      risk {entry.project.riskLevel} • {entry.sprintCount} sprints • {entry.planCount} linked plans
                    </p>
                    <p className="muted-text">
                      progress {projection?.progressScore.toFixed(2) ?? "0.00"}% • blockers {projection?.blockerCount ?? 0} • next{" "}
                      {projection?.nextRequiredAction ?? "Create or activate a sprint"}
                    </p>
                  </>
                );
              })()}
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}
