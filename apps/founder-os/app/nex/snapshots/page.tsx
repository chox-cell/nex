import Link from "next/link";

import { Panel } from "../../../src/components/panel";
import { formatTimestamp } from "../../../src/lib/format";
import { ensureNexSeed, nexRuntime } from "../../../src/lib/nex-runtime";

export default async function SnapshotsPage() {
  const seed = await ensureNexSeed();
  const snapshots = await nexRuntime.repositories.snapshots.listByWorkspace(seed.workspaceId);

  return (
    <div className="page-grid">
      <header className="route-header">
        <div>
          <p className="route-kicker">Sprint 02 / Snapshots</p>
          <h1>Snapshots</h1>
          <p className="route-copy">Meaningful state now has a recoverable snapshot path. Task snapshots capture both the raw task and its truth projection.</p>
        </div>
      </header>

      <Panel eyebrow="Snapshot store" title="Saved recovery points">
        <div className="stack-list">
          {snapshots.map((snapshot) => (
            <article className="stack-card" key={snapshot.id}>
              <header>
                <div>
                  <h3>{snapshot.label}</h3>
                  <p>{snapshot.summary}</p>
                </div>
                <span className="mono">{formatTimestamp(snapshot.createdAt)}</span>
              </header>
              <p className="muted-text">
                scope {snapshot.scopeType} / {snapshot.scopeId}
              </p>
              {snapshot.taskId ? (
                <Link className="link-card" href={`/nex/tasks/${snapshot.taskId}`}>
                  Open source task
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
