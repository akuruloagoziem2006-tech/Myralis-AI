"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import VisionHUD from "./components/VisionHUD";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const [listening, setListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
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
  const [speaking, setSpeaking] = useState(false);

  const chatEnd = useRef(null);
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

  const LOCAL_URL = "http://127.0.0.1:8766";

  useEffect(() => {
    if (!document.getElementById("native-voice")) { const nv = document.createElement("script"); nv.id = "native-voice"; nv.src = "/native-voice.js"; document.head.appendChild(nv); }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    setIsOnline(navigator.onLine);
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

    return () => {
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
    return () => clearInterval(timerRef.current);
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
      body: JSON.stringify({ messages: updatedMessages.slice(-12).map((m, i, a) => i === a.length - 1 ? m : { ...m, image: null }), memory })
    });
    let data;
    try { data = await res.json(); } catch { throw new Error("Gemini route returned HTTP " + res.status + (res.redirected ? " (redirected)" : "")); }
    if (!res.ok || data.error) throw new Error(data.error || ("HTTP " + res.status));
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
          try {
            reply = await sendToLocal(userMessage);
            reply = "⚠️ Gemini failed: " + (geminiErr?.message || "unknown") + "\n\n" + reply;
            setLocalStatus("online");
          } catch {
            reply = "I couldn't reach Myralis right now. Check your internet and try again.";
          }
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      if (autoSpeak) { try { speak(reply); } catch {} }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong on my side. Please try again." }]);
    }

    setLoading(false);
  }


  async function handleVisionAnalyze(dataUrl, summary) {
    setLoading(true);
    setShowVision(false);
    const userLine = summary && summary !== "no clear objects"
      ? `Analyze this scene. On-device detections: ${summary}`
      : "Analyze what you see in this camera frame.";
    setMessages((prev) => [...prev, { role: "user", content: userLine, image: dataUrl }]);
    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, summary })
      });
      const data = await res.json();
      const reply = data.reply || data.error || "I could not analyze that frame.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      if (autoSpeak) speak(reply);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Vision analysis failed. Try again." }]);
    }
    setLoading(false);
  }

  function sendMessage() {
    sendMessageWithText(input);
  }


  const sortedChats = [...pastChats].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const statusText = isOnline ? "Online" : "Offline";
  const statusColor = isOnline ? "#4ade80" : "#f87171";

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
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
        <div style={styles.overlay} onClick={() => {
          setShowDashboard(false);
          setRenamingId(null);
          setEditMemory(false);
          setShowMemory(false);
        }}>
          <div style={styles.dashboard} onClick={(e) => e.stopPropagation()}>
            {/* Profile */}
            <div style={styles.userSection}>
              <div style={styles.avatar}>✧</div>
              <div>
                <div style={styles.userName}>Myralis</div>
                <div style={styles.userSub}>Personal AI</div>
              </div>
            </div>

            <button onClick={newChat} style={styles.menuItem}>
              <span style={styles.menuIcon}>✏️</span> New Chat
            </button>

            {/* Memory */}
            <button onClick={() => setShowMemory(!showMemory)} style={styles.menuItem}>
              <span style={styles.menuIcon}>🧠</span> Memory & Settings
            </button>

            {showMemory && (
              <div style={styles.memoryPanel}>
                <div style={styles.memoryHeader}>
                  <span>What I remember</span>
                  {!editMemory ? (
                    <button onClick={() => { setEditMemory(true); setMemoryDraft(memory); }} style={styles.smallLink}>Edit</button>
                  ) : (
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => { saveMemory(memoryDraft); setEditMemory(false); }} style={styles.smallLink}>Save</button>
                      <button onClick={() => setEditMemory(false)} style={{ ...styles.smallLink, color: "#71717a" }}>Cancel</button>
                    </div>
                  )}
                </div>
                {editMemory ? (
                  <textarea
                    value={memoryDraft}
                    onChange={(e) => setMemoryDraft(e.target.value)}
                    style={styles.memoryEdit}
                    rows={3}
                    placeholder="Name, preferences, goals..."
                  />
                ) : (
                  <div style={styles.memoryBox}>
                    {memory || "Nothing saved yet."}
                  </div>
                )}
                <label style={styles.settingRow}>
                  <input type="checkbox" checked={autoSpeak} onChange={toggleSpeak} />
                  <span>Auto-speak replies</span>
                </label>
              </div>
            )}

            {/* Conversations */}
            <div style={styles.sectionLabel}>Conversations</div>
            <div style={styles.chatList}>
              {sortedChats.length === 0 && (
                <div style={styles.emptyChats}>No conversations yet</div>
              )}
              {sortedChats.map((chat) => (
                <div key={chat.id} style={styles.chatItemWrapper}>
                  {renamingId === chat.id ? (
                    <div style={styles.renameRow}>
                      <input
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        style={styles.renameInput}
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && saveRename(chat.id)}
                      />
                      <button onClick={() => saveRename(chat.id)} style={styles.smallAction}>✓</button>
                      <button onClick={() => setRenamingId(null)} style={styles.smallAction}>✕</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => loadChat(chat)} style={styles.chatItem}>
                        {chat.pinned && <span style={{ marginRight: 5 }}>📌</span>}
                        {chat.title}
                      </button>
                      <div style={styles.chatActions}>
                        <button onClick={() => togglePin(chat.id)} style={styles.chatActionBtn}>{chat.pinned ? "📌" : "📍"}</button>
                        <button onClick={() => startRename(chat)} style={styles.chatActionBtn}>✏️</button>
                        <button onClick={() => deleteChat(chat.id)} style={styles.chatActionBtn}>🗑️</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <main style={styles.chat}>
        <div style={styles.chatInner}>
          
        {messages.length <= 1 && !loading && (
          <div style={styles.quickWrap}>
            {[
              "Explain quantum computing in simple terms",
              "Help me plan a productive day",
              "Improve this paragraph: paste your text",
              "What should I learn to get better at coding?"
            ].map((p) => (
              <button key={p} onClick={() => sendMessageWithText(p)} style={styles.quickChip}>{p}</button>
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
                ...(msg.role === "user" ? styles.userBubble : styles.assistantBubble)
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
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
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
                      <button onClick={() => startEdit(i, msg.content)} style={styles.actionBtn}>Edit</button>
                      <button onClick={() => copyText(msg.content)} style={styles.actionBtn}>Copy</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => copyText(msg.content)} style={styles.actionBtn}>Copy</button>
                      <button onClick={() => shareText(msg.content)} style={styles.actionBtn}>Share</button>
                      <button onClick={() => toggleLike(i, "like")} style={{ ...styles.actionBtn, color: liked[i] === "like" ? "#4ade80" : undefined }}>👍</button>
                      <button onClick={() => toggleLike(i, "unlike")} style={{ ...styles.actionBtn, color: liked[i] === "unlike" ? "#f87171" : undefined }}>👎</button>
                      <button onClick={() => speak(msg.content)} style={styles.actionBtn}>🔊</button>
                      <button onClick={() => regenerate(i)} style={styles.actionBtn}>Regenerate</button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ ...styles.bubble, ...styles.assistantBubble, opacity: 0.7 }}>
              Thinking... {thinkingSeconds}s
            </div>
          )}
          {loading && (
            <div style={{ ...styles.bubble, ...styles.assistantBubble, opacity: 0.9 }}>
              Thinking… {thinkingSeconds}s
            </div>
          )}
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
        <div style={styles.inputWrapper}>
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
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImage} hidden />
          <input
            style={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Message Myralis..."
          />
          <button
            onClick={sendMessage}
            disabled={loading || (!input.trim() && !image)}
            style={{
              ...styles.sendBtn,
              opacity: loading || (!input.trim() && !image) ? 0.4 : 1
            }}
          >
            ↑
          </button>
        </div>
      </footer>
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
  quickWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "8px 4px 16px"
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
    marginTop: 5,
    flexWrap: "wrap"
  },
  actionBtn: {
    background: "transparent",
    border: "none",
    color: "#52525b",
    fontSize: 12,
    cursor: "pointer",
    padding: "3px 6px",
    borderRadius: 5,
    fontWeight: 500
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
