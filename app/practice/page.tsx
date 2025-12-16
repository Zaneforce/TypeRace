'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import VirtualKeyboard from '@/components/VirtualKeyboard';
import { useKeyboardSound } from '@/hooks/useKeyboardSound';
import { useTypingStore } from '@/store/typingStore';
import { getRandomText } from '@/utils/textUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faRotateRight } from '@fortawesome/free-solid-svg-icons';

type Mode = 'time' | 'words';
type TimeOption = 15 | 30 | 60 | 120;
type WordsOption = 10 | 25 | 50 | 100;

export default function PracticePage() {
  const router = useRouter();
  const { playKeySound, soundEnabled, toggleSound } = useKeyboardSound();
  const [pressedKey, setPressedKey] = useState('');
  const [nextKey, setNextKey] = useState('');
  const [mode, setMode] = useState<Mode>('time');
  const [timeLimit, setTimeLimit] = useState<TimeOption>(30);
  const [wordLimit, setWordLimit] = useState<WordsOption>(25);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
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

  useEffect(() => {
    const wordCount = mode === 'words' ? Math.max(wordLimit, 50) : 100;
    setCurrentText(getRandomText(wordCount));
    inputRef.current?.focus();
  }, [setCurrentText, mode, wordLimit]);

  useEffect(() => {
    if (mode === 'words') {
      if (userInput.length === currentText.length && currentText.length > 0) {
        finishTyping();
      }
    }
    // In time mode, don't finish when text ends - just keep going with auto-generated text
  }, [userInput, currentText, finishTyping, mode]);

  // Timer for time mode
  useEffect(() => {
    if (mode === 'time' && isStarted && !isFinished) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            finishTyping();
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
    
    // Auto-generate more text in time mode when user is close to finishing
    if (mode === 'time' && isStarted && !isFinished) {
      const progress = userInput.length / currentText.length;
      // When user has typed 80% of the text, add more text
      if (progress > 0.8) {
        setCurrentText(currentText + ' ' + getRandomText(50));
      }
    }
  }, [userInput, currentText, mode, isStarted, isFinished, setCurrentText]);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isStarted && e.key !== 'Tab') {
      startTyping();
    }

    // Play sound
    playKeySound();
    
    // Update visual keyboard
    setPressedKey(e.key);
    setTimeout(() => setPressedKey(''), 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished) return;
    
    const input = e.target.value;
    
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
    const wordCount = mode === 'words' ? wordLimit : 50;
    setCurrentText(getRandomText(wordCount));
    setTimeLeft(mode === 'time' ? timeLimit : 0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    inputRef.current?.focus();
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    resetTyping();
    const wordCount = newMode === 'words' ? wordLimit : 50;
    setCurrentText(getRandomText(wordCount));
    setTimeLeft(newMode === 'time' ? timeLimit : 0);
  };

  const handleTimeLimitChange = (time: TimeOption) => {
    setTimeLimit(time);
    setTimeLeft(time);
    resetTyping();
    setCurrentText(getRandomText(50));
  };

  const handleWordLimitChange = (words: WordsOption) => {
    setWordLimit(words);
    resetTyping();
    setCurrentText(getRandomText(words));
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
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 hover:text-yellow-500 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <span>← Home</span>
          </button>
          <h1 className="text-2xl font-bold text-yellow-500">
            Practice Mode
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
            <button
              onClick={handleRestart}
              className="text-gray-500 hover:text-yellow-500 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <span>🔄 Restart</span>
            </button>
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
                {mode === 'time' ? 'time left' : 'progress'}
              </div>
              <div className="text-yellow-500 text-3xl font-bold">
                {mode === 'time' ? `${timeLeft}s` : `${userInput.length}/${currentText.length}`}
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
              ) : (
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
              )}  
            </div>
          </div>
        </div>

        {/* Text Display */}
        <div className="mb-8 mt-16">
          {!isStarted && (
            <div className="text-center mb-6 text-gray-600 text-sm animate-pulse">
              Start typing to begin...
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
              <button
                onClick={handleRestart}
                className="mt-4 px-6 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-lg transition-colors"
              >
                Next Test
              </button>
            </div>
          </div>
        )}

        {/* Virtual Keyboard */}
        <VirtualKeyboard pressedKey={pressedKey} nextKey={nextKey} showKeyboard={true} />
      </div>
    </main>
  );
}
