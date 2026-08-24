"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm Myralis AI. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const chatEnd = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Text-to-Speech
  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  // Speech-to-Text
  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }]
        })
      });

      const data = await res.json();

      if (data.error) {
        setMessages(prev => [...prev, { role: "assistant", content: "Error: " + data.error }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        speak(data.reply); // Auto speak the reply
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    }

    setLoading(false);
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <span style={{ color: "#7c9cff" }}>✦</span> Myralis AI
      </header>

      <div style={styles.chat}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.message,
              ...(msg.role === "user" ? styles.user : styles.bot)
            }}
          >
            {msg.role === "assistant" ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            ) : (
              msg.content
            )}
          </div>
        ))}
        {loading && (
          <div style={{ ...styles.message, ...styles.bot, opacity: 0.6 }}>
            Myralis is thinking...
          </div>
        )}
        <div ref={chatEnd} />
      </div>

      <div style={styles.inputArea}>
        <button
          onClick={startListening}
          style={{
            ...styles.iconButton,
            background: listening ? "#ef4444" : "#2a2f3e"
          }}
          title="Speak"
        >
          {listening ? "Listening..." : "🎤"}
        </button>

        <input
          style={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Ask me anything..."
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
    background: "#0f1117",
    color: "#e4e4e7",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  header: {
    padding: "16px 20px",
    background: "#1a1d27",
    borderBottom: "1px solid #2a2f3e",
    fontWeight: 600,
    fontSize: 18
  },
  chat: {
    flex: 1,
    overflowY: "auto",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16
  },
  message: {
    maxWidth: "85%",
    padding: "12px 16px",
    borderRadius: 16,
    lineHeight: 1.6,
    fontSize: 15
  },
  user: {
    background: "#2a2f3e",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4
  },
  bot: {
    background: "#1e2330",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4
  },
  inputArea: {
    padding: "12px 16px",
    background: "#1a1d27",
    borderTop: "1px solid #2a2f3e",
    display: "flex",
    gap: 10,
    alignItems: "center"
  },
  input: {
    flex: 1,
    background: "#12151f",
    border: "1px solid #2a2f3e",
    borderRadius: 12,
    padding: "12px 16px",
    color: "white",
    fontSize: 15,
    outline: "none"
  },
  button: {
    background: "#7c9cff",
    border: "none",
    borderRadius: 12,
    padding: "0 18px",
    height: 44,
    color: "white",
    fontWeight: 600,
    cursor: "pointer"
  },
  iconButton: {
    border: "none",
    borderRadius: 12,
    width: 44,
    height: 44,
    color: "white",
    fontSize: 18,
    cursor: "pointer"
  }
};
