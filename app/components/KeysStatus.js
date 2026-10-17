"use client";

import { useEffect, useState } from "react";

const LABELS = {
  chat: "Chat",
  voice: "Voice call",
  screen: "Live screen",
  sense: "Spider-Sense"
};

function hintFor(value) {
  const v = String(value || "");
  if (/429|quota/i.test(v)) return "This key's Google project is out of quota. Use a key from a new project.";
  if (/503|504|busy|overload|timeout/i.test(v)) return "Google is overloaded right now. Try again in a few minutes.";
  if (/API key|PERMISSION|403|401|400/i.test(v)) return "Google rejected the key. Check it is copied correctly in Vercel.";
  return "";
}

function ago(t) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + " min ago";
  return Math.round(m / 60) + " h ago";
}

export default function KeysStatus({ c }) {
  const [keys, setKeys] = useState(null);
  const [failed, setFailed] = useState(false);
  const [last, setLast] = useState(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setKeys)
      .catch(() => setFailed(true));
    try {
      const raw = localStorage.getItem("myralis_last_status");
      if (raw) setLast(JSON.parse(raw));
    } catch {}
  }, []);

  const muted = (c && c.muted) || "#71717a";
  const accent = (c && c.accent) || "#8b5cf6";
  const text = (c && c.text) || "inherit";
  const bad = (c && c.danger) || "#f87171";

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

      <div style={{ fontSize: 13, color: muted, margin: "18px 0 8px" }}>Last chat reply</div>
      {!last && <div style={{ fontSize: 13, color: muted }}>No replies recorded yet on this phone.</div>}
      {last && last.kind === "ok" && (
        <div style={{ fontSize: 14, color: text }}>
          Answered by {last.model || "unknown model"}, {ago(last.at)}.
        </div>
      )}
      {last && last.kind === "error" && (
        <div style={{ fontSize: 14, color: text }}>
          <div style={{ color: bad }}>Failed {ago(last.at)}: {last.value}</div>
          {hintFor(last.value) && <div style={{ color: muted, marginTop: 6 }}>{hintFor(last.value)}</div>}
        </div>
      )}
    </div>
  );
}
