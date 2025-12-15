import { create } from 'zustand';

interface TypingStats {
  wpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  startTime: number | null;
  endTime: number | null;
}

interface TypingStore {
  currentText: string;
  userInput: string;
  currentIndex: number;
  stats: TypingStats;
  isStarted: boolean;
  isFinished: boolean;
  
  setCurrentText: (text: string) => void;
  setUserInput: (input: string) => void;
  updateStats: () => void;
  startTyping: () => void;
  finishTyping: () => void;
  resetTyping: () => void;
}

const initialStats: TypingStats = {
  wpm: 0,
  accuracy: 100,
  correctChars: 0,
  incorrectChars: 0,
  totalChars: 0,
  startTime: null,
  endTime: null,
};

export const useTypingStore = create<TypingStore>((set, get) => ({
  currentText: '',
  userInput: '',
  currentIndex: 0,
  stats: initialStats,
  isStarted: false,
  isFinished: false,

  setCurrentText: (text) => set({ currentText: text }),
  
  setUserInput: (input) => {
    set({ userInput: input, currentIndex: input.length });
    get().updateStats();
  },

  updateStats: () => {
    const { userInput, currentText, stats, isStarted } = get();
    
    if (!isStarted || !stats.startTime) return;

    let correct = 0;
    let incorrect = 0;

    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] === currentText[i]) {
        correct++;
      } else {
        incorrect++;
      }
    }

    const totalChars = userInput.length;
    const accuracy = totalChars > 0 ? (correct / totalChars) * 100 : 100;
    
    const timeElapsed = (Date.now() - stats.startTime) / 1000 / 60; // in minutes
    const wordsTyped = totalChars / 5; // standard: 5 chars = 1 word
    const wpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;

    set({
      stats: {
        ...stats,
        wpm,
        accuracy: Math.round(accuracy),
        correctChars: correct,
        incorrectChars: incorrect,
        totalChars,
      },
    });
  },

  startTyping: () => {
    set({
      isStarted: true,
      stats: { ...initialStats, startTime: Date.now() },
    });
  },

  finishTyping: () => {
    const { stats } = get();
    set({
      isFinished: true,
      stats: { ...stats, endTime: Date.now() },
    });
  },

  resetTyping: () => {
    set({
      userInput: '',
      currentIndex: 0,
      stats: initialStats,
      isStarted: false,
      isFinished: false,
    });
  },
}));
