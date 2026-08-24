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
  const [showSettings, setShowSettings] = useState(false);
  const [image, setImage] = useState(null);
  const chatEnd = useRef(null);
  const fileInputRef = useRef(null);

  // Load saved data
  useEffect(() => {
    const savedMessages = localStorage.getItem("myralis_messages");
    const savedSpeak = localStorage.getItem("myralis_autoSpeak");

    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      setMessages([{ role: "assistant", content: "Hello! I'm **Myralis AI**. How can I help you today?" }]);
    }

    if (savedSpeak !== null) {
      setAutoSpeak(savedSpeak === "true");
    }
  }, []);

  // Save messages
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
    const cleanText = text.replace(/[*#`_]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  }

  function clearChat() {
    const welcome = [{ role: "assistant", content: "Hello! I'm **Myralis AI**. How can I help you today?" }];
    setMessages(welcome);
    localStorage.setItem("myralis_messages", JSON.stringify(welcome));
    setShowSettings(false);
  }

  function toggleSpeak() {
    const newValue = !autoSpeak;
    setAutoSpeak(newValue);
    localStorage.setItem("myralis_autoSpeak", newValue.toString());
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported. Try Chrome.");
      return;
    }

    window.speechSynthesis.cancel();
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setTimeout(() => sendMessageWithText(transcript), 300);
    };

    recognition.onerror = () => setListening(false);
    recognition.start();
  }

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
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

    setMessages(prev => [...prev, newUserMsg]);
    setImage(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newUserMsg]
        })
      });

      const data = await res.json();

      if (data.error) {
        setMessages(prev => [...prev, { role: "assistant", content: "Error: " + data.error }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        speak(data.reply);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    }

    setLoading(false);
  }

  function sendMessage() {
    sendMessageWithText(input);
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>✦</div>
          <div>
            <div style={styles.logoText}>Myralis</div>
            <div style={styles.logoSub}>AI Companion</div>
          </div>
        </div>

        <button onClick={() => setShowSettings(!showSettings)} style={styles.settingsBtn}>
          ⚙️
        </button>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div style={styles.settingsPanel}>
          <label style={styles.settingItem}>
            <input type="checkbox" checked={autoSpeak} onChange={toggleSpeak} />
            Auto Speak Replies
          </label>
          <button onClick={clearChat} style={styles.clearBtn}>Clear Chat</button>
        </div>
      )}

      {/* Chat */}
      <div style={styles.chat}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            ...styles.message,
            ...(msg.role === "user" ? styles.user : styles.bot)
          }}>
            {msg.image && (
              <img src={msg.image} alt="Uploaded" style={styles.imagePreview} />
            )}
            {msg.role === "assistant" ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            ) : (
              msg.content
            )}
          </div>
        ))}

        {loading && (
          <div style={{ ...styles.message, ...styles.bot, opacity: 0.65 }}>
            Myralis is thinking...
          </div>
        )}
        <div ref={chatEnd} />
      </div>

      {/* Image Preview */}
      {image && (
        <div style={styles.imageBar}>
          <img src={image} alt="Preview" style={{ height: 50, borderRadius: 8 }} />
          <button onClick={() => setImage(null)} style={styles.removeImg}>✕</button>
        </div>
      )}

      {/* Input */}
      <div style={styles.inputArea}>
        <button onClick={startListening} style={{
          ...styles.iconButton,
          background: listening ? "#ef4444" : "#1e293b"
        }}>
          {listening ? "Listening..." : "🎤"}
        </button>

        <button onClick={() => fileInputRef.current.click()} style={styles.iconButton}>
          📷
        </button>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleImage}
          style={{ display: "none" }}
        />

        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={listening ? "Listening..." : "Ask Myralis anything..."}
        />

        <button style={styles.button} onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
    background: "#0b0d13",
    color: "#e4e4e7",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  header: {
    padding: "14px 20px",
    background: "linear-gradient(90deg, #111827, #0f172a)",
    borderBottom: "1px solid #1e293b",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  logoIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    color: "white",
    fontWeight: "bold"
  },
  logoText: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#f8fafc"
  },
  logoSub: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "-2px"
  },
  settingsBtn: {
    background: "transparent",
    border: "none",
    fontSize: "20px",
    cursor: "pointer"
  },
  settingsPanel: {
    background: "#1e293b",
    padding: "12px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #334155"
  },
  settingItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px"
  },
  clearBtn: {
    background: "#ef4444",
    border: "none",
    color: "white",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px"
  },
  chat: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  message: {
    maxWidth: "85%",
    padding: "14px 18px",
    borderRadius: "18px",
    lineHeight: 1.6,
    fontSize: "15px"
  },
  user: {
    background: "#1e293b",
    alignSelf: "flex-end",
    borderBottomRightRadius: "6px"
  },
  bot: {
    background: "#1e1b4b",
    alignSelf: "flex-start",
    borderBottomLeftRadius: "6px",
    border: "1px solid #312e81"
  },
  imagePreview: {
    maxWidth: "100%",
    borderRadius: "12px",
    marginBottom: "8px"
  },
  imageBar: {
    padding: "8px 16px",
    background: "#1e293b",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  removeImg: {
    background: "#ef4444",
    border: "none",
    color: "white",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    cursor: "pointer"
  },
  inputArea: {
    padding: "14px 16px",
    background: "#0f172a",
    borderTop: "1px solid #1e293b",
    display: "flex",
    gap: "8px",
    alignItems: "center"
  },
  input: {
    flex: 1,
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "14px",
    padding: "13px 16px",
    color: "white",
    fontSize: "15px",
    outline: "none"
  },
  button: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: "14px",
    padding: "0 18px",
    height: "46px",
    color: "white",
    fontWeight: "600",
    cursor: "pointer"
  },
  iconButton: {
    border: "none",
    borderRadius: "14px",
    height: "46px",
    minWidth: "46px",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    background: "#1e293b"
  }
};
