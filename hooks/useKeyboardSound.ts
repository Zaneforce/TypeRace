'use client';

import { useEffect, useRef, useState } from 'react';

export const useKeyboardSound = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    // Load sound preference from localStorage
    const savedPreference = localStorage.getItem('keyboardSoundEnabled');
    if (savedPreference !== null) {
      setSoundEnabled(savedPreference === 'true');
    }

    // Initialize AudioContext and load sound
    const initAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Fetch and decode audio file
        const response = await fetch('/sounds/purple.ogg');
        const arrayBuffer = await response.arrayBuffer();
        audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
      } catch (error) {
        console.error('Failed to load audio:', error);
      }
    };

    initAudio();
  }, []);

  const playKeySound = () => {
    if (!soundEnabled || !audioContextRef.current || !audioBufferRef.current) return;

    try {
      const audioContext = audioContextRef.current;
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();

      source.buffer = audioBufferRef.current;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Play a short snippet (use key "30" from config: starts at 12061ms, duration 129ms)
      const startTime = 12.061; // 12061ms in seconds
      const duration = 0.129; // 129ms in seconds
      
      gainNode.gain.value = 0.3;
      source.start(0, startTime, duration);
    } catch (error) {
      // Ignore playback errors
    }
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('keyboardSoundEnabled', String(newValue));
  };

  return { soundEnabled, toggleSound, playKeySound };
};
