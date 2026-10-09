"use client";

import { useEffect, useRef, useState } from "react";

function nativePlugins() {
  try {
    const C = window.Capacitor;
    if (C && C.isNativePlatform && C.isNativePlatform()) return C.Plugins || null;
  } catch {}
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const quiet = (p) => { try { if (p && p.catch) p.catch(() => {}); } catch {} };

function cleanForSpeech(t) {
  return String(t || "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/Sources:[\s\S]*$/, "")
    .replace(/[*_#`~>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 700);
}

function listenWeb(recRef) {
  return new Promise((resolve) => {
    const SRc = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SRc) return resolve("");
    const rec = new SRc();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    let got = "";
    rec.onresult = (e) => { try { got = e.results[0][0].transcript; } catch {} };
    rec.onend = () => resolve(got);
    rec.onerror = () => resolve(got);
    recRef.current = rec;
    try { rec.start(); } catch { resolve(""); }
  });
}

function speakWeb(text, synthRef) {
  return new Promise((resolve) => {
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1;
      u.pitch = 0.85;
      const v = (synth.getVoices() || []).find((x) => /male|david|daniel|alex/i.test(x.name));
      if (v) u.voice = v;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      synthRef.current = u;
      synth.speak(u);
    } catch { resolve(); }
  });
}

export default function CallMode({ onClose, onTurn, memory, screen }) {
  const [phase, setPhase] = useState("connecting");
  const [caption, setCaption] = useState("");
  const [heard, setHeard] = useState("");
  const [secs, setSecs] = useState(0);
  const [muted, setMuted] = useState(false);
  const alive = useRef(true);
  const loopId = useRef(0);
  const mutedRef = useRef(false);
  const history = useRef([]);
  const recRef = useRef(null);
  const synthRef = useRef(null);
  const emptyRounds = useRef(0);
  const wakeRef = useRef(null);

  function stopListening() {
    const P = nativePlugins();
    try { if (P && P.SpeechRecognition) quiet(P.SpeechRecognition.stop()); } catch {}
    try { if (recRef.current) recRef.current.abort(); } catch {}
  }

  function stopSpeaking() {
    const P = nativePlugins();
    try { if (P && P.TextToSpeech) quiet(P.TextToSpeech.stop()); } catch {}
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch {}
  }

  function fail(msg) {
    setPhase("error");
    setCaption(msg);
  }

  async function say(text) {
    const spoken = cleanForSpeech(text);
    if (!spoken || !alive.current) return;
    setPhase("speaking");
    const P = nativePlugins();
    if (P && P.TextToSpeech) {
      try { await P.TextToSpeech.speak({ text: spoken, lang: "en-US", rate: 1.0, pitch: 0.85, volume: 1.0 }); } catch {}
    } else {
      await speakWeb(spoken, synthRef);
    }
  }

  async function ask(text) {
    const msgs = [...history.current, { role: "user", content: text }].slice(-12);
    let image = "";
    if (screen) {
      try {
        const P5 = nativePlugins();
        if (P5 && P5.MyralisScreen) {
          for (let k = 0; k < 13 && !image; k++) {
            const f = await P5.MyralisScreen.frame();
            image = (f && f.image) || "";
            if (!image) await sleep(300);
          }
        }
      } catch {}
      if (!image) {
        const NP = nativePlugins();
        if (!NP || !NP.MyralisScreen) return "The screen plugin is missing from this app build. Reinstall the newest Myralis.apk from Releases.";
        return "Screen capture is on, but no frame has arrived yet. Move something on the screen, then ask again.";
      }
    }
    const res = await fetch(screen ? "/api/screen" : "/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs, memory, image })
    });
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok || data.error || !data.reply) throw new Error(data.error || ("HTTP " + res.status));
    return data.reply;
  }

  async function turnLoop(id) {
    const live = () => alive.current && id === loopId.current;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      fail("You're offline. Calls need an internet connection.");
      return;
    }
    const P = nativePlugins();
    const SR = P && P.SpeechRecognition;
    if (SR) {
      try {
        const perm = await SR.requestPermissions();
        if (perm && perm.speechRecognition !== "granted") { fail("Microphone permission denied."); return; }
      } catch (e) {
        fail("Mic error: " + (e && e.message ? e.message : e));
        return;
      }
    } else if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) {
      fail("This browser has no speech recognition. Use Chrome or the Myralis app.");
      return;
    }
    if (screen) {
      try {
        const P2 = nativePlugins();
        if (!P2 || !P2.MyralisScreen) { fail("Live screen needs the Myralis Android app."); return; }
        await P2.MyralisScreen.start();
      } catch (e) {
        fail("Screen sharing was not allowed.");
        return;
      }
    }
    await say("Hi, go ahead. I'm listening.");
    while (live()) {
      if (mutedRef.current) { setPhase("paused"); await sleep(400); continue; }
      setPhase("listening");
      let text = "";
      try {
        if (SR) {
          const r = await SR.start({ language: "en-US", maxResults: 1, partialResults: false, popup: false });
          text = (r && r.matches && r.matches[0]) || "";
        } else {
          text = await listenWeb(recRef);
        }
      } catch { text = ""; }
      if (!live()) return;
      text = String(text || "").trim();
      if (!text) {
        emptyRounds.current += 1;
        if (emptyRounds.current >= 5) { mutedRef.current = true; setMuted(true); }
        await sleep(300);
        continue;
      }
      emptyRounds.current = 0;
      setHeard(text);
      if (/^(goodbye|bye|bye bye|end call|hang up)\b/i.test(text)) {
        await say("Goodbye.");
        endCall();
        return;
      }
      setPhase("thinking");
      setCaption("");
      let reply = "";
      try {
        reply = await ask(text);
        history.current.push({ role: "user", content: text }, { role: "assistant", content: reply });
        if (onTurn) onTurn(text, reply);
      } catch (e) {
        reply = "Brain error: " + ((e && e.message) || "unknown");
      }
      if (!live()) return;
      setCaption(reply);
      await say(reply);
    }
  }

  function endCall() {
    alive.current = false;
    try { const P4 = nativePlugins(); if (screen && P4 && P4.MyralisScreen) quiet(P4.MyralisScreen.stop()); } catch {}
    loopId.current += 1;
    stopListening();
    stopSpeaking();
    try { if (wakeRef.current) wakeRef.current.release(); } catch {}
    if (onClose) onClose();
  }

  function toggleMute() {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    emptyRounds.current = 0;
    if (next) stopListening();
  }

  function tapOrb() {
    if (phase === "speaking") stopSpeaking();
    else if (mutedRef.current) { mutedRef.current = false; setMuted(false); emptyRounds.current = 0; }
  }

  useEffect(() => {
    alive.current = true;
    const id = ++loopId.current;
    const timer = setInterval(() => setSecs((s) => s + 1), 1000);
    try {
      if (navigator.wakeLock) navigator.wakeLock.request("screen").then((w) => { wakeRef.current = w; }).catch(() => {});
    } catch {}
    turnLoop(id);
    return () => {
      alive.current = false;
      loopId.current += 1;
      clearInterval(timer);
      stopListening();
      stopSpeaking();
      try { if (wakeRef.current) wakeRef.current.release(); } catch {}
    };
  }, []);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const labels = {
    connecting: "Connecting...",
    listening: "Listening...",
    thinking: "Thinking...",
    speaking: "Speaking - tap to interrupt",
    paused: "Muted - tap to resume",
    error: "Call problem"
  };
  const colors = { connecting: "#64748b", listening: "#22d3ee", thinking: "#a78bfa", speaking: "#34d399", paused: "#64748b", error: "#f87171" };
  const c = colors[phase] || "#22d3ee";
  const pulsing = phase === "listening" || phase === "speaking";

  return (
    <div style={styles.overlay}>
      <style>{"@keyframes myralisPulse{0%{transform:scale(1)}50%{transform:scale(1.1)}100%{transform:scale(1)}}"}</style>
      <div style={styles.top}>
        <div style={styles.name}>Myralis{screen ? " · Live screen" : ""}</div>
        <div style={styles.timer}>{mm}:{ss}</div>
      </div>
      <div style={styles.middle}>
        <button
          onClick={tapOrb}
          aria-label="Myralis"
          style={{
            ...styles.orb,
            background: "radial-gradient(circle at 35% 30%, " + c + ", #0f172a 75%)",
            boxShadow: "0 0 60px " + c + "66",
            animation: pulsing ? "myralisPulse 1.6s ease-in-out infinite" : "none"
          }}
        />
        <div style={{ ...styles.state, color: c }}>{labels[phase] || ""}</div>
        {heard ? <div style={styles.heard}>You: {heard}</div> : null}
        <div style={styles.caption}>{caption}</div>
      </div>
      <div style={styles.bottom}>
        <button onClick={toggleMute} style={{ ...styles.round, background: muted ? "#7c3aed" : "#1e293b" }}>{muted ? "🔇" : "🎙️"}</button>
        <button onClick={endCall} style={styles.end}>End call</button>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: "fixed", inset: 0, zIndex: 1100, background: "linear-gradient(180deg,#020617,#0b1020)", color: "#e2e8f0", display: "flex", flexDirection: "column", paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" },
  top: { textAlign: "center", padding: "18px 14px 0" },
  name: { fontSize: 20, fontWeight: 600 },
  timer: { fontSize: 13, opacity: 0.6, marginTop: 4, fontFamily: "monospace" },
  middle: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "0 22px", overflowY: "auto" },
  orb: { width: 170, height: 170, borderRadius: 999, border: "none", flex: "0 0 auto" },
  state: { fontSize: 15, letterSpacing: 0.5 },
  heard: { fontSize: 13, opacity: 0.6, textAlign: "center" },
  caption: { fontSize: 16, lineHeight: 1.45, textAlign: "center", maxWidth: 520 },
  bottom: { display: "flex", alignItems: "center", justifyContent: "center", gap: 18, padding: "16px 14px 26px" },
  round: { width: 58, height: 58, borderRadius: 999, border: "none", color: "#fff", fontSize: 22 },
  end: { height: 58, padding: "0 30px", borderRadius: 999, border: "none", background: "#dc2626", color: "#fff", fontSize: 16, fontWeight: 600 }
};
