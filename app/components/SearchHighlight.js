"use client";

export default function SearchHighlight({ text, searchTerm }) {
  if (!searchTerm || !text) return <span>{text}</span>;

  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
  
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <mark key={i} style={styles.highlight}>{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

const styles = {
  highlight: {
    backgroundColor: '#fbbf24',
    color: '#0b0d13',
    padding: '1px 4px',
    borderRadius: '4px',
    fontWeight: 'bold'
  }
};
