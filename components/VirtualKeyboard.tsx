'use client';

import React, { useEffect, useState } from 'react';

interface VirtualKeyboardProps {
  pressedKey?: string;
  showKeyboard?: boolean;
  nextKey?: string;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ 
  pressedKey = '', 
  showKeyboard = true,
  nextKey = ''
}) => {
  const [activeKey, setActiveKey] = useState<string>('');

  useEffect(() => {
    if (pressedKey) {
      setActiveKey(pressedKey);
      const timer = setTimeout(() => setActiveKey(''), 100);
      return () => clearTimeout(timer);
    }
  }, [pressedKey]);

  // Finger color mapping (like touch typing)
  const fingerColors: { [key: string]: string } = {
    // Left pinky
    '`': 'finger-pink-l', '1': 'finger-pink-l', 'Q': 'finger-pink-l', 'A': 'finger-pink-l', 'Z': 'finger-pink-l',
    'Tab': 'finger-pink-l', 'CapsLock': 'finger-pink-l', 'Shift': 'finger-pink-l',
    
    // Left ring
    '2': 'finger-ring-l', 'W': 'finger-ring-l', 'S': 'finger-ring-l', 'X': 'finger-ring-l',
    
    // Left middle
    '3': 'finger-middle-l', 'E': 'finger-middle-l', 'D': 'finger-middle-l', 'C': 'finger-middle-l',
    
    // Left index
    '4': 'finger-index-l', '5': 'finger-index-l', 'R': 'finger-index-l', 'T': 'finger-index-l',
    'F': 'finger-index-l', 'G': 'finger-index-l', 'V': 'finger-index-l', 'B': 'finger-index-l',
    
    // Right index
    '6': 'finger-index-r', '7': 'finger-index-r', 'Y': 'finger-index-r', 'U': 'finger-index-r',
    'H': 'finger-index-r', 'J': 'finger-index-r', 'N': 'finger-index-r', 'M': 'finger-index-r',
    
    // Right middle
    '8': 'finger-middle-r', 'I': 'finger-middle-r', 'K': 'finger-middle-r', ',': 'finger-middle-r',
    
    // Right ring
    '9': 'finger-ring-r', 'O': 'finger-ring-r', 'L': 'finger-ring-r', '.': 'finger-ring-r',
    
    // Right pinky
    '0': 'finger-pink-r', '-': 'finger-pink-r', '=': 'finger-pink-r', 'P': 'finger-pink-r',
    '[': 'finger-pink-r', ']': 'finger-pink-r', '\\': 'finger-pink-r', ';': 'finger-pink-r',
    "'": 'finger-pink-r', '/': 'finger-pink-r', 'Enter': 'finger-pink-r', 'Backspace': 'finger-pink-r',
    
    // Thumbs
    'Space': 'finger-thumb', ' ': 'finger-thumb', 'Alt': 'finger-thumb', 'Ctrl': 'finger-special', 'Win': 'finger-special', 'Fn': 'finger-special'
  };

  const getFingerColor = (key: string): string => {
    const finger = fingerColors[key] || 'finger-default';
    const colors: { [key: string]: string } = {
      'finger-pink-l': 'bg-pink-600/40 border-pink-500/50',
      'finger-ring-l': 'bg-purple-600/40 border-purple-500/50',
      'finger-middle-l': 'bg-blue-600/40 border-blue-500/50',
      'finger-index-l': 'bg-green-600/40 border-green-500/50',
      'finger-index-r': 'bg-green-600/40 border-green-500/50',
      'finger-middle-r': 'bg-blue-600/40 border-blue-500/50',
      'finger-ring-r': 'bg-purple-600/40 border-purple-500/50',
      'finger-pink-r': 'bg-pink-600/40 border-pink-500/50',
      'finger-thumb': 'bg-orange-600/40 border-orange-500/50',
      'finger-special': 'bg-gray-600/40 border-gray-500/50',
      'finger-default': 'bg-gray-700/40 border-gray-600/50'
    };
    return colors[finger];
  };

  const getFingerColorActive = (key: string): string => {
    const finger = fingerColors[key] || 'finger-default';
    const colors: { [key: string]: string } = {
      'finger-pink-l': 'bg-pink-500 border-pink-400 shadow-pink-500/50',
      'finger-ring-l': 'bg-purple-500 border-purple-400 shadow-purple-500/50',
      'finger-middle-l': 'bg-blue-500 border-blue-400 shadow-blue-500/50',
      'finger-index-l': 'bg-green-500 border-green-400 shadow-green-500/50',
      'finger-index-r': 'bg-green-500 border-green-400 shadow-green-500/50',
      'finger-middle-r': 'bg-blue-500 border-blue-400 shadow-blue-500/50',
      'finger-ring-r': 'bg-purple-500 border-purple-400 shadow-purple-500/50',
      'finger-pink-r': 'bg-pink-500 border-pink-400 shadow-pink-500/50',
      'finger-thumb': 'bg-orange-500 border-orange-400 shadow-orange-500/50',
      'finger-special': 'bg-gray-500 border-gray-400 shadow-gray-500/50',
      'finger-default': 'bg-gray-500 border-gray-400 shadow-gray-500/50'
    };
    return colors[finger];
  };

  const keyboardLayout = [
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
    ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
    ['CapsLock', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
    ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
    ['Ctrl', 'Win', 'Alt', 'Space', 'Alt', 'Fn', 'Ctrl']
  ];

  const getKeyWidth = (key: string) => {
    if (key === 'Space') return 'w-80';
    if (key === 'Backspace') return 'w-24';
    if (key === 'Enter') return 'w-24';
    if (key === 'Tab') return 'w-20';
    if (key === 'CapsLock') return 'w-24';
    if (key === 'Shift') return 'w-28';
    if (key === 'Ctrl' || key === 'Alt' || key === 'Win' || key === 'Fn') return 'w-16';
    return 'w-12';
  };

  const normalizeKey = (key: string) => {
    if (key === ' ') return 'Space';
    return key.toUpperCase();
  };

  const isKeyActive = (key: string) => {
    const normalized = normalizeKey(activeKey);
    if (key === 'Space' && normalized === 'SPACE') return true;
    if (key === 'Backspace' && normalized === 'BACKSPACE') return true;
    if (key === 'Enter' && normalized === 'ENTER') return true;
    if (key === 'Tab' && normalized === 'TAB') return true;
    return key.toUpperCase() === normalized;
  };

  const isKeyNext = (key: string) => {
    if (!nextKey) return false;
    const normalized = normalizeKey(nextKey);
    if (key === 'Space' && normalized === 'SPACE') return true;
    return key.toUpperCase() === normalized;
  };

  if (!showKeyboard) return null;

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 mb-4">
      {/* Finger Guide Legend */}
      <div className="flex justify-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-pink-500"></div>
          <span className="text-gray-400">Kelingking</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span className="text-gray-400">Manis</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-400">Tengah</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-400">Telunjuk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-gray-400">Jempol</span>
        </div>
      </div>

      {/* Keyboard */}
      <div className="bg-gray-900/40 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50">
        <div className="space-y-2">
          {keyboardLayout.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1.5">
              {row.map((key, keyIndex) => {
                const isActive = isKeyActive(key);
                const isNext = isKeyNext(key);
                const baseColor = getFingerColor(key);
                const activeColor = getFingerColorActive(key);
                
                return (
                  <div
                    key={`${rowIndex}-${keyIndex}`}
                    className={`
                      ${getKeyWidth(key)} h-12
                      flex items-center justify-center
                      rounded-lg font-semibold text-sm
                      border-2
                      transition-all duration-100
                      ${isActive
                        ? `${activeColor} text-white scale-95 shadow-lg transform`
                        : isNext
                        ? `${baseColor} text-white border-yellow-400 ring-2 ring-yellow-400/50 animate-pulse`
                        : `${baseColor} text-gray-300 hover:brightness-110`
                      }
                    `}
                  >
                    <span className={isActive ? 'scale-90' : ''}>{key}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Home Row Indicator */}
      <div className="mt-3 text-center text-xs text-gray-500">
        <span className="inline-flex items-center gap-2">
          <span>Home Row:</span>
          <kbd className="px-2 py-1 bg-gray-800/50 rounded border border-gray-700 text-green-400">F</kbd>
          <kbd className="px-2 py-1 bg-gray-800/50 rounded border border-gray-700 text-green-400">J</kbd>
        </span>
      </div>
    </div>
  );
};

export default VirtualKeyboard;
