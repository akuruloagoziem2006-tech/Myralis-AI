"use client";

import { useState, useEffect } from 'react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function SharePage({ params }) {
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShare = async () => {
      try {
        const res = await fetch(`/api/share?id=${params.id}`);
        if (!res.ok) {
          throw new Error('Share not found');
        }
        const data = await res.json();
        setShareData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShare();
  }, [params.id]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading shared chat...</div>
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <h2>❌ {error || 'Share not found'}</h2>
          <p>This shared chat may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>✦ {shareData.title}</h1>
        <div style={styles.meta}>
          <span>Shared on {new Date(shareData.createdAt).toLocaleString()}</span>
          {shareData.systemPrompt && (
            <div style={styles.prompt}>
              <strong>System Prompt:</strong> {shareData.systemPrompt}
            </div>
          )}
        </div>
      </div>

      <div style={styles.chat}>
        {shareData.messages.map((msg, i) => (
          <div 
            key={i} 
            style={{
              ...styles.message,
              ...(msg.role === "user" ? styles.user : styles.bot)
            }}
          >
            <div style={styles.role}>
              {msg.role === 'user' ? '👤 You' : '🤖 Myralis'}
            </div>
            {msg.image && (
              <img src={msg.image} alt="Shared image" style={styles.image} />
            )}
            {msg.role === "assistant" ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            ) : (
              msg.content
            )}
            {msg.timestamp && (
              <div style={styles.time}>
                {new Date(msg.timestamp).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={styles.footer}>
        <p>💬 Shared from Myralis AI</p>
        <a href="/" style={styles.link}>Try Myralis AI →</a>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "20px",
    background: "#0b0d13",
    color: "#e4e4e7",
    minHeight: "100vh",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  header: {
    borderBottom: "2px solid #6366f1",
    paddingBottom: "20px",
    marginBottom: "30px"
  },
  title: {
    fontSize: "24px",
    marginBottom: "8px"
  },
  meta: {
    fontSize: "14px",
    color: "#94a3b8"
  },
  prompt: {
    marginTop: "8px",
    padding: "8px",
    background: "#1e293b",
    borderRadius: "8px",
    fontSize: "13px"
  },
  chat: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "30px"
  },
  message: {
    padding: "14px 18px",
    borderRadius: "18px",
    lineHeight: 1.6,
    fontSize: "15px"
  },
  user: {
    background: "#1e293b",
    alignSelf: "flex-end",
    borderBottomRightRadius: "6px",
    maxWidth: "85%"
  },
  bot: {
    background: "#1e1b4b",
    alignSelf: "flex-start",
    borderBottomLeftRadius: "6px",
    border: "1px solid #312e81",
    maxWidth: "85%"
  },
  role: {
    fontSize: "12px",
    fontWeight: "bold",
    opacity: 0.7,
    marginBottom: "4px"
  },
  image: {
    maxWidth: "100%",
    borderRadius: "8px",
    marginBottom: "8px"
  },
  time: {
    fontSize: "11px",
    opacity: 0.4,
    marginTop: "4px"
  },
  footer: {
    borderTop: "1px solid #1e293b",
    paddingTop: "20px",
    textAlign: "center",
    fontSize: "14px",
    color: "#94a3b8"
  },
  link: {
    color: "#6366f1",
    textDecoration: "none",
    fontWeight: "bold",
    display: "inline-block",
    marginTop: "4px"
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    fontSize: "18px",
    color: "#94a3b8"
  },
  error: {
    textAlign: "center",
    padding: "40px",
    color: "#ef4444"
  }
};
