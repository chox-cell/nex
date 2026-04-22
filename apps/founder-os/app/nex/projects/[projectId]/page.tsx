import Link from "next/link";
import { notFound } from "next/navigation";

import { Panel } from "../../../../src/components/panel";
import { StateBadge } from "../../../../src/components/state-badge";
import { ensureNexSeed, nexRuntime } from "../../../../src/lib/nex-runtime";

interface ProjectDetailPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  await ensureNexSeed();
  const { projectId } = await params;

  try {
    const detail = await nexRuntime.services.execution.getProjectDetail(projectId);

    return (
      <div className="page-grid">
        <header className="route-header">
          <div>
            <p className="route-kicker">Sprint 01 / Project detail</p>
            <h1>{detail.project.name}</h1>
            <p className="route-copy">{detail.project.summary}</p>
          </div>
          <StateBadge status={detail.project.status} />
        </header>

        <div className="page-grid two">
          <Panel eyebrow="Project truth" title="Execution envelope">
            <dl className="detail-list">
              <div>
                <dt>Risk</dt>
                <dd>{detail.project.riskLevel}</dd>
              </div>
              <div>
                <dt>Current sprint</dt>
                <dd>{detail.activeSprint?.name ?? "None"}</dd>
              </div>
              <div>
                <dt>Linked plan ids</dt>
                <dd className="mono">{detail.planIds.join(", ") || "No linked plans"}</dd>
              </div>
              <div>
                <dt>Slug</dt>
                <dd className="mono">{detail.project.slug}</dd>
              </div>
            </dl>
          </Panel>

          <Panel eyebrow="Sprints" title="Project sprint history">
            <div className="link-list">
              {detail.sprints.map((sprint) => (
                <Link className="link-card" href={`/nex/sprints/${sprint.id}`} key={sprint.id}>
                  <div className="split-header">
                    <div>
                      <h3>{sprint.name}</h3>
                      <p>{sprint.goal}</p>
                    </div>
                    <StateBadge status={sprint.status} />
                  </div>
                </Link>
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

