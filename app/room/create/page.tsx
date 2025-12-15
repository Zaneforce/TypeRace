'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import { getRandomText } from '@/utils/textUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faUsers, faRocket, faLink, faBolt, faLightbulb } from '@fortawesome/free-solid-svg-icons';

export default function CreateRoomPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isCreating, setIsCreating] = useState(false);

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
      
      // Create room data in Firebase
      const roomData = {
        code: roomCode,
        name: roomName,
        maxPlayers,
        text: getRandomText(),
        status: 'waiting',
        players: {},
        createdAt: Date.now(),
        createdBy: user.displayName || user.email || 'Anonymous',
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

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="bg-gray-800/50 p-4 rounded-xl text-center">
            <div className="text-2xl mb-1 text-orange-400">
              <FontAwesomeIcon icon={faLink} />
            </div>
            <div className="text-white font-semibold text-sm">Kode Unik</div>
            <div className="text-gray-400 text-xs">Share ke teman</div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-xl text-center">
            <div className="text-2xl mb-1 text-yellow-400">
              <FontAwesomeIcon icon={faBolt} />
            </div>
            <div className="text-white font-semibold text-sm">Real-time</div>
            <div className="text-gray-400 text-xs">Sync otomatis</div>
          </div>
        </div>
      </div>
    </main>
  );
}
