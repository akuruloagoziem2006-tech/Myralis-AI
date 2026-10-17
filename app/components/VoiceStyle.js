"use client";

import { useEffect, useState } from "react";
import { VOICE_STYLES, getVoicePrefs } from "../lib/voiceStyle";

export default function VoiceStyle({ c }) {
  const [prefs, setPrefs] = useState({ style: "warm", voice: "" });
  const [voices, setVoices] = useState([]);
  const muted = (c && c.muted) || "#71717a";
  const accent = (c && c.accent) || "#8b5cf6";
  const text = (c && c.text) || "inherit";

  useEffect(() => {
    setPrefs(getVoicePrefs());
    const P = window.Capacitor?.Plugins?.MyralisDevice;
    if (P && window.Capacitor?.isNativePlatform?.()) {
      P.listVoices().then((r) => setVoices(r.voices || [])).catch(() => {});
    }
  }, []);

  function save(next) {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    try {
      localStorage.setItem("myralis_voice", JSON.stringify({ style: merged.style, name: merged.voice }));
    } catch {}
  }

  const btn = (active) => ({
    flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 13,
    border: "1px solid " + (active ? accent : "#3f3f46"),
    background: active ? accent : "transparent",
    color: active ? "#fff" : text
  });

  return (
    <div style={{ padding: "4px 16px 14px" }}>
      <div style={{ fontSize: 13, color: muted, margin: "16px 0 8px" }}>Voice style</div>
      <div style={{ display: "flex", gap: 6 }}>
        {Object.keys(VOICE_STYLES).map((k) => (
          <button key={k} onClick={() => save({ style: k })} style={btn(prefs.style === k)}>{VOICE_STYLES[k].label}</button>
        ))}
      </div>
      {voices.length > 0 && (
        <>
          <div style={{ fontSize: 13, color: muted, margin: "14px 0 8px" }}>Installed voice</div>
          <select
            value={prefs.voice || ""}
            onChange={(e) => save({ voice: e.target.value })}
            style={{ width: "100%", padding: 10, borderRadius: 10, background: "transparent", color: text, border: "1px solid #3f3f46" }}
          >
            <option value="">Default</option>
            {voices.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </>
      )}
      <div style={{ fontSize: 12, color: muted, marginTop: 8 }}>Applies to auto-speak, the 🔊 button, and calls.</div>
    </div>
  );
}
