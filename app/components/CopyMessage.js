"use client";

import { useState } from 'react';

export default function CopyMessage({ content }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <button onClick={handleCopy} style={styles.copyBtn} title="Copy message">
      {copied ? '✅' : '📋'}
    </button>
  );
}

const styles = {
  copyBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    opacity: 0.4,
    padding: '2px 6px',
    borderRadius: '4px',
    transition: 'opacity 0.2s'
  }
};
