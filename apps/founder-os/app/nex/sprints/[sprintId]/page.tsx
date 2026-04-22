import Link from "next/link";
import { notFound } from "next/navigation";

import { Panel } from "../../../../src/components/panel";
import { StateBadge } from "../../../../src/components/state-badge";
import { TaskGraph } from "../../../../src/components/task-graph";
import { ensureNexSeed, nexRuntime } from "../../../../src/lib/nex-runtime";

interface SprintDetailPageProps {
  params: Promise<{ sprintId: string }>;
}

export default async function SprintDetailPage({ params }: SprintDetailPageProps) {
  await ensureNexSeed();
  const { sprintId } = await params;

  try {
    const detail = await nexRuntime.services.execution.getSprintDetail(sprintId);
    const projection = await nexRuntime.services.projections.refreshSprintProjection(sprintId);
    const allTasks = detail.phases.flatMap((phase) => phase.tasks);

    return (
      <div className="page-grid">
        <header className="route-header">
          <div>
            <p className="route-kicker">Sprint 01 / Sprint engine</p>
            <h1>{detail.sprint.name}</h1>
            <p className="route-copy">{detail.sprint.goal}</p>
          </div>
          <StateBadge status={detail.sprint.status} />
        </header>

        <div className="page-grid two">
          <Panel eyebrow="Progress math" title="Truth projection">
            <dl className="detail-list">
              <div>
                <dt>Progress</dt>
                <dd>{projection.progressScore.toFixed(2)}%</dd>
              </div>
              <div>
                <dt>Current task</dt>
                <dd>{projection.currentTaskId ?? "No active task"}</dd>
              </div>
              <div>
                <dt>Blocked tasks</dt>
                <dd>{projection.blockedTaskIds.length}</dd>
              </div>
              <div>
                <dt>Next move</dt>
                <dd>{projection.nextRequiredAction}</dd>
              </div>
            </dl>
          </Panel>

          <Panel eyebrow="Hierarchy" title="Phases and tasks">
            <div className="stack-list">
              {detail.phases.map(({ phase, tasks }) => (
                <article className="stack-card" key={phase.id}>
                  <header>
                    <div>
                      <h3>
                        {phase.order}. {phase.name}
                      </h3>
                      <p>{phase.goal}</p>
                    </div>
                    <StateBadge status={phase.status} />
                  </header>
                  <p className="muted-text">
                    Truth progress{" "}
                    {projection.phaseProgress.find((candidate) => candidate.phaseId === phase.id)?.progressScore.toFixed(2) ?? "0.00"}%
                  </p>
                  <ul>
                    {tasks.map((task) => (
                      <li key={task.id}>
                        <Link href={`/nex/tasks/${task.id}`}>{task.title}</Link> · {task.ownerRef} · {task.status}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Task graph" title="Dependency structure">
            <TaskGraph edges={detail.edges} tasks={allTasks} />
          </Panel>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
