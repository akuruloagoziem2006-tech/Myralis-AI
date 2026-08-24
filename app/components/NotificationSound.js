"use client";

import { useEffect, useRef } from 'react';

export default function NotificationSound({ enabled, onPlay }) {
  const audioContextRef = useRef(null);

  useEffect(() => {
    if (enabled) {
      playNotificationSound();
      if (onPlay) onPlay();
    }
  }, [enabled]);

  const playNotificationSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.value = 0.1;
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
      }, 150);
    } catch (error) {
      console.log('Audio not available');
    }
  };

  return null;
}
