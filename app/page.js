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
  const [image, setImage] = useState(null);

  const chatEnd = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("myralis_messages");
    const speak = localStorage.getItem("myralis_autoSpeak");

    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([
        { role: "assistant", content: "Hello! I'm **Myralis**. How can I help you today?" }
      ]);
    }

    if (speak !== null) setAutoSpeak(speak === "true");
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
    if (!autoSpeak || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#`_]/g, ""));
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }

  function newChat() {
    const welcome = [
      { role: "assistant", content: "Hello! I'm **Myralis**. How can I help you today?" }
    ];
    setMessages(welcome);
    localStorage.setItem("myralis_messages", JSON.stringify(welcome));
    setShowDashboard(false);
  }

  function toggleSpeak() {
    const newValue = !autoSpeak;
    setAutoSpeak(newValue);
    localStorage.setItem("myralis_autoSpeak", newValue.toString());
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

  async function sendMessageWithText(text) {
    if ((!text.trim() && !image) || loading) return;

    const userMessage = text.trim() || "What do you see in this image?";
    setInput("");
    setLoading(true);
    window.speechSynthesis.cancel();

    const newUserMsg = {
      role: "user",
      content: userMessage,
      image: image || null
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setImage(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, newUserMsg] })
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [...prev, { role: "assistant", content: "Error: " + data.error }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        speak(data.reply);
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
        <div style={styles.brand} onClick={() => setShowDashboard(!showDashboard)}>
          <span style={styles.logo}>✦</span>
          <span style={styles.brandName}>Myralis</span>
        </div>

        <button onClick={newChat} style={styles.newChatBtn}>
          + New Chat
        </button>
      </header>

      {/* Dashboard / Settings Panel */}
      {showDashboard && (
        <div style={styles.dashboard}>
          <div style={styles.dashboardTitle}>Dashboard</div>

          <label style={styles.settingRow}>
            <input type="checkbox" checked={autoSpeak} onChange={toggleSpeak} />
            <span>Auto-speak replies</span>
          </label>

          <button onClick={newChat} style={styles.dashboardBtn}>
            New Chat
          </button>

          <button onClick={() => setShowDashboard(false)} style={styles.closeBtn}>
            Close
          </button>
        </div>
      )}

      {/* Messages */}
      <main style={styles.chat}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.bubble,
              ...(msg.role === "user" ? styles.userBubble : styles.assistantBubble)
            }}
          >
            {msg.image && <img src={msg.image} alt="upload" style={styles.image} />}
            {msg.role === "assistant" ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            ) : (
              msg.content
            )}
          </div>
        ))}

        {loading && (
          <div style={{ ...styles.bubble, ...styles.assistantBubble, opacity: 0.6 }}>
            Thinking...
          </div>
        )}
        <div ref={chatEnd} />
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
          <button onClick={startListening} style={styles.toolBtn}>
            {listening ? "🔴" : "🎤"}
          </button>

          <button onClick={() => fileInputRef.current?.click()} style={styles.toolBtn}>
            📷
          </button>
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
    borderBottom: "1px solid #1f1f1f"
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer"
  },
  logo: {
    fontSize: 20,
    color: "#a78bfa"
  },
  brandName: {
    fontSize: 17,
    fontWeight: 600
  },
  newChatBtn: {
    background: "#1a1a1a",
    border: "1px solid #333",
    color: "#e8e8e8",
    padding: "7px 14px",
    borderRadius: 20,
    fontSize: 13,
    cursor: "pointer"
  },
  dashboard: {
    background: "#111",
    borderBottom: "1px solid #1f1f1f",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 14
  },
  dashboardTitle: {
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 4
  },
  settingRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 14,
    color: "#ccc"
  },
  dashboardBtn: {
    background: "#1a1a1a",
    border: "1px solid #333",
    color: "white",
    padding: "10px",
    borderRadius: 10,
    fontSize: 14,
    cursor: "pointer",
    textAlign: "left"
  },
  closeBtn: {
    background: "transparent",
    border: "1px solid #333",
    color: "#aaa",
    padding: "8px",
    borderRadius: 10,
    fontSize: 13,
    cursor: "pointer"
  },
  chat: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 16
  },
  bubble: {
    maxWidth: "820px",
    width: "100%",
    lineHeight: 1.6,
    fontSize: 15.5
  },
  userBubble: {
    alignSelf: "flex-end",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 18,
    padding: "12px 16px",
    maxWidth: "80%"
  },
  assistantBubble: {
    alignSelf: "flex-start"
  },
  image: {
    maxWidth: "100%",
    borderRadius: 12,
    marginBottom: 10
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
    padding: "12px 16px 20px"
  },
  inputWrapper: {
    maxWidth: 820,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 24,
    padding: "8px 10px 8px 12px"
  },
  toolBtn: {
    background: "transparent",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    padding: "6px",
    color: "#aaa"
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: 15,
    outline: "none",
    padding: "8px 4px"
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
    justifyContent: "center"
  }
};
