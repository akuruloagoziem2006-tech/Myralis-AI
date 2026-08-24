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
    
    // Calculate average response time
    const times = [];
    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
        const diff = messages[i + 1].timestamp - messages[i].timestamp;
        if (diff > 0 && diff < 30000) {
          times.push(diff);
        }
      }
    }
    const avgResponseTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

    // Most used words
    const wordCount = {};
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    messages.forEach(msg => {
      const words = msg.content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        const cleanWord = word.replace(/[^a-z0-9]/g, '');
        if (cleanWord.length > 2 && !stopWords.includes(cleanWord)) {
          wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
        }
      });
    });
    const mostUsedWords = Object.entries(wordCount).sort((a, b) => b[1] - a[1]).slice(0, 10);

    setAnalytics({
      totalMessages,
      userMessages,
      assistantMessages,
      totalWords,
      avgResponseTime,
      mostUsedWords,
      pinnedCount: messages.filter(m => m.pinned).length,
      imageCount: messages.filter(m => m.image).length,
      editedCount: messages.filter(m => m.edited).length
    });
  }, [messages]);

  if (!showDashboard) {
    return (
      <button onClick={() => setShowDashboard(true)} style={{background:"#6366f1",border:"none",borderRadius:"8px",padding:"6px 14px",color:"white",cursor:"pointer",fontSize:"13px",fontWeight:"500"}}>
        📊 Analytics
      </button>
    );
  }

  return (
    <div style={{padding:"16px 20px",background:"#1a1a2e",borderBottom:"1px solid #1e293b",maxHeight:"400px",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
        <h3 style={{margin:0,fontSize:"16px",color:"#e4e4e7"}}>📊 Analytics Dashboard</h3>
        <button onClick={() => setShowDashboard(false)} style={{background:"transparent",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:"18px"}}>✕</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(120px, 1fr))",gap:"8px",marginBottom:"16px"}}>
        <div style={{background:"#1e293b",padding:"10px",borderRadius:"8px",textAlign:"center"}}>
          <div style={{fontSize:"11px",color:"#94a3b8",marginBottom:"4px"}}>Total Messages</div>
          <div style={{fontSize:"18px",fontWeight:"bold",color:"#e4e4e7"}}>{analytics.totalMessages}</div>
        </div>
        <div style={{background:"#1e293b",padding:"10px",borderRadius:"8px",textAlign:"center"}}>
          <div style={{fontSize:"11px",color:"#94a3b8",marginBottom:"4px"}}>You vs Myralis</div>
          <div style={{fontSize:"18px",fontWeight:"bold",color:"#e4e4e7"}}>{analytics.userMessages} / {analytics.assistantMessages}</div>
        </div>
        <div style={{background:"#1e293b",padding:"10px",borderRadius:"8px",textAlign:"center"}}>
          <div style={{fontSize:"11px",color:"#94a3b8",marginBottom:"4px"}}>Avg Response Time</div>
          <div style={{fontSize:"18px",fontWeight:"bold",color:"#e4e4e7"}}>{(analytics.avgResponseTime / 1000).toFixed(1)}s</div>
        </div>
        <div style={{background:"#1e293b",padding:"10px",borderRadius:"8px",textAlign:"center"}}>
          <div style={{fontSize:"11px",color:"#94a3b8",marginBottom:"4px"}}>Total Words</div>
          <div style={{fontSize:"18px",fontWeight:"bold",color:"#e4e4e7"}}>{analytics.totalWords}</div>
        </div>
      </div>

      <div style={{marginBottom:"12px"}}>
        <h4 style={{fontSize:"13px",color:"#94a3b8",marginBottom:"8px"}}>Most Used Words</h4>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px",padding:"8px",background:"#1e293b",borderRadius:"8px"}}>
          {analytics.mostUsedWords?.slice(0, 10).map(([word, count]) => (
            <span key={word} style={{
              padding:"2px 8px",
              borderRadius:"4px",
              background:"#2a2a4a",
              color:"#e4e4e7",
              fontSize:`${Math.min(14 + count * 2, 24)}px`,
              opacity: Math.min(0.5 + count * 0.1, 1)
            }}>{word} ({count})</span>
          ))}
        </div>
      </div>
    </div>
  );
}
