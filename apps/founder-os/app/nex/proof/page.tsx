import Link from "next/link";

import { Panel } from "../../../src/components/panel";
import { StateBadge } from "../../../src/components/state-badge";
import { formatTimestamp } from "../../../src/lib/format";
import { ensureNexSeed, nexRuntime } from "../../../src/lib/nex-runtime";

export default async function ProofPage() {
  const seed = await ensureNexSeed();
  const [evidence, verifications, repoReferences, terminalReferences] = await Promise.all([
    nexRuntime.repositories.evidence.listByWorkspace(seed.workspaceId),
    nexRuntime.repositories.verifications.listByWorkspace(seed.workspaceId),
    nexRuntime.services.repoReferences.listByWorkspace(seed.workspaceId),
    nexRuntime.services.terminalReferences.listByWorkspace(seed.workspaceId),
  ]);
  const evidenceById = new Map(evidence.map((record) => [record.id, record]));

  return (
    <div className="page-grid">
      <header className="route-header">
        <div>
          <p className="route-kicker">Proof vault</p>
          <h1>Proof Vault</h1>
          <p className="route-copy">
            Claims still climb the proof pyramid through evidence and verifications. Sprint 03 now adds repo and terminal truth surfaces as
            reviewable proof-capable references without letting them replace verification or gate approval.
          </p>
        </div>
      </header>

      <div className="metric-grid">
        <article className="metric-card">
          <span className="panel-eyebrow">Evidence records</span>
          <strong>{evidence.length}</strong>
          <p>Persisted proof artifacts attached to task scope.</p>
        </article>
        <article className="metric-card">
          <span className="panel-eyebrow">Verification records</span>
          <strong>{verifications.length}</strong>
          <p>Checks recorded against evidence and closure claims.</p>
        </article>
        <article className="metric-card">
          <span className="panel-eyebrow">Repo references</span>
          <strong>{repoReferences.length}</strong>
          <p>Repo truth-surface artifacts recorded for review.</p>
        </article>
        <article className="metric-card">
          <span className="panel-eyebrow">Terminal references</span>
          <strong>{terminalReferences.length}</strong>
          <p>Terminal truth-surface artifacts recorded for review.</p>
        </article>
      </div>

      <div className="page-grid two">
        <Panel eyebrow="Evidence layer" title="Artifacts">
          <div className="stack-list">
            {evidence.map((record) => (
              <article className="stack-card" key={record.id}>
                <header>
                  <div>
                    <h3>{record.title}</h3>
                    <p>{record.summary}</p>
                  </div>
                  <StateBadge status={record.evidenceType} />
                </header>
                <p className="muted-text pre-wrap">{record.content}</p>
                {record.taskId ? (
                  <Link className="link-card" href={`/nex/tasks/${record.taskId}`}>
                    Open task
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Verification layer" title="Checks">
          <div className="stack-list">
            {verifications.map((record) => (
              <article className="stack-card" key={record.id}>
                <header>
                  <div>
                    <h3>{record.verificationType}</h3>
                    <p>{record.summary}</p>
                  </div>
                  <StateBadge status={record.status} />
                </header>
                <p className="muted-text pre-wrap">{record.detail}</p>
                <p className="muted-text mono">{formatTimestamp(record.createdAt)}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <div className="page-grid two">
        <Panel eyebrow="Repo truth surface" title="Repo-linked artifacts">
          <div className="stack-list">
            {repoReferences.map((record) => {
              const linkedEvidence = record.linkedEvidenceIds
                .map((id) => evidenceById.get(id) ?? null)
                .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));

              return (
                <article className="stack-card" key={record.id}>
                  <header>
                    <div>
                      <h3>{record.repoLabel}</h3>
                      <p>{record.summary}</p>
                    </div>
                    <p className="muted-text mono">{formatTimestamp(record.createdAt)}</p>
                  </header>
                  <dl className="detail-list">
                    <div>
                      <dt>Branch</dt>
                      <dd>{record.branchName ?? "No branch recorded"}</dd>
                    </div>
                    <div>
                      <dt>Git ref</dt>
                      <dd className="mono">{record.gitRef ?? "No ref recorded"}</dd>
                    </div>
                    <div>
                      <dt>Diff ref</dt>
                      <dd className="mono">{record.diffRef ?? "No diff ref recorded"}</dd>
                    </div>
                    <div>
                      <dt>Linked evidence</dt>
                      <dd>{linkedEvidence.length ? linkedEvidence.map((item) => item.title).join(", ") : "No linked evidence"}</dd>
                    </div>
                  </dl>
                  {record.note ? <p className="muted-text pre-wrap">{record.note}</p> : null}
                  {record.taskId ? (
                    <Link className="link-card" href={`/nex/tasks/${record.taskId}`}>
                      Open task
                    </Link>
                  ) : null}
                </article>
              );
            })}
            {!repoReferences.length ? <p className="empty-state">No repo truth-surface references have been recorded yet.</p> : null}
          </div>
        </Panel>

        <Panel eyebrow="Terminal truth surface" title="Terminal-linked artifacts">
          <div className="stack-list">
            {terminalReferences.map((record) => {
              const linkedEvidence = record.linkedEvidenceIds
                .map((id) => evidenceById.get(id) ?? null)
                .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));

              return (
                <article className="stack-card" key={record.id}>
                  <header>
                    <div>
                      <h3>{record.commandSummary}</h3>
                      <p>{record.summary}</p>
                    </div>
                    <p className="muted-text mono">{formatTimestamp(record.executedAt)}</p>
                  </header>
                  <dl className="detail-list">
                    <div>
                      <dt>Outcome</dt>
                      <dd>{record.outcome}</dd>
                    </div>
                    <div>
                      <dt>Working directory</dt>
                      <dd className="mono">{record.cwd ?? "No cwd recorded"}</dd>
                    </div>
                    <div>
                      <dt>Commands</dt>
                      <dd>{record.commands.length ? record.commands.join(" | ") : "No commands recorded"}</dd>
                    </div>
                    <div>
                      <dt>Linked evidence</dt>
                      <dd>{linkedEvidence.length ? linkedEvidence.map((item) => item.title).join(", ") : "No linked evidence"}</dd>
                    </div>
                  </dl>
                  <p className="muted-text pre-wrap">{record.logExcerpt}</p>
                  {record.taskId ? (
                    <Link className="link-card" href={`/nex/tasks/${record.taskId}`}>
                      Open task
                    </Link>
                  ) : null}
                </article>
              );
            })}
            {!terminalReferences.length ? <p className="empty-state">No terminal truth-surface references have been recorded yet.</p> : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
