"use client";

import { useState } from 'react';

export default function MessageReactions({ message, onReact }) {
  const [reactions, setReactions] = useState(message.reactions || {});
  const [showPicker, setShowPicker] = useState(false);

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  const addReaction = (emoji) => {
    const newReactions = { ...reactions };
    newReactions[emoji] = (newReactions[emoji] || 0) + 1;
    setReactions(newReactions);
    setShowPicker(false);
    if (onReact) onReact(emoji);
  };

  return (
    <div style={styles.container}>
      <button 
        onClick={() => setShowPicker(!showPicker)} 
        style={styles.reactionBtn}
      >
        😊
      </button>
      
      {Object.entries(reactions).map(([emoji, count]) => (
        <span key={emoji} style={styles.reactionBadge}>
          {emoji} {count}
        </span>
      ))}

      {showPicker && (
        <div style={styles.picker}>
          {emojis.map(emoji => (
            <button 
              key={emoji} 
              onClick={() => addReaction(emoji)}
              style={styles.emojiBtn}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
    marginTop: "4px",
    flexWrap: "wrap",
    position: "relative"
  },
  reactionBtn: {
    background: "transparent",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    padding: "2px 6px",
    borderRadius: "4px",
    opacity: 0.6,
    transition: "opacity 0.2s"
  },
  reactionBadge: {
    background: "#1e293b",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "13px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px"
  },
  picker: {
    position: "absolute",
    top: "100%",
    left: 0,
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "8px",
    display: "flex",
    gap: "4px",
    zIndex: 10,
    flexWrap: "wrap",
    width: "200px"
  },
  emojiBtn: {
    background: "transparent",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "4px",
    transition: "background 0.2s"
  }
};
