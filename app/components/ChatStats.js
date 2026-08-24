"use client";

import { useState } from 'react';

export default function ChatStats({ messages }) {
  const [showStats, setShowStats] = useState(false);

  if (messages.length === 0) return null;

  const totalMessages = messages.length;
  const userMessages = messages.filter(m => m.role === 'user').length;
  const assistantMessages = messages.filter(m => m.role === 'assistant').length;
  const totalWords = messages.reduce((sum, m) => sum + m.content.split(/\s+/).length, 0);
  const avgWords = Math.round(totalWords / totalMessages);

  return (
    <div style={styles.container}>
      <button 
        onClick={() => setShowStats(!showStats)} 
        style={styles.toggleBtn}
      >
        📊 {showStats ? 'Hide Stats' : 'Show Stats'}
      </button>

      {showStats && (
        <div style={styles.stats}>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>💬 Messages:</span>
            <span style={styles.statValue}>{totalMessages}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>👤 You:</span>
            <span style={styles.statValue}>{userMessages}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>🤖 Myralis:</span>
            <span style={styles.statValue}>{assistantMessages}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>📝 Avg Words:</span>
            <span style={styles.statValue}>{avgWords}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>📏 Total Words:</span>
            <span style={styles.statValue}>{totalWords}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "8px 20px",
    borderBottom: "1px solid #1e293b"
  },
  toggleBtn: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "14px",
    padding: "4px 8px",
    borderRadius: "4px",
    transition: "background 0.2s"
  },
  stats: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    marginTop: "8px",
    padding: "8px",
    background: "#1e293b",
    borderRadius: "8px"
  },
  statItem: {
    display: "flex",
    gap: "4px",
    fontSize: "13px"
  },
  statLabel: {
    color: "#94a3b8"
  },
  statValue: {
    color: "#e4e4e7",
    fontWeight: "bold"
  }
};
