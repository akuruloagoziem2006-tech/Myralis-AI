"use client";
import { useState, useEffect } from 'react';

export default function MessageTimestamp({ timestamp }) {
  const [formattedTime, setFormattedTime] = useState('');

  useEffect(() => {
    if (timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) {
        setFormattedTime('Just now');
      } else if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        setFormattedTime(`${mins}m ago`);
      } else if (date.toDateString() === now.toDateString()) {
        setFormattedTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else {
        setFormattedTime(date.toLocaleDateString([], { month: 'short', day: 'numeric' }));
      }
    }
  }, [timestamp]);

  return <span style={{fontSize:"11px",opacity:0.5,marginTop:"4px",display:"block"}}>{formattedTime}</span>;
}
