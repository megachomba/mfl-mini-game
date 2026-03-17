import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

// Separate store for high-frequency player position updates
// This prevents position broadcasts from triggering re-renders in Grid, UI, Desk etc.
interface PlayerPositions {
  [id: string]: { x: number; y: number; z: number; rot: number };
}

export const usePlayerPositions = create<{
  positions: PlayerPositions;
}>(() => ({
  positions: {},
}));

interface GameState {
  socket: Socket | null;
  connected: boolean;
  playerName: string | null;
  selectedModel: string;
  players: any;
  gameState: any;
  latency: number;
  resetCounter: number;
  setPlayerName: (name: string) => void;
  setSelectedModel: (model: string) => void;
  connect: () => void;
  updateGameState: (state: any) => void;
  resetPosition: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  socket: null,
  connected: false,
  playerName: null,
  selectedModel: 'soldier',
  players: {},
  gameState: null,
  latency: 0,
  resetCounter: 0,

  setPlayerName: (name) => set({ playerName: name }),
  setSelectedModel: (model) => set({ selectedModel: model }),

  resetPosition: () => set((state) => ({ resetCounter: state.resetCounter + 1 })),

  connect: () => {
    const { playerName, socket } = get();
    if (socket) return;

    const serverUrl = import.meta.env.PROD
      ? window.location.origin
      : 'http://localhost:3000';
    const newSocket = io(serverUrl);

    newSocket.on('connect', () => {
      set({ connected: true });
      if (playerName) {
        const { selectedModel } = get();
        newSocket.emit('join', playerName, selectedModel);
      }

      const pingInterval = setInterval(() => {
        const start = Date.now();
        newSocket.emit('ping', () => {
          const latency = Date.now() - start;
          set({ latency });
        });
      }, 1000);

      newSocket.on('disconnect', () => {
        clearInterval(pingInterval);
      });
    });

    newSocket.on('gameState', (gameState) => {
      set({ gameState });
    });

    newSocket.on('restartGame', () => {
      set((state) => ({ resetCounter: state.resetCounter + 1 }));
    });

    // Player positions go to a SEPARATE store — no cascade re-renders
    newSocket.on('playerMoved', ({ id, pos }) => {
      usePlayerPositions.setState((state) => ({
        positions: {
          ...state.positions,
          [id]: { x: pos.x, y: pos.y, z: pos.z, rot: pos.rot || 0 },
        },
      }));
    });

    set({ socket: newSocket });
  },

  updateGameState: (state) => set({ gameState: state }),
}));
