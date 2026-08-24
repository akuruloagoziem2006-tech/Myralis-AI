"use client";

export default function QuickActions({ onAction }) {
  const actions = [
    { emoji: '📝', label: 'Summarize', prompt: 'Summarize this conversation' },
    { emoji: '💡', label: 'Brainstorm', prompt: 'Give me creative ideas about this' },
    { emoji: '🔍', label: 'Explain', prompt: 'Explain this in more detail' },
    { emoji: '📚', label: 'Teach', prompt: 'Teach me about this topic' }
  ];

  return (
    <div style={{padding:"8px 20px",display:"flex",gap:"8px",flexWrap:"wrap",borderTop:"1px solid #1e293b"}}>
      {actions.map((action, i) => (
        <button key={i} onClick={() => onAction(action.prompt)} style={{background:"#1e293b",border:"none",borderRadius:"16px",padding:"6px 14px",color:"#e4e4e7",fontSize:"13px",cursor:"pointer"}}>
          {action.emoji} {action.label}
        </button>
      ))}
    </div>
  );
}
