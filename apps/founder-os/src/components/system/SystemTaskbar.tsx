"use client";

import { useState, useEffect } from "react";

const AGENT_TASKS = [
  { id: "CODEX-01", task: "Analyzing execution spine" },
  { id: "PROOFER-A", task: "Verifying truth artifacts" },
  { id: "GATE-02", task: "Evaluating closure criteria" },
  { id: "MEMORY-X", task: "Indexing session delta" },
  { id: "S-SYNC", task: "Refreshing project state" },
];

export function SystemTaskbar() {
  const [isMounted, setIsMounted] = useState(false);
  const [time, setTime] = useState<string | null>(null);
  const [activeAgents, setActiveAgents] = useState<{ id: string, task: string }[]>([]);

  useEffect(() => {
    setIsMounted(true);
    setTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    // Simulate rotating agent work
    const agentTimer = setInterval(() => {
      const randomAgent = AGENT_TASKS[Math.floor(Math.random() * AGENT_TASKS.length)];
      if (randomAgent) {
        setActiveAgents([randomAgent]);
      }
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(agentTimer);
    };
  }, []);

  return (
    <footer className="system-taskbar">
      <div className="system-status-pill">
        <span className="mono-telemetry" style={{ color: 'var(--success)', opacity: 0.8 }}>SYSTEM: READY</span>
        <span style={{ opacity: 0.2 }}>|</span>
        <span className="mono-telemetry">TRUTH VELOCITY: <span style={{ color: 'var(--text-ivory)' }}>{isMounted ? "SYNCED" : "..."}</span></span>
      </div>

      <div className="agents-work-feed">
        {activeAgents.map((agent, i) => (
          <div key={`${agent.id}-${i}`} className="agent-activity" style={{ opacity: 1 - (i * 0.3) }}>
            <span className="agent-id">[{agent.id}]</span>
            <span className="agent-task">{agent.task}</span>
          </div>
        ))}
        {activeAgents.length === 0 && (
          <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Awaiting agent assignment...
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div className="system-status-pill">
          <span style={{ color: 'var(--text-dim)' }}>GATE STATUS:</span>
          <span style={{ color: 'var(--success)', fontWeight: 800 }}>GO</span>
        </div>
        <div className="mono-telemetry" style={{ fontSize: '0.75rem', minWidth: '80px', textAlign: 'right', color: 'var(--text-dim)' }}>
          {time || "--:--:--"}
        </div>
      </div>
    </footer>
  );
}
