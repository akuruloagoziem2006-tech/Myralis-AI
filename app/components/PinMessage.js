"use client";
import { useState } from 'react';

export default function PinMessage({ message, onPin }) {
  const [pinned, setPinned] = useState(message.pinned || false);

  const handlePin = () => {
    const newPinned = !pinned;
    setPinned(newPinned);
    if (onPin) onPin(newPinned);
  };

  return (
    <button onClick={handlePin} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"14px",padding:"2px 6px",borderRadius:"4px",color:pinned ? '#fbbf24' : '#64748b'}}>
      📌
    </button>
  );
}
