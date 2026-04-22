import type { ReactNode } from "react";

interface PanelProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  zone?: "action" | "context" | "truth" | "strategy";
}

export function Panel({ eyebrow, title, description, children, footer, zone = "context" }: PanelProps) {
  const zoneClass = `zone-${zone}`;

  return (
    <section className={`panel ${zoneClass}`}>
      <header className="panel-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {eyebrow && <span className="route-kicker" style={{ margin: 0, fontSize: '0.65rem' }}>{eyebrow}</span>}
          <h2>{title}</h2>
        </div>
      </header>
      <div className="panel-body">
        {description && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            {description}
          </p>
        )}
        {children}
      </div>
      {footer && (
        <footer style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)' }}>
          {footer}
        </footer>
      )}
    </section>
  );
}
