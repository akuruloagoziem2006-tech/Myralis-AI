"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SearchBar from './components/SearchBar';
import ChatStats from './components/ChatStats';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import CopyMessage from './components/CopyMessage';
import MessageTimestamp from './components/MessageTimestamp';
import QuickActions from './components/QuickActions';
import RegenerateButton from './components/RegenerateButton';
import PinMessage from './components/PinMessage';
import DraftSaver from './components/DraftSaver';
import ContextMemory from './components/ContextMemory';
import NotificationSound from './components/NotificationSound';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [image, setImage] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [tempPrompt, setTempPrompt] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [lastAssistantMessage, setLastAssistantMessage] = useState(null);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);

  const chatEnd = useRef(null);
  const fileInputRef = useRef(null);
  const searchInputRef = useRef(null);

  // Load saved data
  useEffect(() => {
    const savedMessages = localStorage.getItem("myralis_messages");
    const savedSpeak = localStorage.getItem("myralis_autoSpeak");
    const savedDarkMode = localStorage.getItem("myralis_darkMode");
    const savedPrompt = localStorage.getItem("myralis_systemPrompt");
    const savedPinned = localStorage.getItem("myralis_pinned");

    if (savedMessages) {
      const parsed = JSON.parse(savedMessages);
      setMessages(parsed);
      const lastAssistant = [...parsed].reverse().find(m => m.role === 'assistant');
      setLastAssistantMessage(lastAssistant || null);
    } else {
      const welcome = [{ 
        role: "assistant", 
        content: "Hello! I'm **Myralis AI**. How can I help you today?",
        timestamp: Date.now()
      }];
      setMessages(welcome);
      setLastAssistantMessage(welcome[0]);
    }

    if (savedSpeak !== null) {
      setAutoSpeak(savedSpeak === "true");
    }

    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === "true");
    }

    if (savedPrompt) {
      setSystemPrompt(savedPrompt);
      setTempPrompt(savedPrompt);
    } else {
      const defaultPrompt = "You are Myralis, a helpful, friendly, and knowledgeable AI assistant. You provide clear, concise, and accurate responses. You're supportive and encouraging. You can help with coding, general knowledge, creative tasks, and problem-solving. You respond in a warm and conversational tone.";
      setSystemPrompt(defaultPrompt);
      setTempPrompt(defaultPrompt);
    }

    if (savedPinned) {
      setPinnedMessages(JSON.parse(savedPinned));
    }
  }, []);

  // Save messages
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("myralis_messages", JSON.stringify(messages));
    }
  }, [messages]);

  // Save settings
  useEffect(() => {
    localStorage.setItem("myralis_darkMode", darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("myralis_systemPrompt", systemPrompt);
  }, [systemPrompt]);

  useEffect(() => {
    localStorage.setItem("myralis_autoSpeak", autoSpeak.toString());
  }, [autoSpeak]);

  useEffect(() => {
    localStorage.setItem("myralis_pinned", JSON.stringify(pinnedMessages));
  }, [pinnedMessages]);

  // Scroll to bottom
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Speak function
  function speak(text) {
    if (!autoSpeak || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  }

  // Clear chat
  function clearChat() {
    if (confirm("Are you sure you want to clear all messages?")) {
      const welcome = [{ 
        role: "assistant", 
        content: "Hello! I'm **Myralis AI**. How can I help you today?",
        timestamp: Date.now()
      }];
      setMessages(welcome);
      setLastAssistantMessage(welcome[0]);
      setPinnedMessages([]);
      localStorage.setItem("myralis_messages", JSON.stringify(welcome));
      localStorage.removeItem("myralis_pinned");
      setShowSettings(false);
      setShowExportOptions(false);
    }
  }

  // Toggle functions
  function toggleSpeak() {
    setAutoSpeak(!autoSpeak);
  }

  function toggleDarkMode() {
    setDarkMode(!darkMode);
  }

  function togglePromptEditor() {
    setShowPromptEditor(!showPromptEditor);
    setTempPrompt(systemPrompt);
  }

  function saveSystemPrompt() {
    setSystemPrompt(tempPrompt);
    setShowPromptEditor(false);
    alert("✅ System prompt updated!");
  }

  function resetSystemPrompt() {
    const defaultPrompt = "You are Myralis, a helpful, friendly, and knowledgeable AI assistant. You provide clear, concise, and accurate responses. You're supportive and encouraging. You can help with coding, general knowledge, creative tasks, and problem-solving. You respond in a warm and conversational tone.";
    setSystemPrompt(defaultPrompt);
    setTempPrompt(defaultPrompt);
    setShowPromptEditor(false);
    alert("✅ System prompt reset to default!");
  }

  // Pin message handler
  function handlePinMessage(message, isPinned) {
    if (isPinned) {
      setPinnedMessages(prev => [...prev, message]);
      // Move pinned message to top in display
      setMessages(prev => {
        const msgIndex = prev.indexOf(message);
        const updated = [...prev];
        updated.splice(msgIndex, 1);
        updated.unshift({ ...message, pinned: true });
        return updated;
      });
    } else {
      setPinnedMessages(prev => prev.filter(m => m !== message));
      setMessages(prev => {
        const msgIndex = prev.indexOf(message);
        const updated = [...prev];
        updated.splice(msgIndex, 1);
        updated.push({ ...message, pinned: false });
        return updated;
      });
    }
  }

  // Regenerate response
  async function regenerateResponse() {
    if (!lastAssistantMessage || loading) return;
    
    const newMessages = messages.slice(0, -1);
    setMessages(newMessages);
    setLastAssistantMessage(null);
    
    const lastUser = [...newMessages].reverse().find(m => m.role === 'user');
    if (lastUser) {
      await sendMessageWithText(lastUser.content, true);
    }
  }

  // Export functions
  function exportAsText() {
    if (messages.length === 0) return;
    let text = "Myralis AI Chat Export\n";
    text += "=".repeat(40) + "\n\n";
    text += `Exported: ${new Date().toLocaleString()}\n\n`;
    messages.forEach(msg => {
      const role = msg.role === 'user' ? '👤 You' : '🤖 Myralis';
      const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '';
      text += `${role} ${time}:\n`;
      text += `${msg.content}\n\n`;
    });
    text += "=".repeat(40) + "\n";
    text += "Exported from Myralis AI";
    downloadFile(text, 'chat_export.txt', 'text/plain');
  }

  function exportAsJSON() {
    if (messages.length === 0) return;
    const data = {
      exportedAt: new Date().toISOString(),
      app: "Myralis AI",
      version: "1.0",
      systemPrompt: systemPrompt,
      pinnedMessages: pinnedMessages,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || new Date().toISOString(),
        hasImage: !!msg.image,
        pinned: msg.pinned || false
      }))
    };
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, 'chat_export.json', 'application/json');
  }

  function exportAsMarkdown() {
    if (messages.length === 0) return;
    let md = `# Myralis AI Chat Export\n\n`;
    md += `**Exported:** ${new Date().toLocaleString()}\n\n`;
    md += `**System Prompt:** ${systemPrompt}\n\n`;
    md += `---\n\n`;
    messages.forEach(msg => {
      const role = msg.role === 'user' ? '👤 **You**' : '🤖 **Myralis**';
      const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '';
      md += `### ${role} ${time}\n\n`;
      md += `${msg.content}\n\n`;
    });
    md += `---\n\n`;
    md += `*Exported from Myralis AI*`;
    downloadFile(md, 'chat_export.md', 'text/markdown');
  }

  function exportAsHTML() {
    if (messages.length === 0) return;
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Myralis AI Chat Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; background: #0b0d13; color: #e4e4e7; }
    .header { border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
    .system-prompt { background: #1e293b; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; border-left: 3px solid #6366f1; }
    .pinned { border-left: 3px solid #fbbf24; }
    .message { padding: 12px 18px; border-radius: 12px; margin-bottom: 16px; line-height: 1.6; }
    .user { background: #1e293b; text-align: right; border-bottom-right-radius: 4px; }
    .assistant { background: #1e1b4b; border-left: 3px solid #6366f1; border-bottom-left-radius: 4px; }
    .role { font-weight: bold; margin-bottom: 4px; font-size: 14px; opacity: 0.8; }
    .time { font-size: 11px; opacity: 0.4; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #334155; text-align: center; font-size: 14px; opacity: 0.6; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✦ Myralis AI</h1>
    <p>Chat Export - ${new Date().toLocaleString()}</p>
  </div>
  <div class="system-prompt">
    <strong>System Prompt:</strong> ${systemPrompt}
  </div>
  ${messages.map(msg => `
    <div class="message ${msg.role} ${msg.pinned ? 'pinned' : ''}">
      <div class="role">${msg.role === 'user' ? '👤 You' : '🤖 Myralis'}</div>
      <div>${msg.content}</div>
      ${msg.image ? '<div style="margin-top:8px"><img src="' + msg.image + '" style="max-width:200px;border-radius:8px" /></div>' : ''}
      <div class="time">${msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''}</div>
    </div>
  `).join('')}
  <div class="footer">
    Exported from Myralis AI • ${new Date().toLocaleDateString()}
  </div>
</body>
</html>`;
    downloadFile(html, 'chat_export.html', 'text/html');
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportOptions(false);
  }

  // Start listening
  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported. Try Chrome.");
      return;
    }
    window.speechSynthesis.cancel();
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setTimeout(() => sendMessageWithText(transcript), 300);
    };
    recognition.onerror = () => setListening(false);
    recognition.start();
  }

  // Handle image upload
  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result);
    reader.readAsDataURL(file);
  }

  // Send message
  async function sendMessageWithText(text, isRegenerate = false) {
    if ((!text.trim() && !image) || loading) return;

    const userMessage = text.trim() || "What do you see in this image?";
    setInput("");
    setLoading(true);
    window.speechSynthesis.cancel();

    const newUserMsg = {
      role: "user",
      content: userMessage,
      image: image || null,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setImage(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newUserMsg],
          systemPrompt: systemPrompt
        })
      });

      const data = await res.json();

      const assistantMsg = {
        role: "assistant",
        content: data.reply || "Sorry, I couldn't process that.",
        timestamp: Date.now(),
        pinned: false
      };

      if (data.error) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: "Error: " + data.error,
          timestamp: Date.now()
        }]);
      } else {
        setMessages(prev => [...prev, assistantMsg]);
        setLastAssistantMessage(assistantMsg);
        speak(data.reply);
        setNotificationEnabled(true);
        setTimeout(() => setNotificationEnabled(false), 100);
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Connection error. Please try again.",
        timestamp: Date.now()
      }]);
    }

    setLoading(false);
  }

  function sendMessage() {
    sendMessageWithText(input);
  }

  // Quick action handler
  function handleQuickAction(prompt) {
    setInput(prompt);
    setTimeout(() => sendMessageWithText(prompt), 100);
  }

  const suggestions = [
    "What can you help me with?",
    "Tell me a fun fact",
    "Explain AI in simple terms",
    "What's the weather like?",
    "Help me with my code"
  ];

  // Theme
  const theme = darkMode ? {
    background: "#0b0d13",
    color: "#e4e4e7",
    headerBg: "linear-gradient(90deg, #111827, #0f172a)",
    borderColor: "#1e293b",
    inputBg: "#1e293b",
    userBg: "#1e293b",
    botBg: "#1e1b4b",
    botBorder: "#312e81",
    settingsBg: "#1e293b",
  } : {
    background: "#f0f0f0",
    color: "#1a1a1a",
    headerBg: "linear-gradient(90deg, #e0e7ff, #c7d2fe)",
    borderColor: "#d1d5db",
    inputBg: "#ffffff",
    userBg: "#dbeafe",
    botBg: "#f3f4f6",
    botBorder: "#9ca3af",
    settingsBg: "#e5e7eb",
  };

  const displayedMessages = isSearching && searchResults.length > 0 ? searchResults : messages;

  return (
    <div style={{ ...styles.container, background: theme.background, color: theme.color }}>
      <NotificationSound enabled={notificationEnabled} />

      <header style={{ ...styles.header, background: theme.headerBg, borderColor: theme.borderColor }}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>✦</div>
          <div>
            <div style={styles.logoText}>Myralis</div>
            <div style={styles.logoSub}>AI Companion</div>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button onClick={() => setShowExportOptions(!showExportOptions)} style={styles.headerBtn}>📤</button>
          <button onClick={() => setShowSettings(!showSettings)} style={styles.headerBtn}>⚙️</button>
        </div>
      </header>

      {showSettings && (
        <div style={{ ...styles.settingsPanel, background: theme.settingsBg, borderColor: theme.borderColor }}>
          <label style={styles.settingItem}>
            <input type="checkbox" checked={autoSpeak} onChange={toggleSpeak} /> Auto Speak
          </label>
          <label style={styles.settingItem}>
            <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} /> Dark Mode
          </label>
          <button onClick={togglePromptEditor} style={styles.promptBtn}>✏️ Edit System Prompt</button>
          <button onClick={clearChat} style={styles.clearBtn}>Clear Chat</button>
        </div>
      )}

      {showPromptEditor && (
        <div style={{ ...styles.promptEditor, background: theme.settingsBg, borderColor: theme.borderColor }}>
          <div style={styles.promptEditorHeader}>
            <h4 style={styles.promptEditorTitle}>System Prompt</h4>
            <div style={styles.promptEditorActions}>
              <button onClick={resetSystemPrompt} style={styles.resetPromptBtn}>Reset Default</button>
              <button onClick={() => setShowPromptEditor(false)} style={styles.closePromptBtn}>✕</button>
            </div>
          </div>
          <p style={styles.promptEditorDesc}>This controls Myralis's personality, behavior, and response style.</p>
          <textarea
            style={{ ...styles.promptTextarea, background: theme.inputBg, borderColor: theme.borderColor, color: theme.color }}
            value={tempPrompt}
            onChange={(e) => setTempPrompt(e.target.value)}
            rows={6}
            placeholder="Enter system prompt..."
          />
          <div style={styles.promptEditorFooter}>
            <span style={styles.promptCharCount}>{tempPrompt.length} characters</span>
            <button onClick={saveSystemPrompt} style={styles.savePromptBtn}>💾 Save Prompt</button>
          </div>
        </div>
      )}

      {showExportOptions && (
        <div style={{ ...styles.exportPanel, background: theme.settingsBg, borderColor: theme.borderColor }}>
          <div style={styles.exportTitle}>Export Chat As:</div>
          <div style={styles.exportButtons}>
            <button onClick={exportAsText} style={styles.exportBtn}>📄 Text</button>
            <button onClick={exportAsJSON} style={styles.exportBtn}>📊 JSON</button>
            <button onClick={exportAsMarkdown} style={styles.exportBtn}>📝 Markdown</button>
            <button onClick={exportAsHTML} style={styles.exportBtn}>🌐 HTML</button>
          </div>
          <div style={styles.exportCount}>{messages.length} messages</div>
        </div>
      )}

      <SearchBar messages={messages} onSearch={(results) => {
        setSearchResults(results);
        setIsSearching(results.length > 0);
      }} />
      
      <div style={styles.topBar}>
        <ChatStats messages={messages} />
        <ContextMemory messages={messages} />
      </div>

      <DraftSaver 
        input={input} 
        onRestore={(draft) => setInput(draft)}
        onClear={() => {}}
      />

      <div style={styles.chat}>
        {displayedMessages.map((msg, i) => (
          <div 
            key={i} 
            style={{
              ...styles.message,
              ...(msg.role === "user" ? 
                { ...styles.user, background: theme.userBg } : 
                { ...styles.bot, background: theme.botBg, borderColor: theme.botBorder }
              ),
              ...(msg.pinned ? styles.pinned : {}),
              animation: 'fadeIn 0.3s ease'
            }}
          >
            {msg.pinned && <div style={styles.pinnedBadge}>📌 Pinned</div>}
            {msg.image && (
              <img src={msg.image} alt="Uploaded" style={styles.imagePreview} />
            )}
            {msg.role === "assistant" ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            ) : (
              msg.content
            )}
            <div style={styles.messageFooter}>
              <MessageTimestamp timestamp={msg.timestamp} />
              <div style={styles.messageActions}>
                <CopyMessage content={msg.content} />
                <PinMessage 
                  message={msg} 
                  onPin={(pinned) => handlePinMessage(msg, pinned)}
                />
                {msg.role === 'assistant' && i === messages.length - 1 && (
                  <RegenerateButton 
                    onRegenerate={regenerateResponse} 
                    lastMessage={msg}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div style={{ ...styles.message, ...styles.bot, opacity: 0.65, background: theme.botBg }}>
            <span style={styles.typingIndicator}>
              <span>●</span><span>●</span><span>●</span>
            </span>
          </div>
        )}
        <div ref={chatEnd} />
      </div>

      {image && (
        <div style={{ ...styles.imageBar, background: theme.settingsBg, borderColor: theme.borderColor }}>
          <img src={image} alt="Preview" style={{ height: 50, borderRadius: 8 }} />
          <button onClick={() => setImage(null)} style={styles.removeImg}>✕</button>
        </div>
      )}

      {messages.length === 1 && !loading && (
        <div style={styles.suggestions}>
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              style={{ ...styles.suggestionBtn, borderColor: theme.borderColor, color: theme.color }}
              onClick={() => sendMessageWithText(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <QuickActions onAction={handleQuickAction} />

      <div style={{ ...styles.inputArea, borderColor: theme.borderColor, background: theme.background }}>
        <button 
          onClick={startListening} 
          style={{
            ...styles.iconButton,
            background: listening ? "#ef4444" : theme.inputBg,
            color: theme.color
          }}
        >
          {listening ? "⏹" : "🎤"}
        </button>

        <button 
          onClick={() => fileInputRef.current.click()} 
          style={{ ...styles.iconButton, background: theme.inputBg, color: theme.color }}
        >
          📷
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImage}
          style={{ display: "none" }}
        />

        <input
          ref={searchInputRef}
          style={{ ...styles.input, background: theme.inputBg, borderColor: theme.borderColor, color: theme.color }}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            // Auto-save draft
            localStorage.setItem('myralis_draft', e.target.value);
          }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={listening ? "Listening..." : "Ask Myralis anything..."}
          disabled={loading}
        />

        <button 
          style={{
            ...styles.button,
            opacity: loading ? 0.5 : 1
          }} 
          onClick={sendMessage} 
          disabled={loading}
        >
          {loading ? "⏳" : "Send"}
        </button>
      </div>

      <KeyboardShortcuts onShortcut={(action) => {
        if (action === 'search') {
          searchInputRef.current?.focus();
        }
        if (action === 'escape') {
          setInput('');
        }
      }} />

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  header: {
    padding: "14px 20px",
    borderBottom: "1px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0
  },
  headerActions: {
    display: "flex",
    gap: "8px"
  },
  headerBtn: {
    background: "transparent",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "8px"
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  logoIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    color: "white",
    fontWeight: "bold"
  },
  logoText: {
    fontSize: "18px",
    fontWeight: "700"
  },
  logoSub: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "-2px"
  },
  settingsPanel: {
    padding: "12px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid",
    gap: "12px",
    flexWrap: "wrap",
    flexShrink: 0
  },
  settingItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px"
  },
  clearBtn: {
    background: "#ef4444",
    border: "none",
    color: "white",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px"
  },
  promptBtn: {
    background: "#6366f1",
    border: "none",
    color: "white",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px"
  },
  promptEditor: {
    padding: "16px 20px",
    borderBottom: "1px solid",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    flexShrink: 0
  },
  promptEditorHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  promptEditorTitle: {
    margin: 0,
    fontSize: "16px"
  },
  promptEditorActions: {
    display: "flex",
    gap: "8px",
    alignItems: "center"
  },
  resetPromptBtn: {
    background: "transparent",
    border: "1px solid #ef4444",
    color: "#ef4444",
    padding: "4px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px"
  },
  closePromptBtn: {
    background: "transparent",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    padding: "0 4px"
  },
  promptEditorDesc: {
    margin: 0,
    fontSize: "13px",
    opacity: 0.7
  },
  promptTextarea: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical"
  },
  promptEditorFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  promptCharCount: {
    fontSize: "12px",
    opacity: 0.6
  },
  savePromptBtn: {
    background: "#22c55e",
    border: "none",
    color: "white",
    padding: "6px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500"
  },
  exportPanel: {
    padding: "12px 20px",
    borderBottom: "1px solid",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    flexShrink: 0
  },
  exportTitle: {
    fontSize: "14px",
    fontWeight: "600"
  },
  exportButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  },
  exportBtn: {
    padding: "6px 14px",
    borderRadius: "8px",
    border: "1px solid #6366f1",
    background: "transparent",
    color: "#6366f1",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    transition: "all 0.2s"
  },
  exportCount: {
    fontSize: "12px",
    opacity: 0.7
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #1e293b",
    flexShrink: 0,
    padding: "0 20px"
  },
  chat: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    minHeight: 0
  },
  message: {
    maxWidth: "85%",
    padding: "14px 18px",
    borderRadius: "18px",
    lineHeight: 1.6,
    fontSize: "15px",
    position: "relative"
  },
  user: {
    alignSelf: "flex-end",
    borderBottomRightRadius: "6px"
  },
  bot: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: "6px",
    border: "1px solid"
  },
  pinned: {
    border: "2px solid #fbbf24"
  },
  pinnedBadge: {
    fontSize: "11px",
    color: "#fbbf24",
    fontWeight: "bold",
    marginBottom: "4px"
  },
  messageFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "4px",
    gap: "8px"
  },
  messageActions: {
    display: "flex",
    gap: "4px",
    alignItems: "center"
  },
  typingIndicator: {
    display: "flex",
    gap: "6px",
    fontSize: "20px"
  },
  imagePreview: {
    maxWidth: "100%",
    borderRadius: "12px",
    marginBottom: "8px"
  },
  imageBar: {
    padding: "8px 16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    borderTop: "1px solid",
    flexShrink: 0
  },
  removeImg: {
    background: "#ef4444",
    border: "none",
    color: "white",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    cursor: "pointer"
  },
  suggestions: {
    padding: "8px 20px",
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    flexWrap: "wrap",
    justifyContent: "center",
    flexShrink: 0
  },
  suggestionBtn: {
    background: "transparent",
    border: "1px solid",
    borderRadius: "20px",
    padding: "8px 16px",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap"
  },
  inputArea: {
    padding: "12px 14px",
    borderTop: "1px solid",
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexShrink: 0
  },
  input: {
    flex: 1,
    border: "1px solid",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.2s"
  },
  button: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: "14px",
    padding: "0 16px",
    height: "44px",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    transition: "opacity 0.2s"
  },
  iconButton: {
    border: "none",
    borderRadius: "12px",
    height: "44px",
    minWidth: "44px",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background 0.2s"
  }
};
