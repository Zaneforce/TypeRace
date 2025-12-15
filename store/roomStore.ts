import { create } from 'zustand';
import { Room, Player, RoomStore } from '@/types/room';

export const useRoomStore = create<RoomStore>((set) => ({
  currentRoom: null,
  currentPlayer: null,

  setRoom: (room) => set({ currentRoom: room }),
  
  setPlayer: (player) => set({ currentPlayer: player }),

  updatePlayer: (playerId, updates) =>
    set((state) => {
      if (!state.currentRoom) return state;
      
      const updatedPlayers = state.currentRoom.players.map((p) =>
        p.id === playerId ? { ...p, ...updates } : p
      );

      return {
        currentRoom: { ...state.currentRoom, players: updatedPlayers },
        currentPlayer:
          state.currentPlayer?.id === playerId
            ? { ...state.currentPlayer, ...updates }
            : state.currentPlayer,
      };
    }),

  updatePlayers: (players) =>
    set((state) => {
      if (!state.currentRoom) return state;
      return {
        currentRoom: { ...state.currentRoom, players },
      };
    }),

  resetRoom: () => set({ currentRoom: null, currentPlayer: null }),
}));
