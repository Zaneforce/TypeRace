export interface TypingSession {
  id: string;
  userId: string;
  wpm: number;
  accuracy: number;
  mode: 'time' | 'words' | 'sudden-death';
  duration: number; // in seconds
  wordCount: number;
  timestamp: number;
  roomType: 'practice' | 'custom';
}

export interface UserStats {
  userId: string;
  username: string;
  totalTests: number;
  averageWpm: number;
  bestWpm: number;
  averageAccuracy: number;
  bestAccuracy: number;
  totalWords: number;
  totalTimeTyping: number; // in seconds
  lastPlayed: number;
  sessions: TypingSession[];
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  wpm: number;
  accuracy: number;
  wordCount: number;
  timestamp: number;
}
