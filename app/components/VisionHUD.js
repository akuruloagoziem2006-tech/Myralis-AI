"use client";

import { useEffect, useRef, useState } from "react";

export default function VisionHUD({ onClose, onAnalyze, isOnline }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const [status, setStatus] = useState("Loading vision model...");
  const [ready, setReady] = useState(false);
  const [detections, setDetections] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [liveSummary, setLiveSummary] = useState("");

  useEffect(() => {
    let active = true;

    async function setup() {
      try {
        setStatus("Starting camera...");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });
        if (!active) return;
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStatus("Loading detection model...");
        const cocoSsd = await import("@tensorflow-models/coco-ssd");
        await import("@tensorflow/tfjs");
        const model = await cocoSsd.load({ base: "lite_mobilenet_v2" });
        if (!active) return;
        modelRef.current = model;

        setReady(true);
        setStatus("JARVIS VISION // scanning");
        detectLoop();
      } catch (err) {
        console.error(err);
        setStatus("Camera or model failed. Allow camera permission and try again.");
      }
    }

    setup();

    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function detectLoop() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const model = modelRef.current;
    if (!video || !canvas || !model) return;

    if (video.readyState >= 2) {
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;

      try {
        const results = await model.detect(video);
        setDetections(results);
        const labels = results.slice(0, 6).map(r => r.class);
        const unique = [...new Set(labels)];
        setLiveSummary(unique.length ? unique.join(" · ") : "scanning environment…");
        setStatus(unique.length ? `SEEING: ${unique.join(", ")}` : "JARVIS VISION // scanning");

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, width, height);
        ctx.lineWidth = 2;
        ctx.font = "14px monospace";

        results.forEach((pred) => {
          const [x, y, w, h] = pred.bbox;
          const label = `${pred.class} ${Math.round(pred.score * 100)}%`;

          // Jarvis-style box
          ctx.strokeStyle = "#22d3ee";
          ctx.fillStyle = "rgba(34, 211, 238, 0.12)";
          ctx.fillRect(x, y, w, h);
          ctx.strokeRect(x, y, w, h);

          // Corner accents
          const len = 12;
          ctx.beginPath();
          ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
          ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
          ctx.moveTo(x, y + h - len); ctx.lineTo(x, y + h); ctx.lineTo(x + len, y + h);
          ctx.moveTo(x + w - len, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - len);
          ctx.stroke();

          // Label background
          const textWidth = ctx.measureText(label).width;
          ctx.fillStyle = "rgba(8, 12, 20, 0.85)";
          ctx.fillRect(x, Math.max(0, y - 22), textWidth + 10, 20);
          ctx.fillStyle = "#67e8f9";
          ctx.fillText(label, x + 5, Math.max(14, y - 7));
        });
      } catch (err) {
        // ignore frame errors
      }
    }

    rafRef.current = requestAnimationFrame(detectLoop);
  }

  async function handleAnalyze() {
    if (!videoRef.current || analyzing) return;
    setAnalyzing(true);

    try {
      const video = videoRef.current;
      const temp = document.createElement("canvas");
      temp.width = video.videoWidth || 640;
      temp.height = video.videoHeight || 480;
      const ctx = temp.getContext("2d");
      ctx.drawImage(video, 0, 0, temp.width, temp.height);
      const dataUrl = temp.toDataURL("image/jpeg", 0.85);

      const summary = detections.length
        ? detections.map((d) => `\( {d.class} ( \){Math.round(d.score * 100)}%)`).join(", ")
        : "no clear objects";

      if (onAnalyze) {
        await onAnalyze(dataUrl, summary);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setStatus("Analyze failed. Try again.");
    }

    setAnalyzing(false);
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.topBar}>
        <div>
          <div style={styles.title}>MYRALIS VISION</div>
          <div style={styles.sub}>{status}</div>
        </div>
        <button onClick={onClose} style={styles.closeBtn}>Close</button>
      </div>

      <div style={styles.stage}>
        <video ref={videoRef} playsInline muted style={styles.video} />
        <canvas ref={canvasRef} style={styles.canvas} />
      </div>

      <div style={styles.bottomBar}>
        <div style={styles.detectList}>
          {detections.length === 0 ? (
            <span style={{ color: "#64748b" }}>Point camera at an object…</span>
          ) : (
            detections.slice(0, 4).map((d, i) => (
              <span key={i} style={styles.chip}>
                {d.class} {Math.round(d.score * 100)}%
              </span>
            ))
          )}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!ready || analyzing}
          style={{
            ...styles.analyzeBtn,
            opacity: !ready || analyzing ? 0.5 : 1
          }}
        >
          {analyzing ? "Analyzing..." : isOnline ? "Analyze with Gemini" : "Capture Description"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    background: "#020617",
    display: "flex",
    flexDirection: "column",
    color: "#e2e8f0",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    borderBottom: "1px solid rgba(34,211,238,0.25)",
    background: "rgba(2,6,23,0.95)"
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: "#22d3ee"
  },
  sub: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 3
  },
  closeBtn: {
    background: "rgba(15,23,42,0.9)",
    border: "1px solid rgba(34,211,238,0.35)",
    color: "#e2e8f0",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 13,
    cursor: "pointer"
  },
  stage: {
    position: "relative",
    flex: 1,
    overflow: "hidden",
    background: "#000"
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  canvas: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%"
  },
  bottomBar: {
    padding: "12px 14px 16px",
    borderTop: "1px solid rgba(34,211,238,0.25)",
    background: "rgba(2,6,23,0.96)"
  },
  detectList: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    minHeight: 28,
    marginBottom: 10
  },
  chip: {
    fontSize: 11,
    color: "#67e8f9",
    border: "1px solid rgba(34,211,238,0.35)",
    borderRadius: 999,
    padding: "4px 8px",
    background: "rgba(8,47,73,0.45)"
  },
  analyzeBtn: {
    width: "100%",
    border: "none",
    borderRadius: 12,
    padding: "12px 14px",
    background: "linear-gradient(135deg, #0891b2, #7c3aed)",
    color: "white",
    fontSize: 14,
    fontWeight: 650,
    cursor: "pointer"
  }
};
