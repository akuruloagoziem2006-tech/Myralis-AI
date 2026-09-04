"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const [listening, setListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
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

  const chatEnd = useRef(null);
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("myralis_messages");
    const speak = localStorage.getItem("myralis_autoSpeak");
    const chats = localStorage.getItem("myralis_past_chats");
    const savedMemory = localStorage.getItem("myralis_memory");

    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      const welcome = savedMemory
        ? `Hello. I've loaded what I know about you.\n\nHow can I help you today?`
        : `Hello. I'm **Myralis**, your personal AI.\n\nTell me things to remember, or just ask me anything.`;
      setMessages([{ role: "assistant", content: welcome }]);
    }

    if (speak !== null) setAutoSpeak(speak === "true");
    if (chats) setPastChats(JSON.parse(chats));
    if (savedMemory) setMemory(savedMemory);
  }, []);

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem("myralis_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Thinking timer
  useEffect(() => {
    if (loading) {
      setThinkingSeconds(0);
      timerRef.current = setInterval(() => {
        setThinkingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setThinkingSeconds(0);
    }
    return () => clearInterval(timerRef.current);
  }, [loading]);

  function saveMemory(newMemory) {
    setMemory(newMemory);
    localStorage.setItem("myralis_memory", newMemory);
  }

  function savePastChats(chats) {
    setPastChats(chats);
    localStorage.setItem("myralis_past_chats", JSON.stringify(chats));
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#`_\~\[\]]/g, "").replace(/\n+/g, ". ");
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  }

  function newChat() {
    if (messages.length > 1) {
      const title = messages.find(m => m.role === "user")?.content?.slice(0, 40) || "New conversation";
      const updated = [{ id: Date.now(), title, messages, pinned: false }, ...pastChats].slice(0, 30);
      savePastChats(updated);
    }
    const welcome = memory
      ? `Hello. Ready when you are.`
      : `Hello. I'm **Myralis**. How can I help?`;
    const welcomeMsg = [{ role: "assistant", content: welcome }];
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
    savePastChats(pastChats.filter(c => c.id !== id));
  }

  function togglePin(id) {
    const updated = pastChats.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c);
    updated.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    savePastChats(updated);
  }

  function startRename(chat) {
    setRenamingId(chat.id);
    setRenameText(chat.title);
  }

  function saveRename(id) {
    if (!renameText.trim()) return;
    savePastChats(pastChats.map(c => c.id === id ? { ...c, title: renameText.trim() } : c));
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
    setLiked(prev => ({ ...prev, [index]: value }));
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported.");
    window.speechSynthesis.cancel();
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

  function runQuickAction(action) {
    const prompts = {
      plan: "Help me plan my day. Ask me what important things I need to get done today.",
      explain: "Explain the last topic we discussed in a very simple and clear way.",
      summarize: "Summarize our recent conversation in a few clear points.",
      ideas: "Based on what you know about me, give me 5 useful ideas or suggestions.",
      focus: "Help me focus. Give me a short plan to stay productive for the next 2 hours.",
      write: "Help me write something. Ask me what I need to write."
    };
    sendMessageWithText(prompts[action]);
  }

  async function sendMessageWithText(text, currentMessages = messages) {
    if ((!text.trim() && !image) || loading) return;
    const userMessage = text.trim() || "What do you see in this image?";
    setInput("");
    setLoading(true);
    window.speechSynthesis.cancel();

    const newUserMsg = { role: "user", content: userMessage, image: image || null };
    let updatedMessages = currentMessages;
    if (currentMessages === messages) {
      updatedMessages = [...messages, newUserMsg];
      setMessages(updatedMessages);
    }
    setImage(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, memory })
      });
      const data = await res.json();

      if (data.error) {
        setMessages(prev => [...prev, { role: "assistant", content: "Error: " + data.error }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        if (autoSpeak) speak(data.reply);
        if (data.updatedMemory) saveMemory(data.updatedMemory);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error." }]);
    }
    setLoading(false);
  }

  function sendMessage() {
    sendMessageWithText(input);
  }

  const sortedChats = [...pastChats].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand} onClick={() => setShowDashboard(true)}>
          <div style={styles.logoMark}>✧</div>
          <span style={styles.brandName}>Myralis</span>
        </div>
        <button onClick={newChat} style={styles.newChatBtn}>+ New Chat</button>
      </header>

      {showDashboard && (
        <div style={styles.overlay} onClick={() => {
          setShowDashboard(false);
          setRenamingId(null);
          setEditMemory(false);
          setShowMemory(false);
        }}>
          <div style={styles.dashboard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.userSection}>
              <div style={styles.avatar}>✧</div>
              <div>
                <div style={styles.userName}>Myralis</div>
                <div style={styles.userSub}>Personal AI</div>
              </div>
            </div>

            <button onClick={newChat} style={styles.menuItem}>
              <span>✏️</span> New Chat
            </button>

            <div style={styles.sectionLabel}>Quick Actions</div>
            <div style={styles.quickActions}>
              <button onClick={() => { runQuickAction("plan"); setShowDashboard(false); }} style={styles.quickBtn}>📅 Plan my day</button>
              <button onClick={() => { runQuickAction("focus"); setShowDashboard(false); }} style={styles.quickBtn}>🎯 Focus mode</button>
              <button onClick={() => { runQuickAction("explain"); setShowDashboard(false); }} style={styles.quickBtn}>💡 Explain simply</button>
              <button onClick={() => { runQuickAction("summarize"); setShowDashboard(false); }} style={styles.quickBtn}>📝 Summarize</button>
              <button onClick={() => { runQuickAction("write"); setShowDashboard(false); }} style={styles.quickBtn}>✍️ Help me write</button>
              <button onClick={() => { runQuickAction("ideas"); setShowDashboard(false); }} style={styles.quickBtn}>🚀 Ideas</button>
            </div>

            <button onClick={() => setShowMemory(!showMemory)} style={styles.menuItem}>
              <span>🧠</span> Memory & Settings
            </button>

            {showMemory && (
              <div style={styles.memoryPanel}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "#a1a1aa" }}>What I remember</span>
                  {!editMemory ? (
                    <button onClick={() => { setEditMemory(true); setMemoryDraft(memory); }} style={styles.smallLink}>Edit</button>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
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
                <label style={{ ...styles.settingRow, marginTop: 10 }}>
                  <input type="checkbox" checked={autoSpeak} onChange={toggleSpeak} />
                  <span>Auto-speak replies</span>
                </label>
              </div>
            )}

            <div style={styles.sectionLabel}>Conversations</div>
            <div style={styles.chatList}>
              {sortedChats.length === 0 && (
                <div style={{ color: "#555", fontSize: 13, padding: "6px" }}>No conversations yet</div>
              )}
              {sortedChats.map((chat) => (
                <div key={chat.id} style={styles.chatItemWrapper}>
                  {renamingId === chat.id ? (
                    <div style={{ display: "flex", gap: 5, width: "100%" }}>
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
                        {chat.pinned && <span style={{ marginRight: 4 }}>📌</span>}
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

      <main style={styles.chat}>
        <div style={styles.chatInner}>
          {messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div style={{
                ...styles.bubble,
                ...(msg.role === "user" ? styles.userBubble : styles.assistantBubble)
              }}>
                {msg.image && <img src={msg.image} alt="upload" style={styles.image} />}
                {editingIndex === i ? (
                  <div>
                    <textarea value={editText} onChange={(e) => setEditText(e.target.value)} style={styles.editArea} rows={3} />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
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
          <div ref={chatEnd} />
        </div>
      </main>

      {image && (
        <div style={styles.previewBar}>
          <img src={image} alt="preview" style={{ height: 48, borderRadius: 8 }} />
          <button onClick={() => setImage(null)} style={styles.removeBtn}>✕</button>
        </div>
      )}

      <footer style={styles.footer}>
        <div style={styles.inputWrapper}>
          <button onClick={startListening} style={{
            ...styles.toolBtn,
            background: listening ? "rgba(59,130,246,0.25)" : "transparent",
            color: listening ? "#60a5fa" : "#888"
          }}>
            {listening ? "●" : "🎙"}
          </button>
          <button onClick={() => fileInputRef.current?.click()} style={styles.toolBtn}>🖼</button>
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
    </div>
  );
}

const styles = {
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
    height: 52,
    padding: "0 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #1c1c1f",
    background: "#09090b",
    flexShrink: 0
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    cursor: "pointer"
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
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
    fontWeight: 600
  },
  newChatBtn: {
    background: "#18181b",
    border: "1px solid #27272a",
    color: "#e4e4e7",
    padding: "6px 13px",
    borderRadius: 18,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer"
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 50,
    display: "flex"
  },
  dashboard: {
    width: "min(285px, 84vw)",
    height: "100%",
    background: "#0f0f12",
    borderRight: "1px solid #1c1c1f",
    display: "flex",
    flexDirection: "column",
    padding: "16px 12px 12px"
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    marginBottom: 14
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: "linear-gradient(135deg, #8b5cf6, #06b6d4, #3b82f6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 17,
    color: "white"
  },
  userName: { fontSize: 15, fontWeight: 600 },
  userSub: { fontSize: 11, color: "#71717a", marginTop: 1 },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    background: "transparent",
    border: "none",
    color: "#d4d4d8",
    padding: "10px 9px",
    borderRadius: 9,
    fontSize: 14,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    marginBottom: 2
  },
  sectionLabel: {
    fontSize: 11,
    color: "#52525b",
    margin: "12px 0 6px 3px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.4px"
  },
  quickActions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 7,
    marginBottom: 6
  },
  quickBtn: {
    background: "#18181b",
    border: "1px solid #27272a",
    color: "#d4d4d8",
    padding: "9px 7px",
    borderRadius: 9,
    fontSize: 12,
    cursor: "pointer",
    textAlign: "left"
  },
  memoryPanel: {
    background: "#18181b",
    borderRadius: 9,
    padding: "11px",
    margin: "4px 0 8px"
  },
  settingRow: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    fontSize: 13,
    color: "#d4d4d8"
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
    background: "#09090b",
    padding: "8px",
    borderRadius: 7,
    fontSize: 12,
    color: "#a1a1aa",
    maxHeight: 70,
    overflowY: "auto",
    lineHeight: 1.45,
    whiteSpace: "pre-wrap"
  },
  memoryEdit: {
    width: "100%",
    background: "#09090b",
    border: "1px solid #27272a",
    borderRadius: 7,
    color: "#e4e4e7",
    padding: "8px",
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
    gap: 1
  },
  chatItemWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 3
  },
  chatItem: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "#a1a1aa",
    padding: "8px 9px",
    borderRadius: 7,
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
    padding: "3px 4px",
    borderRadius: 4
  },
  renameInput: {
    flex: 1,
    background: "#18181b",
    border: "1px solid #27272a",
    borderRadius: 7,
    color: "white",
    padding: "5px 7px",
    fontSize: 12,
    outline: "none"
  },
  smallAction: {
    background: "#27272a",
    border: "none",
    color: "white",
    width: 26,
    height: 26,
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12
  },
  chat: {
    flex: 1,
    overflowY: "auto",
    padding: "14px 13px",
    minHeight: 0
  },
  chatInner: {
    maxWidth: 780,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    width: "100%"
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
    borderRadius: 16,
    padding: "10px 15px",
    maxWidth: "min(82%, 420px)",
    marginLeft: "auto"
  },
  assistantBubble: {
    alignSelf: "flex-start",
    maxWidth: "min(94%, 680px)",
    color: "#e4e4e7"
  },
  image: {
    maxWidth: "100%",
    borderRadius: 10,
    marginBottom: 8
  },
  actions: {
    display: "flex",
    gap: 3,
    marginTop: 4,
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
    borderRadius: 9,
    color: "white",
    padding: 10,
    fontSize: 14,
    resize: "vertical",
    outline: "none"
  },
  primaryBtn: {
    background: "#7c3aed",
    border: "none",
    color: "white",
    padding: "6px 12px",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer"
  },
  secondaryBtn: {
    background: "#27272a",
    border: "none",
    color: "#d4d4d8",
    padding: "6px 12px",
    borderRadius: 7,
    fontSize: 13,
    cursor: "pointer"
  },
  previewBar: {
    padding: "7px 14px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#0f0f12",
    borderTop: "1px solid #1c1c1f",
    flexShrink: 0
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
    padding: "10px 13px 14px",
    flexShrink: 0
  },
  inputWrapper: {
    maxWidth: 780,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: 5,
    background: "#18181b",
    border: "1px solid #27272a",
    borderRadius: 24,
    padding: "6px 9px"
  },
  toolBtn: {
    background: "transparent",
    border: "none",
    fontSize: 16,
    cursor: "pointer",
    width: 34,
    height: 34,
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
    padding: "6px 3px",
    minWidth: 0
  },
  sendBtn: {
    background: "#e4e4e7",
    color: "#09090b",
    border: "none",
    width: 32,
    height: 32,
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
