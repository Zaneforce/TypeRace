'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBullseye, 
  faUsers,
  faSignOutAlt,
  faSignInAlt,
  faArrowRight,
  faUser,
  faTrophy
} from '@fortawesome/free-solid-svg-icons';

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [roomCode, setRoomCode] = useState('');

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      router.push(`/room/${roomCode}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* User Info */}
      <div className="absolute top-6 right-6 z-50">
        {user ? (
          <div className="flex items-center gap-3">
            {/* Profile Button */}
            <button
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2 bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-md px-4 py-2 rounded-full border border-gray-700/50 hover:border-yellow-500/50 transition-all text-gray-300 hover:text-yellow-500 cursor-pointer"
              title="Profile"
            >
              <FontAwesomeIcon icon={faUser} />
              <span className="text-sm font-medium">Profile</span>
            </button>
            
            {/* Leaderboard Button */}
            <button
              onClick={() => router.push('/leaderboard')}
              className="flex items-center gap-2 bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-md px-4 py-2 rounded-full border border-gray-700/50 hover:border-yellow-500/50 transition-all text-gray-300 hover:text-yellow-500 cursor-pointer"
              title="Leaderboard"
            >
              <FontAwesomeIcon icon={faTrophy} />
              <span className="text-sm font-medium">Leaderboard</span>
            </button>
            
            {/* User Info */}
            <div className="flex items-center gap-3 bg-gray-800/50 backdrop-blur-md px-4 py-2 rounded-full border border-gray-700/50">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {(user.displayName || user.email)?.[0]?.toUpperCase()}
              </div>
              <span className="text-gray-300 font-medium text-sm">
                {user.displayName || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 transition-colors ml-2"
                title="Logout"
              >
                <FontAwesomeIcon icon={faSignOutAlt} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 backdrop-blur-md px-5 py-2.5 rounded-full border border-yellow-500/30 text-yellow-500 font-medium transition-all hover:scale-105"
          >
            <FontAwesomeIcon icon={faSignInAlt} />
            <span>Login</span>
          </button>
        )}
      </div>

      <div className="max-w-6xl w-full relative z-10">
        {/* App Name */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
            TypeRacer
          </h1>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16 space-y-4">
          <p className="text-2xl text-gray-400 font-light max-w-2xl mx-auto">
            Improve your typing speed with
            <span className="text-yellow-500 font-semibold"> competitive racing</span>
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500 pt-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Multiplayer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span>Real-time Stats</span>
            </div>
          </div>
        </div>

        {/* Mode Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Practice Mode */}
          <Link href="/practice">
            <div className="group relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 hover:border-yellow-500/50 p-8 rounded-3xl cursor-pointer transform transition-all duration-300 hover:scale-105 hover:-translate-y-2 overflow-hidden min-h-[340px]">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-yellow-500/0 group-hover:from-yellow-500/10 group-hover:to-transparent transition-all duration-300"></div>
              
              <div className="relative">
                <div className="w-16 h-16 bg-yellow-500/10 group-hover:bg-yellow-500/20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <FontAwesomeIcon icon={faBullseye} className="text-3xl text-yellow-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-yellow-500 transition-colors">
                  Practice
                </h2>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors mb-4">
                  Solo training to improve your speed
                </p>
                <div className="flex items-center text-yellow-500 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-2">
                  <span className="text-sm font-semibold">Start typing</span>
                  <FontAwesomeIcon icon={faArrowRight} className="ml-2 text-xs" />
                </div>
              </div>
            </div>
          </Link>

          {/* Custom Room */}
          <div className="group relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 hover:border-orange-500/50 p-8 pb-6 rounded-3xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 overflow-hidden min-h-[340px]">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/10 group-hover:to-transparent transition-all duration-300"></div>
            
            <div className="relative">
              <div className="w-16 h-16 bg-orange-500/10 group-hover:bg-orange-500/20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <FontAwesomeIcon icon={faUsers} className="text-3xl text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">
                Custom Room
              </h2>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors mb-6">
                Play with friends privately
              </p>
              
              <div className="space-y-3 pr-2">
                <Link href="/room/create">
                  <button className="w-full bg-gradient-to-r from-orange-500/20 to-orange-600/20 hover:from-orange-500/30 hover:to-orange-600/30 border border-orange-500/30 text-orange-300 font-semibold py-3 px-4 rounded-xl transition-all hover:scale-105">
                    Create Room
                  </button>
                </Link>
                
                <div className="flex gap-2 mb-4 pr-2">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="w-32 px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-700/50 text-gray-200 placeholder-gray-600 focus:border-orange-500/50 focus:outline-none transition-all h-12"
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                    maxLength={6}
                  />
                  <button
                    onClick={handleJoinRoom}
                    className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 hover:from-orange-500/30 hover:to-orange-600/30 border border-orange-500/30 text-orange-300 font-semibold px-6 rounded-xl transition-all hover:scale-105 whitespace-nowrap h-12 flex items-center justify-center"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600 text-sm">
          <p className="flex items-center justify-center gap-2">
            <span>Justin Valentino</span>
          </p>
        </div>
      </div>
    </main>
  );
}
