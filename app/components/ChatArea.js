"use client";

import { IconPencil, IconCopy, IconShare, IconUp, IconDown, IconSpeaker, IconRegen } from "./Icons";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatArea(props) {
  const { messages, loading, thinkingSeconds, editingIndex, setEditingIndex, editText, setEditText, saveEdit, startEdit, copyText, shareText, toggleLike, liked, speak, regenerate, styles, c, sendMessageWithText, chatEnd } = props;
  return (
    <>
        {/* Chat Area */}
        <main style={{ ...styles.chat, background: c.bg, paddingBottom: 220 }}>
          <div style={styles.chatInner}>
          
          {messages.length <= 1 && !loading && (
            <div style={styles.heroWrap}>
              <div style={styles.heroLogo}>✧</div>
            </div>
          )}
          {messages.length <= 1 && !loading && (
            <div style={styles.quickWrap}>
              {[
                "Explain quantum computing in simple terms",
                "Help me plan a productive day",
                "Improve this paragraph: paste your text",
                "What should I learn to get better at coding?"
              ].map((p) => (
                <button key={p} onClick={() => sendMessageWithText(p)} style={{ ...styles.quickChip, color: c.text, borderColor: c.border, background: c.panel }}>{p}</button>
              ))}
              {typeof window !== "undefined" && !localStorage.getItem("myralis_seen_install_tip") && (
                <div
                  style={styles.installTip}
                  onClick={() => localStorage.setItem("myralis_seen_install_tip", "1")}
                >
                  Tip: Install Myralis from your browser menu → Add to Home Screen
                </div>
              )}
            </div>
          )}

            {messages.map((msg, i) => (
              <div key={i} className="my-fade" style={styles.messageBlock}>
                <div style={{
                  ...styles.bubble,
                  ...(msg.role === "user" ? styles.userBubble : styles.assistantBubble),
                  background: msg.role === "user" ? c.user : "transparent",
                  color: msg.role === "user" ? c.userText : c.text
                }}>
                  {msg.image && <img src={msg.image} alt="upload" style={styles.image} />}
                  {editingIndex === i ? (
                    <div>
                      <textarea value={editText} onChange={(e) => setEditText(e.target.value)} style={styles.editArea} rows={3} />
                      <div style={styles.editActions}>
                        <button onClick={() => saveEdit(i)} style={styles.primaryBtn}>Save</button>
                        <button onClick={() => setEditingIndex(null)} style={styles.secondaryBtn}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    msg.role === "assistant" ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({node, ...props}) => <p style={{ margin: "0 0 12px" }} {...props} />,
                          ul: ({node, ...props}) => <ul style={{ margin: "0 0 12px", paddingLeft: 22 }} {...props} />,
                          ol: ({node, ...props}) => <ol style={{ margin: "0 0 12px", paddingLeft: 22 }} {...props} />,
                          li: ({node, ...props}) => <li style={{ marginBottom: 6 }} {...props} />,
                          h1: ({node, ...props}) => <h1 style={{ margin: "18px 0 10px", fontSize: 22 }} {...props} />,
                          h2: ({node, ...props}) => <h2 style={{ margin: "16px 0 8px", fontSize: 18 }} {...props} />,
                          h3: ({node, ...props}) => <h3 style={{ margin: "14px 0 8px", fontSize: 16 }} {...props} />,
                          code: ({node, inline, className, children, ...props}) => inline ? (<code className="my-code" {...props}>{children}</code>) : (<div className="my-code-wrap"><button className="my-copy" onClick={() => navigator.clipboard?.writeText(String(children).replace(/\n$/, ""))}>Copy</button><pre className="my-pre"><code {...props}>{children}</code></pre></div>),
                          hr: ({node, ...props}) => <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid rgba(127,127,127,0.25)" }} {...props} />
                        }}
                      >{msg.content}</ReactMarkdown>
                    ) : msg.content
                  )}
                </div>

                {editingIndex !== i && (
                  <div style={{
                    ...styles.actions,
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
                  }}>
                    {msg.role === "user" ? (
                      <>
                        <button onClick={() => startEdit(i, msg.content)} style={styles.actionBtn} title="Edit"><IconPencil /></button>
                        <button onClick={() => copyText(msg.content)} style={styles.actionBtn} title="Copy"><IconCopy /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => copyText(msg.content)} style={styles.actionBtn} title="Copy"><IconCopy /></button>
                        <button onClick={() => shareText(msg.content)} style={styles.actionBtn} title="Share"><IconShare /></button>
                        <button onClick={() => toggleLike(i, "like")} style={{ ...styles.actionBtn, color: liked[i] === "like" ? "#4ade80" : undefined }}><IconUp /></button>
                        <button onClick={() => toggleLike(i, "unlike")} style={{ ...styles.actionBtn, color: liked[i] === "unlike" ? "#f87171" : undefined }}><IconDown /></button>
                        <button onClick={() => speak(msg.content)} style={styles.actionBtn}><IconSpeaker /></button>
                        <button onClick={() => regenerate(i)} style={styles.actionBtn} title="Regenerate"><IconRegen /></button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}

          
          
          
            {loading && (
              <div style={{ ...styles.bubble, ...styles.assistantBubble, opacity: 0.9 }}>
                <span className="my-typing" aria-label="Thinking"><i></i><i></i><i></i></span> <small>{thinkingSeconds}s</small>
              </div>
            )}
            <div className="myralis-bottom-spacer" style={{ height: 96, flexShrink: 0 }} />
            <div ref={chatEnd} />
          </div>
        </main>
    </>
  );
}
