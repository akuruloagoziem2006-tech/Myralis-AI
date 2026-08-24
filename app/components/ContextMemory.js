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
    <div style={{padding:"4px 12px",fontSize:"13px"}}>
      <button onClick={() => setShowDetails(!showDetails)} style={{background:"transparent",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:"13px",padding:"4px 8px",borderRadius:"4px"}}>
        🧠 Context: {memoryUsage}%
      </button>
      {showDetails && (
        <div style={{marginTop:"4px",padding:"8px",background:"#1e293b",borderRadius:"8px",display:"flex",flexDirection:"column",gap:"4px"}}>
          <div style={{width:"100%",height:"4px",background:"#334155",borderRadius:"2px",overflow:"hidden"}}>
            <div style={{width:`${memoryUsage}%`,height:"100%",background:getMemoryColor(),transition:"width 0.3s ease"}} />
          </div>
          <div style={{display:"flex",gap:"12px",fontSize:"12px",color:"#94a3b8"}}>
            <span>📝 {messages.length} messages</span>
            <span>📊 {totalWords} words</span>
          </div>
        </div>
      )}
    </div>
  );
}
