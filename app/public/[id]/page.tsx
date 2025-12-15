'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/lib/firebase';
import { ref, onValue, set, update, get } from 'firebase/database';
import VirtualKeyboard from '@/components/VirtualKeyboard';
import { useKeyboardSound } from '@/hooks/useKeyboardSound';
import { getRandomText, calculateWPM, calculateAccuracy } from '@/utils/textUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faTrophy, faCheckCircle, faCrown } from '@fortawesome/free-solid-svg-icons';

interface PlayerData {
  id: string;
  name: string;
  progress: number;
  wpm: number;
  accuracy: number;
  isFinished: boolean;
  finishTime?: number;
  startTime?: number;
}

interface RoomData {
  text: string;
  status: 'waiting' | 'playing' | 'finished';
  players: { [key: string]: PlayerData };
  winner?: string;
  createdAt: number;
}

export default function PublicRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params?.id as string;
  const { user } = useAuth();
  const { playKeySound, soundEnabled, toggleSound } = useKeyboardSound();

  const [room, setRoom] = useState<RoomData | null>(null);
  const [userInput, setUserInput] = useState('');
  const [pressedKey, setPressedKey] = useState('');
  const [nextKey, setNextKey] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !roomId) {
      router.push('/login');
      return;
    }

    const roomRef = ref(database, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoom(data);
        
        // Check if all players finished
        const players = Object.values(data.players || {}) as PlayerData[];
        const allFinished = players.every((p: PlayerData) => p.isFinished);
        
        if (allFinished && players.length > 0 && data.status !== 'finished') {
          // Find winner based on score (WPM * Accuracy)
          const sortedPlayers = players
            .filter((p: PlayerData) => p.isFinished)
            .map((p: PlayerData) => ({
              ...p,
              score: p.wpm * (p.accuracy / 100)
            }))
            .sort((a: any, b: any) => b.score - a.score);
          
          const winner = sortedPlayers[0];
          await update(ref(database, `rooms/${roomId}`), {
            status: 'finished',
            winner: winner.id
          });
          setShowWinner(true);
        }
      }
    });

    // Initialize text if not exists
    get(roomRef).then(async (snapshot) => {
      const data = snapshot.val();
      if (data && !data.text) {
        await update(roomRef, {
          text: getRandomText(50)
        });
      }
    });

    return () => unsubscribe();
  }, [user, roomId, router]);

  useEffect(() => {
    if (room?.text && userInput.length < room.text.length) {
      setNextKey(room.text[userInput.length]);
    } else {
      setNextKey('');
    }
  }, [userInput, room]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isStarted && e.key !== 'Tab' && user && room) {
      const now = Date.now();
      setIsStarted(true);
      setStartTime(now);
      
      // Update room status to playing if still waiting
      if (room.status === 'waiting') {
        update(ref(database, `rooms/${roomId}`), { status: 'playing' });
      }
      
      // Save player start time
      update(ref(database, `rooms/${roomId}/players/${user.uid}`), { 
        startTime: now 
      });
    }

    playKeySound();
    
    setPressedKey(e.key);
    setTimeout(() => setPressedKey(''), 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!room || !user) return;
    
    const input = e.target.value;
    setUserInput(input);

    // Get current player data - use local startTime first (more reliable), then Firebase
    const currentPlayerData = room.players[user.uid];
    const playerStartTime = startTime || currentPlayerData?.startTime;

    // Calculate stats
    const progress = (input.length / room.text.length) * 100;
    let wpm = 0;
    let accuracy = 100;

    if (playerStartTime && input.length > 0) {
      const timeElapsed = (Date.now() - playerStartTime) / 1000;
      wpm = calculateWPM(input.length, timeElapsed);

      let correct = 0;
      for (let i = 0; i < input.length; i++) {
        if (input[i] === room.text[i]) correct++;
      }
      accuracy = calculateAccuracy(correct, input.length);
    }

    const isFinished = input.length >= room.text.length;

    // Update player in Firebase
    const updateData: any = {
      progress,
      wpm,
      accuracy,
      isFinished,
    };

    // Only add finishTime if the player just finished
    if (isFinished && !room.players[user.uid]?.isFinished) {
      updateData.finishTime = Date.now();
    }

    update(ref(database, `rooms/${roomId}/players/${user.uid}`), updateData);
  };

  const renderText = () => {
    if (!room || !room.text) return null;

    // Split text into words to avoid cutting words
    const words = room.text.split(' ');
    let charCount = 0;
    let wordStartIndex = 0;
    
    // Find which word the user is currently typing
    for (let i = 0; i < words.length; i++) {
      const wordLength = words[i].length + (i < words.length - 1 ? 1 : 0); // +1 for space
      
      if (charCount + wordLength > userInput.length) {
        // User is typing this word or hasn't reached it yet
        // Calculate how many words to skip based on characters typed
        const estimatedCharsPerLine = 50;
        const linesToSkip = Math.floor(charCount / estimatedCharsPerLine);
        
        if (linesToSkip > 0) {
          // Find the word index at the start of visible text
          let skipChars = linesToSkip * estimatedCharsPerLine;
          let skipWordCount = 0;
          let skipCharCount = 0;
          
          for (let j = 0; j < words.length; j++) {
            const wLength = words[j].length + (j < words.length - 1 ? 1 : 0);
            if (skipCharCount + wLength > skipChars) {
              wordStartIndex = j;
              break;
            }
            skipCharCount += wLength;
          }
        }
        break;
      }
      
      charCount += wordLength;
    }
    
    // Get visible words
    const visibleWords = words.slice(wordStartIndex);
    const displayText = visibleWords.join(' ');
    
    // Calculate character offset
    let charOffset = 0;
    for (let i = 0; i < wordStartIndex; i++) {
      charOffset += words[i].length + (i < words.length - 1 ? 1 : 0);
    }

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

  const sortedPlayers = room ? Object.values(room.players).sort((a, b) => {
    if (a.isFinished && b.isFinished) {
      return (a.finishTime || 0) - (b.finishTime || 0);
    }
    if (a.isFinished) return -1;
    if (b.isFinished) return 1;
    return b.progress - a.progress;
  }) : [];

  const currentPlayer = user && room?.players[user.uid];
  const winner = room?.winner && room.players[room.winner];

  if (!room) {
    return (
      <main className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-yellow-500 text-xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-gray-300">
      {/* Winner Modal */}
      {showWinner && winner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 p-12 rounded-2xl border-2 border-yellow-500 max-w-md w-full text-center animate-pulse">
            <FontAwesomeIcon icon={faCrown} className="text-yellow-500 text-6xl mb-4" />
            <h2 className="text-4xl font-bold text-yellow-500 mb-4">Winner!</h2>
            <p className="text-3xl text-white mb-2">{winner.name}</p>
            <p className="text-gray-400 mb-6">{winner.wpm} WPM • {winner.accuracy}% Accuracy</p>
            <button
              onClick={() => router.push('/lobby')}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold px-8 py-3 rounded-lg transition-colors"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push('/lobby')}
            className="text-gray-500 hover:text-yellow-500 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <FontAwesomeIcon icon={faHome} />
            <span>Lobby</span>
          </button>
          <h1 className="text-2xl font-bold text-yellow-500">
            Public Room
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSound}
              className={`text-sm font-medium transition-colors flex items-center gap-2 ${
                soundEnabled ? 'text-yellow-500 hover:text-yellow-400' : 'text-gray-500 hover:text-gray-400'
              }`}
              title={soundEnabled ? 'Sound On' : 'Sound Off'}
            >
              <span>{soundEnabled ? '🔊' : '🔇'}</span>
            </button>
            <div className="text-gray-500 text-sm">
              {sortedPlayers.length}/5 Players
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
              <div className="text-yellow-500 text-3xl font-bold">{currentPlayer?.wpm || 0}</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <div className="text-gray-500 text-xs mb-1">accuracy</div>
              <div className="text-yellow-500 text-3xl font-bold">{currentPlayer?.accuracy || 100}%</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <div className="text-gray-500 text-xs mb-1">progress</div>
              <div className="text-yellow-500 text-3xl font-bold">
                {currentPlayer ? Math.floor(currentPlayer.progress) : 0}%
              </div>
            </div>
          </div>

          {/* Text Display */}
          <div className="mb-8">
            {room.status === 'waiting' && (
              <div className="text-center mb-6 text-gray-600 text-sm animate-pulse">
                Waiting for players... Start typing to begin!
              </div>
            )}
            
            <div 
              className="text-left leading-relaxed px-4 max-w-4xl mx-auto overflow-hidden"
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
              disabled={currentPlayer?.isFinished}
              className="w-full bg-transparent text-transparent caret-transparent outline-none border-none"
              style={{
                position: 'absolute',
                opacity: 0,
                pointerEvents: 'none'
              }}
              autoFocus
            />
          </div>

          {/* Personal Stats */}
          {currentPlayer && (
            <div className="max-w-4xl mx-auto mb-8">
              <div className="flex items-center justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">wpm</span>
                  <span className="text-yellow-500 text-2xl font-bold">{currentPlayer.wpm}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">acc</span>
                  <span className="text-yellow-500 text-2xl font-bold">{currentPlayer.accuracy}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">progress</span>
                  <span className="text-yellow-500 text-2xl font-bold">
                    {Math.floor(currentPlayer.progress)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl border border-gray-700/50 sticky top-8">
            <h2 className="text-xl font-bold text-yellow-500 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faTrophy} />
              <span>Leaderboard</span>
            </h2>
            <div className="space-y-2">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={`p-3 rounded-lg flex items-center justify-between ${
                    player.id === user?.uid
                      ? 'bg-yellow-500/20 border border-yellow-500/50'
                      : 'bg-gray-700/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 font-mono text-sm w-6">
                      {index === 0 && player.isFinished ? '🥇' : 
                       index === 1 && player.isFinished ? '🥈' : 
                       index === 2 && player.isFinished ? '🥉' : 
                       `#${index + 1}`}
                    </span>
                    <div>
                      <span className={`font-medium block ${
                        player.id === user?.uid ? 'text-yellow-500' : 'text-gray-300'
                      }`}>
                        {player.name}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{player.wpm} wpm</span>
                        <span>•</span>
                        <span>{Math.floor(player.progress)}%</span>
                      </div>
                    </div>
                  </div>
                  {player.isFinished && (
                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Virtual Keyboard */}
      <VirtualKeyboard pressedKey={pressedKey} nextKey={nextKey} showKeyboard={true} />
    </main>
  );
}
