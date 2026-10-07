"use client";

import { useEffect, useRef, useState } from "react";

export default function VisionHUD({ onClose, onAnalyze }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);
  const rafRef = useRef(null);
  const liveTimer = useRef(null);
  const lastLive = useRef(0);

  const [status, setStatus] = useState("Booting vision systems...");
  const [liveText, setLiveText] = useState("");
  const [liveMode, setLiveMode] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stream;
    let cancelled = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        if (cancelled) return;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();

        try {
          const cocoSsd = await import("@tensorflow-models/coco-ssd");
          await import("@tensorflow/tfjs");
          modelRef.current = await cocoSsd.load({ base: "lite_mobilenet_v2" });
        } catch {
          modelRef.current = null;
        }

        setReady(true);
        setStatus("FRIDAY VISION // online");
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
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, w, h);

        // HUD frame
        ctx.strokeStyle = "rgba(34,211,238,0.85)";
        ctx.lineWidth = 2;
        const m = 18;
        const L = 28;
        // corners
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
          try {
            const results = await model.detect(video);
            results.forEach((r) => {
              const [x, y, bw, bh] = r.bbox;
              ctx.strokeStyle = "#22d3ee";
              ctx.lineWidth = 2;
              ctx.strokeRect(x, y, bw, bh);
              ctx.fillStyle = "rgba(8,47,73,0.75)";
              const label = `${r.class} ${Math.round(r.score * 100)}%`;
              ctx.fillRect(x, Math.max(0, y - 18), ctx.measureText(label).width + 10, 18);
              ctx.fillStyle = "#a5f3fc";
              ctx.font = "12px monospace";
              ctx.fillText(label, x + 4, Math.max(12, y - 5));
            });
          } catch {}
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    start();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (liveTimer.current) clearInterval(liveTimer.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Live Gemini describe every 4s when enabled
  useEffect(() => {
    if (!ready || !liveMode) {
      if (liveTimer.current) clearInterval(liveTimer.current);
      return;
    }
    liveTimer.current = setInterval(() => {
      void liveDescribe();
    }, 4000);
    return () => clearInterval(liveTimer.current);
  }, [ready, liveMode]);

  function captureFrame(quality = 0.92) {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", quality);
  }

  async function liveDescribe() {
    const now = Date.now();
    if (now - lastLive.current < 3500) return;
    lastLive.current = now;
    const image = captureFrame(0.7);
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
        setStatus("FRIDAY VISION // tracking");
      }
    } catch {
      // ignore transient live errors
    }
  }

  async function analyze() {
    const image = captureFrame(0.93);
    if (!image || analyzing) return;
    setAnalyzing(true);
    setStatus("FRIDAY VISION // full analysis...");
    try {
      if (onAnalyze) {
        await onAnalyze(image, liveText || "");
      }
    } finally {
      setAnalyzing(false);
    }
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
        <button
          onClick={() => setLiveMode((v) => !v)}
          style={{ ...styles.btn, borderColor: liveMode ? "#22d3ee" : "#333" }}
        >
          {liveMode ? "Live describe: ON" : "Live describe: OFF"}
        </button>
        <button onClick={analyze} disabled={analyzing} style={styles.analyze}>
          {analyzing ? "Analyzing..." : "Full Analyze"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "#020617",
    color: "#e2e8f0",
    display: "flex",
    flexDirection: "column"
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 14px",
    borderBottom: "1px solid #164e63"
  },
  title: { fontSize: 12, letterSpacing: 2, color: "#22d3ee", fontFamily: "monospace" },
  status: { fontSize: 12, color: "#67e8f9", marginTop: 4, fontFamily: "monospace" },
  live: { fontSize: 14, color: "#f8fafc", marginTop: 8, lineHeight: 1.35 },
  close: {
    background: "transparent",
    border: "1px solid #334155",
    color: "#e2e8f0",
    borderRadius: 8,
    padding: "8px 12px"
  },
  stage: { position: "relative", flex: 1, background: "#000", overflow: "hidden" },
  video: { width: "100%", height: "100%", objectFit: "cover" },
  canvas: { position: "absolute", inset: 0, width: "100%", height: "100%" },
  bottom: {
    display: "flex",
    gap: 10,
    padding: "12px 14px",
    borderTop: "1px solid #164e63"
  },
  btn: {
    flex: 1,
    background: "#0f172a",
    border: "1px solid #333",
    color: "#e2e8f0",
    borderRadius: 10,
    padding: "12px 10px"
  },
  analyze: {
    flex: 1,
    background: "linear-gradient(135deg,#0891b2,#4f46e5)",
    border: "none",
    color: "white",
    borderRadius: 10,
    padding: "12px 10px",
    fontWeight: 600
  }
};
