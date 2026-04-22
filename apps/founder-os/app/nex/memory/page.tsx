import Link from "next/link";

import { Panel } from "../../../src/components/panel";
import { StateBadge } from "../../../src/components/state-badge";
import { formatTimestamp } from "../../../src/lib/format";
import { ensureNexSeed, nexRuntime } from "../../../src/lib/nex-runtime";

export default async function MemoryPage() {
  const seed = await ensureNexSeed();
  const [events, packets, patterns, sprintProjections] = await Promise.all([
    nexRuntime.repositories.events.listByWorkspace(seed.workspaceId),
    nexRuntime.repositories.resumePackets.listByWorkspace(seed.workspaceId),
    nexRuntime.repositories.patterns.listOpenByWorkspace(seed.workspaceId),
    nexRuntime.services.projections.listSprintProjectionsByWorkspace(seed.workspaceId),
  ]);

  return (
    <div className="page-grid">
      <header className="route-header">
        <div>
          <p className="route-kicker">Sprint 02 / Memory timeline</p>
          <h1>Memory Timeline</h1>
          <p className="route-copy">Events, projections, resume packets, and detected patterns now persist inside NEX instead of transient chat state.</p>
        </div>
      </header>

      <div className="page-grid two">
        <Panel eyebrow="Resume engine" title="Current resume packets">
          <div className="stack-list">
            {packets.map((packet) => (
              <article className="stack-card" key={packet.id}>
                <header>
                  <div>
                    <h3>
                      {packet.scopeType} / {packet.currentTask ?? packet.currentObjective}
                    </h3>
                    <p>{packet.nextRequiredAction}</p>
                  </div>
                  <StateBadge status={packet.currentState} />
                </header>
                {packet.blockers.length ? (
                  <ul>
                    {packet.blockers.map((blocker) => (
                      <li key={blocker}>{blocker}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">No blockers in this resume packet.</p>
                )}
              </article>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Pattern detector" title="Open patterns">
          {patterns.length ? (
            <div className="stack-list">
              {patterns.map((pattern) => (
                <article className="stack-card" key={pattern.id}>
                  <header>
                    <div>
                      <h3>{pattern.patternType}</h3>
                      <p>{pattern.summary}</p>
                    </div>
                    <span className="mono">{pattern.occurrenceCount}x</span>
                  </header>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state">No repeated blockers, stalled work, or silent drift patterns are currently open.</p>
          )}
        </Panel>
      </div>

      <Panel eyebrow="State projections" title="Sprint truth projections">
        <div className="stack-list">
          {sprintProjections.map((projection) => (
            <article className="stack-card" key={projection.sprintId}>
              <header>
                <div>
                  <h3>{projection.sprintName}</h3>
                  <p>{projection.nextRequiredAction}</p>
                </div>
                <span className="mono">{projection.progressScore.toFixed(2)}%</span>
              </header>
              {projection.currentTaskId ? (
                <Link className="link-card" href={`/nex/tasks/${projection.currentTaskId}`}>
                  Open current task
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="Event store" title="Execution memory stream">
        <div className="stack-list">
          {events.map((event) => (
            <article className="stack-card" key={event.id}>
              <header>
                <div>
                  <h3>{event.summary}</h3>
                  <p>
                    {event.scopeType} / {event.scopeId}
                  </p>
                </div>
                <span className="mono">{formatTimestamp(event.createdAt)}</span>
              </header>
              <p className="muted-text">
                {event.eventType} by {event.actorRef}
              </p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}

