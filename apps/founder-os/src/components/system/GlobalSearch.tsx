"use client";

import { useState } from "react";

export function GlobalSearch() {
  const [query, setQuery] = useState("");

  return (
    <div className="command-surface">
      <span style={{ color: 'var(--bronze)', fontWeight: 800, fontSize: '0.9rem', opacity: 0.8 }}>❯</span>
      <input
        className="command-input"
        type="text"
        placeholder="Command NEX... (e.g. /upload, /find, /connect)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <span className="command-kbd">⌘</span>
        <span className="command-kbd">K</span>
      </div>
    </div>
  );
}
