"use client";

import { useState } from 'react';

export default function SearchBar({ messages, onSearch }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setIsSearching(term.length > 0);
    
    if (term.length === 0) {
      onSearch([]);
      return;
    }

    const results = messages.filter(msg => 
      msg.content.toLowerCase().includes(term.toLowerCase())
    );
    onSearch(results);
  };

  return (
    <div style={styles.container}>
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearch}
        placeholder="🔍 Search chat..."
        style={styles.input}
      />
      {isSearching && (
        <span style={styles.count}>
          {messages.filter(m => 
            m.content.toLowerCase().includes(searchTerm.toLowerCase())
          ).length} results
        </span>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "8px 20px",
    borderBottom: "1px solid #1e293b",
    display: "flex",
    gap: "10px",
    alignItems: "center"
  },
  input: {
    flex: 1,
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "8px 12px",
    color: "#e4e4e7",
    fontSize: "14px",
    outline: "none"
  },
  count: {
    fontSize: "12px",
    color: "#94a3b8",
    whiteSpace: "nowrap"
  }
};
