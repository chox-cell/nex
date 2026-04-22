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

function formatConfig(config: ToolProvider["config"]): string {
  return Object.entries(config)
    .map(([key, value]) => `${key}=${formatConfigValue(value)}`)
    .join(", ");
}

function formatConfigValue(value: ToolProviderConfigValue): string {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (value === null) {
    return "null";
  }

  return String(value);
}

export default async function ToolsPage() {
  await ensureNexSeed();
  const registry = await nexRuntime.services.tools.getFounderRegistrySummary();

  if (!registry) {
    throw new Error("Founder workspace tool registry could not be loaded.");
  }

  return (
    <div className="page-grid">
      <header className="route-header">
        <div>
          <p className="route-kicker">Sprint 03 / Tool provider registry</p>
          <h1>Tools</h1>
          <p className="route-copy">
            NEX now persists the founder tool registry as canonical state. A provider can be configured inside NEX without being treated as a
            connected truth source or an automation surface.
          </p>
        </div>
      </header>

      <section className="metric-grid">
        <article className="metric-card">
          <span className="panel-eyebrow">Providers</span>
          <strong>{registry.providers.length}</strong>
          <p>Seeded founder work surfaces tracked inside the SSOT.</p>
        </article>
        <article className="metric-card">
          <span className="panel-eyebrow">Configured</span>
          <strong>{registry.statusCounts.configured}</strong>
          <p>Registry-backed providers with explicit metadata but no implied live connector.</p>
        </article>
        <article className="metric-card">
          <span className="panel-eyebrow">Planned</span>
          <strong>{registry.statusCounts.planned}</strong>
          <p>Providers reserved for later Sprint 03 phases once their backing structures exist.</p>
        </article>
        <article className="metric-card">
          <span className="panel-eyebrow">Truth surfaces</span>
          <strong>{registry.truthSurfaceCount}</strong>
          <p>Providers marked as future proof surfaces, not active truth owners.</p>
        </article>
      </section>

      <div className="page-grid two">
        <Panel
          eyebrow="Provider registry"
          title="Seeded founder tools"
          description="These records come from the canonical founder workspace seed and remain queryable through the ToolProviderService."
        >
          <div className="stack-list">
            {registry.providers.map((provider) => (
              <article className="stack-card" key={provider.id}>
                <header>
                  <div>
                    <h3>{provider.name}</h3>
                    <p>{provider.providerType}</p>
                  </div>
                  <StateBadge status={provider.status} />
                </header>
                <dl className="detail-list">
                  <div>
                    <dt>Capabilities</dt>
                    <dd>{provider.capabilities.map(formatCapability).join(", ")}</dd>
                  </div>
                  <div>
                    <dt>Truth surface</dt>
                    <dd>{provider.capabilities.includes("proof_surface") || provider.capabilities.includes("repo_truth") ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt>Config</dt>
                    <dd className="mono">{formatConfig(provider.config)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="Registry rules"
          title="Status model"
          description="Provider status describes NEX-side readiness only. It does not imply external auth or tool-native truth ownership."
        >
          <div className="stack-list">
            <article className="stack-card">
              <header>
                <div>
                  <h3>Configured</h3>
                  <p>Metadata and expected role are persisted in NEX.</p>
                </div>
                <StateBadge status="configured" />
              </header>
              <p className="muted-text">Use this when the provider is modeled inside NEX, but deeper packet, proof, or connector work is still gated.</p>
            </article>
            <article className="stack-card">
              <header>
                <div>
                  <h3>Planned</h3>
                  <p>The provider is intentionally reserved for a later phase.</p>
                </div>
                <StateBadge status="planned" />
              </header>
              <p className="muted-text">This prevents fake “connected” states before manual packet logging, truth surfaces, or connector contracts exist.</p>
            </article>
            <article className="stack-card">
              <header>
                <div>
                  <h3>Active</h3>
                  <p>Reserved for providers with real backing structure.</p>
                </div>
                <StateBadge status="active" />
              </header>
              <p className="muted-text">No provider is marked active in Phase 1 because no live connector or proof surface has been fully modeled yet.</p>
            </article>
            <article className="stack-card">
              <header>
                <div>
                  <h3>Inactive</h3>
                  <p>Reserved for intentionally disabled providers.</p>
                </div>
                <StateBadge status="inactive" />
              </header>
              <p className="muted-text">The registry already understands the state, even though the founder workspace does not need disabled providers yet.</p>
            </article>
          </div>
        </Panel>
      </div>
    </div>
  );
}
