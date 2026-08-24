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

  if (voices.length === 0) return null;

  return (
    <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
      <button onClick={() => speakText(text)} style={{background:"#22c55e",border:"none",borderRadius:"6px",padding:"4px 12px",color:"white",cursor:"pointer",fontSize:"14px"}}>🔊</button>
      <button onClick={stopSpeaking} style={{background:"#ef4444",border:"none",borderRadius:"6px",padding:"4px 12px",color:"white",cursor:"pointer",fontSize:"14px",opacity:isSpeaking ? 1 : 0.5}}>⏹</button>
      <select value={selectedVoice?.voiceURI || ''} onChange={(e) => {
        const voice = voices.find(v => v.voiceURI === e.target.value);
        setSelectedVoice(voice);
      }} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:"6px",padding:"4px 8px",color:"#e4e4e7",fontSize:"12px",maxWidth:"200px"}}>
        <option value="">Select Voice</option>
        {voices.map(voice => (
          <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>
        ))}
      </select>
      {isSpeaking && <span style={{fontSize:"12px",color:"#22c55e"}}>● Speaking...</span>}
    </div>
  );
}
