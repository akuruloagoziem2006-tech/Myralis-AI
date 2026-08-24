"use client";
import { useState, useEffect } from 'react';

export default function DraftSaver({ input, onRestore, onClear }) {
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    const savedDraft = localStorage.getItem('myralis_draft');
    if (savedDraft && savedDraft.length > 0) {
      setHasDraft(true);
    }
  }, []);

  const clearDraft = () => {
    localStorage.removeItem('myralis_draft');
    setHasDraft(false);
    if (onClear) onClear();
  };

  const restoreDraft = () => {
    const draft = localStorage.getItem('myralis_draft');
    if (draft && onRestore) {
      onRestore(draft);
      clearDraft();
    }
  };

  if (!hasDraft) return null;

  return (
    <div style={{padding:"4px 20px",display:"flex",gap:"8px",alignItems:"center",background:"#1e293b",borderBottom:"1px solid #334155",fontSize:"13px"}}>
      <span style={{color:"#94a3b8"}}>💾 Draft saved</span>
      <button onClick={restoreDraft} style={{background:"#6366f1",border:"none",color:"white",padding:"2px 10px",borderRadius:"4px",cursor:"pointer",fontSize:"12px"}}>Restore</button>
      <button onClick={clearDraft} style={{background:"transparent",border:"none",color:"#64748b",cursor:"pointer",fontSize:"14px",padding:"0 4px"}}>✕</button>
    </div>
  );
}
