'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import VirtualKeyboard from '@/components/VirtualKeyboard';
import { useKeyboardSound } from '@/hooks/useKeyboardSound';
import { useTypingStore } from '@/store/typingStore';
import { getRandomText } from '@/utils/textUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faRotateRight, faVolumeHigh, faVolumeXmark, faSkull, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { database } from '@/lib/firebase';
import { ref, push, set, get, update } from 'firebase/database';
import { TypingSession, UserStats } from '@/types/stats';

type Mode = 'time' | 'words' | 'sudden-death';
type TimeOption = 15 | 30 | 60 | 120;
type WordsOption = 10 | 25 | 50 | 100;

export default function PracticePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { playKeySound, soundEnabled, toggleSound } = useKeyboardSound();
  const [pressedKey, setPressedKey] = useState('');
  const [nextKey, setNextKey] = useState('');
  const [mode, setMode] = useState<Mode>('time');
  const [timeLimit, setTimeLimit] = useState<TimeOption>(30);
  const [wordLimit, setWordLimit] = useState<WordsOption>(25);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [startTime, setStartTime] = useState<number>(0);
  const [suddenDeathWordCount, setSuddenDeathWordCount] = useState<number>(50);
  const [completedWords, setCompletedWords] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs to store latest values for saveSession
  const userInputRef = useRef<string>('');
  const currentTextRef = useRef<string>('');
  const startTimeRef = useRef<number>(0);
  
  const {
    currentText,
    userInput,
    stats,
    isStarted,
    isFinished,
    setCurrentText,
    setUserInput,
    startTyping,
    finishTyping,
    resetTyping,
  } = useTypingStore();

  // Update refs whenever values change
  useEffect(() => {
    userInputRef.current = userInput;
    currentTextRef.current = currentText;
    startTimeRef.current = startTime;
  }, [userInput, currentText, startTime]);

  useEffect(() => {
    const wordCount = mode === 'words' ? Math.max(wordLimit, 50) : 100;
    setCurrentText(getRandomText(wordCount, language));
    inputRef.current?.focus();
  }, [setCurrentText, mode, wordLimit, language]);

  // Save session to Firebase
  const saveSession = async (inputText?: string, textToCompare?: string, sessionStartTime?: number) => {
    if (!user) return;

    // Use passed parameters or current state
    const finalInput = inputText || userInput;
    const finalText = textToCompare || currentText;
    const finalStartTime = sessionStartTime || startTime;

    // Ensure we have valid data
    if (!finalInput || finalInput.length === 0) {
      console.warn('Cannot save session: userInput is empty');
      return;
    }

    if (!finalStartTime || finalStartTime === 0) {
      console.warn('Cannot save session: startTime is not set');
      return;
    }

    const duration = mode === 'time' ? timeLimit : Math.floor((Date.now() - finalStartTime) / 1000);
    
    // Calculate accurate word count and stats
    let correct = 0;
    let incorrect = 0;
    for (let i = 0; i < finalInput.length; i++) {
      if (finalInput[i] === finalText[i]) {
        correct++;
      } else {
        incorrect++;
      }
    }
    
    const totalChars = finalInput.length;
    const accuracy = totalChars > 0 ? (correct / totalChars) * 100 : 100;
    
    // Calculate WPM based on actual duration
    const timeElapsed = duration / 60; // in minutes
    const wordsTyped = correct / 5; // only count correct characters for WPM
    const wpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
    
    // Calculate actual word count (words that were typed correctly)
    const words = finalInput.trim().split(/\s+/);
    const targetWords = finalText.trim().split(/\s+/);
    let correctWords = 0;
    for (let i = 0; i < words.length && i < targetWords.length; i++) {
      if (words[i] === targetWords[i]) {
        correctWords++;
      }
    }
    const wordCount = correctWords;

    console.log('Saving practice session:', {
      wpm,
      accuracy: Math.round(accuracy),
      wordCount,
      duration,
      correct,
      totalChars,
      userInputLength: finalInput.length
    });

    const session: TypingSession = {
      id: Date.now().toString(),
      userId: user.uid,
      wpm: Math.max(wpm, 0), // Ensure WPM is not negative
      accuracy: Math.round(accuracy),
      mode: mode,
      duration: duration,
      wordCount: wordCount,
      timestamp: Date.now(),
      roomType: 'practice'
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
        const bestAcc = Math.max(...sessions.map(s => s.accuracy));
        const totalWords = sessions.reduce((sum, s) => sum + s.wordCount, 0);
        const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);

        await update(statsRef, {
          totalTests,
          averageWpm: Math.round(totalWpm / totalTests),
          bestWpm,
          averageAccuracy: Math.round(totalAcc / totalTests),
          bestAccuracy: Math.round(bestAcc),
          totalWords,
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
          averageWpm: wpm,
          bestWpm: wpm,
          averageAccuracy: Math.round(accuracy),
          bestAccuracy: Math.round(accuracy),
          totalWords: wordCount,
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
        wpm: wpm,
        accuracy: Math.round(accuracy),
        wordCount: wordCount,
        timestamp: Date.now()
      };

      // Save to daily leaderboard
      const dailyRef = push(ref(database, 'leaderboard/daily'));
      await set(dailyRef, leaderboardEntry);

      // Calculate competitive score
      const competitiveScore = wpm * (accuracy / 100) * Math.sqrt(wordCount);
      const currentBestScore = currentStats 
        ? currentStats.bestWpm * (currentStats.bestAccuracy || currentStats.averageAccuracy) / 100 * Math.sqrt(currentStats.totalWords || 0)
        : 0;

      // Update all-time leaderboard (only if it's a new competitive best)
      if (!currentStats || competitiveScore > currentBestScore) {
        const allTimeRef = push(ref(database, 'leaderboard/alltime'));
        await set(allTimeRef, leaderboardEntry);
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  useEffect(() => {
    if (mode === 'words') {
      if (userInput.length === currentText.length && currentText.length > 0) {
        // Capture current values BEFORE finishTyping
        const capturedInput = userInput;
        const capturedText = currentText;
        const capturedStartTime = startTime;
        finishTyping();
        saveSession(capturedInput, capturedText, capturedStartTime);
      }
    } else if (mode === 'sudden-death') {
      // Check if reached the end
      if (userInput.length === currentText.length && currentText.length > 0) {
        // Capture current values BEFORE finishTyping
        const capturedInput = userInput;
        const capturedText = currentText;
        const capturedStartTime = startTime;
        finishTyping();
        saveSession(capturedInput, capturedText, capturedStartTime);
      }
    }
    // In time mode, don't finish when text ends - just keep going with auto-generated text
  }, [userInput, currentText, finishTyping, mode, startTime]);

  // Timer for time mode
  useEffect(() => {
    if (mode === 'time' && isStarted && !isFinished) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Use refs to get the latest values
            const currentInput = userInputRef.current;
            const currentFullText = currentTextRef.current;
            const currentStart = startTimeRef.current;
            finishTyping();
            // Call saveSession with the captured values from refs
            saveSession(currentInput, currentFullText, currentStart);
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
  }, [mode, isStarted, isFinished, finishTyping]);

  useEffect(() => {
    if (userInput.length < currentText.length) {
      setNextKey(currentText[userInput.length]);
    } else {
      setNextKey('');
    }
    
    // Auto-generate more text in time mode and sudden death mode when user is close to finishing
    if ((mode === 'time' || mode === 'sudden-death') && isStarted && !isFinished) {
      const progress = userInput.length / currentText.length;
      // When user has typed 80% of the text, add more text
      if (progress > 0.8) {
        setCurrentText(currentText + ' ' + getRandomText(50, language));
      }
    }
  }, [userInput, currentText, mode, isStarted, isFinished, setCurrentText, language]);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Shortcut: Tab + Enter untuk restart
    if (e.key === 'Tab' && e.repeat === false) {
      e.preventDefault();
      handleRestart();
      return;
    }

    // Shortcut: Enter untuk next test (jika sudah selesai)
    if (e.key === 'Enter' && isFinished) {
      e.preventDefault();
      handleRestart();
      return;
    }

    if (!isStarted && e.key !== 'Tab') {
      startTyping();
      setStartTime(Date.now());
    }

    // Play sound
    playKeySound(e.key);
    
    // Update visual keyboard
    setPressedKey(e.key);
    setTimeout(() => setPressedKey(''), 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished) return;
    
    const input = e.target.value;
    
    // Sudden Death mode: Game over on first mistake
    if (mode === 'sudden-death' && input.length > userInput.length) {
      const nextChar = currentText[userInput.length];
      const typedChar = input[input.length - 1];
      
      if (typedChar !== nextChar) {
        // Wrong character - instant game over
        // Capture current values BEFORE finishTyping
        const capturedText = currentText;
        const capturedStartTime = startTime;
        finishTyping();
        // Save current input (the one with the mistake) before it changes
        saveSession(input, capturedText, capturedStartTime);
        return;
      }
      
      // Update completed words count (count spaces as word completion)
      if (typedChar === ' ') {
        setCompletedWords(prev => prev + 1);
      }
    }
    
    // Only allow typing the next character correctly (like Monkeytype)
    if (input.length > userInput.length) {
      // User is typing forward
      const nextChar = currentText[userInput.length];
      const typedChar = input[input.length - 1];
      
      // Always accept the input (even if wrong) but track it
      setUserInput(input);
    } else {
      // User is deleting
      setUserInput(input);
    }
  };

  const handleRestart = () => {
    resetTyping();
    setCompletedWords(0);
    let wordCount = 50;
    if (mode === 'words') wordCount = wordLimit;
    else if (mode === 'sudden-death') wordCount = 100; // Start with 100 words, will auto-generate more
    
    setCurrentText(getRandomText(wordCount, language));
    setTimeLeft(mode === 'time' ? timeLimit : 0);
    setStartTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    // Auto-focus input after small delay to ensure state is updated
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    resetTyping();
    setCompletedWords(0);
    let wordCount = 50;
    if (newMode === 'words') wordCount = wordLimit;
    else if (newMode === 'sudden-death') wordCount = 100; // Start with 100 words, will auto-generate more
    
    setCurrentText(getRandomText(wordCount, language));
    setTimeLeft(newMode === 'time' ? timeLimit : 0);
  };

  const handleTimeLimitChange = (time: TimeOption) => {
    setTimeLimit(time);
    setTimeLeft(time);
    resetTyping();
    setCurrentText(getRandomText(50, language));
  };

  const handleWordLimitChange = (words: WordsOption) => {
    setWordLimit(words);
    resetTyping();
    setCurrentText(getRandomText(words, language));
  };

  const renderText = () => {
    const words = currentText.split(' ');
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
    <main className="min-h-screen bg-[#1a1a1a] text-gray-300" onClick={() => inputRef.current?.focus()}>
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 hover:text-yellow-500 transition-colors flex items-center gap-2 text-sm font-medium mb-4"
          >
            <FontAwesomeIcon icon={faHome} />
            <span>Home</span>
          </button>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-yellow-500">
              Practice Mode
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
                className="text-gray-500 hover:text-yellow-500 transition-colors flex items-center gap-2 text-sm font-medium"
                title={language === 'en' ? 'Switch to Indonesian' : 'Switch to English'}
              >
                <FontAwesomeIcon icon={faGlobe} />
                <span className="uppercase">{language}</span>
              </button>
              <button
                onClick={toggleSound}
              className={`text-sm font-medium transition-colors flex items-center gap-2 ${
                soundEnabled ? 'text-yellow-500 hover:text-yellow-400' : 'text-gray-500 hover:text-gray-400'
              }`}
              title={soundEnabled ? 'Sound On' : 'Sound Off'}
            >
              <FontAwesomeIcon icon={soundEnabled ? faVolumeHigh : faVolumeXmark} />
            </button>
            <button
              onClick={handleRestart}
              className="text-gray-500 hover:text-yellow-500 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <FontAwesomeIcon icon={faRotateRight} />
              <span>Restart</span>
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Stats */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <div className="text-gray-500 text-xs mb-1">wpm</div>
              <div className="text-yellow-500 text-3xl font-bold">{stats?.wpm || 0}</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <div className="text-gray-500 text-xs mb-1">accuracy</div>
              <div className="text-yellow-500 text-3xl font-bold">{stats?.accuracy || 100}%</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <div className="text-gray-500 text-xs mb-1">
                {mode === 'time' ? 'time left' : mode === 'sudden-death' ? 'words completed' : 'progress'}
              </div>
              <div className={`text-3xl font-bold ${mode === 'sudden-death' ? 'text-green-500' : 'text-yellow-500'}`}>
                {mode === 'time' 
                  ? `${timeLeft}s` 
                  : mode === 'sudden-death'
                  ? (
                    <span className="flex items-center justify-center gap-2">
                      {completedWords}
                    </span>
                  )
                  : `${userInput.length}/${currentText.length}`}
              </div>
            </div>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-8 mb-4">
            {/* Mode Toggle */}
            <div className="flex gap-2 bg-gray-800/50 p-1 rounded-lg">
              <button
                onClick={() => handleModeChange('time')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'time' 
                    ? 'bg-yellow-500 text-gray-900' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                time
              </button>
              <button
                onClick={() => handleModeChange('words')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'words' 
                    ? 'bg-yellow-500 text-gray-900' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                words
              </button>
              <button
                onClick={() => handleModeChange('sudden-death')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  mode === 'sudden-death' 
                    ? 'bg-red-500 text-white' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                title="One mistake = Game Over"
              >
                <FontAwesomeIcon icon={faSkull} /> sudden death
              </button>
            </div>

            {/* Options */}
            <div className="flex gap-2">
              {mode === 'time' ? (
                <>
                  {[15, 30, 60, 120].map((time) => (
                    <button
                      key={time}
                      onClick={() => handleTimeLimitChange(time as TimeOption)}
                      disabled={isStarted}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        timeLimit === time
                          ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50'
                          : 'text-gray-500 hover:text-gray-300'
                      } ${isStarted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {time}
                    </button>
                  ))}
                </>
              ) : mode === 'words' ? (
                <>
                  {[10, 25, 50, 100].map((words) => (
                    <button
                      key={words}
                      onClick={() => handleWordLimitChange(words as WordsOption)}
                      disabled={isStarted}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        wordLimit === words
                          ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50'
                          : 'text-gray-500 hover:text-gray-300'
                      } ${isStarted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {words}
                    </button>
                  ))}
                </>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  Type as many words as you can without mistakes!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Text Display */}
        <div className="mb-8 mt-16">
          {!isStarted && (
            <div className="text-center mb-6 space-y-2">
              <div className="text-gray-600 text-sm animate-pulse">
                Start typing to begin...
              </div>
              <div className="text-xs text-gray-500">
                <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">Tab + Enter</kbd> to restart
              </div>
            </div>
          )}
          
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
        </div>

        {/* Hidden Input (capture typing) */}
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={isFinished}
          className="absolute opacity-0 w-0 h-0"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          inputMode="text"
        />

        {/* Result */}
        {isFinished && stats && (
          <div className="text-center mb-8">
            <div className="inline-block bg-gray-800/50 border border-gray-700 rounded-xl p-8">
              <div className="text-4xl font-bold text-yellow-500 mb-2">
                {stats.wpm} WPM
              </div>
              <div className="text-gray-400">
                Akurasi: <span className="text-yellow-500 font-semibold">{stats.accuracy}%</span>
              </div>
              <div className="mt-4 space-y-2">
                <button
                  onClick={handleRestart}
                  className="w-full px-6 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-lg transition-colors"
                >
                  Next Test
                </button>
                <div className="text-xs text-gray-500">
                  Press <kbd className="px-2 py-1 bg-gray-700 rounded">Tab + Enter</kbd> or <kbd className="px-2 py-1 bg-gray-700 rounded">Enter</kbd> to restart
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Virtual Keyboard */}
        <VirtualKeyboard pressedKey={pressedKey} nextKey={nextKey} showKeyboard={true} />
      </div>
    </main>
  );
}
