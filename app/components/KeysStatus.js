"use client";

import { useEffect, useState } from "react";

const LABELS = {
  chat: "Chat",
  voice: "Voice call",
  screen: "Live screen",
  sense: "Spider-Sense"
};

export default function KeysStatus({ c }) {
  const [keys, setKeys] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setKeys)
      .catch(() => setFailed(true));
  }, []);

  const muted = (c && c.muted) || "#71717a";
  const accent = (c && c.accent) || "#8b5cf6";
  const text = (c && c.text) || "inherit";

  return (
    <div style={{ padding: "4px 16px 14px" }}>
      <div style={{ fontSize: 13, color: muted, margin: "16px 0 8px" }}>API keys</div>
      {failed && <div style={{ fontSize: 13, color: muted }}>Could not check keys.</div>}
      {!failed && !keys && <div style={{ fontSize: 13, color: muted }}>Checking...</div>}
      {keys && Object.keys(LABELS).map((k) => {
        const entry = keys[k] || { set: false };
        return (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", color: text, fontSize: 14 }}>
            <span>{LABELS[k]}</span>
            <span style={{ color: entry.set ? accent : muted, fontSize: 13 }}>
              {entry.set ? "Key set" : "No key"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
