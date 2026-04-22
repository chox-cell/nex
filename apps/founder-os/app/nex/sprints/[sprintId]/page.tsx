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
      <div>
        <header className="route-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="route-kicker">Execution Container</p>
            <h1>{detail.sprint.name || "Unnamed Sprint"}</h1>
            <p className="route-copy">{detail.sprint.goal || "No strategic goal defined for this sprint."}</p>
          </div>
          <div style={{ marginTop: '2.5rem' }}>
            <StateBadge status={detail.sprint.status} />
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <Panel eyebrow="Progress Mathematics" title="Truth Projection">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Truth Velocity</p>
                <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)' }}>{projection.progressScore.toFixed(1)}%</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Stalled Tasks</p>
                <p style={{ fontSize: '2.5rem', fontWeight: 800, color: projection.blockedTaskIds.length > 0 ? 'var(--danger)' : 'var(--success)' }}>{projection.blockedTaskIds.length}</p>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Next Required Action</p>
              <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>{projection.nextRequiredAction}</p>
            </div>
          </Panel>

          <Panel eyebrow="Execution Runtime" title="Active Focus">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Current Task</p>
                {projection.currentTaskId ? (
                  <Link href={`/nex/tasks/${projection.currentTaskId}`} style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent)' }}>
                    {allTasks.find(t => t.id === projection.currentTaskId)?.title || "View Task Runtime →"}
                  </Link>
                ) : (
                  <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-muted)' }}>No active task focus.</p>
                )}
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--bg-soft)', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Sprint Path</p>
                <p style={{ fontSize: '0.85rem' }}>{detail.phases.length} phases integrated into truth spine.</p>
              </div>
            </div>
          </Panel>
        </div>

        <Panel eyebrow="Structural Hierarchy" title="Phases & Task Sequences">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {detail.phases.map(({ phase, tasks }) => (
              <div key={phase.id} style={{ padding: '1.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-l)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{phase.order}. {phase.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{phase.goal}</p>
                  </div>
                  <StateBadge status={phase.status} />
                </div>
                <div style={{ margin: '1rem 0', padding: '0.5rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                   <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>
                    {projection.phaseProgress.find((candidate) => candidate.phaseId === phase.id)?.progressScore.toFixed(1) ?? "0.0"}% Progress
                   </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {tasks.map((task) => (
                    <Link key={task.id} href={`/nex/tasks/${task.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-m)', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 500 }}>{task.title}</span>
                      <StateBadge status={task.status} />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div style={{ marginTop: '2rem' }}>
          <Panel eyebrow="Visual Logic" title="Task Dependency Graph">
            <TaskGraph edges={detail.edges} tasks={allTasks} />
          </Panel>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
