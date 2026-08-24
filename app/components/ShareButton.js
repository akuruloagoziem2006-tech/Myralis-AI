"use client";

import { useState } from 'react';

export default function ShareButton({ messages, title }) {
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (messages.length === 0) return;

    setSharing(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          title: title || 'Myralis Chat',
          systemPrompt: localStorage.getItem('myralis_systemPrompt') || ''
        })
      });

      const data = await res.json();
      setShareUrl(data.url);
    } catch (error) {
      console.error('Share failed:', error);
      alert('Failed to share chat. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div style={styles.container}>
      <button 
        onClick={handleShare} 
        style={styles.shareBtn}
        disabled={sharing || messages.length === 0}
      >
        {sharing ? '⏳ Sharing...' : '🔗 Share Chat'}
      </button>

      {shareUrl && (
        <div style={styles.shareResult}>
          <input 
            type="text" 
            value={shareUrl} 
            readOnly 
            style={styles.urlInput}
          />
          <button onClick={copyToClipboard} style={styles.copyBtn}>
            {copied ? '✅ Copied!' : '📋 Copy'}
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    alignItems: "center"
  },
  shareBtn: {
    background: "#6366f1",
    border: "none",
    borderRadius: "8px",
    padding: "6px 16px",
    color: "white",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500"
  },
  shareResult: {
    display: "flex",
    gap: "8px",
    width: "100%",
    maxWidth: "400px"
  },
  urlInput: {
    flex: 1,
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid #334155",
    background: "#1e293b",
    color: "#e4e4e7",
    fontSize: "12px",
    fontFamily: "monospace"
  },
  copyBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    background: "#22c55e",
    color: "white",
    cursor: "pointer",
    fontSize: "12px",
    whiteSpace: "nowrap"
  }
};
