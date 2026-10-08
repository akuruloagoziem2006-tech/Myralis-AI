"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import VisionHUD from "./components/VisionHUD";
import CallMode from "./components/CallMode";
import SettingsPanel from "./components/SettingsPanel";
import SpiderSense from "./components/SpiderSense";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const [listening, setListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const [image, setImage] = useState(null);
  const [pastChats, setPastChats] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState("");
  const [liked, setLiked] = useState({});
  const [renamingId, setRenamingId] = useState(null);
  const [renameText, setRenameText] = useState("");
  const [memory, setMemory] = useState("");
  const [editMemory, setEditMemory] = useState(false);
  const [memoryDraft, setMemoryDraft] = useState("");
  const [showMemory, setShowMemory] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [useLocal, setUseLocal] = useState(false);
  const [localStatus, setLocalStatus] = useState("unknown");
  const [showVision, setShowVision] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState("system");
  const [senseOn, setSenseOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  const chatEnd = useRef(null);
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

  const LOCAL_URL = "http://127.0.0.1:8766";

  useEffect(() => {
    if (!document.getElementById("native-voice")) { const nv = document.createElement("script"); nv.id = "native-voice"; nv.src = "/native-voice.js"; document.head.appendChild(nv); }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        // Check for updates on load and when app is opened again
        try { reg.update(); } catch {}
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              // Activate new worker immediately
              worker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      }).catch(() => {});

      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }

    setIsOnline(navigator.onLine);
    const savedTheme = localStorage.getItem("myralis_theme");
    if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    const saved = localStorage.getItem("myralis_messages");
    const speak = localStorage.getItem("myralis_autoSpeak");
    const chats = localStorage.getItem("myralis_past_chats");
    const savedMemory = localStorage.getItem("myralis_memory");
    const savedLocal = localStorage.getItem("myralis_use_local");

    if (saved) setMessages(JSON.parse(saved));
    else {
      setMessages([{
        role: "assistant",
        content: "Hello — I'm **Myralis**, your AI assistant for learning, writing, planning, and everyday questions. Pick a prompt below or type your own. You can also use **voice**, **images**, or **live Vision**."
      }]);
    }

    if (speak !== null) setAutoSpeak(speak === "true"); else setAutoSpeak(false);
    if (chats) setPastChats(JSON.parse(chats));
    if (savedMemory) setMemory(savedMemory);
    setUseLocal(false); // public app: Gemini only

    checkLocalServer();

    const isLight = theme === "light" || (theme === "system" && typeof window !== "undefined" && !window.matchMedia("(prefers-color-scheme: dark)").matches);
  const isDarkTheme = !isLight;
  const c = isLight
    ? {
        bg: "#f7f7f8",
        panel: "#ffffff",
        panel2: "#ececf1",
        text: "#0d0d0d",
        muted: "#6b6b76",
        border: "#e5e5e5",
        user: "#1a1a1a",
        userText: "#ffffff",
        assistant: "transparent",
        inputBg: "#ffffff",
        accent: "#7c3aed",
        danger: "#b91c1c"
      }
    : {
        bg: "#0a0a0c",
        panel: "#111114",
        panel2: "#1a1a1f",
        text: "#ececf1",
        muted: "#8b8b98",
        border: "#2a2a32",
        user: "#2f2f3a",
        userText: "#f4f4f5",
        assistant: "transparent",
        inputBg: "#1a1a1f",
        accent: "#8b5cf6",
        danger: "#f87171"
      };

  return (
) => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem("myralis_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (loading) {
      setThinkingSeconds(0);
      timerRef.current = setInterval(() => setThinkingSeconds((p) => p + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setThinkingSeconds(0);
    }
    const isLight = theme === "light" || (theme === "system" && typeof window !== "undefined" && !window.matchMedia("(prefers-color-scheme: dark)").matches);
  const isDarkTheme = !isLight;
  const c = isLight
    ? {
        bg: "#f7f7f8",
        panel: "#ffffff",
        panel2: "#ececf1",
        text: "#0d0d0d",
        muted: "#6b6b76",
        border: "#e5e5e5",
        user: "#1a1a1a",
        userText: "#ffffff",
        assistant: "transparent",
        inputBg: "#ffffff",
        accent: "#7c3aed",
        danger: "#b91c1c"
      }
    : {
        bg: "#0a0a0c",
        panel: "#111114",
        panel2: "#1a1a1f",
        text: "#ececf1",
        muted: "#8b8b98",
        border: "#2a2a32",
        user: "#2f2f3a",
        userText: "#f4f4f5",
        assistant: "transparent",
        inputBg: "#1a1a1f",
        accent: "#8b5cf6",
        danger: "#f87171"
      };

  return (
) => clearInterval(timerRef.current);
  }, [loading]);

  async function checkLocalServer() {
    try {
      const res = await fetch(`${LOCAL_URL}/status`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        setLocalStatus("online");
        return true;
      }
    } catch {
      setLocalStatus("offline");
    }
    return false;
  }

  function saveMemory(newMemory) {
    setMemory(newMemory);
    localStorage.setItem("myralis_memory", newMemory);
  }

  function savePastChats(chats) {
    setPastChats(chats);
    localStorage.setItem("myralis_past_chats", JSON.stringify(chats));
  }

  function toggleLocalMode() {
    const newValue = !useLocal;
    setUseLocal(newValue);
    localStorage.setItem("myralis_use_local", newValue.toString());
    if (newValue) checkLocalServer();
  }

      function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    const clean = String(text)
      .replace(/[*#`_\~\[\]]/g, "")
      .replace(/\n+/g, ". ");
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 0.95;
    utterance.pitch = 0.85;
    utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const maleVoice =
      voices.find((v) => /male|david|james|daniel|google uk english male|microsoft david|microsoft mark/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith("en") && /male/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (maleVoice) utterance.voice = maleVoice;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeaking(false);
  }
  function toggleTheme() {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("myralis_theme", next);
      return next;
    });
  }

  function setThemePersist(next) {
    setTheme(next);
    localStorage.setItem("myralis_theme", next);
  }

  function toggleSensePersist() {
    setSenseOn((v) => {
      const next = !v;
      localStorage.setItem("myralis_sense", next ? "on" : "off");
      return next;
    });
  }

  function clearAllChats() {
    setPastChats([]);
    localStorage.removeItem("myralis_past_chats");
    setShowSettings(false);
  }

  function clearMemoryOnly() {
    setMemory("");
    localStorage.removeItem("myralis_memory");
  }

  function newChat() {
    if (messages.length > 1) {
      const title = messages.find((m) => m.role === "user")?.content?.slice(0, 40) || "New conversation";
      const updated = [{ id: Date.now(), title, messages, pinned: false }, ...pastChats].slice(0, 30);
      savePastChats(updated);
    }
    const welcomeMsg = [{ role: "assistant", content: "Hello — I'm **Myralis**, your AI assistant for learning, writing, planning, and everyday questions. Pick a prompt below or type your own. You can also use **voice**, **images**, or **live Vision**." }];
    setMessages(welcomeMsg);
    localStorage.setItem("myralis_messages", JSON.stringify(welcomeMsg));
    setShowDashboard(false);
  }

  function loadChat(chat) {
    setMessages(chat.messages);
    localStorage.setItem("myralis_messages", JSON.stringify(chat.messages));
    setShowDashboard(false);
  }

  function deleteChat(id) {
    savePastChats(pastChats.filter((c) => c.id !== id));
  }

  function togglePin(id) {
    const updated = pastChats.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c));
    updated.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    savePastChats(updated);
  }

  function startRename(chat) {
    setRenamingId(chat.id);
    setRenameText(chat.title);
  }

  function saveRename(id) {
    if (!renameText.trim()) return;
    savePastChats(pastChats.map((c) => (c.id === id ? { ...c, title: renameText.trim() } : c)));
    setRenamingId(null);
    setRenameText("");
  }

  function toggleSpeak() {
    const newValue = !autoSpeak;
    setAutoSpeak(newValue);
    localStorage.setItem("myralis_autoSpeak", newValue.toString());
  }

  function copyText(text) {
    navigator.clipboard.writeText(text.replace(/[*#`_]/g, ""));
  }

  function shareText(text) {
    if (navigator.share) {
      navigator.share({ text: text.replace(/[*#`_]/g, "") });
    } else {
      copyText(text);
      alert("Copied to clipboard");
    }
  }

  function startEdit(index, content) {
    setEditingIndex(index);
    setEditText(content);
  }

  function saveEdit(index) {
    const updated = [...messages];
    updated[index].content = editText;
    setMessages(updated);
    setEditingIndex(null);
    setEditText("");
  }

  function regenerate(index) {
    if (index === 0) return;
    const userMsg = messages[index - 1];
    if (userMsg.role !== "user") return;
    const newMessages = messages.slice(0, index);
    setMessages(newMessages);
    setTimeout(() => sendMessageWithText(userMsg.content, newMessages), 100);
  }

  function toggleLike(index, value) {
    setLiked((prev) => ({ ...prev, [index]: value }));
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const NativeSR = window.Capacitor?.Plugins?.SpeechRecognition;
    if (NativeSR) {
      (async () => {
        try {
          const perm = await NativeSR.requestPermissions();
          if (perm?.speechRecognition !== "granted") { alert("Microphone permission denied."); return; }
          setListening(true);
          const r = await NativeSR.start({ language: "en-US", maxResults: 1, partialResults: false, popup: false });
          setListening(false);
          const t = r?.matches?.[0];
          if (t) { setInput(t); setTimeout(() => sendMessageWithText(t), 200); }
        } catch (e) {
          setListening(false);
          alert("Mic error: " + (e?.message || e));
        }
      })();
      return;
    }
    if (!SpeechRecognition) return alert("Speech recognition not supported.");
    try { window.speechSynthesis?.cancel(); } catch {}
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setTimeout(() => sendMessageWithText(transcript), 200);
    };
    recognition.onerror = () => setListening(false);
    recognition.start();
  }

  function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result);
    reader.readAsDataURL(file);
  }

  async function sendToLocal(message) {
    const res = await fetch(`${LOCAL_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) throw new Error("Local server error");
    const data = await res.json();
    return data.reply;
  }

  async function sendToGemini(updatedMessages) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: updatedMessages.slice(-12).map((m, i, a) => i === a.length - 1 ? m : { ...m, image: null }),
        memory
      })
    });
    let data = {};
    try { data = await res.json(); } catch {
      throw new Error("Bad response from /api/chat (HTTP " + res.status + ")");
    }
    if (!res.ok || data.error) {
      throw new Error(data.error || ("HTTP " + res.status));
    }
    if (!data.reply) throw new Error("Empty reply from model");
    if (data.updatedMemory) saveMemory(data.updatedMemory);
    return data.reply;
  }

  async function sendMessageWithText(text, currentMessages = messages) {
    if ((!text.trim() && !image) || loading) return;

    const userMessage = text.trim() || "What do you see in this image?";
    setInput("");
    setLoading(true);
    try { window.speechSynthesis?.cancel(); } catch {}

    const newUserMsg = { role: "user", content: userMessage, image: image || null };
    let updatedMessages = currentMessages === messages ? [...messages, newUserMsg] : currentMessages;
    if (currentMessages === messages) setMessages(updatedMessages);
    setImage(null);

    try {
      let reply = "";
      const preferLocal = false; // public app: always Gemini when online

      if (preferLocal) {
        try {
          reply = await sendToLocal(userMessage);
          setLocalStatus("online");
        } catch {
          setLocalStatus("offline");
          if (!isOnline) {
            reply = `You're offline and the **local Myralis server** is not running.

To use Local AI:
1. Open Termux
2. Run: python myralis_server.py
3. Try again`;
          } else {
            try {
              reply = await sendToGemini(updatedMessages);
            } catch {
              reply = "Myralis is busy right now. Please try again in a moment.";
            }
          }
        }
      } else {
        try {
          reply = await sendToGemini(updatedMessages);
        } catch (geminiErr) {
          reply = "Myralis API error: " + (geminiErr?.message || "unknown error");
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      if (autoSpeak) { try { speak(reply); } catch {} }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong on my side. Please try again." }]);
    }

    setLoading(false);
  }


  async function handleVisionAnalyze(dataUrl, summary, mode = "full", question = "") {
    setLoading(true);
    setShowVision(false);
    const labels = {
      full: "Full vision analysis of this camera frame.",
      text: "Read all the text in this camera frame.",
      identify: "Identify what is in this camera frame.",
      translate: "Translate the text in this camera frame.",
      solve: "Solve what is shown in this camera frame.",
      count: "Count the objects in this camera frame."
    };
    setMessages((prev) => [...prev, {
      role: "user",
      content: mode === "ask" ? question : (labels[mode] || labels.full),
      image: dataUrl
    }]);
    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, mode, question, detections: summary })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || ("HTTP " + res.status));
      const reply = data.reply || "I could not analyze that frame.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      if (autoSpeak) { try { speak(reply); } catch {} }
    } catch (err) {
      const offline = summary ? "\n\nWhat my on-device detector sees: " + summary + "." : "";
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Vision analysis failed: " + (err?.message || "unknown error") + offline
      }]);
    }
    setLoading(false);
  }

  function sendMessage() {
    sendMessageWithText(input);
  }


  const sortedChats = [...pastChats].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const statusText = isOnline ? "Online" : "Offline";
  const statusColor = isOnline ? "#4ade80" : "#f87171";

  const isLight = theme === "light" || (theme === "system" && typeof window !== "undefined" && !window.matchMedia("(prefers-color-scheme: dark)").matches);
  const isDarkTheme = !isLight;
  const c = isLight
    ? {
        bg: "#f7f7f8",
        panel: "#ffffff",
        panel2: "#ececf1",
        text: "#0d0d0d",
        muted: "#6b6b76",
        border: "#e5e5e5",
        user: "#1a1a1a",
        userText: "#ffffff",
        assistant: "transparent",
        inputBg: "#ffffff",
        accent: "#7c3aed",
        danger: "#b91c1c"
      }
    : {
        bg: "#0a0a0c",
        panel: "#111114",
        panel2: "#1a1a1f",
        text: "#ececf1",
        muted: "#8b8b98",
        border: "#2a2a32",
        user: "#2f2f3a",
        userText: "#f4f4f5",
        assistant: "transparent",
        inputBg: "#1a1a1f",
        accent: "#8b5cf6",
        danger: "#f87171"
      };

  return (

    <div style={{ ...styles.page, background: c.bg, color: c.text }}>
      {/* Header */}
      <header style={{ ...styles.header, background: c.panel, borderBottom: `1px solid ${c.border}` }}>
        <div style={styles.brand} onClick={() => setShowDashboard(true)}>
          <div style={styles.logoMark}>✧</div>
          <div>
            <div style={styles.brandName}>Myralis</div>
            <div style={{ ...styles.statusLine, color: statusColor }}>{statusText}</div>
          </div>
        </div>
          <button onClick={newChat} style={styles.newChatBtn}>+ New</button>
      </header>

      {/* Side Menu */}
      {showDashboard && (
          <div style={styles.menuOverlay} onClick={() => setShowDashboard(false)}>
            <div style={styles.menuDrawer} onClick={(e) => e.stopPropagation()}>
              <div style={styles.menuProfile}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={styles.menuAvatar}>✦</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>Myralis</div>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>Personal AI</div>
                  </div>
                </div>
                <button onClick={() => setShowDashboard(false)} style={styles.menuIconBtn}>✕</button>
              </div>
              <div style={styles.menuCard}>
                <button onClick={() => { newChat(); setShowDashboard(false); }} style={styles.menuRow}>
                  <span style={styles.menuRowIcon}>✏️</span> New Chat
                </button>
                <button onClick={() => { setShowDashboard(false); setShowSettings(true); }} style={styles.menuRow}>
                  <span style={styles.menuRowIcon}>⚙️</span> Settings
                </button>
              </div>
              <div style={styles.menuSectionLabel}>Conversations</div>
              <div style={styles.menuCard}>
                {(() => {
                  const q = (chatSearch || "").trim().toLowerCase();
                  const list = (pastChats || []).filter((c) =>
                    !q || String(c.title || "").toLowerCase().includes(q)
                  );
                  if (!list.length) {
                    return (
                      <div style={{ padding: "14px 16px", opacity: 0.55, fontSize: 14 }}>
                        {q ? "No matches" : "No conversations yet"}
                      </div>
                    );
                  }
                  return list.map((chat) => (
                    <div key={chat.id} style={styles.menuChatRow}>
                      <button
                        onClick={() => { setMessages(chat.messages || []); setShowDashboard(false); }}
                        style={styles.menuChatMain}
                      >
                        <div style={styles.menuChatTitle}>
                          {(chat.pinned ? "📌 " : "") + (chat.title || "Chat")}
                        </div>
                      </button>
                      <div style={styles.menuChatActions}>
                        <button onClick={() => togglePin(chat.id)} style={styles.menuTiny} title="Pin">📌</button>
                        <button onClick={() => startRename(chat)} style={styles.menuTiny} title="Rename">✏️</button>
                        <button onClick={() => deleteChat(chat.id)} style={styles.menuTiny} title="Delete">🗑️</button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
              <div style={styles.menuBottomBar}>
                <div style={styles.menuSearchWrap}>
                  <span style={{ opacity: 0.5 }}>🔍</span>
                  <input
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    placeholder="Search"
                    style={styles.menuSearchInput}
                  />
                </div>
                <button onClick={() => { setShowDashboard(false); setShowSettings(true); }} style={styles.menuBottomBtn} title="Settings">⚙️</button>
                <button onClick={() => { newChat(); setShowDashboard(false); }} style={styles.menuBottomBtn} title="New chat">✏️</button>
              </div>
            </div>
          </div>
        )}

      {/* Chat Area */}
      <main style={{ ...styles.chat, background: c.bg, paddingBottom: 220 }}>
        <div style={styles.chatInner}>
          
        {messages.length <= 1 && !loading && (
          <div style={styles.quickWrap}>
            {[
              "Explain quantum computing in simple terms",
              "Help me plan a productive day",
              "Improve this paragraph: paste your text",
              "What should I learn to get better at coding?"
            ].map((p) => (
              <button key={p} onClick={() => sendMessageWithText(p)} style={{ ...styles.quickChip, color: c.text, borderColor: c.border, background: c.panel }}>{p}</button>
            ))}
            {typeof window !== "undefined" && !localStorage.getItem("myralis_seen_install_tip") && (
              <div
                style={styles.installTip}
                onClick={() => localStorage.setItem("myralis_seen_install_tip", "1")}
              >
                Tip: Install Myralis from your browser menu → Add to Home Screen
              </div>
            )}
          </div>
        )}

          {messages.map((msg, i) => (
            <div key={i} style={styles.messageBlock}>
              <div style={{
                ...styles.bubble,
                ...(msg.role === "user" ? styles.userBubble : styles.assistantBubble),
                background: msg.role === "user" ? c.user : c.assistant,
                color: msg.role === "user" ? c.userText : c.text
              }}>
                {msg.image && <img src={msg.image} alt="upload" style={styles.image} />}
                {editingIndex === i ? (
                  <div>
                    <textarea value={editText} onChange={(e) => setEditText(e.target.value)} style={styles.editArea} rows={3} />
                    <div style={styles.editActions}>
                      <button onClick={() => saveEdit(i)} style={styles.primaryBtn}>Save</button>
                      <button onClick={() => setEditingIndex(null)} style={styles.secondaryBtn}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  msg.role === "assistant" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({node, ...props}) => <p style={{ margin: "0 0 12px" }} {...props} />,
                        ul: ({node, ...props}) => <ul style={{ margin: "0 0 12px", paddingLeft: 22 }} {...props} />,
                        ol: ({node, ...props}) => <ol style={{ margin: "0 0 12px", paddingLeft: 22 }} {...props} />,
                        li: ({node, ...props}) => <li style={{ marginBottom: 6 }} {...props} />,
                        h1: ({node, ...props}) => <h1 style={{ margin: "18px 0 10px", fontSize: 22 }} {...props} />,
                        h2: ({node, ...props}) => <h2 style={{ margin: "16px 0 8px", fontSize: 18 }} {...props} />,
                        h3: ({node, ...props}) => <h3 style={{ margin: "14px 0 8px", fontSize: 16 }} {...props} />,
                        hr: ({node, ...props}) => <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid rgba(127,127,127,0.25)" }} {...props} />
                      }}
                    >{msg.content}</ReactMarkdown>
                  ) : msg.content
                )}
              </div>

              {editingIndex !== i && (
                <div style={{
                  ...styles.actions,
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
                }}>
                  {msg.role === "user" ? (
                    <>
                      <button onClick={() => startEdit(i, msg.content)} style={styles.actionBtn} title="Edit">✏️</button>
                      <button onClick={() => copyText(msg.content)} style={styles.actionBtn} title="Copy">📋</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => copyText(msg.content)} style={styles.actionBtn} title="Copy">📋</button>
                      <button onClick={() => shareText(msg.content)} style={styles.actionBtn} title="Share">🔗</button>
                      <button onClick={() => toggleLike(i, "like")} style={{ ...styles.actionBtn, color: liked[i] === "like" ? "#4ade80" : undefined }}>👍</button>
                      <button onClick={() => toggleLike(i, "unlike")} style={{ ...styles.actionBtn, color: liked[i] === "unlike" ? "#f87171" : undefined }}>👎</button>
                      <button onClick={() => speak(msg.content)} style={styles.actionBtn}>🔊</button>
                      <button onClick={() => regenerate(i)} style={styles.actionBtn} title="Regenerate">🔄</button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

          
          
          
          {loading && (
            <div style={{ ...styles.bubble, ...styles.assistantBubble, opacity: 0.9 }}>
              Thinking… {thinkingSeconds}s
            </div>
          )}
          <div className="myralis-bottom-spacer" style={{ height: 220, flexShrink: 0 }} />
          <div ref={chatEnd} />
        </div>
      </main>

      {image && (
        <div style={styles.previewBar}>
          <img src={image} alt="preview" style={styles.previewImage} />
          <button onClick={() => setImage(null)} style={styles.removeBtn}>✕</button>
        </div>
      )}

      {/* Input */}
      <footer style={styles.footer}>
        <div style={{ ...styles.inputWrapper, background: c.inputBg, borderColor: c.border, color: c.text }}>
          <button
            onClick={speaking ? stopSpeaking : startListening}
            style={{
              ...styles.toolBtn,
              background: listening || speaking ? "rgba(96,165,250,0.2)" : "transparent",
              color: listening || speaking ? "#60a5fa" : "#71717a"
            }}
            title={speaking ? "Stop speaking" : "Voice input"}
          >
            {speaking ? "⏹" : listening ? "●" : "🎙"}
          </button>
          <button onClick={() => fileInputRef.current?.click()} style={styles.toolBtn}>🖼</button>
          <button onClick={() => setShowVision(true)} style={styles.toolBtn} title="Vision">👁</button>
          <button onClick={() => setShowCall(true)} style={styles.toolBtn} title="Call Myralis">📞</button>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImage} hidden />
          <input
            style={{ ...styles.input, color: c.text }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Message Myralis..."
          />
          <button
            onClick={sendMessage}
            disabled={loading || (!input.trim() && !image)}
            style={{ ...styles.sendBtn, background: c.accent, opacity: loading || (!input.trim() && !image) ? 0.4 : 1 }}
          >
            ↑
          </button>
        </div>
      </footer>
    <SpiderSense messages={messages} input={input} loading={loading} enabled={!useLocal && isOnline && senseOn} onSend={(t) => sendMessageWithText(t)} onFill={(t) => setInput(t)} />
    <SettingsPanel
      open={showSettings}
      onClose={() => setShowSettings(false)}
      theme={theme}
      onThemeChange={setThemePersist}
      autoSpeak={autoSpeak}
      onToggleSpeak={toggleSpeak}
      senseOn={senseOn}
      onToggleSense={toggleSensePersist}
      memory={memory}
      onEditMemory={() => { setShowSettings(false); setShowDashboard(true); setShowMemory(true); }}
      onClearMemory={clearMemoryOnly}
      onClearChats={clearAllChats}
      onNewChat={() => { setShowSettings(false); newChat(); }}
    />
    {showCall && (
      <CallMode memory={memory} onClose={() => setShowCall(false)} onTurn={(u, a) => setMessages((prev) => [...prev, { role: "user", content: u }, { role: "assistant", content: a }])} />
    )}
    {showVision && (
      <VisionHUD
        isOnline={isOnline}
        onClose={() => setShowVision(false)}
        onAnalyze={handleVisionAnalyze}
      />
    )}
    </div>
  );
}


const styles = {
  menuOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex" },
  menuDrawer: { width: "min(340px, 88vw)", height: "100%", background: "#0c0c0e", color: "#f4f4f5", display: "flex", flexDirection: "column", padding: "12px 12px calc(env(safe-area-inset-bottom, 0px) + 40px)", boxShadow: "8px 0 30px rgba(0,0,0,0.35)", overflowY: "auto" },
  menuProfile: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 8px 16px" },
  menuAvatar: { width: 42, height: 42, borderRadius: 999, background: "linear-gradient(135deg,#8b5cf6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 },
  menuIconBtn: { width: 40, height: 40, borderRadius: 999, border: "none", background: "#1c1c1f", color: "#fff", fontSize: 16 },
  menuCard: { background: "#1c1c1f", borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  menuRow: { width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "transparent", border: "none", borderBottom: "1px solid #2a2a2e", color: "#f4f4f5", fontSize: 15, textAlign: "left" },
  menuRowIcon: { width: 24, textAlign: "center" },
  menuSectionLabel: { fontSize: 13, opacity: 0.55, padding: "0 8px 8px", fontWeight: 500 },
  menuChatRow: { display: "flex", alignItems: "center", borderBottom: "1px solid #2a2a2e" },
  menuChatMain: { flex: 1, minWidth: 0, border: "none", background: "transparent", color: "#f4f4f5", textAlign: "left", padding: "12px 14px", fontSize: 14 },
  menuChatTitle: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  menuChatActions: { display: "flex", gap: 2, paddingRight: 8 },
  menuTiny: { border: "none", background: "transparent", fontSize: 14, padding: 6 },
  menuBottomBar: { marginTop: "auto", display: "flex", alignItems: "center", gap: 8, paddingTop: 10 },
  menuSearchWrap: { flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#1c1c1f", borderRadius: 999, padding: "10px 14px" },
  menuSearchInput: { flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", color: "#f4f4f5", fontSize: 14 },
  menuBottomBtn: { width: 44, height: 44, borderRadius: 999, border: "none", background: "#1c1c1f", color: "#fff", fontSize: 18 },

  page: {
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    overflow: "hidden"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    position: "sticky",
    top: 0,
    zIndex: 20
  },
  chat: {
    flex: 1,
    overflowY: "auto",
    padding: " 8px 0 260px"
  },
  chatInner: {
    maxWidth: 820,
    margin: "0 auto",
    width: "100%",
    padding: "0 18px"
  },
  messageBlock: {
    marginBottom: 22
  },
  bubble: {
    maxWidth: "92%",
    lineHeight: 1.65,
    fontSize: 15.5,
    wordBreak: "break-word"
  },
  userBubble: {
    marginLeft: "auto",
    borderRadius: 22,
    padding: "12px 16px"
  },
  assistantBubble: {
    marginRight: "auto",
    borderRadius: 0,
    padding: "6px 0 2px"
  },
  footer: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    padding: "8px 14px max(14px, env(safe-area-inset-bottom))",
    background: "transparent",
    zIndex: 40
  },
  inputWrapper: {
    maxWidth: 820,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 28,
    padding: "10px 12px",
    border: "1px solid rgba(127,127,127,0.22)",
    boxShadow: "0 8px 28px rgba(0,0,0,0.08)"
  },
  input: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 15,
    padding: "8px 4px"
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    border: "none",
    color: "#fff",
    fontSize: 16,
    cursor: "pointer"
  },
  toolBtn: {
    border: "none",
    background: "transparent",
    fontSize: 18,
    cursor: "pointer",
    padding: "4px 6px"
  },
  quickWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "12px 2px 24px"
  },
  quickChip: {
    textAlign: "left",
    borderRadius: 16,
    padding: "12px 14px",
    fontSize: 14,
    cursor: "pointer",
    border: "1px solid rgba(127,127,127,0.22)",
    background: "transparent"
  },
  installTip: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.7
  },

  quickChip: {
    textAlign: "left",
    border: "1px solid #27272a",
    background: "#18181b",
    color: "#e4e4e7",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 13,
    cursor: "pointer"
  },
  installTip: {
    marginTop: 6,
    fontSize: 12,
    color: "#71717a"
  },

  page: {
    height: "100dvh",
    maxHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    background: "#09090b",
    color: "#e4e4e7",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflow: "hidden"
  },
  header: {
    height: 54,
    padding: "0 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #1a1a1e",
    background: "#09090b",
    flexShrink: 0
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer"
  },
  logoMark: {
    width: 30,
    height: 30,
    borderRadius: 9,
    background: "linear-gradient(135deg, #8b5cf6, #06b6d4, #3b82f6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    color: "white",
    fontWeight: 700
  },
  brandName: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.2
  },
  statusLine: {
    fontSize: 11,
    marginTop: 1,
    fontWeight: 500
  },
  newChatBtn: {
    background: "#18181b",
    border: "1px solid #27272a",
    color: "#e4e4e7",
    padding: "7px 14px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer"
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 50,
    display: "flex"
  },
  dashboard: {
    width: "min(290px, 85vw)",
    height: "100%",
    background: "#0c0c0f",
    borderRight: "1px solid #1a1a1e",
    display: "flex",
    flexDirection: "column",
    padding: "18px 14px 14px"
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 11,
    background: "linear-gradient(135deg, #8b5cf6, #06b6d4, #3b82f6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 17,
    color: "white"
  },
  userName: { fontSize: 15, fontWeight: 600 },
  userSub: { fontSize: 12, color: "#71717a", marginTop: 2 },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "transparent",
    border: "none",
    color: "#d4d4d8",
    padding: "11px 10px",
    borderRadius: 10,
    fontSize: 14,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    marginBottom: 2
  },
  menuIcon: { fontSize: 15, width: 20 },
  modeBox: {
    background: "#141417",
    borderRadius: 12,
    padding: "12px",
    margin: "8px 0 12px",
    border: "1px solid #1f1f23"
  },
  modeLabel: {
    fontSize: 12,
    color: "#a1a1aa",
    marginBottom: 8,
    fontWeight: 500
  },
  modeRow: {
    display: "flex",
    gap: 8
  },
  modeBtn: {
    flex: 1,
    border: "1px solid",
    color: "white",
    padding: "9px 0",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer"
  },
  modeHint: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 8,
    lineHeight: 1.4
  },
  sectionLabel: {
    fontSize: 11,
    color: "#52525b",
    margin: "14px 0 6px 4px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.4px"
  },
  memoryPanel: {
    background: "#141417",
    borderRadius: 12,
    padding: "12px",
    margin: "4px 0 10px",
    border: "1px solid #1f1f23"
  },
  memoryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    fontSize: 12,
    color: "#a1a1aa"
  },
  settingRow: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    fontSize: 13,
    color: "#d4d4d8",
    marginTop: 10
  },
  smallLink: {
    background: "transparent",
    border: "none",
    color: "#a78bfa",
    fontSize: 12,
    cursor: "pointer",
    padding: 0
  },
  memoryBox: {
    background: "#0a0a0c",
    padding: "9px",
    borderRadius: 8,
    fontSize: 12,
    color: "#a1a1aa",
    maxHeight: 72,
    overflowY: "auto",
    lineHeight: 1.45,
    whiteSpace: "pre-wrap"
  },
  memoryEdit: {
    width: "100%",
    background: "#0a0a0c",
    border: "1px solid #27272a",
    borderRadius: 8,
    color: "#e4e4e7",
    padding: "9px",
    fontSize: 12,
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit"
  },
  chatList: {
    flex: 1,
    overflowY: "auto",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    gap: 2
  },
  emptyChats: {
    color: "#555",
    fontSize: 13,
    padding: "8px 6px"
  },
  chatItemWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 2
  },
  chatItem: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "#a1a1aa",
    padding: "9px 10px",
    borderRadius: 8,
    fontSize: 13,
    cursor: "pointer",
    textAlign: "left",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  chatActions: { display: "flex", gap: 1 },
  chatActionBtn: {
    background: "transparent",
    border: "none",
    color: "#52525b",
    fontSize: 12,
    cursor: "pointer",
    padding: "4px 5px",
    borderRadius: 5
  },
  renameRow: {
    display: "flex",
    gap: 5,
    width: "100%",
    alignItems: "center"
  },
  renameInput: {
    flex: 1,
    background: "#18181b",
    border: "1px solid #27272a",
    borderRadius: 8,
    color: "white",
    padding: "6px 8px",
    fontSize: 12,
    outline: "none"
  },
  smallAction: {
    background: "#27272a",
    border: "none",
    color: "white",
    width: 28,
    height: 28,
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 12
  },
  chat: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 14px",
    minHeight: 0
  },
  chatInner: {
    maxWidth: 780,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    width: "100%"
  },
  messageBlock: {
    marginBottom: 20
  },
  bubble: {
    lineHeight: 1.55,
    fontSize: "clamp(14px, 2.5vw, 15px)",
    width: "100%"
  },
  userBubble: {
    alignSelf: "flex-end",
    background: "#18181b",
    border: "1px solid #27272a",
    borderRadius: 18,
    padding: "11px 15px",
    maxWidth: "min(85%, 420px)",
    marginLeft: "auto"
  },
  assistantBubble: {
    alignSelf: "flex-start",
    maxWidth: "min(95%, 680px)",
    color: "#e4e4e7"
  },
  image: {
    maxWidth: "100%",
    borderRadius: 12,
    marginBottom: 8
  },
  actions: {
    display: "flex",
    gap: 2,
    marginTop: 6,
    marginBottom: 4,
    flexWrap: "wrap",
    alignItems: "center"
  },
  actionBtn: {
    border: "none",
    background: "transparent",
    color: "#71717a",
    fontSize: 16,
    cursor: "pointer",
    padding: "8px 10px",
    borderRadius: 10,
    lineHeight: 1
  },
  editArea: {
    width: "100%",
    background: "#09090b",
    border: "1px solid #27272a",
    borderRadius: 10,
    color: "white",
    padding: 10,
    fontSize: 14,
    resize: "vertical",
    outline: "none"
  },
  editActions: {
    display: "flex",
    gap: 8,
    marginTop: 8
  },
  primaryBtn: {
    background: "#7c3aed",
    border: "none",
    color: "white",
    padding: "6px 13px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer"
  },
  secondaryBtn: {
    background: "#27272a",
    border: "none",
    color: "#d4d4d8",
    padding: "6px 13px",
    borderRadius: 8,
    fontSize: 13,
    cursor: "pointer"
  },
  previewBar: {
    padding: "8px 14px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#0c0c0f",
    borderTop: "1px solid #1a1a1e",
    flexShrink: 0
  },
  previewImage: {
    height: 48,
    borderRadius: 8
  },
  removeBtn: {
    background: "#27272a",
    border: "none",
    color: "white",
    width: 26,
    height: 26,
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: 12
  },
  footer: {
    paddingBottom: "max(10px, env(safe-area-inset-bottom))",
    padding: "10px 14px 14px",
    flexShrink: 0
  },
  inputWrapper: {
    maxWidth: 780,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "#141417",
    border: "1px solid #27272a",
    borderRadius: 26,
    padding: "6px 8px"
  },
  toolBtn: {
    background: "transparent",
    border: "none",
    fontSize: 16,
    cursor: "pointer",
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#71717a",
    flexShrink: 0
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: 15,
    outline: "none",
    padding: "7px 4px",
    minWidth: 0
  },
  sendBtn: {
    background: "#e4e4e7",
    color: "#09090b",
    border: "none",
    width: 34,
    height: 34,
    borderRadius: "50%",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  }
};
