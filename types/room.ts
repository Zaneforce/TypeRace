export interface Player {
  id: string;
  name: string;
  progress: number;
  wpm: number;
  accuracy: number;
  isFinished: boolean;
  finishTime?: number;
}

export interface Room {
  id: string;
  code: string;
  text: string;
  players: Player[];
  isStarted: boolean;
  createdAt: number;
}

export interface RoomStore {
  currentRoom: Room | null;
  currentPlayer: Player | null;
  setRoom: (room: Room) => void;
  setPlayer: (player: Player) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  updatePlayers: (players: Player[]) => void;
  resetRoom: () => void;
}
