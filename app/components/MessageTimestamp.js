"use client";

import { useState, useEffect } from 'react';

export default function MessageTimestamp({ timestamp }) {
  const [formattedTime, setFormattedTime] = useState('');

  useEffect(() => {
    if (timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      // Less than 1 minute
      if (diff < 60000) {
        setFormattedTime('Just now');
      }
      // Less than 1 hour
      else if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        setFormattedTime(`${mins}m ago`);
      }
      // Today
      else if (date.toDateString() === now.toDateString()) {
        setFormattedTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
      // This year
      else if (date.getFullYear() === now.getFullYear()) {
        setFormattedTime(date.toLocaleDateString([], { month: 'short', day: 'numeric' }));
      }
      // Older
      else {
        setFormattedTime(date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }));
      }
    }
  }, [timestamp]);

  return <span style={styles.timestamp}>{formattedTime}</span>;
}

const styles = {
  timestamp: {
    fontSize: '11px',
    opacity: 0.5,
    marginTop: '4px',
    display: 'block'
  }
};
