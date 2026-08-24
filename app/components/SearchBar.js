"use client";
import { useState } from 'react';
export default function SearchBar({ messages, onSearch }) {
  const [searchTerm, setSearchTerm] = useState("");
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
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
    <div style={{padding:"8px 20px",borderBottom:"1px solid #1e293b"}}>
      <input type="text" value={searchTerm} onChange={handleSearch} 
        placeholder="🔍 Search chat..." 
        style={{width:"100%",background:"#1e293b",border:"1px solid #334155",borderRadius:"8px",padding:"8px 12px",color:"#e4e4e7",fontSize:"14px",outline:"none"}} />
    </div>
  );
}
