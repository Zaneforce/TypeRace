'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/lib/firebase';
import { ref, onValue, get } from 'firebase/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faTrophy, faChartLine, faKeyboard, faClock, faFire } from '@fortawesome/free-solid-svg-icons';
import { UserStats, TypingSession } from '@/types/stats';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const statsRef = ref(database, `userStats/${user.uid}`);
    const unsubscribe = onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStats(data);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, router]);

  const getFilteredSessions = () => {
    if (!stats?.sessions) return [];
    
    const now = Date.now();
    const sessions = Object.values(stats.sessions);
    
    switch (selectedPeriod) {
      case 'week':
        return sessions.filter(s => now - s.timestamp < 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return sessions.filter(s => now - s.timestamp < 30 * 24 * 60 * 60 * 1000);
      default:
        return sessions;
    }
  };

  const calculateImprovement = () => {
    const sessions = getFilteredSessions().sort((a, b) => a.timestamp - b.timestamp);
    if (sessions.length < 2) return 0;
    
    const firstHalf = sessions.slice(0, Math.floor(sessions.length / 2));
    const secondHalf = sessions.slice(Math.floor(sessions.length / 2));
    
    const firstAvg = firstHalf.reduce((acc, s) => acc + s.wpm, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((acc, s) => acc + s.wpm, 0) / secondHalf.length;
    
    return Math.round(secondAvg - firstAvg);
  };

  const getChartData = () => {
    const sessions = getFilteredSessions().sort((a, b) => a.timestamp - b.timestamp);
    return sessions.slice(-10); // Last 10 sessions
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </main>
    );
  }

  const improvement = calculateImprovement();
  const chartData = getChartData();
  const maxWpm = Math.max(...chartData.map(s => s.wpm), 0);

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
          <h1 className="text-3xl font-bold text-yellow-500">Profile & Statistics</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* User Info */}
        <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">{user?.displayName || user?.email}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Total Tests</div>
              <div className="text-yellow-500 text-2xl font-bold flex items-center gap-2">
                <FontAwesomeIcon icon={faKeyboard} className="text-lg" />
                {stats?.totalTests || 0}
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Average WPM</div>
              <div className="text-yellow-500 text-2xl font-bold">{Math.round(stats?.averageWpm || 0)}</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Best WPM</div>
              <div className="text-yellow-500 text-2xl font-bold flex items-center gap-2">
                <FontAwesomeIcon icon={faTrophy} className="text-lg" />
                {stats?.bestWpm || 0}
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Avg Accuracy</div>
              <div className="text-yellow-500 text-2xl font-bold">{Math.round(stats?.averageAccuracy || 0)}%</div>
            </div>
          </div>
        </div>

        {/* Improvement Banner */}
        {improvement !== 0 && (
          <div className={`${improvement > 0 ? 'bg-green-900/30 border-green-700' : 'bg-red-900/30 border-red-700'} border rounded-xl p-6 mb-8`}>
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faFire} className={`${improvement > 0 ? 'text-green-500' : 'text-red-500'} text-3xl`} />
              <div>
                <div className="text-white font-bold text-lg">
                  {improvement > 0 ? '🎉 You\'re improving!' : '📉 Keep practicing!'}
                </div>
                <div className={`${improvement > 0 ? 'text-green-400' : 'text-red-400'} text-sm`}>
                  {improvement > 0 ? '+' : ''}{improvement} WPM compared to your earlier sessions this {selectedPeriod}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          {(['week', 'month', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedPeriod === period
                  ? 'bg-yellow-500 text-gray-900'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Progress Chart */}
        <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faChartLine} /> Progress Chart (Last 10 Sessions)
          </h3>
          
          {chartData.length > 0 ? (
            <div className="space-y-3">
              {chartData.map((session, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="text-gray-500 text-sm w-8">#{idx + 1}</div>
                  <div className="flex-1">
                    <div className="relative h-8 bg-gray-700 rounded-lg overflow-hidden">
                      <div
                        className="absolute h-full bg-gradient-to-r from-yellow-600 to-yellow-500 flex items-center px-3 transition-all"
                        style={{ width: `${(session.wpm / maxWpm) * 100}%` }}
                      >
                        <span className="text-white text-xs font-bold">{session.wpm} WPM</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-400 text-xs">
                    {new Date(session.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No sessions found for this period. Start typing to see your progress!
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faClock} /> Recent Sessions
          </h3>
          
          {getFilteredSessions().length > 0 ? (
            <div className="space-y-2">
              {getFilteredSessions()
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 10)
                .map((session, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${
                        session.roomType === 'practice' 
                          ? 'bg-blue-900/50 text-blue-400' 
                          : 'bg-purple-900/50 text-purple-400'
                      }`}>
                        {session.roomType}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {new Date(session.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-yellow-500 font-bold">{session.wpm} WPM</div>
                      <div className="text-gray-400">{session.accuracy}%</div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No sessions yet. Start typing to build your history!
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
