"use client";

import { useState } from 'react';

export default function ChatTags({ messages, onFilter }) {
  const [selectedTag, setSelectedTag] = useState(null);

  // Analyze messages to find topics
  const getTopics = () => {
    const topics = {};
    const keywords = {
      '💻 Coding': ['code', 'programming', 'javascript', 'python', 'react', 'api', 'function', 'bug'],
      '📚 Learning': ['learn', 'study', 'explain', 'understand', 'teach', 'education'],
      '💡 Ideas': ['idea', 'creative', 'brainstorm', 'suggest', 'imagine'],
      '📝 Writing': ['write', 'story', 'poem', 'draft', 'edit', 'grammar'],
      '🤖 AI': ['ai', 'artificial', 'intelligence', 'machine learning', 'model'],
      '🎯 Productivity': ['plan', 'organize', 'schedule', 'efficient', 'goal']
    };

    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      Object.entries(keywords).forEach(([tag, words]) => {
        if (words.some(word => content.includes(word))) {
          topics[tag] = (topics[tag] || 0) + 1;
        }
      });
    });

    return topics;
  };

  const topics = getTopics();

  if (Object.keys(topics).length === 0) return null;

  return (
    <div style={styles.container}>
      <button
        onClick={() => {
          setSelectedTag(null);
          onFilter(null);
        }}
        style={{
          ...styles.tag,
          background: !selectedTag ? '#6366f1' : 'transparent',
          color: !selectedTag ? 'white' : '#94a3b8'
        }}
      >
        All
      </button>
      {Object.entries(topics).map(([tag, count]) => (
        <button
          key={tag}
          onClick={() => {
            setSelectedTag(tag);
            onFilter(tag);
          }}
          style={{
            ...styles.tag,
            background: selectedTag === tag ? '#6366f1' : 'transparent',
            color: selectedTag === tag ? 'white' : '#94a3b8'
          }}
        >
          {tag} ({count})
        </button>
      ))}
    </div>
  );
}

const styles = {
  container: {
    padding: "8px 20px",
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    borderBottom: "1px solid #1e293b",
    flexShrink: 0
  },
  tag: {
    padding: "4px 12px",
    borderRadius: "16px",
    border: "1px solid #334155",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s"
  }
};
