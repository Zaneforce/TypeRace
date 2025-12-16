'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/lib/firebase';
import { ref, onValue, update, get, remove, set, push } from 'firebase/database';
import VirtualKeyboard from '@/components/VirtualKeyboard';
import { useKeyboardSound } from '@/hooks/useKeyboardSound';
import { calculateWPM, calculateAccuracy, getRandomText } from '@/utils/textUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faUsers, faLink, faCheckCircle, faUser, faCrown, faTrophy, faRotateRight, faVolumeHigh, faVolumeXmark, faGamepad, faRocket, faClock, faFileAlt, faSkull, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { TypingSession, UserStats } from '@/types/stats';

interface PlayerData {
  id: string;
  name: string;
  progress: number;
  wpm: number;
  accuracy: number;
  isFinished: boolean;
  finishTime?: number;
  startTime?: number;
  completedWords?: number;
}

interface RoomData {
  code: string;
  name: string;
  text: string;
  language?: 'en' | 'id';
  status: 'waiting' | 'playing' | 'finished';
  players: { [key: string]: PlayerData };
  maxPlayers: number;
  mode: 'time' | 'words' | 'sudden-death';
  timeLimit: number;
  wordLimit: number;
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
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasJoinedRef = useRef(false);
  
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
      hasJoinedRef.current = true;
    };

    joinRoom();

    // Listen to room changes
    const unsubscribe = onValue(roomRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Check if current user has been kicked (not in players list)
        // Only check after user has successfully joined
        if (hasJoinedRef.current && (!data.players || !data.players[user.uid])) {
          alert('Anda telah di-kick dari room!');
          router.push('/');
          return;
        }
        
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
      setTimeLeft(room.timeLimit);
      setShowWinner(false);
      inputRef.current?.focus();
    }
  }, [room?.status, room?.timeLimit]);

  // Timer for time mode
  useEffect(() => {
    if (room?.mode === 'time' && room.status === 'playing' && isStarted) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time's up - finish the game
            handleFinishGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [room?.mode, room?.status, isStarted]);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  const handleStartGame = async () => {
    if (!room || !user || room.createdBy !== user.uid) return;
    
    await update(ref(database, `customRooms/${roomCode}`), {
      status: 'playing'
    });
  };

  const handleFinishGame = async () => {
    if (!room || !user) return;
    
    await update(ref(database, `customRooms/${roomCode}/players/${user.uid}`), {
      isFinished: true,
      finishTime: Date.now()
    });

    // Save session to Firebase
    await saveSession();
  };

  // Save session to Firebase
  const saveSession = async () => {
    if (!user || !room) return;

    const currentPlayerData = room.players[user.uid];
    if (!currentPlayerData) return;

    const playerStartTime = startTime || currentPlayerData.startTime;
    if (!playerStartTime) return;

    const duration = Math.floor((Date.now() - playerStartTime) / 1000);
    const wordCount = userInput.trim().split(/\s+/).length;

    const session: TypingSession = {
      id: Date.now().toString(),
      userId: user.uid,
      wpm: Math.round(currentPlayerData.wpm),
      accuracy: Math.round(currentPlayerData.accuracy),
      mode: room.mode,
      duration: duration,
      wordCount: wordCount,
      timestamp: Date.now(),
      roomType: 'custom'
    };

    try {
      // Save session
      const sessionRef = push(ref(database, `sessions/${user.uid}`));
      await set(sessionRef, session);

      // Update user stats
      const statsRef = ref(database, `userStats/${user.uid}`);
      const statsSnapshot = await get(statsRef);
      const currentStats = statsSnapshot.val() as UserStats | null;

      if (currentStats) {
        // Update existing stats
        const sessions = currentStats.sessions || [];
        sessions.push(session);
        
        const totalTests = sessions.length;
        const totalWpm = sessions.reduce((sum, s) => sum + s.wpm, 0);
        const totalAcc = sessions.reduce((sum, s) => sum + s.accuracy, 0);
        const bestWpm = Math.max(...sessions.map(s => s.wpm));
        const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);

        await update(statsRef, {
          totalTests,
          averageWpm: Math.round(totalWpm / totalTests),
          bestWpm,
          averageAccuracy: Math.round(totalAcc / totalTests),
          totalTimeTyping: totalTime,
          lastPlayed: Date.now(),
          sessions
        });
      } else {
        // Create new stats
        const newStats: UserStats = {
          userId: user.uid,
          username: user.displayName || user.email || 'Anonymous',
          totalTests: 1,
          averageWpm: Math.round(currentPlayerData.wpm),
          bestWpm: Math.round(currentPlayerData.wpm),
          averageAccuracy: Math.round(currentPlayerData.accuracy),
          totalTimeTyping: duration,
          lastPlayed: Date.now(),
          sessions: [session]
        };
        await set(statsRef, newStats);
      }

      // Update leaderboard (both daily and all-time)
      const leaderboardEntry = {
        userId: user.uid,
        username: user.displayName || user.email || 'Anonymous',
        wpm: Math.round(currentPlayerData.wpm),
        accuracy: Math.round(currentPlayerData.accuracy),
        wordCount: wordCount,
        timestamp: Date.now()
      };

      // Save to daily leaderboard
      const dailyRef = push(ref(database, 'leaderboard/daily'));
      await set(dailyRef, leaderboardEntry);

      // Update all-time leaderboard (only if it's a new personal best)
      if (!currentStats || Math.round(currentPlayerData.wpm) >= currentStats.bestWpm) {
        const allTimeRef = push(ref(database, 'leaderboard/alltime'));
        await set(allTimeRef, leaderboardEntry);
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!room || !user) return;

    // Only allow typing when game is playing
    if (room.status !== 'playing') {
      e.preventDefault();
      return;
    }

    if (!isStarted && e.key !== 'Tab') {
      setIsStarted(true);
      const now = Date.now();
      setStartTime(now);
      
      // Save startTime to Firebase
      await update(ref(database, `customRooms/${roomCode}/players/${user.uid}`), {
        startTime: now
      });
    }

    playKeySound();
    
    setPressedKey(e.key);
    setTimeout(() => setPressedKey(''), 100);
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!room || !user) return;
    
    const input = e.target.value;
    
    // Sudden Death mode: Game over on first mistake
    if (room.mode === 'sudden-death' && input.length > userInput.length) {
      const nextChar = room.text[userInput.length];
      const typedChar = input[input.length - 1];
      
      if (typedChar !== nextChar) {
        // Wrong character - instant game over
        await handleFinishGame();
        return;
      }
    }
    
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

    // Check finish condition based on mode
    const isFinished = room.mode === 'words'
      ? input.length >= room.text.length
      : false; // In time mode and sudden death, finish is controlled by timer or mistakes

    // Update player in Firebase
    const updateData: any = {
      progress,
      wpm,
      accuracy,
      isFinished,
    };
    
    // Track completed words in sudden death mode
    if (room.mode === 'sudden-death') {
      const completedWords = input.trim().split(/\s+/).filter(w => w.length > 0).length;
      updateData.completedWords = completedWords;
    }

    // Only add finishTime if the player just finished
    if (isFinished && !room.players[user.uid]?.isFinished) {
      updateData.finishTime = Date.now();
      
      // Save session when player finishes
      setTimeout(() => saveSession(), 100);
    }

    await update(ref(database, `customRooms/${roomCode}/players/${user.uid}`), updateData);
    
    // Auto-generate more text in time mode and sudden death mode when any player is close to finishing
    if ((room.mode === 'time' || room.mode === 'sudden-death') && room.status === 'playing' && room.createdBy === user.uid) {
      const progressRatio = input.length / room.text.length;
      // When any player has typed 80% of the text, add more text
      if (progressRatio > 0.8) {
        const roomLanguage = room.language || 'en';
        const newText = room.text + ' ' + getRandomText(100, roomLanguage);
        await update(ref(database, `customRooms/${roomCode}`), {
          text: newText
        });
      }
    }
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/room/${roomCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKickPlayer = async (playerId: string) => {
    if (!room || !user) return;
    
    // Only room creator can kick players
    if (room.createdBy !== user.uid) {
      alert('Hanya room owner yang bisa kick player!');
      return;
    }

    // Cannot kick yourself
    if (playerId === user.uid) {
      alert('Anda tidak bisa kick diri sendiri!');
      return;
    }

    if (confirm(`Kick player ${room.players[playerId]?.name}?`)) {
      try {
        await remove(ref(database, `customRooms/${roomCode}/players/${playerId}`));
      } catch (error) {
        console.error('Error kicking player:', error);
        alert('Gagal kick player!');
      }
    }
  };

  const handlePlayAgain = async () => {
    if (!room || !user) return;
    
    // Only room owner can restart
    if (room.createdBy !== user.uid) {
      alert('Hanya room owner yang bisa restart!');
      return;
    }

    // Reset room state
    const wordCount = room.mode === 'time' ? 200 : 
                     room.mode === 'sudden-death' ? 200 : 
                     Math.max(room.wordLimit, 100);
    const roomLanguage = room.language || 'en';
    const newText = getRandomText(wordCount, roomLanguage);
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
    setTimeLeft(room.timeLimit);
    setShowWinner(false);
    inputRef.current?.focus();
  };

  const renderText = () => {
    if (!room) return null;

    const words = room.text.split(' ');
    const CHARS_PER_LINE = 45; // Approximate characters per line
    
    // Build lines by fitting words
    const lines: string[][] = [[]];
    let currentLineLength = 0;
    let lineIndex = 0;
    
    words.forEach((word, wordIdx) => {
      const wordWithSpace = wordIdx < words.length - 1 ? word + ' ' : word;
      const wordLength = wordWithSpace.length;
      
      if (currentLineLength + wordLength > CHARS_PER_LINE && currentLineLength > 0) {
        // Start new line
        lineIndex++;
        lines[lineIndex] = [];
        currentLineLength = 0;
      }
      
      lines[lineIndex].push(wordWithSpace);
      currentLineLength += wordLength;
    });
    
    // Calculate which line the user is currently on
    let charsSoFar = 0;
    let currentLine = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i].join('');
      if (charsSoFar + lineText.length > userInput.length) {
        currentLine = i;
        break;
      }
      charsSoFar += lineText.length;
    }
    
    // Always show 3 lines with typing line in the middle
    const startLine = currentLine === 0 ? 0 : currentLine - 1;
    
    // Show 3 lines (with enough text generated, there will always be lines)
    const visibleLines = lines.slice(startLine, startLine + 3);
    
    // Calculate character offset for the visible portion
    let charOffset = 0;
    for (let i = 0; i < startLine; i++) {
      charOffset += lines[i].join('').length;
    }
    
    return (
      <div>
        {visibleLines.map((line, lineIdx) => {
          if (!line || line.length === 0) return null;
          const lineText = line.join('');
          const lineStartChar = charOffset + (lineIdx > 0 ? visibleLines.slice(0, lineIdx).reduce((acc, l) => acc + (l?.join('').length || 0), 0) : 0);
          
          return (
            <div key={startLine + lineIdx} style={{ minHeight: '3.6rem' }}>
              {lineText.split('').map((char, charIdx) => {
                const actualIndex = lineStartChar + charIdx;
                let className = 'text-3xl typing-char ';
                
                if (actualIndex < userInput.length) {
                  className += userInput[actualIndex] === char 
                    ? 'text-yellow-400' 
                    : 'text-red-400 bg-red-900/30 rounded px-0.5';
                } else if (actualIndex === userInput.length) {
                  className += 'text-gray-200 typing-caret bg-yellow-500/30 border-l-2 border-yellow-400';
                } else {
                  className += 'text-gray-500';
                }
                
                return (
                  <span key={actualIndex} className={className}>
                    {char}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    );
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
              <FontAwesomeIcon icon={faUsers} /> {room?.name || 'Room'}
            </h1>
            <div className="text-gray-500 text-sm mt-1">
              Code: {roomCode}
            </div>
            <button
              onClick={copyRoomLink}
              className="text-gray-500 hover:text-yellow-400 transition-colors flex items-center gap-2 text-xs mx-auto mt-1"
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
              <FontAwesomeIcon icon={soundEnabled ? faVolumeHigh : faVolumeXmark} />
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
          {/* Waiting Lobby */}
          {room?.status === 'waiting' && (
            <div className="bg-gray-800/50 border-2 border-yellow-500/30 rounded-xl p-8 mb-8 text-center">
              <h2 className="text-3xl font-bold text-yellow-500 mb-4 flex items-center justify-center gap-3">
                <FontAwesomeIcon icon={faGamepad} /> Waiting for Players...
              </h2>
              <p className="text-gray-400 mb-6">
                {room.createdBy === user?.uid 
                  ? 'Anda adalah host! Klik tombol Start ketika semua player sudah siap.'
                  : 'Menunggu host untuk memulai permainan...'}
              </p>
              
              {/* Language Selector */}
              {room.createdBy === user?.uid ? (
                <div className="mb-6">
                  <label className="block text-white font-semibold mb-2 text-center">
                    Bahasa Kata (Text Language)
                  </label>
                  <div className="relative max-w-md mx-auto">
                    <button
                      type="button"
                      onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                      className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white border-2 border-yellow-500 rounded-lg px-4 py-3 pr-10 font-bold text-center focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all shadow-lg hover:shadow-xl hover:from-yellow-500 hover:to-orange-500 cursor-pointer"
                    >
                      {room.language === 'id' ? '🇮🇩 Bahasa Indonesia' : '🇬🇧 English'}
                    </button>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white">
                      <svg className={`w-5 h-5 transition-transform ${languageDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {languageDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-gray-800 border-2 border-yellow-500/50 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <button
                          type="button"
                          onClick={async () => {
                            const newLanguage = 'id';
                            const wordCount = room.mode === 'words' ? Math.max(room.wordLimit, 100) : 
                                             room.mode === 'sudden-death' ? 100 : 200;
                            await update(ref(database, `customRooms/${roomCode}`), { 
                              language: newLanguage,
                              text: getRandomText(wordCount, newLanguage)
                            });
                            setLanguageDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left font-bold transition-all flex items-center gap-2 ${
                            room.language === 'id'
                              ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white'
                              : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          🇮🇩 Bahasa Indonesia
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const newLanguage = 'en';
                            const wordCount = room.mode === 'words' ? Math.max(room.wordLimit, 100) : 
                                             room.mode === 'sudden-death' ? 100 : 200;
                            await update(ref(database, `customRooms/${roomCode}`), { 
                              language: newLanguage,
                              text: getRandomText(wordCount, newLanguage)
                            });
                            setLanguageDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left font-bold transition-all flex items-center gap-2 ${
                            room.language === 'en'
                              ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white'
                              : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          🇬🇧 English
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 mb-6 max-w-md mx-auto">
                  <div className="flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faGlobe} className="text-yellow-500" />
                    <span className="text-gray-300 font-semibold">
                      {room.language === 'id' ? '🇮🇩 Bahasa Indonesia' : '🇬🇧 English'}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Mode Settings - Only for host */}
              {room.createdBy === user?.uid && (
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Mode Permainan
                    </label>
                    <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                      <button
                        type="button"
                        onClick={async () => {
                          await update(ref(database, `customRooms/${roomCode}`), { mode: 'time' });
                        }}
                        className={`py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                          room.mode === 'time'
                            ? 'bg-yellow-600 text-white border-2 border-yellow-400'
                            : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <FontAwesomeIcon icon={faClock} /> Waktu
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await update(ref(database, `customRooms/${roomCode}`), { mode: 'words' });
                        }}
                        className={`py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                          room.mode === 'words'
                            ? 'bg-yellow-600 text-white border-2 border-yellow-400'
                            : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <FontAwesomeIcon icon={faFileAlt} /> Kata
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await update(ref(database, `customRooms/${roomCode}`), { mode: 'sudden-death' });
                        }}
                        className={`py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                          room.mode === 'sudden-death'
                            ? 'bg-red-600 text-white border-2 border-red-400'
                            : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:border-gray-500'
                        }`}
                        title="One mistake = Game Over"
                      >
                        <FontAwesomeIcon icon={faSkull} /> Sudden Death
                      </button>
                    </div>
                  </div>

                  {/* Mode Value Settings */}
                  {room.mode === 'time' ? (
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        Durasi: {room.timeLimit} detik
                      </label>
                      <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
                        {[15, 30, 60, 120].map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={async () => {
                              const roomLanguage = room.language || 'en';
                              await update(ref(database, `customRooms/${roomCode}`), { 
                                timeLimit: time,
                                text: getRandomText(200, roomLanguage) 
                              });
                            }}
                            className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                              room.timeLimit === time
                                ? 'bg-yellow-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {time}s
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : room.mode === 'words' ? (
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        Jumlah Kata: {room.wordLimit}
                      </label>
                      <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
                        {[25, 50, 100, 200].map((words) => (
                          <button
                            key={words}
                            type="button"
                            onClick={async () => {
                              const roomLanguage = room.language || 'en';
                              await update(ref(database, `customRooms/${roomCode}`), { 
                                wordLimit: words,
                                text: getRandomText(Math.max(words, 100), roomLanguage) 
                              });
                            }}
                            className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                              room.wordLimit === words
                                ? 'bg-yellow-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {words}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-red-200 text-sm text-center">
                        <span className="font-semibold">Sudden Death:</span> Ketik sebanyak mungkin kata tanpa kesalahan. Satu karakter salah = Game Over!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Current Settings Display */}
              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-2">Game Settings:</div>
                <div className="flex gap-4 justify-center">
                  <div className="bg-gray-700/50 px-4 py-2 rounded-lg">
                    <span className="text-gray-400">Mode: </span>
                    <span className="text-yellow-400 font-semibold">
                      {room.mode === 'time' ? `${room.timeLimit}s` : 
                       room.mode === 'sudden-death' ? '♾️ Unlimited' : 
                       `${room.wordLimit} words`}
                    </span>
                  </div>
                  <div className="bg-gray-700/50 px-4 py-2 rounded-lg">
                    <span className="text-gray-400">Players: </span>
                    <span className="text-yellow-400 font-semibold">
                      {Object.keys(room.players || {}).length}/{room.maxPlayers}
                    </span>
                  </div>
                </div>
              </div>

              {room.createdBy === user?.uid && (
                <button
                  onClick={handleStartGame}
                  disabled={Object.keys(room.players || {}).length < 1}
                  className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed text-lg flex items-center gap-2 mx-auto"
                >
                  <FontAwesomeIcon icon={faRocket} /> Start Game
                </button>
              )}
            </div>
          )}

          {/* Game UI - Only show when playing or finished */}
          {(room?.status === 'playing' || room?.status === 'finished') && (
            <>
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
                  <div className="text-gray-500 text-xs mb-1">
                    {room.mode === 'time' ? 'time left' : 'progress'}
                  </div>
                  <div className="text-yellow-500 text-3xl font-bold">
                    {room.mode === 'time' 
                      ? `${timeLeft}s`
                      : `${Math.floor((userInput.length / (room?.text.length || 1)) * 100)}%`}
                  </div>
                </div>
              </div>

              {/* Text Display */}
              <div className="mb-8 mt-16">
                <div 
                  className="text-left px-4 max-w-4xl mx-auto overflow-hidden cursor-text"
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
                    position: 'relative',
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
                  disabled={room?.players[user?.uid || '']?.isFinished || room?.status !== 'playing'}
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
            </>
          )}
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
                  // In sudden death mode, sort by completed words count
                  if (room.mode === 'sudden-death') {
                    return (b.completedWords || 0) - (a.completedWords || 0);
                  }
                  // Normal modes: sort by completion and score
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
                      {player.id === room.createdBy && (
                        <FontAwesomeIcon icon={faCrown} className="text-yellow-500 text-xs" title="Room Owner" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {player.isFinished && (
                        <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-sm" />
                      )}
                      {room.createdBy === user?.uid && player.id !== user?.uid && room.status === 'waiting' && (
                        <button
                          onClick={() => handleKickPlayer(player.id)}
                          className="text-red-500 hover:text-red-400 transition-colors text-xs px-2 py-1 rounded hover:bg-red-500/10"
                          title="Kick Player"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>{player.wpm} wpm</span>
                    {room.mode === 'sudden-death' ? (
                      <span className="text-green-400">{player.completedWords || 0} words</span>
                    ) : (
                      <span>{Math.floor(player.progress)}%</span>
                    )}
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-2xl w-full mx-4 border-2 border-yellow-500/50 shadow-2xl">
            <div className="text-center">
              <div className="mb-6">
                <FontAwesomeIcon icon={faTrophy} className="text-yellow-500 text-6xl" />
              </div>
              <h2 className="text-3xl font-bold text-yellow-500 mb-8">Game Selesai!</h2>
              
              {(() => {
                const sortedPlayers = Object.values(room.players)
                  .filter((p: any) => p.isFinished)
                  .map((p: any) => ({
                    ...p,
                    score: p.wpm * (p.accuracy / 100)
                  }))
                  .sort((a: any, b: any) => b.score - a.score);
                
                const topThree = sortedPlayers.slice(0, 3);
                
                return (
                  <>
                    {/* Podium Display */}
                    <div className="flex items-end justify-center gap-6 mb-10">
                      {/* 2nd Place */}
                      {topThree[1] && (
                        <div className="flex flex-col items-center">
                          <div className="text-4xl mb-3">🥈</div>
                          <div className="bg-gradient-to-b from-gray-600 to-gray-700 rounded-t-lg p-5 w-32 text-center border-2 border-gray-500">
                            <div className="text-white font-bold text-sm mb-2">{topThree[1].name}</div>
                            <div className="text-gray-300 text-xs mb-1">{topThree[1].wpm} WPM</div>
                            <div className="text-gray-400 text-xs">{topThree[1].accuracy}%</div>
                          </div>
                          <div className="bg-gray-600 w-32 h-20 rounded-b-lg flex items-center justify-center">
                            <span className="text-white font-bold text-2xl">2</span>
                          </div>
                        </div>
                      )}
                      
                      {/* 1st Place */}
                      {topThree[0] && (
                        <div className="flex flex-col items-center -mt-8">
                          <div className="text-5xl mb-3">🏆</div>
                          <div className="bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-t-lg p-6 w-36 text-center border-2 border-yellow-400">
                            <div className="text-gray-900 font-bold mb-2">{topThree[0].name}</div>
                            <div className="text-gray-800 text-sm mb-1">{topThree[0].wpm} WPM</div>
                            <div className="text-gray-700 text-sm">{topThree[0].accuracy}%</div>
                          </div>
                          <div className="bg-yellow-600 w-36 h-28 rounded-b-lg flex items-center justify-center">
                            <span className="text-white font-bold text-3xl">1</span>
                          </div>
                        </div>
                      )}
                      
                      {/* 3rd Place */}
                      {topThree[2] && (
                        <div className="flex flex-col items-center">
                          <div className="text-4xl mb-3">🥉</div>
                          <div className="bg-gradient-to-b from-orange-700 to-orange-800 rounded-t-lg p-5 w-32 text-center border-2 border-orange-600">
                            <div className="text-white font-bold text-sm mb-2">{topThree[2].name}</div>
                            <div className="text-orange-200 text-xs mb-1">{topThree[2].wpm} WPM</div>
                            <div className="text-orange-300 text-xs">{topThree[2].accuracy}%</div>
                          </div>
                          <div className="bg-orange-700 w-32 h-16 rounded-b-lg flex items-center justify-center">
                            <span className="text-white font-bold text-2xl">3</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* All Players Ranking */}
                    {sortedPlayers.length > 3 && (
                      <div className="bg-gray-700/50 rounded-lg p-5 mb-6 max-h-48 overflow-y-auto">
                        <div className="text-gray-400 text-xs mb-3">Ranking Lengkap:</div>
                        {sortedPlayers.slice(3).map((player: any, idx: number) => (
                          <div key={player.id} className="flex justify-between items-center py-2 border-b border-gray-600 last:border-0">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 font-bold">#{idx + 4}</span>
                              <span className="text-white text-sm">{player.name}</span>
                            </div>
                            <div className="flex gap-4 text-xs">
                              <span className="text-yellow-400">{player.wpm} WPM</span>
                              <span className="text-gray-400">{player.accuracy}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="space-y-4 mt-8">
                {room.createdBy === user?.uid && (
                  <button
                    onClick={handlePlayAgain}
                    className="w-full px-6 py-4 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faRotateRight} /> Main Lagi
                  </button>
                )}
                <button
                  onClick={() => router.push('/')}
                  className="w-full px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
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
