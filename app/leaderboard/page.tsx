'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref, query, orderByChild, limitToLast, onValue } from 'firebase/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faTrophy, faMedal, faCrown, faFire, faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import { LeaderboardEntry } from '@/types/stats';

export default function LeaderboardPage() {
  const router = useRouter();
  const [dailyLeaderboard, setDailyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'daily' | 'alltime'>('daily');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get daily leaderboard (last 24 hours)
    const dailyRef = ref(database, 'leaderboard/daily');
    const unsubscribeDaily = onValue(dailyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entries = Object.values(data) as LeaderboardEntry[];
        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        
        // Filter untuk 24 jam terakhir
        const recentEntries = entries.filter(e => e.timestamp > oneDayAgo);
        
        // Group by userId dan ambil WPM tertinggi per user
        const userBestMap = new Map<string, LeaderboardEntry>();
        recentEntries.forEach(entry => {
          const existing = userBestMap.get(entry.userId);
          if (!existing || entry.wpm > existing.wpm) {
            userBestMap.set(entry.userId, entry);
          }
        });
        
        // Convert map ke array dan sort
        const filtered = Array.from(userBestMap.values())
          .sort((a, b) => b.wpm - a.wpm)
          .slice(0, 100);
        
        setDailyLeaderboard(filtered);
      }
      setLoading(false);
    });

    // Get all-time leaderboard
    const allTimeRef = ref(database, 'leaderboard/alltime');
    const unsubscribeAllTime = onValue(allTimeRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entries = Object.values(data) as LeaderboardEntry[];
        
        // Group by userId dan ambil WPM tertinggi per user
        const userBestMap = new Map<string, LeaderboardEntry>();
        entries.forEach(entry => {
          const existing = userBestMap.get(entry.userId);
          if (!existing || entry.wpm > existing.wpm) {
            userBestMap.set(entry.userId, entry);
          }
        });
        
        // Convert map ke array dan sort
        const sorted = Array.from(userBestMap.values())
          .sort((a, b) => b.wpm - a.wpm)
          .slice(0, 100);
        
        setAllTimeLeaderboard(sorted);
      }
    });

    return () => {
      unsubscribeDaily();
      unsubscribeAllTime();
    };
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FontAwesomeIcon icon={faCrown} className="text-yellow-500 text-xl" />;
      case 2:
        return <FontAwesomeIcon icon={faMedal} className="text-gray-400 text-xl" />;
      case 3:
        return <FontAwesomeIcon icon={faMedal} className="text-orange-600 text-xl" />;
      default:
        return <span className="text-gray-500 font-bold">#{rank}</span>;
    }
  };

  const getRankClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-900/50 to-yellow-800/50 border-yellow-500/50';
      case 2:
        return 'bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-gray-400/50';
      case 3:
        return 'bg-gradient-to-r from-orange-900/50 to-orange-800/50 border-orange-600/50';
      default:
        return 'bg-gray-800/30 border-gray-700/50';
    }
  };

  const currentLeaderboard = activeTab === 'daily' ? dailyLeaderboard : allTimeLeaderboard;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-gray-300">
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
          <h1 className="text-3xl font-bold text-yellow-500 flex items-center gap-3">
            <FontAwesomeIcon icon={faTrophy} />
            Leaderboard
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Tab Selector */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'daily'
                ? 'bg-yellow-500 text-gray-900'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <FontAwesomeIcon icon={faFire} /> Daily Champions
          </button>
          <button
            onClick={() => setActiveTab('alltime')}
            className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'alltime'
                ? 'bg-yellow-500 text-gray-900'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <FontAwesomeIcon icon={faCrown} /> All-Time Legends
          </button>
        </div>

        {/* Leaderboard List */}
        {currentLeaderboard.length > 0 ? (
          <div className="space-y-3">
            {currentLeaderboard.map((entry, idx) => {
              const rank = idx + 1;
              return (
                <div
                  key={idx}
                  className={`${getRankClass(rank)} border rounded-xl p-4 transition-all hover:scale-[1.02]`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 flex justify-center">
                        {getRankIcon(rank)}
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">
                          {entry.username || 'Anonymous'}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-500 font-bold text-2xl">
                        {entry.wpm} <span className="text-sm text-gray-400">WPM</span>
                      </div>
                      <div className="text-gray-400 text-sm">
                        {entry.accuracy}% accuracy · {entry.wordCount || 0} words
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mb-4">
              <FontAwesomeIcon icon={faTrophy} className="text-yellow-500 text-7xl" />
            </div>
            <div className="text-gray-400 text-lg">
              No entries yet. Be the first to claim the throne!
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
