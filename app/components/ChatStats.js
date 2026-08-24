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
    <div style={{padding:"8px 0"}}>
      <button onClick={() => setShowStats(!showStats)} style={{background:"transparent",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:"13px"}}>
        📊 {showStats ? 'Hide Stats' : 'Show Stats'}
      </button>
      {showStats && (
        <div style={{display:"flex",gap:"12px",flexWrap:"wrap",marginTop:"4px",padding:"8px",background:"#1e293b",borderRadius:"8px",fontSize:"12px"}}>
          <span>💬 {totalMessages}</span>
          <span>👤 {userMessages}</span>
          <span>🤖 {assistantMessages}</span>
          <span>📝 {avgWords} avg</span>
        </div>
      )}
    </div>
  );
}
