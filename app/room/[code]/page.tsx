'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/lib/firebase';
import { ref, onValue, update, get } from 'firebase/database';
import VirtualKeyboard from '@/components/VirtualKeyboard';
import { useKeyboardSound } from '@/hooks/useKeyboardSound';
import { calculateWPM, calculateAccuracy, getRandomText } from '@/utils/textUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faUsers, faLink, faCheckCircle, faUser, faCrown, faTrophy, faRotateRight } from '@fortawesome/free-solid-svg-icons';

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
  code: string;
  name: string;
  text: string;
  status: 'waiting' | 'playing' | 'finished';
  players: { [key: string]: PlayerData };
  maxPlayers: number;
  createdAt: number;
  createdBy: string;
}

export default function RoomPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { playKeySound, soundEnabled, toggleSound } = useKeyboardSound();
  const { user } = useAuth();
  
  const [room, setRoom] = useState<RoomData | null>(null);
  const [pressedKey, setPressedKey] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const roomCode = params.code.toUpperCase();
  const isHost = searchParams.get('host') === 'true';

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const roomRef = ref(database, `customRooms/${roomCode}`);
    
    // Check if room exists and join
    const joinRoom = async () => {
      const snapshot = await get(roomRef);
      
      if (!snapshot.exists()) {
        alert('Room tidak ditemukan!');
        router.push('/');
        return;
      }

      // Add player to room
      const playerName = user.displayName || user.email || `Player${Math.floor(Math.random() * 1000)}`;
      const playerData: PlayerData = {
        id: user.uid,
        name: playerName,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        isFinished: false,
      };

      await update(ref(database, `customRooms/${roomCode}/players/${user.uid}`), playerData);
    };

    joinRoom();

    // Listen to room changes
    const unsubscribe = onValue(roomRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoom(data);
        
        // Check if all players finished
        const players = Object.values(data.players || {}) as PlayerData[];
        const allFinished = players.every((p: PlayerData) => p.isFinished);
        
        if (allFinished && players.length > 0) {
          if (data.status !== 'finished') {
            // Find winner based on score (WPM * Accuracy)
            const sortedPlayers = players
              .filter((p: PlayerData) => p.isFinished)
              .map((p: PlayerData) => ({
                ...p,
                score: p.wpm * (p.accuracy / 100)
              }))
              .sort((a, b) => b.score - a.score);
            
            const winner = sortedPlayers[0];
            await update(ref(database, `customRooms/${roomCode}`), {
              status: 'finished',
              winner: winner.id
            });
          }
          // Show winner modal whenever status is finished
          setShowWinner(true);
        }
      } else {
        alert('Room tidak ditemukan!');
        router.push('/');
      }
    });

    inputRef.current?.focus();

    return () => unsubscribe();
  }, [roomCode, user, router]);

  // Reset local state when room status changes to 'waiting' (play again)
  useEffect(() => {
    if (room && room.status === 'waiting') {
      setUserInput('');
      setIsStarted(false);
      setStartTime(0);
      setShowWinner(false);
      inputRef.current?.focus();
    }
  }, [room?.status]);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!room || !user) return;

    if (!isStarted && e.key !== 'Tab') {
      setIsStarted(true);
      const now = Date.now();
      setStartTime(now);
      
      // Save startTime to Firebase
      await update(ref(database, `customRooms/${roomCode}/players/${user.uid}`), {
        startTime: now
      });

      // Update room status to playing if still waiting
      if (room.status === 'waiting') {
        await update(ref(database, `customRooms/${roomCode}`), {
          status: 'playing'
        });
      }
    }

    playKeySound();
    
    setPressedKey(e.key);
    setTimeout(() => setPressedKey(''), 100);
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!room || !user) return;
    
    const input = e.target.value;
    setUserInput(input);

    // Get current player data
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

    await update(ref(database, `customRooms/${roomCode}/players/${user.uid}`), updateData);
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/room/${roomCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayAgain = async () => {
    if (!room || !user) return;
    
    // Only room owner can restart
    if (room.createdBy !== (user.displayName || user.email)) {
      alert('Hanya room owner yang bisa restart!');
      return;
    }

    // Reset room state
    const newText = getRandomText();
    const resetPlayers: { [key: string]: any } = {};
    
    Object.values(room.players).forEach((player: any) => {
      resetPlayers[player.id] = {
        id: player.id,
        name: player.name,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        isFinished: false,
      };
    });

    await update(ref(database, `customRooms/${roomCode}`), {
      text: newText,
      status: 'waiting',
      players: resetPlayers,
      winner: null,
    });

    // Reset local state
    setUserInput('');
    setIsStarted(false);
    setStartTime(0);
    setShowWinner(false);
    inputRef.current?.focus();
  };

  const renderText = () => {
    if (!room) return null;

    return room.text.split('').map((char, index) => {
      let className = 'text-3xl font-mono transition-all duration-75 ';
      
      if (index < userInput.length) {
        className += userInput[index] === char 
          ? 'text-yellow-400' 
          : 'text-red-500 bg-red-500/20 rounded';
      } else if (index === userInput.length) {
        className += 'text-gray-300 bg-yellow-500/30 border-l-2 border-yellow-500';
      } else {
        className += 'text-gray-600';
      }
      
      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

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
              <FontAwesomeIcon icon={faUsers} /> Room: {roomCode}
            </h1>
            <button
              onClick={copyRoomLink}
              className="text-gray-500 hover:text-yellow-400 transition-colors flex items-center gap-2 text-sm mx-auto mt-1"
            >
              <FontAwesomeIcon icon={faLink} />
              <span>{copied ? 'Link Copied!' : 'Share Room'}</span>
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSound}
              className={`text-sm font-medium transition-colors flex items-center gap-2 ${
                soundEnabled ? 'text-yellow-500 hover:text-yellow-400' : 'text-gray-500 hover:text-gray-400'
              }`}
              title={soundEnabled ? 'Sound On' : 'Sound Off'}
            >
              <span>{soundEnabled ? '≡ƒöè' : '≡ƒöç'}</span>
            </button>
            <div className="text-gray-500 text-sm">
              {room ? Object.keys(room.players || {}).length : 0} Player{(room && Object.keys(room.players || {}).length > 1) ? 's' : ''}
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
              <div className="text-yellow-500 text-3xl font-bold">{room?.players[user?.uid || '']?.wpm || 0}</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <div className="text-gray-500 text-xs mb-1">accuracy</div>
              <div className="text-yellow-500 text-3xl font-bold">{room?.players[user?.uid || '']?.accuracy || 100}%</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <div className="text-gray-500 text-xs mb-1">progress</div>
              <div className="text-yellow-500 text-3xl font-bold">
                {Math.floor((userInput.length / (room?.text.length || 1)) * 100)}%
              </div>
            </div>
          </div>

          {/* Text Display */}
          <div className="mb-8">
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
              disabled={room?.players[user?.uid || '']?.isFinished}
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
              <FontAwesomeIcon icon={faUsers} /> Players
            </h3>
            <div className="space-y-3">
              {room && Object.values(room.players || {})
                .map((p: any) => ({
                  ...p,
                  score: p.wpm * (p.accuracy / 100)
                }))
                .sort((a: any, b: any) => {
                  if (a.isFinished && b.isFinished) return b.score - a.score;
                  if (a.isFinished) return -1;
                  if (b.isFinished) return 1;
                  return b.progress - a.progress;
                }).map((player: any, index: number) => (
                <div
                  key={player.id}
                  className={`p-3 rounded-lg transition-all ${
                    player.id === user?.uid
                      ? 'bg-yellow-500/20 border border-yellow-500/50'
                      : 'bg-gray-700/30 border border-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {index === 0 && player.isFinished && (
                        <FontAwesomeIcon icon={faCrown} className="text-yellow-500 text-sm" />
                      )}
                      <span className={`text-xs font-bold ${
                        player.id === user?.uid ? 'text-yellow-500' : 'text-gray-500'
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
                        player.id === user?.uid
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

      {/* Winner Modal */}
      {showWinner && room && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 border-2 border-yellow-500/50 shadow-2xl">
            <div className="text-center">
              <div className="mb-4">
                <FontAwesomeIcon icon={faTrophy} className="text-yellow-500 text-6xl" />
              </div>
              <h2 className="text-3xl font-bold text-yellow-500 mb-2">Game Selesai!</h2>
              
              {(() => {
                const sortedPlayers = Object.values(room.players)
                  .filter((p: any) => p.isFinished)
                  .map((p: any) => ({
                    ...p,
                    score: p.wpm * (p.accuracy / 100)
                  }))
                  .sort((a: any, b: any) => b.score - a.score);
                const winner = sortedPlayers[0] as any;
                
                return (
                  <>
                    <p className="text-gray-300 text-lg mb-6">
                      Pemenang: <span className="text-yellow-500 font-bold">{winner?.name}</span>
                    </p>
                    
                    <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">WPM</div>
                          <div className="text-yellow-500 text-2xl font-bold">{winner?.wpm}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Accuracy</div>
                          <div className="text-yellow-500 text-2xl font-bold">{winner?.accuracy}%</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Score</div>
                          <div className="text-yellow-500 text-2xl font-bold">{Math.round(winner?.score || 0)}</div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className="space-y-3">
                {room.createdBy === (user?.displayName || user?.email) && (
                  <button
                    onClick={handlePlayAgain}
                    className="w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faRotateRight} /> Main Lagi
                  </button>
                )}
                <button
                  onClick={() => router.push('/')}
                  className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Kembali ke Home
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
