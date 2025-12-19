'use client';

import { useEffect, useRef, useState } from 'react';

interface KeySound {
  startTime: number;
  duration: number;
}

interface SoundConfig {
  defines: { [key: string]: [number, number] };
}

// Key mapping: keyboard key -> config key ID
const KEY_MAP: { [key: string]: string } = {
  // Numbers
  '1': '2', '2': '3', '3': '4', '4': '5', '5': '6',
  '6': '7', '7': '8', '8': '9', '9': '10', '0': '11',
  
  // Top row
  'q': '17', 'w': '18', 'e': '19', 'r': '20', 't': '21',
  'y': '22', 'u': '23', 'i': '24', 'o': '25', 'p': '26',
  
  // Middle row
  'a': '31', 's': '32', 'd': '33', 'f': '34', 'g': '35',
  'h': '36', 'j': '37', 'k': '38', 'l': '39',
  
  // Bottom row
  'z': '45', 'x': '46', 'c': '47', 'v': '48', 'b': '49',
  'n': '50', 'm': '51',
  
  // Special keys
  ' ': '62', // Space
  'Enter': '42',
  'Backspace': '15',
  'Tab': '16',
  'Shift': '44',
  'CapsLock': '30',
};

export const useKeyboardSound = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const soundConfigRef = useRef<SoundConfig | null>(null);

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
        
        // Load sound config
        const configResponse = await fetch('/sounds/config.json');
        soundConfigRef.current = await configResponse.json();
        
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

  const playKeySound = (key?: string) => {
    if (!soundEnabled || !audioContextRef.current || !audioBufferRef.current || !soundConfigRef.current) return;

    try {
      const audioContext = audioContextRef.current;
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();

      source.buffer = audioBufferRef.current;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Get sound timing for specific key or use default
      let startTime = 12.061; // Default: key "30"
      let duration = 0.129;
      
      if (key) {
        const configKey = KEY_MAP[key.toLowerCase()] || KEY_MAP[key];
        if (configKey && soundConfigRef.current.defines[configKey]) {
          const [start, dur] = soundConfigRef.current.defines[configKey];
          startTime = start / 1000; // Convert ms to seconds
          duration = dur / 1000;
        }
      }
      
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
