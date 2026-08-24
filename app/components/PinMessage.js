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
    <button 
      onClick={handlePin} 
      style={{
        ...styles.pinBtn,
        color: pinned ? '#fbbf24' : '#64748b'
      }}
      title={pinned ? 'Unpin message' : 'Pin message'}
    >
      {pinned ? '📌' : '📌'}
    </button>
  );
}

const styles = {
  pinBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '2px 6px',
    borderRadius: '4px',
    transition: 'all 0.2s'
  }
};
