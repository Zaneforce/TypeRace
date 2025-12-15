'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/lib/firebase';
import { ref, onValue, set, push, get } from 'firebase/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faUsers, faPlus, faArrowRight } from '@fortawesome/free-solid-svg-icons';

interface RoomData {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
}

export default function LobbyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const roomsRef = ref(database, 'rooms');
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const roomsList: RoomData[] = Object.entries(data).map(([id, room]: [string, any]) => ({
          id,
          name: room.name || `Room ${id.slice(0, 6)}`,
          players: room.players ? Object.keys(room.players).length : 0,
          maxPlayers: 5,
          status: room.status || 'waiting',
          createdAt: room.createdAt || Date.now(),
        }));
        setRooms(roomsList.filter(room => room.status === 'waiting'));
      } else {
        setRooms([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, router]);

  const createRoom = async () => {
    if (!user) return;

    const roomsRef = ref(database, 'rooms');
    const newRoomRef = push(roomsRef);
    const roomId = newRoomRef.key;

    await set(newRoomRef, {
      name: `${user.displayName}'s Room`,
      status: 'waiting',
      createdAt: Date.now(),
      players: {
        [user.uid]: {
          id: user.uid,
          name: user.displayName || 'Player',
          progress: 0,
          wpm: 0,
          accuracy: 100,
          isFinished: false,
        }
      }
    });

    router.push(`/public/${roomId}`);
  };

  const joinRoom = async (roomId: string) => {
    if (!user) return;

    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    const room = snapshot.val();

    if (room) {
      const currentPlayers = room.players ? Object.keys(room.players).length : 0;
      if (currentPlayers >= 5) {
        alert('Room is full!');
        return;
      }

      await set(ref(database, `rooms/${roomId}/players/${user.uid}`), {
        id: user.uid,
        name: user.displayName || 'Player',
        progress: 0,
        wpm: 0,
        accuracy: 100,
        isFinished: false,
      });

      router.push(`/public/${roomId}`);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-yellow-500 text-xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-gray-300">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 hover:text-yellow-500 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <FontAwesomeIcon icon={faHome} />
            <span>Home</span>
          </button>
          <h1 className="text-3xl font-bold text-yellow-500">Room Lobby</h1>
          <div className="w-24"></div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Create Room Button */}
        <div className="mb-8 flex justify-center">
          <button
            onClick={createRoom}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold px-8 py-4 rounded-lg transition-colors flex items-center gap-3"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Create New Room</span>
          </button>
        </div>

        {/* Rooms Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <FontAwesomeIcon icon={faUsers} className="text-6xl mb-4 opacity-20" />
              <p>No rooms available. Create one to get started!</p>
            </div>
          ) : (
            rooms.map((room) => (
              <div
                key={room.id}
                className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl border border-gray-700/50 hover:border-yellow-500/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-yellow-500">{room.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <FontAwesomeIcon icon={faUsers} />
                    <span>{room.players}/{room.maxPlayers}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {room.players >= room.maxPlayers ? (
                      <span className="text-red-400">Full</span>
                    ) : (
                      <span className="text-green-400">Open</span>
                    )}
                  </div>
                  <button
                    onClick={() => joinRoom(room.id)}
                    disabled={room.players >= room.maxPlayers}
                    className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Join</span>
                    <FontAwesomeIcon icon={faArrowRight} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
