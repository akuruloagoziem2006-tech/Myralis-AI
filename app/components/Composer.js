"use client";

export default function Composer(props) {
  const { pendingAction, setPendingAction, setMessages, showPlus, setShowPlus, fileInputRef, setShowVision, setShowCall, setCallScreen, input, setInput, handleImage, image, c, isOnline, useLocal, listening, speaking, stopSpeaking, startListening, sendMessage, loading, styles } = props;
  return (
        <footer style={styles.footer}>
          {pendingAction && (
            <div style={{ position: "fixed", left: 12, right: 12, bottom: 104, zIndex: 60, background: "#18181b", border: "1px solid #27272a", borderRadius: 18, padding: 14, boxShadow: "0 12px 36px rgba(0,0,0,0.4)" }}>
              <div style={{ color: "#f4f4f5", marginBottom: 12, lineHeight: 1.4 }}>{pendingAction.summary}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={async () => {
                  const p = pendingAction;
                  setPendingAction(null);
                  let t;
                  try { t = await p.run(); } catch (e) { t = "Couldn't do that: " + (e?.message || e); }
                  setMessages((prev) => [...prev, { role: "assistant", content: t }]);
                }} style={{ flex: 1, padding: 11, borderRadius: 12, border: "none", background: "#f4f4f5", color: "#09090b", fontWeight: 600 }}>Confirm</button>
                <button onClick={() => setPendingAction(null)} style={{ flex: 1, padding: 11, borderRadius: 12, border: "1px solid #3f3f46", background: "transparent", color: "#f4f4f5" }}>Cancel</button>
              </div>
            </div>
          )}
          {showPlus && (
            <div style={styles.plusMenu}>
              <button onClick={() => { setShowPlus(false); fileInputRef.current?.click(); }} style={styles.plusRow}>🖼  Upload image</button>
              <button onClick={() => { setShowPlus(false); setShowVision(true); }} style={styles.plusRow}>👁  Live vision</button>
              <button onClick={() => { setShowPlus(false); setCallScreen(false); setShowCall(true); }} style={styles.plusRow}>📞  Call Myralis</button>
              <button onClick={async () => { setShowPlus(false); try { const P = window.Capacitor?.Plugins?.MyralisOverlay; if (!P || !window.Capacitor?.isNativePlatform?.()) { alert("Floating bubble needs the Myralis Android app."); return; } await P.start(); alert("Floating bubble is on. Tap ✧ over any app to come back to Myralis."); } catch (e) { alert(e?.message || "Could not start the bubble"); } }} style={styles.plusRow}>🫧  Floating bubble</button>
              <button onClick={async () => { setShowPlus(false); try { const P = window.Capacitor?.Plugins?.MyralisOverlay; if (P) await P.stop(); alert("Floating bubble is off."); } catch (e) { alert("Could not stop the bubble"); } }} style={styles.plusRow}>⏹  Stop bubble</button>
              <button onClick={() => { setShowPlus(false); setCallScreen(true); setShowCall(true); }} style={styles.plusRow}>🖥  Live screen</button>
            </div>
          )}
          <div style={{ background: c.inputBg, border: "1px solid " + c.border, borderRadius: 26, padding: "10px 12px 10px", boxShadow: "0 8px 28px rgba(0,0,0,0.12)", maxWidth: 760, margin: "0 auto 12px", width: "calc(100% - 24px)", boxSizing: "border-box", color: c.text }}>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImage} hidden />
            <textarea
              data-composer="1"
              rows={1}
              enterKeyHint="enter"
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", color: c.text, fontSize: 16, lineHeight: 1.4, fontFamily: "inherit", padding: "6px 6px 8px", maxHeight: 160, overflowY: "auto", boxSizing: "border-box", display: "block" }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Myralis..."
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setShowPlus((v) => !v)} title="More" style={{ width: 36, height: 36, borderRadius: 999, border: "1px solid " + c.border, background: "transparent", color: c.text, fontSize: 20, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>＋</button>
              <div style={{ padding: "7px 14px", borderRadius: 999, border: "1px solid " + c.border, fontSize: 13, color: c.text, opacity: 0.8, whiteSpace: "nowrap" }}>{isOnline && !useLocal ? "Gemini" : "Local"}</div>
              <div style={{ flex: 1 }} />
              <button
                onClick={speaking ? stopSpeaking : startListening}
                title={speaking ? "Stop speaking" : "Voice input"}
                style={{ width: 36, height: 36, borderRadius: 999, border: "none", background: listening || speaking ? "rgba(96,165,250,0.2)" : "transparent", color: listening || speaking ? "#60a5fa" : c.text, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {speaking ? "⏹" : listening ? "●" : "🎙"}
              </button>
              <button onClick={() => { setCallScreen(false); setShowCall(true); }} title="Call Myralis" style={{ width: 36, height: 36, borderRadius: 999, border: "none", background: "transparent", color: c.text, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>📞</button>
              <button
                onClick={sendMessage}
                disabled={loading || (!input.trim() && !image)}
                title="Send"
                style={{ width: 40, height: 40, borderRadius: 999, border: "none", background: "#111113", color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", opacity: loading || (!input.trim() && !image) ? 0.4 : 1 }}
              >
                ↑
              </button>
            </div>
          </div>
        </footer>
  );
}
