import type { ReactNode } from "react";
import Link from "next/link";

interface AppFrameProps {
  children: ReactNode;
}

const navigation = [
  { href: "/nex", label: "Workspace" },
  { href: "/nex/plans", label: "Plans" },
  { href: "/nex/projects", label: "Projects" },
  { href: "/nex/tools", label: "Tools" },
  { href: "/nex/memory", label: "Memory" },
  { href: "/nex/proof", label: "Proof" },
  { href: "/nex/gates", label: "Gates" },
  { href: "/nex/snapshots", label: "Snapshots" },
];

export function AppFrame({ children }: AppFrameProps) {
  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <div className="brand-block">
          <p className="brand-kicker">Founder execution operating system</p>
          <h1>NEX</h1>
          <p className="brand-copy">Memory-first, proof-first, truth-first. Mission, execution, truth, and the seeded tool registry now live in the canonical founder workspace.</p>
        </div>
        <nav className="shell-nav" aria-label="Primary">
          {navigation.map((item) => (
            <Link className="nav-link" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <p className="sidebar-note-title">Sprint discipline</p>
          <p>Sprint 03 exposes tool providers only where registry state is persisted. No provider is presented as connected before its backing structure exists.</p>
        </div>
      </aside>
      <main className="shell-main">{children}</main>
    </div>
  );
}
