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
    if (messages.length > 0) {
      localStorage.setItem("myralis_messages", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
      const updated = [{ id: Date.now(), title, messages }, ...pastChats].slice(0, 20);
      setPastChats(updated);
      localStorage.setItem("myralis_past_chats", JSON.stringify(updated));
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
      alert("Copied to clipboard (sharing not supported)");
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
    // Find the user message before this assistant reply
    if (index === 0) return;
    const userMsg = messages[index - 1];
    if (userMsg.role !== "user") return;

    // Remove the old assistant reply and resend
    const newMessages = messages.slice(0, index);
    setMessages(newMessages);
    setTimeout(() => sendMessageWithText(userMsg.content, newMessages), 100);
  }

  function toggleLike(index, value) {
    setLiked(prev => ({ ...prev, [index]: value }));
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported.");
      return;
    }

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
    
    // Only add user message if it's a new one
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
        setMessages((prev) => [...prev, { role: "assistant", content: "Error: " + data.error }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        if (autoSpeak) speak(data.reply);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Connection error." }]);
    }

    setLoading(false);
  }

  function sendMessage() {
    sendMessageWithText(input);
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.brand} onClick={() => setShowDashboard(true)}>
          <span style={styles.logo}>✦</span>
          <span style={styles.brandName}>Myralis</span>
        </div>
        <button onClick={newChat} style={styles.newChatBtn}>+ New Chat</button>
      </header>

      {/* Dashboard */}
      {showDashboard && (
        <div style={styles.overlay} onClick={() => { setShowDashboard(false); setShowSettings(false); }}>
          <div style={styles.dashboard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.userSection}>
              <div style={styles.avatar}>✦</div>
              <div>
                <div style={styles.userName}>Myralis</div>
                <div style={styles.userSub}>AI Model</div>
              </div>
            </div>

            <button onClick={newChat} style={styles.menuItem}>
              <span>✏️</span> New Chat
            </button>

            <div style={styles.sectionLabel}>Conversations</div>
            <div style={styles.chatList}>
              {pastChats.length === 0 && (
                <div style={{ color: "#666", fontSize: 13, padding: "8px 10px" }}>No past conversations yet</div>
              )}
              {pastChats.map((chat) => (
                <button key={chat.id} onClick={() => loadChat(chat)} style={styles.chatItem}>
                  {chat.title}
                </button>
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

      {/* Messages */}
      <main style={styles.chat}>
        <div style={styles.chatInner}>
          {messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{
                ...styles.bubble,
                ...(msg.role === "user" ? styles.userBubble : styles.assistantBubble)
              }}>
                {msg.image && <img src={msg.image} alt="upload" style={styles.image} />}
                
                {editingIndex === i ? (
                  <div>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      style={styles.editArea}
                      rows={3}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button onClick={() => saveEdit(i)} style={styles.smallBtn}>Save</button>
                      <button onClick={() => setEditingIndex(null)} style={styles.smallBtnSecondary}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  msg.role === "assistant" ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )
                )}
              </div>

              {/* Action Buttons */}
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
                      <button onClick={() => toggleLike(i, "like")} style={{
                        ...styles.actionBtn,
                        color: liked[i] === "like" ? "#4ade80" : "#888"
                      }}>👍</button>
                      <button onClick={() => toggleLike(i, "unlike")} style={{
                        ...styles.actionBtn,
                        color: liked[i] === "unlike" ? "#f87171" : "#888"
                      }}>👎</button>
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

      {/* Image Preview */}
      {image && (
        <div style={styles.previewBar}>
          <img src={image} alt="preview" style={{ height: 48, borderRadius: 8 }} />
          <button onClick={() => setImage(null)} style={styles.removeBtn}>✕</button>
        </div>
      )}

      {/* Input */}
      <footer style={styles.footer}>
        <div style={styles.inputWrapper}>
          <button onClick={startListening} style={{
            ...styles.toolBtn,
            background: listening ? "#3b82f6" : "transparent"
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
            style={styles.sendBtn}
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
    background: "#0a0a0a",
    color: "#e8e8e8",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  header: {
    height: 56,
    padding: "0 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #1f1f1f",
    flexShrink: 0
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer"
  },
  logo: { fontSize: 20, color: "#a78bfa" },
  brandName: { fontSize: 17, fontWeight: 600 },
  newChatBtn: {
    background: "#1a1a1a",
    border: "1px solid #333",
    color: "#e8e8e8",
    padding: "7px 14px",
    borderRadius: 20,
    fontSize: 13,
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
    width: "min(290px, 85vw)",
    height: "100%",
    background: "#111",
    borderRight: "1px solid #222",
    display: "flex",
    flexDirection: "column",
    padding: "20px 16px"
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    color: "white",
    flexShrink: 0
  },
  userName: { fontSize: 16, fontWeight: 600 },
  userSub: { fontSize: 12, color: "#888", marginTop: 2 },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "transparent",
    border: "none",
    color: "#ddd",
    padding: "12px 10px",
    borderRadius: 10,
    fontSize: 15,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    marginBottom: 8
  },
  sectionLabel: {
    fontSize: 12,
    color: "#666",
    margin: "16px 0 8px 10px",
    fontWeight: 500
  },
  chatList: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 2
  },
  chatItem: {
    background: "transparent",
    border: "none",
    color: "#ccc",
    padding: "10px",
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer",
    textAlign: "left",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  bottomBar: {
    display: "flex",
    gap: 8,
    borderTop: "1px solid #222",
    paddingTop: 14,
    marginTop: 10
  },
  bottomBtn: {
    flex: 1,
    background: "#1a1a1a",
    border: "1px solid #333",
    color: "#ccc",
    padding: "10px",
    borderRadius: 10,
    fontSize: 14,
    cursor: "pointer"
  },
  settingsPanel: {
    background: "#1a1a1a",
    borderRadius: 10,
    padding: "12px",
    marginTop: 10
  },
  settingRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 14,
    color: "#ccc"
  },
  chat: {
    flex: 1,
    overflowY: "auto",
    padding: "16px"
  },
  chatInner: {
    maxWidth: 820,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    width: "100%"
  },
  bubble: {
    lineHeight: 1.6,
    fontSize: "clamp(14px, 2.5vw, 15.5px)",
    width: "100%"
  },
  userBubble: {
    alignSelf: "flex-end",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 18,
    padding: "12px 16px",
    maxWidth: "min(85%, 520px)"
  },
  assistantBubble: {
    alignSelf: "flex-start",
    maxWidth: "min(90%, 720px)"
  },
  image: {
    maxWidth: "100%",
    borderRadius: 12,
    marginBottom: 10
  },
  actions: {
    display: "flex",
    gap: 6,
    marginTop: 6,
    flexWrap: "wrap"
  },
  actionBtn: {
    background: "transparent",
    border: "none",
    color: "#888",
    fontSize: 12,
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 6
  },
  editArea: {
    width: "100%",
    background: "#111",
    border: "1px solid #333",
    borderRadius: 8,
    color: "white",
    padding: 10,
    fontSize: 14,
    resize: "vertical"
  },
  smallBtn: {
    background: "#a78bfa",
    border: "none",
    color: "white",
    padding: "6px 12px",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer"
  },
  smallBtnSecondary: {
    background: "#333",
    border: "none",
    color: "white",
    padding: "6px 12px",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer"
  },
  previewBar: {
    padding: "8px 16px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#111",
    borderTop: "1px solid #1f1f1f"
  },
  removeBtn: {
    background: "#333",
    border: "none",
    color: "white",
    width: 28,
    height: 28,
    borderRadius: "50%",
    cursor: "pointer"
  },
  footer: {
    padding: "12px 16px 20px",
    flexShrink: 0
  },
  inputWrapper: {
    maxWidth: 820,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 24,
    padding: "8px 10px"
  },
  toolBtn: {
    background: "transparent",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    width: 38,
    height: 38,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#aaa",
    flexShrink: 0
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: 15,
    outline: "none",
    padding: "8px 4px",
    minWidth: 0
  },
  sendBtn: {
    background: "#e8e8e8",
    color: "#0a0a0a",
    border: "none",
    width: 34,
    height: 34,
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
