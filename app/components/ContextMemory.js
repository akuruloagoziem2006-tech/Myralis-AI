"use client";

import { useState } from 'react';

export default function ContextMemory({ messages }) {
  const [showDetails, setShowDetails] = useState(false);

  const totalWords = messages.reduce((sum, m) => sum + m.content.split(/\s+/).length, 0);
  const memoryUsage = Math.min(Math.round((totalWords / 2000) * 100), 100);
  
  const getMemoryColor = () => {
    if (memoryUsage < 50) return '#22c55e';
    if (memoryUsage < 80) return '#fbbf24';
    return '#ef4444';
  };

  return (
    <div style={styles.container}>
      <button 
        onClick={() => setShowDetails(!showDetails)} 
        style={styles.toggleBtn}
      >
        🧠 Context: {memoryUsage}%
      </button>
      
      {showDetails && (
        <div style={styles.details}>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${memoryUsage}%`,
                background: getMemoryColor()
              }}
            />
          </div>
          <div style={styles.stats}>
            <span>📝 {messages.length} messages</span>
            <span>📊 {totalWords} words</span>
          </div>
          <div style={styles.status}>
            {memoryUsage < 80 ? 
              '✅ Enough context' : 
              '⚠️ Context limit approaching'
            }
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "4px 12px",
    fontSize: "13px"
  },
  toggleBtn: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "13px",
    padding: "4px 8px",
    borderRadius: "4px"
  },
  details: {
    marginTop: "4px",
    padding: "8px",
    background: "#1e293b",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  progressBar: {
    width: "100%",
    height: "4px",
    background: "#334155",
    borderRadius: "2px",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    transition: "width 0.3s ease"
  },
  stats: {
    display: "flex",
    gap: "12px",
    fontSize: "12px",
    color: "#94a3b8"
  },
  status: {
    fontSize: "12px",
    fontWeight: "500"
  }
};
