"use client";

import { useState, useEffect } from 'react';

export default function ResponseSpeed({ messages }) {
  const [avgSpeed, setAvgSpeed] = useState(0);

  useEffect(() => {
    if (messages.length < 2) return;

    const speeds = [];
    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
        const timeDiff = messages[i + 1].timestamp - messages[i].timestamp;
        if (timeDiff > 0 && timeDiff < 30000) { // Only count responses under 30s
          speeds.push(timeDiff);
        }
      }
    }

    if (speeds.length > 0) {
      const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length;
      setAvgSpeed(avg);
    }
  }, [messages]);

  if (avgSpeed === 0) return null;

  const speedText = avgSpeed < 1000 ? '🚀 Fast' : avgSpeed < 3000 ? '⚡ Good' : '🐢 Slow';

  return (
    <div style={styles.container}>
      <span style={styles.icon}>⏱️</span>
      <span style={styles.speed}>{speedText}</span>
      <span style={styles.time}>{(avgSpeed / 1000).toFixed(1)}s</span>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    fontSize: '12px',
    padding: '0 12px',
    color: '#94a3b8'
  },
  icon: {
    fontSize: '14px'
  },
  speed: {
    fontWeight: '500'
  },
  time: {
    opacity: 0.6
  }
};
