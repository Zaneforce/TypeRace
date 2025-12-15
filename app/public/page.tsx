'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import VirtualKeyboard from '@/components/VirtualKeyboard';
import { useKeyboardSound } from '@/hooks/useKeyboardSound';
import { useRoomStore } from '@/store/roomStore';
import { getRandomText, calculateWPM, calculateAccuracy } from '@/utils/textUtils';
import { Player } from '@/types/room';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faTrophy, faUser, faCheckCircle, faUsers, faVolumeHigh, faVolumeXmark } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/contexts/AuthContext';

export default function PublicRoomPage() {
  const router = useRouter();
  const { playKeySound, soundEnabled, toggleSound } = useKeyboardSound();
  const { user } = useAuth();
  const [pressedKey, setPressedKey] = useState('');
  const [nextKey, setNextKey] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { currentRoom, currentPlayer, setRoom, setPlayer, updatePlayer, updatePlayers } = useRoomStore();

  // Simulate joining a public room
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const playerName = user.displayName || user.email || `Player${Math.floor(Math.random() * 1000)}`;
    
    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      name: playerName,
      progress: 0,
      wpm: 0,
      accuracy: 100,
      isFinished: false,
    };

    const text = getRandomText();
    
    // Simulate other players
    const otherPlayers: Player[] = Array.from({ length: 3 }, (_, i) => ({
      id: `bot-${i}`,
      name: `Player ${i + 1}`,
      progress: 0,
      wpm: 0,
      accuracy: 100,
      isFinished: false,
    }));

    setRoom({
      id: 'public-room',
      code: 'PUBLIC',
      text,
      players: [newPlayer, ...otherPlayers],
      isStarted: false,
      createdAt: Date.now(),
    });

    setPlayer(newPlayer);
    inputRef.current?.focus();

    // Simulate bot typing
    const botInterval = setInterval(() => {
      updatePlayers(
        [newPlayer, ...otherPlayers].map((p) => {
          if (p.id.startsWith('bot-') && !p.isFinished) {
            const newProgress = Math.min(p.progress + Math.random() * 3, 100);
            return {
              ...p,
              progress: newProgress,
              wpm: Math.floor(40 + Math.random() * 40),
              isFinished: newProgress >= 100,
              finishTime: newProgress >= 100 ? Date.now() : undefined,
            };
          }
          return p;
        })
      );
    }, 1000);

    return () => clearInterval(botInterval);
  }, [setRoom, setPlayer, updatePlayers]);

  useEffect(() => {
    if (!currentRoom || !currentPlayer) return;

    const progress = (userInput.length / currentRoom.text.length) * 100;
    const isFinished = userInput.length >= currentRoom.text.length;

    updatePlayer(currentPlayer.id, {
      progress,
      wpm,
      accuracy,
      isFinished,
      finishTime: isFinished ? Date.now() : undefined,
    });
  }, [userInput, wpm, accuracy]); // Removed currentRoom, currentPlayer, updatePlayer from dependencies

  useEffect(() => {
    if (!currentRoom) return;
    if (userInput.length < currentRoom.text.length) {
      setNextKey(currentRoom.text[userInput.length]);
    } else {
      setNextKey('');
    }
  }, [userInput, currentRoom]);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isStarted && e.key !== 'Tab') {
      setIsStarted(true);
      setStartTime(Date.now());
    }

    const specialKeys = ['Backspace', 'Enter', 'Tab', 'Shift', 'Control', 'Alt'];
    playKeySound();
    
    setPressedKey(e.key);
    setTimeout(() => setPressedKey(''), 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentRoom || currentPlayer?.isFinished) return;
    
    const input = e.target.value;
    setUserInput(input);

    // Calculate stats
    if (startTime) {
      const timeElapsed = (Date.now() - startTime) / 1000;
      const calculatedWpm = calculateWPM(input.length, timeElapsed);
      setWpm(calculatedWpm);

      let correct = 0;
      for (let i = 0; i < input.length; i++) {
        if (input[i] === currentRoom.text[i]) correct++;
      }
      setAccuracy(calculateAccuracy(correct, input.length));
    }
  };

  const renderText = () => {
    if (!currentRoom) return null;

    const charsPerLine = 45;
    const completedLines = Math.floor(userInput.length / charsPerLine);
    let charOffset = 0;
    if (completedLines > 0) {
      charOffset = Math.max(0, (completedLines - 0) * charsPerLine);
    }
    
    const displayText = currentRoom.text.substring(charOffset);

    return displayText.split('').map((char, index) => {
      const actualIndex = index + charOffset;
      let className = 'text-3xl font-mono transition-all duration-75 ';
      
      if (actualIndex < userInput.length) {
        className += userInput[actualIndex] === char 
          ? 'text-yellow-400' 
          : 'text-red-500 bg-red-500/20 rounded';
      } else if (actualIndex === userInput.length) {
        className += 'text-gray-300 bg-yellow-500/30 border-l-2 border-yellow-500';
      } else {
        className += 'text-gray-600';
      }
      
      return (
        <span key={actualIndex} className={className}>
          {char}
        </span>
      );
    });
  };

  const sortedPlayers = currentRoom?.players.sort((a, b) => {
    if (a.isFinished && b.isFinished) {
      return (a.finishTime || 0) - (b.finishTime || 0);
    }
    if (a.isFinished) return -1;
    if (b.isFinished) return 1;
    return b.progress - a.progress;
  }) || [];

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-gray-300">
      {/* Header */}
      <div className="border-b border-gray-800 sticky top-0 bg-[#1a1a1a] z-10">
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 hover:text-yellow-500 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <FontAwesomeIcon icon={faHome} />
            <span>Home</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-yellow-500 text-2xl font-bold flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faUsers} /> Public Room
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSound}
              className={`text-sm font-medium transition-colors flex items-center gap-2 ${
                soundEnabled ? 'text-yellow-500 hover:text-yellow-400' : 'text-gray-500 hover:text-gray-400'
              }`}
              title={soundEnabled ? 'Sound On' : 'Sound Off'}
            >
              <FontAwesomeIcon icon={soundEnabled ? faVolumeHigh : faVolumeXmark} />
            </button>
            <div className="text-gray-500 text-sm">
              {sortedPlayers.length}/5 Player{sortedPlayers.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6 grid lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <div className="text-gray-500 text-xs mb-1">wpm</div>
              <div className="text-yellow-500 text-3xl font-bold">{wpm}</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <div className="text-gray-500 text-xs mb-1">accuracy</div>
              <div className="text-yellow-500 text-3xl font-bold">{accuracy}%</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <div className="text-gray-500 text-xs mb-1">progress</div>
              <div className="text-yellow-500 text-3xl font-bold">
                {Math.floor((userInput.length / (currentRoom?.text.length || 1)) * 100)}%
              </div>
            </div>
          </div>

          {/* Text Display */}
          <div className="mb-8">
            {!isStarted && (
              <div className="text-center mb-6 text-gray-600 text-sm animate-pulse">
                Start typing to begin...
              </div>
            )}
            
            <div 
              className="text-left leading-relaxed px-4 max-w-4xl mx-auto overflow-hidden cursor-text"
              onClick={() => inputRef.current?.focus()}
              style={{ 
              fontSize: '2rem',
              letterSpacing: '0.02em',
              wordSpacing: '0.5em',
              lineHeight: '1.8',
              height: '10.8rem',
              position: 'relative'
            }}
          >
            <div style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              padding: '0 1rem'
            }}>
              {renderText()}
            </div>
          </div>

          {/* Hidden Input */}
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={currentPlayer?.isFinished}
            className="w-full bg-transparent text-transparent caret-transparent outline-none border-none"
            style={{
              position: 'absolute',
              left: '-9999px'
            }}
            autoFocus
          />
        </div>

        {/* Virtual Keyboard */}
        <VirtualKeyboard pressedKey={pressedKey} showKeyboard={true} />
      </div>

      {/* Leaderboard Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-gray-800/30 rounded-lg border border-gray-700/50 p-6 sticky top-24">
          <h3 className="text-yellow-500 text-lg font-bold mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faTrophy} /> Leaderboard
          </h3>
          <div className="space-y-3">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`p-3 rounded-lg transition-all ${
                  player.id === currentPlayer?.id
                    ? 'bg-yellow-500/20 border border-yellow-500/50'
                    : 'bg-gray-700/30 border border-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${
                      player.id === currentPlayer?.id ? 'text-yellow-500' : 'text-gray-500'
                    }`}>
                      #{index + 1}
                    </span>
                    <span className="text-gray-300 font-medium text-sm">
                      {player.name}
                    </span>
                  </div>
                  {player.isFinished && (
                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-sm" />
                  )}
                </div>
                
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>{player.wpm} wpm</span>
                  <span>{Math.floor(player.progress)}%</span>
                </div>
                
                <div className="w-full bg-gray-600 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      player.id === currentPlayer?.id
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                        : 'bg-gradient-to-r from-gray-500 to-gray-600'
                    }`}
                    style={{ width: `${player.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </main>
  );
}
