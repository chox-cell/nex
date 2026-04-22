import { ensureNexSeed, nexRuntime } from "../../../src/lib/nex-runtime";
import {
  ActiveMissionPanel,
  StrategicPrioritiesPanel,
  ProjectSummaryPanel,
  SprintSummaryPanel,
  TaskFocusPanel,
  OwnerToolPanel,
  BlockersPanel,
  VerifiedProofPanel,
  NextMovePanel,
} from "../../../src/components/command-center/CommandCenterPanels";

export default async function CommandCenterPage() {
  await ensureNexSeed();

  const summary = await nexRuntime.services.commandCenter.getCommandCenterSummary();

  if (!summary) {
    throw new Error("Failed to load Command Center summary.");
  }

  return (
    <div className="page-grid">
      <header className="route-header">
        <div>
          <p className="route-kicker">Operational Cockpit</p>
          <h1>Founder Command Center</h1>
          <p className="route-copy">
            Understand current operational truth within seconds. Driven by real persisted state, projections, and truth records.
          </p>
        </div>
      </header>

      <section className="command-center-layout">
        <div className="cc-col">
          <ActiveMissionPanel mission={summary.mission} />
          <StrategicPrioritiesPanel priorities={summary.priorities} />
        </div>

        <div className="cc-col">
          <ProjectSummaryPanel project={summary.project} />
          <SprintSummaryPanel sprint={summary.sprint} />
          <TaskFocusPanel task={summary.task} />
        </div>

        <div className="cc-col">
          <OwnerToolPanel ownerTool={summary.ownerTool} />
          <BlockersPanel blockers={summary.blockers} />
          <VerifiedProofPanel lastProof={summary.lastVerifiedProof} />
          <NextMovePanel nextMove={summary.nextRequiredMove} />
        </div>
      </section>
    </div>
  );
}
