"use client";

import { useState, useEffect } from 'react';

export default function VoiceOutput({ text, autoSpeak, language }) {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (window.speechSynthesis) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        // Set default voice based on language
        const defaultVoice = availableVoices.find(v => v.lang.startsWith(language || 'en'));
        setSelectedVoice(defaultVoice || availableVoices[0]);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [language]);

  useEffect(() => {
    if (autoSpeak && text) {
      speakText(text);
    }
  }, [text, autoSpeak]);

  const speakText = (textToSpeak) => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    const cleanText = textToSpeak.replace(/[*#`_]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = 1;
    utterance.pitch = 1.05;
    utterance.lang = language || 'en-US';
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const changeVoice = (voiceURI) => {
    const voice = voices.find(v => v.voiceURI === voiceURI);
    setSelectedVoice(voice);
  };

  if (voices.length === 0) return null;

  return (
    <div style={styles.container}>
      <div style={styles.controls}>
        <button 
          onClick={() => speakText(text)} 
          style={styles.playBtn}
          disabled={!text}
        >
          🔊
        </button>
        <button 
          onClick={stopSpeaking} 
          style={styles.stopBtn}
          disabled={!isSpeaking}
        >
          ⏹
        </button>
        <select 
          value={selectedVoice?.voiceURI || ''} 
          onChange={(e) => changeVoice(e.target.value)}
          style={styles.voiceSelect}
        >
          <option value="">Select Voice</option>
          {voices.map(voice => (
            <option key={voice.voiceURI} value={voice.voiceURI}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
        {isSpeaking && (
          <span style={styles.playingIndicator}>● Speaking...</span>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "4px 12px",
    borderBottom: "1px solid #1e293b",
    background: "#1a1a2e"
  },
  controls: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap"
  },
  playBtn: {
    background: "#22c55e",
    border: "none",
    borderRadius: "6px",
    padding: "4px 12px",
    color: "white",
    cursor: "pointer",
    fontSize: "14px"
  },
  stopBtn: {
    background: "#ef4444",
    border: "none",
    borderRadius: "6px",
    padding: "4px 12px",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
    opacity: 0.7
  },
  voiceSelect: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "6px",
    padding: "4px 8px",
    color: "#e4e4e7",
    fontSize: "12px",
    maxWidth: "200px"
  },
  playingIndicator: {
    fontSize: "12px",
    color: "#22c55e",
    animation: "pulse 1s infinite"
  }
};
