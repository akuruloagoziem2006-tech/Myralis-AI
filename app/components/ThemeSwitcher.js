"use client";

export default function ThemeSwitcher({ currentTheme, onThemeChange }) {
  const themes = [
    { name: 'Dark', emoji: '🌙', value: 'dark' },
    { name: 'Light', emoji: '☀️', value: 'light' },
    { name: 'Ocean', emoji: '🌊', value: 'ocean' },
    { name: 'Forest', emoji: '🌿', value: 'forest' },
    { name: 'Sunset', emoji: '🌅', value: 'sunset' },
    { name: 'Neon', emoji: '💜', value: 'neon' }
  ];

  return (
    <div style={styles.container}>
      {themes.map(theme => (
        <button
          key={theme.value}
          onClick={() => onThemeChange(theme.value)}
          style={{
            ...styles.themeBtn,
            background: currentTheme === theme.value ? '#6366f1' : 'transparent',
            color: currentTheme === theme.value ? 'white' : '#94a3b8'
          }}
          title={theme.name}
        >
          {theme.emoji}
        </button>
      ))}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center'
  },
  themeBtn: {
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s'
  }
};
