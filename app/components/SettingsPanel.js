"use client";

export default function SettingsPanel({
  open,
  onClose,
  theme,          // "light" | "dark" | "system"
  onThemeChange,
  autoSpeak,
  onToggleSpeak,
  senseOn,
  onToggleSense,
  memory,
  onEditMemory,
  onClearMemory,
  onClearChats,
  onNewChat
}) {
  if (!open) return null;

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const c = isDark
    ? {
        bg: "#0a0a0c",
        card: "#1c1c1e",
        text: "#f5f5f7",
        muted: "#8e8e93",
        border: "#2c2c2e",
        danger: "#ff453a",
        accent: "#8b5cf6"
      }
    : {
        bg: "#f2f2f7",
        card: "#ffffff",
        text: "#1c1c1e",
        muted: "#6c6c70",
        border: "#e5e5ea",
        danger: "#ff3b30",
        accent: "#7c3aed"
      };

  const Row = ({ icon, title, subtitle, onClick, right, danger }) => (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        background: c.card,
        border: "none",
        borderBottom: `1px solid ${c.border}`,
        color: danger ? c.danger : c.text,
        textAlign: "left",
        cursor: onClick ? "pointer" : "default"
      }}
    >
      <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{icon}</span>
      <span style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>{title}</div>
        {subtitle ? (
          <div style={{ fontSize: 13, color: c.muted, marginTop: 2 }}>{subtitle}</div>
        ) : null}
      </span>
      {right}
    </button>
  );

  const Group = ({ label, children }) => (
    <div style={{ marginBottom: 22 }}>
      {label ? (
        <div
          style={{
            fontSize: 13,
            color: c.muted,
            padding: "0 8px 8px",
            fontWeight: 500
          }}
        >
          {label}
        </div>
      ) : null}
      <div
        style={{
          borderRadius: 14,
          overflow: "hidden",
          border: `1px solid ${c.border}`
        }}
      >
        {children}
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: c.bg,
        color: c.text,
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          borderBottom: `1px solid ${c.border}`
        }}
      >
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            color: c.text,
            fontSize: 22,
            padding: 4,
            cursor: "pointer"
          }}
        >
          ✕
        </button>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Settings</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        <Group label="App">
          <Row
            icon="◐"
            title="Appearance"
            subtitle={
              theme === "system" ? "System" : theme === "light" ? "Light" : "Dark"
            }
            onClick={() => {
              const order = ["system", "light", "dark"];
              const i = order.indexOf(theme);
              onThemeChange(order[(i + 1) % order.length]);
            }}
            right={<span style={{ color: c.muted, fontSize: 13 }}>Tap to change</span>}
          />
          <Row
            icon="🔊"
            title="Auto-speak replies"
            subtitle={autoSpeak ? "On" : "Off"}
            onClick={onToggleSpeak}
            right={
              <span style={{ color: autoSpeak ? c.accent : c.muted, fontSize: 13 }}>
                {autoSpeak ? "On" : "Off"}
              </span>
            }
          />
        </Group>

        <Group label="Myralis">
          <Row
            icon="🕷"
            title="Spider-Sense"
            subtitle={senseOn ? "Suggestions on" : "Suggestions off"}
            onClick={onToggleSense}
            right={
              <span style={{ color: senseOn ? c.accent : c.muted, fontSize: 13 }}>
                {senseOn ? "On" : "Off"}
              </span>
            }
          />
          <Row
            icon="🧠"
            title="Memory"
            subtitle={memory ? String(memory).slice(0, 48) : "Nothing saved yet"}
            onClick={onEditMemory}
          />
        </Group>

        <Group label="Data & information">
          <Row icon="💬" title="New chat" onClick={onNewChat} />
          <Row
            icon="🗑"
            title="Clear all chats"
            onClick={onClearChats}
            danger
          />
          <Row
            icon="🧹"
            title="Clear memory"
            onClick={onClearMemory}
            danger
          />
        </Group>

        <Group label="About">
          <Row
            icon="✦"
            title="Myralis AI"
            subtitle="Personal assistant · Web + Android"
          />
          <Row
            icon="🔗"
            title="Open live site"
            subtitle="myralis-ai.vercel.app"
            onClick={() => window.open("https://myralis-ai.vercel.app", "_blank")}
          />
        </Group>

        <div
          style={{
            textAlign: "center",
            color: c.muted,
            fontSize: 12,
            padding: "12px 0 28px"
          }}
        >
          Myralis · local settings stored on this device
        </div>
      </div>
    </div>
  );
}
