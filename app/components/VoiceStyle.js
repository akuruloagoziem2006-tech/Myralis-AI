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

  async function test() {
    const P = window.Capacitor?.Plugins?.MyralisDevice;
    if (!P || !window.Capacitor?.isNativePlatform?.()) {
      alert("Voice test needs the Myralis Android app.");
      return;
    }
    if (typeof P.testVoice !== "function") {
      try {
        await P.speak({ text: "Hello, I am Myralis. This is how I sound with this voice.", lang: "en-US", volume: 1.0, rate: getVoicePrefs().rate, pitch: getVoicePrefs().pitch, voice: prefs.voice || "" });
        const g = getVoicePrefs(); alert("Sent to phone: style " + g.style + ", speed " + g.rate + ", pitch " + g.pitch + ", voice " + (prefs.voice || "Default") + ". Listen for a change in speed or pitch.");
      } catch (e) {
        alert("Could not speak the sample: " + ((e && e.message) || e));
      }
      return;
    }
    try {
      const r = await P.testVoice({ voice: prefs.voice || "" });
      if (!prefs.voice) {
        alert("Default voice in use: " + r.current);
      } else if (r.matched) {
        alert("Switched to " + r.current + ".");
      } else {
        alert("The phone used " + r.current + " instead of " + prefs.voice + ". That voice isn't usable on this phone yet. Download its voice data and try again.");
      }
    } catch (e) {
      alert("Test failed: " + ((e && e.message) || e));
    }
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
          <button onClick={test} style={{ width: "100%", marginTop: 10, padding: 10, borderRadius: 10, border: "1px solid #3f3f46", background: "transparent", color: text }}>
            Test this voice
          </button>
        </>
      )}
      <div style={{ fontSize: 12, color: muted, marginTop: 8 }}>Applies to auto-speak, the 🔊 button, and calls.</div>
    </div>
  );
}
