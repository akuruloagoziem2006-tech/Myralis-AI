"use client";

export default function SideMenu(props) {
  const { showDashboard, setShowDashboard, newChat, setShowSettings, pastChats, chatSearch, setChatSearch, setMessages, togglePin, startRename, deleteChat, memory, memoryDraft, setMemoryDraft, saveMemory, styles } = props;
  return (
    <>
        {/* Side Menu */}
        {showDashboard && (
            <div style={styles.menuOverlay} onClick={() => setShowDashboard(false)}>
              <div style={styles.menuDrawer} onClick={(e) => e.stopPropagation()}>
                <div style={styles.menuProfile}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={styles.menuAvatar}>✦</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>Myralis</div>
                      <div style={{ fontSize: 12, opacity: 0.6 }}>Personal AI</div>
                    </div>
                  </div>
                  <button onClick={() => setShowDashboard(false)} style={styles.menuIconBtn}>✕</button>
                </div>
                <div style={styles.menuCard}>
                  <button onClick={() => { newChat(); setShowDashboard(false); }} style={styles.menuRow}>
                    <span style={styles.menuRowIcon}>✏️</span> New Chat
                  </button>
                                </div>
                <div style={styles.menuSectionLabel}>Conversations</div>
                <div style={styles.menuCard}>
                  {(() => {
                    const q = (chatSearch || "").trim().toLowerCase();
                    const list = (pastChats || []).filter((c) =>
                      !q || String(c.title || "").toLowerCase().includes(q) || (c.messages || []).some((m) => String(m.content || "").toLowerCase().includes(q))
                    );
                    if (!list.length) {
                      return (
                        <div style={{ padding: "14px 16px", opacity: 0.55, fontSize: 14 }}>
                          {q ? "No matches" : "No conversations yet"}
                        </div>
                      );
                    }
                    return list.map((chat) => (
                      <div key={chat.id} style={styles.menuChatRow}>
                        <button
                          onClick={() => { setMessages(chat.messages || []); setShowDashboard(false); }}
                          style={styles.menuChatMain}
                        >
                          <div style={styles.menuChatTitle}>
                            {(chat.pinned ? "📌 " : "") + (chat.title || "Chat")}
                          </div>
                          {q && (() => {
                            const hit = (chat.messages || []).find((m) => String(m.content || "").toLowerCase().includes(q));
                            return hit ? <div style={{ fontSize: 12, opacity: 0.6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(hit.content).slice(0, 90)}</div> : null;
                          })()}
                        </button>
                        <div style={styles.menuChatActions}>
                          <button onClick={() => togglePin(chat.id)} style={styles.menuTiny} title="Pin">📌</button>
                          <button onClick={() => startRename(chat)} style={styles.menuTiny} title="Rename">✏️</button>
                          <button onClick={() => deleteChat(chat.id)} style={styles.menuTiny} title="Delete">🗑️</button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
                <div data-memory-panel="1">
                  <div style={styles.menuSectionLabel}>Memory</div>
                  <div style={styles.menuCard}>
                    <div style={{ padding: "12px 14px" }}>
                      <textarea
                        value={memoryDraft !== "" ? memoryDraft : memory}
                        onChange={(e) => setMemoryDraft(e.target.value)}
                        placeholder="Nothing saved yet. Tell Myralis things to remember."
                        rows={3}
                        style={{ width: "100%", boxSizing: "border-box", background: "transparent", color: "#f4f4f5", border: "none", outline: "none", resize: "none", fontSize: 14, fontFamily: "inherit" }}
                      />
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button onClick={() => { saveMemory(memoryDraft !== "" ? memoryDraft : memory); setMemoryDraft(""); }} style={{ flex: 1, padding: 9, borderRadius: 10, border: "none", background: "#f4f4f5", color: "#09090b", fontWeight: 600 }}>Save</button>
                        <button onClick={() => { setMemoryDraft(""); saveMemory(""); }} style={{ flex: 1, padding: 9, borderRadius: 10, border: "1px solid #3f3f46", background: "transparent", color: "#f4f4f5" }}>Clear</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={styles.menuBottomBar}>
                  <div style={styles.menuSearchWrap}>
                    <span style={{ opacity: 0.5 }}>🔍</span>
                    <input
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      placeholder="Search"
                      style={styles.menuSearchInput}
                    />
                  </div>
                  <button onClick={() => { setShowDashboard(false); setShowSettings(true); }} style={styles.menuBottomBtn} title="Settings">⚙️</button>
                  <button onClick={() => { newChat(); setShowDashboard(false); }} style={styles.menuBottomBtn} title="New chat">✏️</button>
                </div>
              </div>
            </div>
          )}
    </>
  );
}
