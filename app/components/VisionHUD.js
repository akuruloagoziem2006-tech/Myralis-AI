"use client";

import { useEffect, useRef, useState } from "react";

const MODES = [
  { id: "full", label: "Analyze" },
  { id: "text", label: "Read text" },
  { id: "identify", label: "Identify" },
  { id: "translate", label: "Translate" },
  { id: "solve", label: "Solve" },
  { id: "count", label: "Count" }
];

export default function VisionHUD({ onClose, onAnalyze }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);
  const rafRef = useRef(null);
  const liveTimer = useRef(null);
  const lastLive = useRef(0);
  const detectionsRef = useRef([]);
  const analyzingRef = useRef(false);

  const [status, setStatus] = useState("Booting vision systems...");
  const [liveText, setLiveText] = useState("");
  const [liveMode, setLiveMode] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState("environment");
  const [question, setQuestion] = useState("");

  useEffect(() => {
    let stream;
    let cancelled = false;
    let lastDetect = 0;
    setReady(false);
    setStatus("Starting camera...");

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();

        if (!modelRef.current) {
          try {
            const cocoSsd = await import("@tensorflow-models/coco-ssd");
            await import("@tensorflow/tfjs");
            modelRef.current = await cocoSsd.load({ base: "lite_mobilenet_v2" });
          } catch {
            modelRef.current = null;
          }
        }

        setReady(true);
        setStatus("MYRALIS VISION // online");
        loop();
      } catch {
        setStatus("Camera permission denied");
      }
    }

    async function loop() {
      if (cancelled) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const model = modelRef.current;
      if (video && canvas && video.readyState >= 2) {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = "rgba(34,211,238,0.85)";
        ctx.lineWidth = 2;
        const m = 18;
        const L = 28;
        [[m, m], [w - m, m], [m, h - m], [w - m, h - m]].forEach(([x, y], i) => {
          ctx.beginPath();
          const dx = i % 2 === 0 ? L : -L;
          const dy = i < 2 ? L : -L;
          ctx.moveTo(x, y + dy);
          ctx.lineTo(x, y);
          ctx.lineTo(x + dx, y);
          ctx.stroke();
        });

        if (model) {
          const now = Date.now();
          if (now - lastDetect > 300) {
            lastDetect = now;
            try { detectionsRef.current = await model.detect(video); } catch {}
          }
          detectionsRef.current.forEach((r) => {
            const [x, y, bw, bh] = r.bbox;
            ctx.strokeStyle = "#22d3ee";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, bw, bh);
            ctx.fillStyle = "rgba(8,47,73,0.75)";
            ctx.font = "12px monospace";
            const label = `${r.class} ${Math.round(r.score * 100)}%`;
            ctx.fillRect(x, Math.max(0, y - 18), ctx.measureText(label).width + 10, 18);
            ctx.fillStyle = "#a5f3fc";
            ctx.fillText(label, x + 4, Math.max(12, y - 5));
          });
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    start();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [facing]);

  useEffect(() => {
    if (!ready || !liveMode) {
      if (liveTimer.current) clearInterval(liveTimer.current);
      return;
    }
    liveTimer.current = setInterval(() => { void liveDescribe(); }, 6000);
    return () => clearInterval(liveTimer.current);
  }, [ready, liveMode]);

  function captureFrame(quality = 0.85, maxDim = 1280) {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  }

  function detectionSummary() {
    const counts = {};
    detectionsRef.current.forEach((r) => { counts[r.class] = (counts[r.class] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => (v > 1 ? `${k} x${v}` : k)).join(", ");
  }

  async function liveDescribe() {
    if (analyzingRef.current || document.hidden) return;
    const now = Date.now();
    if (now - lastLive.current < 5500) return;
    lastLive.current = now;
    const image = captureFrame(0.7, 640);
    if (!image) return;
    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, mode: "live" })
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setLiveText(data.reply);
        setStatus("MYRALIS VISION // tracking");
      }
    } catch {}
  }

  async function analyze(mode = "full", q = "") {
    if (analyzingRef.current) return;
    const image = captureFrame(0.8, 1024);
    if (!image) return;
    analyzingRef.current = true;
    setAnalyzing(true);
    setStatus("MYRALIS VISION // analyzing...");
    try {
      if (onAnalyze) await onAnalyze(image, detectionSummary(), mode, q);
    } finally {
      analyzingRef.current = false;
      setAnalyzing(false);
    }
  }

  function ask() {
    const q = question.trim();
    if (!q) return;
    setQuestion("");
    analyze("ask", q);
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.topBar}>
        <div>
          <div style={styles.title}>MYRALIS VISION</div>
          <div style={styles.status}>{status}</div>
          {liveText ? <div style={styles.live}>{liveText}</div> : null}
        </div>
        <button onClick={onClose} style={styles.close}>Close</button>
      </div>

      <div style={styles.stage}>
        <video ref={videoRef} playsInline muted style={styles.video} />
        <canvas ref={canvasRef} style={styles.canvas} />
      </div>

      <div style={styles.bottom}>
        <div style={styles.chips}>
          {MODES.map((m) => (
            <button key={m.id} onClick={() => analyze(m.id)} disabled={analyzing || !ready} style={styles.chip}>
              {m.label}
            </button>
          ))}
        </div>
        <div style={styles.askRow}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") ask(); }}
            placeholder="Ask anything about what the camera sees..."
            style={styles.input}
          />
          <button onClick={ask} disabled={analyzing || !ready} style={styles.analyze}>
            {analyzing ? "..." : "Ask"}
          </button>
        </div>
        <div style={styles.row}>
          <button
            onClick={() => setLiveMode((v) => !v)}
            style={{ ...styles.btn, borderColor: liveMode ? "#22d3ee" : "#333" }}
          >
            {liveMode ? "Live describe: ON" : "Live describe: OFF"}
          </button>
          <button
            onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
            style={styles.btn}
          >
            Flip camera
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: "fixed", inset: 0, zIndex: 1000, background: "#020617", color: "#e2e8f0", display: "flex", flexDirection: "column" },
  topBar: { display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 14px", borderBottom: "1px solid #164e63" },
  title: { fontSize: 12, letterSpacing: 2, color: "#22d3ee", fontFamily: "monospace" },
  status: { fontSize: 12, color: "#67e8f9", marginTop: 4, fontFamily: "monospace" },
  live: { fontSize: 14, color: "#f8fafc", marginTop: 8, lineHeight: 1.35 },
  close: { background: "transparent", border: "1px solid #334155", color: "#e2e8f0", borderRadius: 8, padding: "8px 12px", height: 38 },
  stage: { position: "relative", flex: 1, background: "#000", overflow: "hidden" },
  video: { width: "100%", height: "100%", objectFit: "cover" },
  canvas: { position: "absolute", inset: 0, width: "100%", height: "100%" },
  bottom: { display: "flex", flexDirection: "column", gap: 10, padding: "12px 14px", borderTop: "1px solid #164e63" },
  chips: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 },
  chip: { flex: "0 0 auto", background: "#0f172a", border: "1px solid #155e75", color: "#a5f3fc", borderRadius: 999, padding: "9px 14px", whiteSpace: "nowrap" },
  askRow: { display: "flex", gap: 8 },
  input: { flex: 1, minWidth: 0, background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0", borderRadius: 10, padding: "11px 12px", fontSize: 14 },
  row: { display: "flex", gap: 10 },
  btn: { flex: 1, background: "#0f172a", border: "1px solid #333", color: "#e2e8f0", borderRadius: 10, padding: "12px 10px" },
  analyze: { background: "linear-gradient(135deg,#0891b2,#4f46e5)", border: "none", color: "white", borderRadius: 10, padding: "11px 18px", fontWeight: 600 }
};
