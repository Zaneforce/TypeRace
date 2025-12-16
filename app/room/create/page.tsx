'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { database } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import { getRandomText } from '@/utils/textUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faUsers, faRocket, faLink, faBolt, faLightbulb, faSkull, faGlobe } from '@fortawesome/free-solid-svg-icons';

export default function CreateRoomPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [mode, setMode] = useState<'time' | 'words' | 'sudden-death'>('time');
  const [timeLimit, setTimeLimit] = useState(60);
  const [wordLimit, setWordLimit] = useState(50);
  const [suddenDeathWordCount, setSuddenDeathWordCount] = useState(50);
  const [isCreating, setIsCreating] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      alert('Nama room harus diisi!');
      return;
    }

    if (!user) {
      alert('Kamu harus login terlebih dahulu!');
      router.push('/login');
      return;
    }

    setIsCreating(true);
    
    try {
      // Generate unique room code
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Generate appropriate amount of text based on mode
      let wordCount = 200;
      if (mode === 'words') wordCount = Math.max(wordLimit, 100);
      else if (mode === 'sudden-death') wordCount = 100; // Start with 100 words, will auto-generate more
      
      // Create room data in Firebase
      const roomData = {
        code: roomCode,
        name: roomName,
        maxPlayers,
        mode,
        timeLimit,
        wordLimit,
        text: getRandomText(wordCount, language),
        language: language,
        status: 'waiting',
        players: {},
        createdAt: Date.now(),
        createdBy: user.uid,
      };

      await set(ref(database, `customRooms/${roomCode}`), roomData);
      
      // Redirect to room
      router.push(`/room/${roomCode}?host=true`);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Gagal membuat room!');
      setIsCreating(false);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900 to-gray-900 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-white hover:text-orange-300 transition-colors mb-4 flex items-center gap-2 mx-auto"
          >
            <FontAwesomeIcon icon={faHome} />
            <span className="font-semibold">Kembali</span>
          </button>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <FontAwesomeIcon icon={faUsers} /> Buat Room
          </h1>
          <p className="text-orange-200">Buat room custom untuk bermain dengan teman</p>
        </div>

        {/* Form */}
        <div className="bg-gray-800/90 backdrop-blur-md p-8 rounded-2xl border border-gray-700 space-y-6">
          {/* Room Name */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Nama Room
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Contoh: Room Seru"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border-2 border-gray-600 focus:border-orange-500 focus:outline-none"
              maxLength={30}
            />
          </div>

          {/* Max Players */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Maksimal Pemain: {maxPlayers}
            </label>
            <input
              type="range"
              min="2"
              max="8"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>2</span>
              <span>4</span>
              <span>6</span>
              <span>8</span>
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Bahasa Kata (Text Language)
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                className="w-full bg-gradient-to-r from-gray-700 to-gray-800 text-white border-2 border-gray-600 rounded-lg px-4 py-3 pr-10 font-semibold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-lg hover:shadow-xl hover:border-gray-500 cursor-pointer text-left"
              >
                {language === 'id' ? '🇮🇩 Bahasa Indonesia' : '🇬🇧 English'}
              </button>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <svg className={`w-5 h-5 transition-transform ${languageDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {languageDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-gray-800 border-2 border-gray-600 rounded-lg shadow-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('id');
                      setLanguageDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left font-semibold transition-all flex items-center gap-2 ${
                      language === 'id'
                        ? 'bg-orange-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    🇮🇩 Bahasa Indonesia
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('en');
                      setLanguageDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left font-semibold transition-all flex items-center gap-2 ${
                      language === 'en'
                        ? 'bg-orange-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Game Mode */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Mode Permainan
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMode('time')}
                className={`py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  mode === 'time'
                    ? 'bg-orange-600 text-white border-2 border-orange-400'
                    : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:border-gray-500'
                }`}
              >
                <FontAwesomeIcon icon={faBolt} /> Waktu
              </button>
              <button
                type="button"
                onClick={() => setMode('words')}
                className={`py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  mode === 'words'
                    ? 'bg-orange-600 text-white border-2 border-orange-400'
                    : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:border-gray-500'
                }`}
              >
                <FontAwesomeIcon icon={faLightbulb} /> Kata
              </button>
              <button
                type="button"
                onClick={() => setMode('sudden-death')}
                className={`py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  mode === 'sudden-death'
                    ? 'bg-red-600 text-white border-2 border-red-400'
                    : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:border-gray-500'
                }`}
                title="One mistake = Game Over"
              >
                <FontAwesomeIcon icon={faSkull} /> Sudden Death
              </button>
            </div>
          </div>

          {/* Mode Settings */}
          {mode === 'time' ? (
            <div>
              <label className="block text-white font-semibold mb-2">
                Durasi: {timeLimit} detik
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 60, 120].map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setTimeLimit(time)}
                    className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                      timeLimit === time
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {time}s
                  </button>
                ))}
              </div>
            </div>
          ) : mode === 'words' ? (
            <div>
              <label className="block text-white font-semibold mb-2">
                Jumlah Kata: {wordLimit}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 100, 200].map((words) => (
                  <button
                    key={words}
                    type="button"
                    onClick={() => setWordLimit(words)}
                    className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                      wordLimit === words
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {words}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
              <p className="text-red-200 text-sm">
                <span className="font-semibold">Sudden Death:</span> Type as many words as you can without making a single mistake. One wrong character = Game Over!
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 flex gap-3">
            <div className="text-xl text-blue-400 mt-0.5">
              <FontAwesomeIcon icon={faLightbulb} />
            </div>
            <div className="text-sm text-blue-200">
              <p className="font-semibold mb-1">Info:</p>
              <p>Setelah room dibuat, kamu akan mendapat kode room yang bisa dibagikan ke teman-temanmu.</p>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={faRocket} />
            {isCreating ? 'Membuat Room...' : 'Buat Room'}
          </button>
        </div>
      </div>
    </main>
  );
}
