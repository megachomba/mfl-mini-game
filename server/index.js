import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load questions
const questionsPath = path.join(__dirname, '../src/data/questions.json');
const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Game State
let gameState = {
  phase: 'LOBBY', // LOBBY, MEMORIZE, GAME, END
  players: {},
  grid: [], 
  scores: {
    quentin: 0,
    yann: 0,
    mathurin: 0
  },
  currentTurn: null,
  activeQuestion: null, // { question, tileId, answeringPlayer }
  answerFeedback: null // 'correct' | 'incorrect' | null
};

// Predefined players configuration
const PLAYER_CONFIG = {
  quentin: { color: '#3b82f6', startPos: { x: -8, y: 2, z: 11 } }, // Blue
  mathurin: { color: '#22c55e', startPos: { x: 0, y: 2, z: 11 } },  // Green
  yann: { color: '#ef4444', startPos: { x: 8, y: 2, z: 11 } }      // Red
};

// Initialize Grid
const initGrid = () => {
  const tiles = [];
  // 30 Blue (Quentin), 30 Red (Yann), 30 Green (Mathurin), 10 Neutral (Gray)
  let types = [
    ...Array(30).fill('quentin'),
    ...Array(30).fill('yann'),
    ...Array(30).fill('mathurin'),
    ...Array(10).fill('neutral')
  ];
  
  // Shuffle
  types.sort(() => Math.random() - 0.5);

  for(let i=0; i<100; i++) {
    tiles.push({
      id: i,
      type: types[i],
      revealed: false,
      x: i % 10,
      y: Math.floor(i / 10)
    });
  }
  return tiles;
};

gameState.grid = initGrid();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Ping/pong for latency measurement
  socket.on('ping', (callback) => {
    callback();
  });

  socket.on('join', (playerName) => {
    if (PLAYER_CONFIG[playerName]) {
      const config = PLAYER_CONFIG[playerName];
      gameState.players[socket.id] = {
        id: socket.id,
        name: playerName,
        color: config.color,
        x: config.startPos.x,
        y: config.startPos.y,
        z: config.startPos.z,
        startPos: config.startPos
      };
      io.emit('gameState', gameState);
      console.log(`${playerName} joined!`);
    }
  });

  socket.on('move', (pos) => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].x = pos.x;
      gameState.players[socket.id].y = pos.y;
      gameState.players[socket.id].z = pos.z;
      gameState.players[socket.id].rot = pos.rot || 0;
      socket.broadcast.emit('playerMoved', { id: socket.id, pos });
    }
  });

const PREDEFINED_PLAYERS_ORDER = ['quentin', 'mathurin', 'yann'];

// ... (inside revealTile or wherever currentTurn is initialized)
// Update startGame logic
  socket.on('startGame', () => {
    gameState.phase = 'MEMORIZE';
    gameState.grid = initGrid(); 
    gameState.scores = { quentin: 0, yann: 0, mathurin: 0 };
    io.emit('gameState', gameState);

    setTimeout(() => {
      gameState.phase = 'GAME';
      // Find first connected player in order
      const firstPlayer = PREDEFINED_PLAYERS_ORDER.find(name => 
          Object.values(gameState.players).some(p => p.name === name)
      );
      gameState.currentTurn = firstPlayer || 'quentin';
      io.emit('gameState', gameState);
    }, 20000);
  });

// ... (inside answerQuestion)
  socket.on('revealTile', (tileId) => {
      if (gameState.phase !== 'GAME') return;
      
      // Check turn
      const player = gameState.players[socket.id];
      if (!player || player.name !== gameState.currentTurn) return;
      
      if (gameState.activeQuestion) return; // Already answering

      const tile = gameState.grid.find(t => t.id === tileId);
      if (tile && !tile.revealed) {
          tile.revealed = true;
          
          // Pick random question
          const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
          
          gameState.activeQuestion = {
              ...randomQuestion,
              tileId: tile.id,
              answeringPlayer: player.name
          };
          
          io.emit('gameState', gameState);
      }
  });

  socket.on('answerQuestion', ({ answerIndex }) => {
      if (!gameState.activeQuestion) return;

      const isCorrect = answerIndex === gameState.activeQuestion.correct;
      const player = gameState.players[socket.id];
      
      if (player && player.name === gameState.activeQuestion.answeringPlayer) {
          if (isCorrect) {
              gameState.scores[player.name] += 1; 
          }
          
          gameState.activeQuestion = null;
          gameState.answerFeedback = isCorrect ? 'correct' : 'incorrect';
          io.emit('gameState', gameState);
          
          setTimeout(() => {
              gameState.answerFeedback = null;

              // Rotate Turn Deterministically
              let currentIndex = PREDEFINED_PLAYERS_ORDER.indexOf(gameState.currentTurn);
              if (currentIndex === -1) currentIndex = 0;
              
              let nextPlayer = null;
              for (let i = 1; i <= PREDEFINED_PLAYERS_ORDER.length; i++) {
                  const nextIndex = (currentIndex + i) % PREDEFINED_PLAYERS_ORDER.length;
                  const candidateName = PREDEFINED_PLAYERS_ORDER[nextIndex];
                  // Check if this player is connected
                  const isConnected = Object.values(gameState.players).some(p => p.name === candidateName);
                  if (isConnected) {
                      nextPlayer = candidateName;
                      break;
                  }
              }
              
              if (nextPlayer) {
                  gameState.currentTurn = nextPlayer;
              }
              
              io.emit('gameState', gameState);
          }, 3000);
      }
  });

  socket.on('disconnect', () => {
    delete gameState.players[socket.id];
    io.emit('gameState', gameState);
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
