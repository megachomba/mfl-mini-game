import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface GameState {
  socket: Socket | null;
  connected: boolean;
  playerName: string | null;
  players: any; // To be typed properly
  gameState: any;
  latency: number;
  resetCounter: number;
  setPlayerName: (name: string) => void;
  connect: () => void;
  updateGameState: (state: any) => void;
  resetPosition: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  socket: null,
  connected: false,
  playerName: null,
  players: {},
  gameState: null,
  latency: 0,
  resetCounter: 0,

  setPlayerName: (name) => set({ playerName: name }),

  resetPosition: () => set((state) => ({ resetCounter: state.resetCounter + 1 })),

  connect: () => {
    const { playerName, socket } = get();
    if (socket) return;

    const newSocket = io('http://localhost:3000');

    newSocket.on('connect', () => {
      set({ connected: true });
      if (playerName) {
        newSocket.emit('join', playerName);
      }

      // Ping for latency measurement
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
    
    newSocket.on('playerMoved', ({ id, pos }) => {
      set((state) => {
        if (!state.gameState || !state.gameState.players) return state;
        
        // Check if player exists to avoid errors, though usually they should
        const currentPlayer = state.gameState.players[id];
        if (!currentPlayer) return state;

        // Create shallow copy of players to trigger update
        const newPlayers = { ...state.gameState.players };
        newPlayers[id] = { 
            ...currentPlayer, 
            x: pos.x, 
            y: pos.y, 
            z: pos.z,
            rot: pos.rot || 0
        };

        return {
          gameState: {
            ...state.gameState,
            players: newPlayers
          }
        };
      });
    });

    set({ socket: newSocket });
  },

  updateGameState: (state) => set({ gameState: state }),
}));
