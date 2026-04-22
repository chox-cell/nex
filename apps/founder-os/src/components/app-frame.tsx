"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlobalSearch } from "./system/GlobalSearch";
import { SystemTaskbar } from "./system/SystemTaskbar";

/* --- Recognizable Icon System (SVG) --- */

const Icons = {
  Command: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
  ),
  Workspace: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  ),
  Plans: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
  ),
  Projects: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
  ),
  Tools: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  ),
  Memory: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  ),
  Proof: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 11 11 13 15 9"/></svg>
  ),
  Gates: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  ),
  Upload: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
  ),
  Send: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
  ),
};

interface AppFrameProps {
  children: ReactNode;
}

const navigation = [
  { href: "/nex/command-center", label: "Command Center", icon: Icons.Command },
  { href: "/nex", label: "Workspace", icon: Icons.Workspace },
  { href: "/nex/plans", label: "Strategic Plans", icon: Icons.Plans },
  { href: "/nex/projects", label: "Execution Board", icon: Icons.Projects },
  { href: "/nex/tools", label: "Tool Registry", icon: Icons.Tools },
  { href: "/nex/memory", label: "Memory Timeline", icon: Icons.Memory },
  { href: "/nex/proof", label: "Proof Vault", icon: Icons.Proof },
  { href: "/nex/gates", label: "Governance Gates", icon: Icons.Gates },
];

export function AppFrame({ children }: AppFrameProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();

  const effectiveCollapsed = isCollapsed && !isHovered;

  return (
    <div className={`shell ${effectiveCollapsed ? "collapsed" : ""}`}>
      <aside 
        className="shell-sidebar"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={{ padding: '0.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            background: 'var(--bronze)', 
            borderRadius: 'var(--radius-m)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: 900, 
            color: '#000', 
            fontSize: '1.1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
          }}>
            N
          </div>
          {!effectiveCollapsed && (
            <span style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.05em', color: 'var(--text-ivory)' }}>NEX OS</span>
          )}
        </div>

        <div className="nav-group">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? "active" : ""}`}
              >
                <span className="nav-icon">
                  <Icon />
                </span>
                {!effectiveCollapsed && (
                  <span style={{ transition: 'opacity 200ms ease' }}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!effectiveCollapsed && (
             <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-l)', border: '1px solid var(--border)' }}>
               <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>OPERATING_MODE</p>
               <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--success)' }}>FOUNDER_PRIME</p>
             </div>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ 
              background: 'transparent', 
              border: 0, 
              color: 'var(--text-dim)', 
              fontSize: '0.7rem', 
              cursor: 'pointer', 
              padding: '0.75rem',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontWeight: 700
            }}
          >
            {effectiveCollapsed ? "◈" : "[_] UNLOCK_SHELL"}
          </button>
        </div>
      </aside>

      <main className="shell-main">
        <header className="shell-header glass-surface">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.15em' }}>NEX // ALPHA</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
               <button className="action-trigger"><Icons.Upload /> UPLOAD</button>
               <button className="action-trigger"><Icons.Send /> SEND</button>
            </div>
          </div>
          
          <GlobalSearch />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <button className="action-trigger" style={{ color: 'var(--bronze)' }}>CONNECT_TOOL</button>
          </div>
        </header>
        
        <div className="content-area">
          {children}
        </div>

        <SystemTaskbar />
      </main>
    </div>
  );
}
