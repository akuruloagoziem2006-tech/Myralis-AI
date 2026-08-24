"use client";
import { useEffect } from 'react';

export default function KeyboardShortcuts({ onShortcut }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onShortcut('search');
      }
      if (e.key === 'Escape') {
        onShortcut('escape');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onShortcut]);

  return (
    <div style={{padding:"4px 20px",fontSize:"12px",color:"#64748b",display:"flex",gap:"16px",borderTop:"1px solid #1e293b"}}>
      <span>⌘K Search</span>
      <span>Esc Cancel</span>
    </div>
  );
}
