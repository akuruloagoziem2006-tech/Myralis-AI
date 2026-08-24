"use client";

import { useState, useEffect } from 'react';

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    });

    window.addEventListener('appinstalled', () => {
      setShowInstall(false);
    });
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setShowInstall(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!showInstall) return null;

  return (
    <div style={{padding:"4px 12px",borderBottom:"1px solid #1e293b",background:"#1e293b"}}>
      <button onClick={handleInstall} style={{background:"#6366f1",border:"none",color:"white",padding:"6px 16px",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:"500"}}>
        📱 Install App
      </button>
    </div>
  );
}
