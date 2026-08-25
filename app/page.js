"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [image, setImage] = useState(null);
  const [pastChats, setPastChats] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState("");
  const [liked, setLiked] = useState({});
  const [renamingId, setRenamingId] = useState(null);
  const [renameText, setRenameText] = useState("");

  const chatEnd = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("myralis_messages");
    const speak = localStorage.getItem("myralis_autoSpeak");
    const chats = localStorage.getItem("myralis_past_chats");
    if (saved) setMessages(JSON.parse(saved));
    else setMessages([{ role: "assistant", content: "Hello! I'm **Myralis**. How can I help you today?" }]);
    if (speak !== null) setAutoSpeak(speak === "true");
    if (chats) setPastChats(JSON.parse(chats));
  }, []);

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem("myralis_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function savePastChats(chats) {
    setPastChats(chats);
    localStorage.setItem("myralis_past_chats", JSON.stringify(chats));
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#`_]/g, ""));
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }

  function newChat() {
    if (messages.length > 1) {
      const title = messages.find(m => m.role === "user")?.content?.slice(0, 40) || "New conversation";
      const updated = [{ id: Date.now(), title, messages, pinned: false }, ...pastChats].slice(0, 30);
      savePastChats(updated);
    }
    const welcome = [{ role: "assistant", content: "Hello! I'm **Myralis**. How can I help you today?" }];
    setMessages(welcome);
    localStorage.setItem("myralis_messages", JSON.stringify(welcome));
    setShowDashboard(false);
    setShowSettings(false);
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
      setTimeout(() => sendMessageWithText(transcript), 250);
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
        body: JSON.stringify({ messages: updatedMessages })
      });
      const data = await res.json();
      if (data.error) {
        setMessages(prev => [...prev, { role: "assistant", content: "Error: " + data.error }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        if (autoSpeak) speak(data.reply);
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
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.brand} onClick={() => setShowDashboard(true)}>
          <div style={styles.logoMark}>✦</div>
          <span style={styles.brandName}>Myralis</span>
        </div>
        <button onClick={newChat} style={styles.newChatBtn}>+ New Chat</button>
      </header>

      {/* Dashboard */}
      {showDashboard && (
        <div style={styles.overlay} onClick={() => { setShowDashboard(false); setShowSettings(false); setRenamingId(null); }}>
          <div style={styles.dashboard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.userSection}>
              <div style={styles.avatar}>✦</div>
              <div>
                <div style={styles.userName}>Myralis</div>
                <div style={styles.userSub}>AI Model</div>
              </div>
            </div>

            <button onClick={newChat} style={styles.menuItem}>
              <span style={{ fontSize: 16 }}>✏️</span> New Chat
            </button>

            <div style={styles.sectionLabel}>Conversations</div>
            <div style={styles.chatList}>
              {sortedChats.length === 0 && (
                <div style={{ color: "#555", fontSize: 13, padding: "10px" }}>No conversations yet</div>
              )}
              {sortedChats.map((chat) => (
                <div key={chat.id} style={styles.chatItemWrapper}>
                  {renamingId === chat.id ? (
                    <div style={{ display: "flex", gap: 6, width: "100%" }}>
                      <input value={renameText} onChange={(e) => setRenameText(e.target.value)} style={styles.renameInput} autoFocus onKeyDown={(e) => e.key === "Enter" && saveRename(chat.id)} />
                      <button onClick={() => saveRename(chat.id)} style={styles.smallAction}>✓</button>
                      <button onClick={() => setRenamingId(null)} style={styles.smallAction}>✕</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => loadChat(chat)} style={styles.chatItem}>
                        {chat.pinned && <span style={{ marginRight: 6 }}>📌</span>}
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

            <div style={styles.bottomBar}>
              <button style={styles.bottomBtn}>🔍 Search</button>
              <button onClick={() => setShowSettings(!showSettings)} style={styles.bottomBtn}>⚙️</button>
            </div>

            {showSettings && (
              <div style={styles.settingsPanel}>
                <label style={styles.settingRow}>
                  <input type="checkbox" checked={autoSpeak} onChange={toggleSpeak} />
                  <span>Auto-speak replies</span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Area */}
      <main style={styles.chat}>
        <div style={styles.chatInner}>
          {messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <div style={{
                ...styles.bubble,
                ...(msg.role === "user" ? styles.userBubble : styles.assistantBubble)
              }}>
                {msg.image && <img src={msg.image} alt="upload" style={styles.image} />}
                {editingIndex === i ? (
                  <div>
                    <textarea value={editText} onChange={(e) => setEditText(e.target.value)} style={styles.editArea} rows={3} />
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
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
            <div style={{ ...styles.bubble, ...styles.assistantBubble, opacity: 0.6 }}>
              Thinking...
            </div>
          )}
          <div ref={chatEnd} />
        </div>
      </main>

      {image && (
        <div style={styles.previewBar}>
          <img src={image} alt="preview" style={{ height: 52, borderRadius: 10 }} />
          <button onClick={() => setImage(null)} style={styles.removeBtn}>✕</button>
        </div>
      )}

      {/* Input */}
      <footer style={styles.footer}>
        <div style={styles.inputWrapper}>
          <button onClick={startListening} style={{
            ...styles.toolBtn,
            background: listening ? "rgba(59,130,246,0.2)" : "transparent",
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
    display: "flex",
    flexDirection: "column",
    background: "#09090b",
    color: "#e4e4e7",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  header: {
    height: 60,
    padding: "0 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #1c1c1f",
    background: "rgba(9,9,11,0.85)",
    backdropFilter: "blur(12px)",
    flexShrink: 0
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer"
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 9,
    background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    color: "white",
    fontWeight: 600
  },
  brandName: {
    fontSize: 17,
    fontWeight: 600,
    letterSpacing: "-0.3px"
  },
  newChatBtn: {
    background: "#18181b",
    border: "1px solid #27272a",
    color: "#e4e4e7",
    padding: "8px 16px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "0.15s"
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 50,
    display: "flex"
  },
  dashboard: {
    width: "min(300px, 85vw)",
    height: "100%",
    background: "#0f0f12",
    borderRight: "1px solid #1c1c1f",
    display: "flex",
    flexDirection: "column",
    padding: "24px 18px"
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 24
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    color: "white"
  },
  userName: { fontSize: 16, fontWeight: 600 },
  userSub: { fontSize: 12, color: "#71717a", marginTop: 2 },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "transparent",
    border: "none",
    color: "#d4d4d8",
    padding: "12px 12px",
    borderRadius: 10,
    fontSize: 14,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    marginBottom: 6
  },
  sectionLabel: {
    fontSize: 11,
    color: "#52525b",
    margin: "18px 0 8px 12px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  chatList: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 2
  },
  chatItemWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 4
  },
  chatItem: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "#a1a1aa",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 13,
    cursor: "pointer",
    textAlign: "left",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  chatActions: {
    display: "flex",
    gap: 2
  },
  chatActionBtn: {
    background: "transparent",
    border: "none",
    color: "#52525b",
    fontSize: 13,
    cursor: "pointer",
    padding: "4px 6px",
    borderRadius: 4
  },
  renameInput: {
    flex: 1,
    background: "#18181b",
    border: "1px solid #27272a",
    borderRadius: 8,
    color: "white",
    padding: "7px 10px",
    fontSize: 13,
    outline: "none"
  },
  smallAction: {
    background: "#27272a",
    border: "none",
    color: "white",
    width: 30,
    height: 30,
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13
  },
  bottomBar: {
    display: "flex",
    gap: 8,
    borderTop: "1px solid #1c1c1f",
    paddingTop: 16,
    marginTop: 12
  },
  bottomBtn: {
    flex: 1,
    background: "#18181b",
    border: "1px solid #27272a",
    color: "#a1a1aa",
    padding: "10px",
    borderRadius: 10,
    fontSize: 13,
    cursor: "pointer"
  },
  settingsPanel: {
    background: "#18181b",
    borderRadius: 10,
    padding: "14px",
    marginTop: 10
  },
  settingRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    color: "#d4d4d8"
  },
  chat: {
    flex: 1,
    overflowY: "auto",
    padding: "24px 16px"
  },
  chatInner: {
    maxWidth: 780,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    width: "100%"
  },
  bubble: {
    lineHeight: 1.65,
    fontSize: 15,
    width: "100%"
  },
  userBubble: {
    alignSelf: "flex-end",
    background: "#18181b",
    border: "1px solid #27272a",
    borderRadius: 18,
    padding: "12px 18px",
    maxWidth: "min(80%, 460px)",
    marginLeft: "auto"
  },
  assistantBubble: {
    alignSelf: "flex-start",
    maxWidth: "min(92%, 700px)",
    color: "#e4e4e7"
  },
  image: {
    maxWidth: "100%",
    borderRadius: 12,
    marginBottom: 10
  },
  actions: {
    display: "flex",
    gap: 4,
    marginTop: 6,
    flexWrap: "wrap"
  },
  actionBtn: {
    background: "transparent",
    border: "none",
    color: "#52525b",
    fontSize: 12,
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 6,
    fontWeight: 500
  },
  editArea: {
    width: "100%",
    background: "#09090b",
    border: "1px solid #27272a",
    borderRadius: 10,
    color: "white",
    padding: 12,
    fontSize: 14,
    resize: "vertical",
    outline: "none"
  },
  primaryBtn: {
    background: "#7c3aed",
    border: "none",
    color: "white",
    padding: "7px 14px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer"
  },
  secondaryBtn: {
    background: "#27272a",
    border: "none",
    color: "#d4d4d8",
    padding: "7px 14px",
    borderRadius: 8,
    fontSize: 13,
    cursor: "pointer"
  },
  previewBar: {
    padding: "10px 20px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#0f0f12",
    borderTop: "1px solid #1c1c1f"
  },
  removeBtn: {
    background: "#27272a",
    border: "none",
    color: "white",
    width: 28,
    height: 28,
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: 13
  },
  footer: {
    padding: "16px 20px 24px",
    flexShrink: 0
  },
  inputWrapper: {
    maxWidth: 780,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#18181b",
    border: "1px solid #27272a",
    borderRadius: 28,
    padding: "8px 12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)"
  },
  toolBtn: {
    background: "transparent",
    border: "none",
    fontSize: 17,
    cursor: "pointer",
    width: 38,
    height: 38,
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
    padding: "8px 6px",
    minWidth: 0
  },
  sendBtn: {
    background: "#e4e4e7",
    color: "#09090b",
    border: "none",
    width: 36,
    height: 36,
    borderRadius: "50%",
    fontSize: 18,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  }
};
