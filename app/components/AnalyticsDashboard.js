"use client";

import { useState, useEffect } from 'react';

export default function AnalyticsDashboard({ messages }) {
  const [showDashboard, setShowDashboard] = useState(false);
  const [analytics, setAnalytics] = useState({});

  useEffect(() => {
    if (messages.length === 0) return;

    const totalMessages = messages.length;
    const userMessages = messages.filter(m => m.role === 'user').length;
    const assistantMessages = messages.filter(m => m.role === 'assistant').length;
    const totalWords = messages.reduce((sum, m) => sum + m.content.split(/\s+/).length, 0);
    const avgResponseTime = calculateAvgResponseTime(messages);
    const mostUsedWords = getMostUsedWords(messages);
    const messageLengths = getMessageLengths(messages);
    const activityByHour = getActivityByHour(messages);
    const sentimentAnalysis = analyzeSentiment(messages);

    setAnalytics({
      totalMessages,
      userMessages,
      assistantMessages,
      totalWords,
      avgResponseTime,
      mostUsedWords,
      messageLengths,
      activityByHour,
      sentimentAnalysis,
      pinnedCount: messages.filter(m => m.pinned).length,
      imageCount: messages.filter(m => m.image).length,
      editedCount: messages.filter(m => m.edited).length
    });
  }, [messages]);

  const calculateAvgResponseTime = (msgs) => {
    const times = [];
    for (let i = 0; i < msgs.length - 1; i++) {
      if (msgs[i].role === 'user' && msgs[i + 1].role === 'assistant') {
        const diff = msgs[i + 1].timestamp - msgs[i].timestamp;
        if (diff > 0 && diff < 30000) {
          times.push(diff);
        }
      }
    }
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  };

  const getMostUsedWords = (msgs) => {
    const wordCount = {};
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    
    msgs.forEach(msg => {
      const words = msg.content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        const cleanWord = word.replace(/[^a-z0-9]/g, '');
        if (cleanWord.length > 2 && !stopWords.includes(cleanWord)) {
          wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
        }
      });
    });

    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  };

  const getMessageLengths = (msgs) => {
    const lengths = msgs.map(m => m.content.length);
    return {
      avg: Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length),
      min: Math.min(...lengths),
      max: Math.max(...lengths)
    };
  };

  const getActivityByHour = (msgs) => {
    const hours = Array(24).fill(0);
    msgs.forEach(msg => {
      if (msg.timestamp) {
        const hour = new Date(msg.timestamp).getHours();
        hours[hour]++;
      }
    });
    return hours;
  };

  const analyzeSentiment = (msgs) => {
    const positive = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'happy', 'awesome'];
    const negative = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'sad', 'disappointed', 'frustrated', 'annoying'];
    
    let positiveScore = 0;
    let negativeScore = 0;

    msgs.forEach(msg => {
      const words = msg.content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (positive.includes(word)) positiveScore++;
        if (negative.includes(word)) negativeScore++;
      });
    });

    const total = positiveScore + negativeScore || 1;
    return {
      positive: Math.round((positiveScore / total) * 100),
      negative: Math.round((negativeScore / total) * 100),
      neutral: 100 - Math.round((positiveScore / total) * 100) - Math.round((negativeScore / total) * 100)
    };
  };

  const getTimeDisplay = (ms) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (!showDashboard) {
    return (
      <button 
        onClick={() => setShowDashboard(true)} 
        style={styles.toggleBtn}
      >
        📊 Analytics
      </button>
    );
  }

  return (
    <div style={styles.dashboard}>
      <div style={styles.header}>
        <h3 style={styles.title}>📊 Analytics Dashboard</h3>
        <button 
          onClick={() => setShowDashboard(false)} 
          style={styles.closeBtn}
        >
          ✕
        </button>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Total Messages</div>
          <div style={styles.cardValue}>{analytics.totalMessages}</div>
        </div>
        
        <div style={styles.card}>
          <div style={styles.cardLabel}>You vs Myralis</div>
          <div style={styles.cardValue}>
            {analytics.userMessages} / {analytics.assistantMessages}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Avg Response Time</div>
          <div style={styles.cardValue}>
            {getTimeDisplay(analytics.avgResponseTime || 0)}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Total Words</div>
          <div style={styles.cardValue}>{analytics.totalWords}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Message Length</div>
          <div style={styles.cardValue}>
            {analytics.messageLengths?.avg || 0} avg
          </div>
          <div style={styles.cardSub}>
            Min: {analytics.messageLengths?.min || 0} | Max: {analytics.messageLengths?.max || 0}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Pinned Messages</div>
          <div style={styles.cardValue}>{analytics.pinnedCount || 0}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Images Shared</div>
          <div style={styles.cardValue}>{analytics.imageCount || 0}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Messages Edited</div>
          <div style={styles.cardValue}>{analytics.editedCount || 0}</div>
        </div>
      </div>

      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Most Used Words</h4>
        <div style={styles.wordCloud}>
          {analytics.mostUsedWords?.slice(0, 10).map(([word, count]) => (
            <span 
              key={word} 
              style={{
                ...styles.wordTag,
                fontSize: `${Math.min(14 + count * 2, 24)}px`,
                opacity: Math.min(0.5 + count * 0.1, 1)
              }}
            >
              {word} ({count})
            </span>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Sentiment Analysis</h4>
        <div style={styles.sentimentBar}>
          <div style={{ ...styles.sentimentFill, background: '#22c55e', width: `${analytics.sentimentAnalysis?.positive || 0}%` }}>
            😊 {analytics.sentimentAnalysis?.positive || 0}%
          </div>
          <div style={{ ...styles.sentimentFill, background: '#94a3b8', width: `${analytics.sentimentAnalysis?.neutral || 0}%` }}>
            😐 {analytics.sentimentAnalysis?.neutral || 0}%
          </div>
          <div style={{ ...styles.sentimentFill, background: '#ef4444', width: `${analytics.sentimentAnalysis?.negative || 0}%` }}>
            😞 {analytics.sentimentAnalysis?.negative || 0}%
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Activity by Hour</h4>
        <div style={styles.hourGrid}>
          {analytics.activityByHour?.map((count, hour) => (
            <div key={hour} style={styles.hourColumn}>
              <div style={{
                ...styles.hourBar,
                height: `${Math.min(count * 5, 100)}%`,
                background: count > 0 ? '#6366f1' : '#1e293b'
              }} />
              <span style={styles.hourLabel}>{hour}h</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  toggleBtn: {
    background: "#6366f1",
    border: "none",
    borderRadius: "8px",
    padding: "6px 14px",
    color: "white",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500"
  },
  dashboard: {
    padding: "16px 20px",
    background: "#1a1a2e",
    borderBottom: "1px solid #1e293b",
    maxHeight: "400px",
    overflowY: "auto"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },
  title: {
    margin: 0,
    fontSize: "16px",
    color: "#e4e4e7"
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "18px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "8px",
    marginBottom: "16px"
  },
  card: {
    background: "#1e293b",
    padding: "10px",
    borderRadius: "8px",
    textAlign: "center"
  },
  cardLabel: {
    fontSize: "11px",
    color: "#94a3b8",
    marginBottom: "4px"
  },
  cardValue: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#e4e4e7"
  },
  cardSub: {
    fontSize: "10px",
    color: "#64748b",
    marginTop: "2px"
  },
  section: {
    marginBottom: "12px"
  },
  sectionTitle: {
    fontSize: "13px",
    color: "#94a3b8",
    marginBottom: "8px"
  },
  wordCloud: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    padding: "8px",
    background: "#1e293b",
    borderRadius: "8px"
  },
  wordTag: {
    padding: "2px 8px",
    borderRadius: "4px",
    background: "#2a2a4a",
    color: "#e4e4e7"
  },
  sentimentBar: {
    display: "flex",
    borderRadius: "8px",
    overflow: "hidden",
    height: "30px",
    background: "#1e293b"
  },
  sentimentFill: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold",
    color: "white",
    transition: "width 0.5s ease"
  },
  hourGrid: {
    display: "flex",
    gap: "2px",
    alignItems: "flex-end",
    height: "60px",
    padding: "4px",
    background: "#1e293b",
    borderRadius: "8px"
  },
  hourColumn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end"
  },
  hourBar: {
    width: "100%",
    minHeight: "2px",
    maxHeight: "100%",
    borderRadius: "2px 2px 0 0",
    transition: "height 0.5s ease"
  },
  hourLabel: {
    fontSize: "8px",
    color: "#64748b",
    marginTop: "2px"
  }
};
