"use client";

import { useEffect, useRef, useState } from "react";

function textOnly(messages) {
  return (messages || [])
    .filter((m) => m && m.content)
    .slice(-6)
    .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 600) }));
}

async function getSense(mode, payload) {
  const res = await fetch("/api/sense", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, ...payload })
  });
  const data = await res.json();
  return res.ok && Array.isArray(data.suggestions) ? data.suggestions : [];
}

export default function SpiderSense({ messages, input, loading, enabled, onSend, onFill }) {
  const [on, setOn] = useState(true);
  const [follow, setFollow] = useState([]);
  const [typing, setTyping] = useState([]);
  const lastKey = useRef("");
  const followId = useRef(0);
  const typingId = useRef(0);

  useEffect(() => {
    try { if (localStorage.getItem("myralis_sense") === "off") setOn(false); } catch {}
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    try { localStorage.setItem("myralis_sense", next ? "on" : "off"); } catch {}
  }

  const lastMsg = messages && messages.length ? messages[messages.length - 1] : null;

  useEffect(() => {
    if (!messages || messages.length < 2) {
      setFollow([]);
      lastKey.current = "";
      return;
    }
    if (!on || !enabled || loading) return;
    if (!lastMsg || lastMsg.role !== "assistant" || !lastMsg.content) return;
    const key = messages.length + ":" + String(lastMsg.content).length;
    if (key === lastKey.current) return;
    lastKey.current = key;
    setFollow([]);
    const id = ++followId.current;
    getSense("followups", { messages: textOnly(messages) })
      .then((s) => { if (id === followId.current) setFollow(s); })
      .catch(() => {});
  }, [messages, loading, on, enabled]);

  useEffect(() => {
    const q = (input || "").trim();
    if (!on || !enabled || loading || q.length < 5) {
      setTyping([]);
      return;
    }
    const id = ++typingId.current;
    const timer = setTimeout(() => {
      getSense("typing", { question: q, messages: textOnly(messages) })
        .then((s) => { if (id === typingId.current) setTyping(s); })
        .catch(() => {});
    }, 900);
    return () => clearTimeout(timer);
  }, [input, on, enabled, loading]);

  if (!enabled) return null;

  const q = (input || "").trim();
  const showTyping = on && q.length >= 5 && typing.length > 0;
  const showFollow =
    on && !showTyping && q.length === 0 && !loading &&
    lastMsg && lastMsg.role === "assistant" && messages.length >= 2 && follow.length > 0;
  const items = showTyping ? typing : showFollow ? follow : [];

  return (
    <div style={styles.wrap}>
      <div style={styles.row}>
        <button onClick={toggle} style={{ ...styles.toggle, opacity: on ? 1 : 0.5 }} title="Spider-Sense">🕷</button>
        {items.map((s, i) => (
          <button key={i} style={styles.chip} onClick={() => (showTyping ? onFill(s) : onSend(s))}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)",
    zIndex: 30,
    pointerEvents: "none"
  },
  row: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    padding: "6px 12px",
    alignItems: "center",
    pointerEvents: "auto"
  },
  toggle: {
    flex: "0 0 auto",
    width: 34,
    height: 34,
    borderRadius: 999,
    background: "#0f172a",
    border: "1px solid #7f1d1d",
    fontSize: 16
  },
  chip: {
    flex: "0 0 auto",
    maxWidth: "78vw",
    background: "rgba(15,23,42,0.96)",
    border: "1px solid #7c3aed",
    color: "#e9d5ff",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 14,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  }
};
