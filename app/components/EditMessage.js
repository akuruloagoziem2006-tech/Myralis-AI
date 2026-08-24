"use client";

import { useState } from 'react';

export default function EditMessage({ message, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  const handleSave = () => {
    if (editedContent.trim() !== message.content) {
      onEdit(editedContent);
    }
    setIsEditing(false);
  };

  if (message.role !== 'user') return null;

  if (isEditing) {
    return (
      <div style={styles.editContainer}>
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          style={styles.textarea}
          rows={2}
        />
        <div style={styles.actions}>
          <button onClick={handleSave} style={styles.saveBtn}>✅ Save</button>
          <button onClick={() => setIsEditing(false)} style={styles.cancelBtn}>✕ Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      style={styles.editBtn}
      title="Edit message"
    >
      ✏️
    </button>
  );
}

const styles = {
  editBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    opacity: 0.4,
    padding: '2px 6px',
    borderRadius: '4px',
    transition: 'opacity 0.2s'
  },
  editContainer: {
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  textarea: {
    width: '100%',
    padding: '8px',
    borderRadius: '8px',
    border: '1px solid #6366f1',
    background: '#1e293b',
    color: '#e4e4e7',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  actions: {
    display: 'flex',
    gap: '8px'
  },
  saveBtn: {
    padding: '4px 12px',
    borderRadius: '6px',
    border: 'none',
    background: '#22c55e',
    color: 'white',
    cursor: 'pointer',
    fontSize: '12px'
  },
  cancelBtn: {
    padding: '4px 12px',
    borderRadius: '6px',
    border: 'none',
    background: '#ef4444',
    color: 'white',
    cursor: 'pointer',
    fontSize: '12px'
  }
};
