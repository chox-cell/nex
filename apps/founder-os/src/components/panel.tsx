import type { ReactNode } from "react";

interface PanelProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Panel({ eyebrow, title, description, children, footer }: PanelProps) {
  return (
    <section className="panel">
      <header className="panel-header">
        {eyebrow ? <p className="panel-eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p className="panel-description">{description}</p> : null}
      </header>
      <div className="panel-body">{children}</div>
      {footer ? <div className="panel-footer">{footer}</div> : null}
    </section>
  );
}

