"use client";

import { useEffect, useState } from "react";
import { getVoicePrefs } from "../lib/voiceStyle";

export default function VoiceStyle({ c }) {
  const [voice, setVoice] = useState("");
  const [voices, setVoices] = useState([]);
  const muted = (c && c.muted) || "#71717a";
  const text = (c && c.text) || "inherit";

  useEffect(() => {
    setVoice(getVoicePrefs().voice);
    const P = window.Capacitor?.Plugins?.MyralisDevice;
    if (P && window.Capacitor?.isNativePlatform?.()) {
      P.listVoices().then((r) => setVoices(r.voices || [])).catch(() => {});
    }
  }, []);

  function choose(name) {
    setVoice(name);
    try {
      localStorage.setItem("myralis_voice", JSON.stringify({ name }));
    } catch {}
  }

  async function test() {
    const P = window.Capacitor?.Plugins?.MyralisDevice;
    if (!P || !window.Capacitor?.isNativePlatform?.()) {
      alert("Voice test needs the Myralis Android app.");
      return;
    }
    try {
      await P.speak({ text: "Hello, I am Myralis.", lang: "en-US", volume: 1.0, rate: 1.0, pitch: 1.0, voice: voice || "" });
    } catch (e) {
      alert("Could not speak: " + ((e && e.message) || e));
    }
  }

  if (voices.length === 0) return null;

  return (
    <div style={{ padding: "4px 16px 14px" }}>
      <div style={{ fontSize: 13, color: muted, margin: "16px 0 8px" }}>Installed voice</div>
      <select
        value={voice}
        onChange={(e) => choose(e.target.value)}
        style={{ width: "100%", padding: 10, borderRadius: 10, background: "transparent", color: text, border: "1px solid #3f3f46" }}
      >
        <option value="">Default</option>
        {voices.map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
      <button onClick={test} style={{ width: "100%", marginTop: 10, padding: 10, borderRadius: 10, border: "1px solid #3f3f46", background: "transparent", color: text }}>
        Test this voice
      </button>
      <div style={{ fontSize: 12, color: muted, marginTop: 8 }}>Applies to auto-speak, the 🔊 button, and calls.</div>
    </div>
  );
}
