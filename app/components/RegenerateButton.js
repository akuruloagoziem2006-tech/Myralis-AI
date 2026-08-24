"use client";
import { useState } from 'react';

export default function RegenerateButton({ onRegenerate, lastMessage }) {
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setRegenerating(true);
    await onRegenerate();
    setRegenerating(false);
  };

  if (!lastMessage || lastMessage.role !== 'assistant') return null;

  return (
    <button onClick={handleRegenerate} style={{background:"transparent",border:"1px solid #6366f1",borderRadius:"16px",padding:"4px 12px",color:"#6366f1",cursor:"pointer",fontSize:"12px"}} disabled={regenerating}>
      {regenerating ? '⟳ Regenerating...' : '⟳ Regenerate'}
    </button>
  );
}
