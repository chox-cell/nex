import { Panel } from "../panel";
import { StateBadge } from "../state-badge";
import type { CommandCenterSummary } from "@nex/ssot";

export function ActiveMissionPanel({ mission }: { mission: CommandCenterSummary["mission"] }) {
  return (
    <Panel eyebrow="Active Mission" title={mission.title} description="Current operational focus and vision anchoring.">
      <dl className="detail-list">
        <div>
          <dt>Objective</dt>
          <dd>{mission.objective}</dd>
        </div>
        <div>
          <dt>Strategic Focus</dt>
          <dd>{mission.strategicFocus}</dd>
        </div>
      </dl>
    </Panel>
  );
}

export function StrategicPrioritiesPanel({ priorities }: { priorities: CommandCenterSummary["priorities"] }) {
  return (
    <Panel eyebrow="Strategic Priorities" title="Ranked priorities" description="Ranked objectives currently tracked in the workspace.">
      <div className="stack-list">
        {priorities.map((p) => (
          <article key={p.title} className="stack-card">
            <header>
              <div>
                <h3 className="mono">{p.rank}. {p.title}</h3>
              </div>
              <StateBadge status={p.status} />
            </header>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function ProjectSummaryPanel({ project }: { project: CommandCenterSummary["project"] }) {
  if (!project) {
    return (
      <Panel eyebrow="Current Project" title="No Active Project" description="Operational execution container.">
        <p className="empty-state">No active project found. Choose or create a project to begin execution.</p>
      </Panel>
    );
  }

  return (
    <Panel eyebrow="Current Project" title={project.name} description="Current execution container tracked in NEX.">
      <dl className="detail-list">
        <div>
          <dt>Status</dt>
          <dd><StateBadge status={project.status} /></dd>
        </div>
        <div>
          <dt>Risk Level</dt>
          <dd>{project.riskLevel}</dd>
        </div>
        <div>
          <dt>Progress Truth</dt>
          <dd>{project.progressSummary}</dd>
        </div>
      </dl>
    </Panel>
  );
}

export function SprintSummaryPanel({ sprint }: { sprint: CommandCenterSummary["sprint"] }) {
  if (!sprint) {
    return (
      <Panel eyebrow="Current Sprint" title="No Active Sprint" description="Current iteration of truth closure.">
        <p className="empty-state">No active sprint found. Convert a plan to a sprint to continue.</p>
      </Panel>
    );
  }

  return (
    <Panel eyebrow="Current Sprint" title={sprint.name} description="Current iteration of truth closure.">
      <dl className="detail-list">
        <div>
          <dt>Status</dt>
          <dd><StateBadge status={sprint.status} /></dd>
        </div>
        <div>
          <dt>Phase Summary</dt>
          <dd>{sprint.phaseSummary}</dd>
        </div>
        <div>
          <dt>Truth Progress</dt>
          <dd className="mono">{sprint.progressScore.toFixed(2)}%</dd>
        </div>
      </dl>
    </Panel>
  );
}

export function TaskFocusPanel({ task }: { task: CommandCenterSummary["task"] }) {
  if (!task) {
    return (
      <Panel eyebrow="Current Task" title="No Active Task" description="Immediate operational focus.">
        <p className="empty-state">No active task found.</p>
      </Panel>
    );
  }

  return (
    <Panel eyebrow="Current Task" title={task.name} description="Immediate operational focus.">
      <dl className="detail-list">
        <div>
          <dt>State</dt>
          <dd><StateBadge status={task.status} /></dd>
        </div>
        <div>
          <dt>Blocker State</dt>
          <dd>{task.blockerState}</dd>
        </div>
        <div>
          <dt>Dependencies</dt>
          <dd>{task.dependencySummary}</dd>
        </div>
      </dl>
    </Panel>
  );
}

export function OwnerToolPanel({ ownerTool }: { ownerTool: CommandCenterSummary["ownerTool"] }) {
  if (!ownerTool) {
    return (
      <Panel eyebrow="Owner Tool" title="No Tool Assigned" description="Assigned tool or provider for the current task.">
        <p className="empty-state">No active tool assigned to current task.</p>
      </Panel>
    );
  }

  return (
    <Panel eyebrow="Owner Tool" title={ownerTool.name} description="Assigned tool or provider for the current task.">
      <dl className="detail-list">
        <div>
          <dt>Provider Type</dt>
          <dd className="mono">{ownerTool.providerType}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd><StateBadge status={ownerTool.status} /></dd>
        </div>
        <div>
          <dt>Readiness</dt>
          <dd>{ownerTool.readiness}</dd>
        </div>
      </dl>
    </Panel>
  );
}

export function BlockersPanel({ blockers }: { blockers: CommandCenterSummary["blockers"] }) {
  return (
    <Panel eyebrow="Blockers" title="Operational Stalls" description="Actual open blockers detected in the truth layer.">
      {blockers.length === 0 ? (
        <p className="empty-state">No open blockers detected. Execution path is clear.</p>
      ) : (
        <div className="stack-list">
          {blockers.map((b, i) => (
            <article key={i} className="stack-card">
              <header>
                <div>
                  <h3 className="mono">{b.text}</h3>
                  <p className="panel-description" style={{ marginTop: '0.4rem', fontSize: '0.8rem' }}>{b.context}</p>
                </div>
              </header>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function VerifiedProofPanel({ lastProof }: { lastProof: string | null }) {
  return (
    <Panel eyebrow="Last Verified Proof" title="Truth Record" description="Latest real evidence or verification-linked proof.">
      <div className="proof-display">
        {lastProof ? (
          <code className="mono-block">{lastProof}</code>
        ) : (
          <p className="empty-state">No verified proof records found in current execution context.</p>
        )}
      </div>
    </Panel>
  );
}

export function NextMovePanel({ nextMove }: { nextMove: CommandCenterSummary["nextRequiredMove"] }) {
  return (
    <Panel eyebrow="Next Required Move" title={nextMove.action} description="Deterministic rule-driven instruction.">
      <div className="next-move-context">
        <p className="next-move-reason"><strong>Reason:</strong> {nextMove.reason}</p>
        <div className="next-move-action-indicator">
          <span>REQUIRED ACTION</span>
        </div>
      </div>
    </Panel>
  );
}
