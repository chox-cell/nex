import Link from "next/link";
import { Panel } from "../../src/components/panel";
import { StateBadge } from "../../src/components/state-badge";
import { ensureNexSeed, nexRuntime } from "../../src/lib/nex-runtime";

export default async function NexWorkspacePage() {
  const seed = await ensureNexSeed();

  const [mission, toolRegistry] = await Promise.all([
    nexRuntime.services.mission.getFounderSummary(),
    nexRuntime.services.tools.getFounderRegistrySummary(),
  ]);

  if (!mission) {
    throw new Error("Founder workspace seed failed.");
  }

  const projects = await nexRuntime.services.execution.listProjects(mission.workspace.id);
  const activeProject = projects.find((entry) => entry.project.status === "ACTIVE") ?? projects[0] ?? null;
  const activeSprint = activeProject?.project.currentSprintId
    ? await nexRuntime.repositories.sprints.getById(activeProject.project.currentSprintId)
    : null;
  const sprintProjection = activeSprint ? await nexRuntime.services.projections.refreshSprintProjection(activeSprint.id) : null;

  return (
    <div>
      <header className="route-header">
        <p className="route-kicker">Operating Shell</p>
        <h1>Workspace</h1>
        <p className="route-copy">
          The unified control layer for your mission. Projects, tools, and memory are unified into a single execution spine.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
        <Panel eyebrow="Strategic Mission" title={mission.workspace.name || "UNNAMED_WORKSPACE"} zone="strategy">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Core Vision</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-ivory)' }}>{mission.vision?.title || "Establishing baseline vision."}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>System Status</p>
                <StateBadge status={mission.workspace.status || "IDLE"} />
              </div>
              <div>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Operational Region</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-silver)' }}>{mission.workspace.timezone || "GLOBAL_CLUSTER"}</p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel eyebrow="Execution Focus" title={activeProject?.project.name || "IDLE_STATE"} zone="action">
          {activeProject ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Active Sprint</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-ivory)' }}>{activeSprint?.name || "Initializing..."}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Truth Velocity</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--bronze)' }}>{sprintProjection?.progressScore.toFixed(1) || "0.0"}%</p>
                </div>
              </div>
              <div style={{ padding: '1rem', background: 'var(--bg-obsidian)', borderRadius: 'var(--radius-m)', border: '1px solid var(--border-strong)' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--bronze)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Next Required Move</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-ivory)', lineHeight: '1.4' }}>{sprintProjection?.nextRequiredAction || "Maintain current vector."}</p>
              </div>
              <Link href="/nex/command-center" className="os-button" style={{ width: '100%' }}>ENTER_COMMAND_CENTER</Link>
            </div>
          ) : (
            <div style={{ padding: '3rem 0', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>No active projects in the execution spine.</p>
              <Link href="/nex/projects" className="os-button" style={{ marginTop: '1.5rem' }}>INITIALIZE_PROJECT</Link>
            </div>
          )}
        </Panel>
      </div>

      <section>
        <h2 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>
          Operational Surfaces
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {[
            { href: "/nex/command-center", label: "Command Center", desc: "Live operational cockpit and urgency layer." },
            { href: "/nex/plans", label: "Strategic Plans", desc: "Versioned execution blueprints." },
            { href: "/nex/projects", label: "Execution Board", desc: "Active project boards and sprint tracking." },
            { href: "/nex/tools", label: "Tool Registry", desc: "Founder tool and automation inventory." },
            { href: "/nex/memory", label: "Memory Timeline", desc: "Canonical event and decision history." },
            { href: "/nex/proof", label: "Proof Vault", desc: "Verified truth artifacts and evidence." },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="plan-card" style={{ borderLeft: '3px solid var(--border-strong)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-ivory)' }}>{link.label}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-graphite)', lineHeight: '1.5' }}>{link.desc}</p>
              <div style={{ marginTop: '1.25rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--bronze)', textTransform: 'uppercase' }}>OPEN_SURFACE →</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
