import type { ToolProvider, ToolProviderConfigValue } from "@nex/core";
import { Panel } from "../../../src/components/panel";
import { StateBadge } from "../../../src/components/state-badge";
import { ensureNexSeed, nexRuntime } from "../../../src/lib/nex-runtime";

function formatCapability(capability: string): string {
  return capability
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function ToolsPage() {
  await ensureNexSeed();
  const registry = await nexRuntime.services.tools.getFounderRegistrySummary();

  if (!registry) {
    throw new Error("Founder workspace tool registry could not be loaded.");
  }

  return (
    <div>
      <header className="route-header">
        <p className="route-kicker">Automation Registry</p>
        <h1>Tools</h1>
        <p className="route-copy">
          The canonical registry of tool providers and active connectors. Manage provider configuration and truth surface assignments within the founder workspace.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
        {[
          { label: "Active Providers", value: registry.providers.length },
          { label: "Configured State", value: registry.statusCounts.configured },
          { label: "Planned Integration", value: registry.statusCounts.planned },
          { label: "Truth Surfaces", value: registry.truthSurfaceCount },
        ].map((stat) => (
          <div key={stat.label} style={{ padding: '2rem', background: 'var(--bg-graphite)', border: '1px solid var(--border)', borderRadius: 'var(--radius-l)' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>{stat.label}</p>
            <p style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-ivory)' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem' }}>
        <Panel eyebrow="Seeded Infrastructure" title="Provider Registry">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {registry.providers.map((provider) => (
              <div key={provider.id} className="plan-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-ivory)' }}>{provider.name}</h3>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>{provider.providerType}</p>
                  </div>
                  <StateBadge status={provider.status} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Capabilities</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-silver)' }}>{provider.capabilities.map(formatCapability).join(", ")}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Truth Role</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-silver)' }}>{provider.capabilities.includes("proof_surface") ? "Canonical Proof Surface" : "General Automation"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Governance" title="Integration Model">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <StateBadge status="configured" />
              <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: '0.75rem 0 0.25rem 0' }}>Configuration Locked</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Metadata and role definitions are persisted. The provider is ready for packet and proof sync.</p>
            </div>
            <div>
              <StateBadge status="planned" />
              <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: '0.75rem 0 0.25rem 0' }}>Reserved Interface</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Integration is intentionally reserved for a future execution phase to prevent stale truth sync.</p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
