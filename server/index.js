import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load questions from all player files
const questionsDir = path.join(__dirname, '../src/data/questions');
const players = ['quentin', 'yann', 'mathurin', 'bastis', 'dan', 'lucas', 'victorien', 'admin'];
const questions = players.flatMap(player => {
  const filePath = path.join(questionsDir, `${player}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return [];
});

// Load neutral questions
const neutralFilePath = path.join(questionsDir, 'neutral.json');
const neutralQuestions = fs.existsSync(neutralFilePath)
  ? JSON.parse(fs.readFileSync(neutralFilePath, 'utf-8'))
  : [];

console.log(`Loaded ${questions.length} player questions + ${neutralQuestions.length} neutral questions`);

const app = express();
app.use(cors());

// Serve static files from the dist folder (production build)
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// SPA fallback - serve index.html for all non-API routes (Express 5 syntax)
app.get('/{*splat}', (req, res, next) => {
  // Skip socket.io requests
  if (req.path.startsWith('/socket.io')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Track active timer so we can clear it on restart
let activeTimerInterval = null;

// Game State
let gameState = {
  phase: 'LOBBY', // LOBBY, MEMORIZE, GAME, END
  memorizeTimer: 0, // Countdown timer for MEMORIZE phase
  players: {},
  grid: [],
  scores: {
    quentin: 0,
    yann: 0,
    mathurin: 0,
    bastis: 0,
    dan: 0,
    lucas: 0,
    victorien: 0
  },
  currentTurn: null,
  gridSize: 'full', // small | medium | large | full
  gridSide: 18, // side length of current grid
  selectedTile: null, // tile id being selected (blinking) before reveal
  activeQuestion: null, // { question, tileId, answeringPlayer }
  answerFeedback: null // 'correct' | 'incorrect' | null
};

// Predefined players configuration
const PLAYER_CONFIG = {
  quentin: { color: '#3b82f6', startPos: { x: -6, y: 2, z: 13 } },   // Blue - front row
  mathurin: { color: '#22c55e', startPos: { x: -1, y: 2, z: 13 } },   // Green - front row
  yann: { color: '#ef4444', startPos: { x: 4, y: 2, z: 13 } },        // Red - front row
  bastis: { color: '#f97316', startPos: { x: 9, y: 2, z: 13 } },      // Orange - front row
  dan: { color: '#8b5cf6', startPos: { x: -3.5, y: 2, z: 9 } },   // Purple - back row
  lucas: { color: '#06b6d4', startPos: { x: 1.5, y: 2, z: 9 } },      // Cyan - back row
  victorien: { color: '#ec4899', startPos: { x: 6.5, y: 2, z: 9 } },   // Pink - back row
  admin: { color: '#ffffff', startPos: { x: 0, y: 10, z: 20 } }       // White - spectator
};

// Player themes: Tier 1 = most knowledge = hardest questions = most points
// Tier 2 = medium, Tier 3 = least knowledge = easiest = fewer points
const PLAYER_THEMES = {
  quentin: [
    { theme: 'Thibaut Pinot', tier: 1 },
    { theme: 'League of Legends 2025', tier: 2 },
    { theme: 'Road Cycling > 2010', tier: 3 }
  ],
  yann: [
    { theme: 'MFL (Web3)', tier: 1 },
    { theme: 'Flags', tier: 2 },
    { theme: 'Quantum Physics', tier: 3 }
  ],
  mathurin: [
    { theme: 'WoW: Burning Crusade (Mage)', tier: 1 },
    { theme: 'OSS 117', tier: 2 },
    { theme: 'Harry Potter', tier: 3 }
  ],
  bastis: [
    { theme: 'Guitar', tier: 1 },
    { theme: 'Classic French Rap (pre-2010)', tier: 2 },
    { theme: 'Asymptotically Optimal Function Fields', tier: 3 }
  ],
  dan: [
    { theme: 'Football', tier: 1 },
    { theme: 'Geography', tier: 2 },
    { theme: 'Gaming', tier: 3 }
  ],
  lucas: [
    { theme: 'New Zealand', tier: 1 },
    { theme: 'NBA Players (2015-2025)', tier: 2 },
    { theme: 'AS Saint-Étienne 2025-26', tier: 3 }
  ],
  victorien: [
    { theme: 'Sum 41', tier: 1 },
    { theme: 'Video Games', tier: 2 },
    { theme: 'Geography', tier: 3 }
  ]
};

// Scoring: Tier 1 = 3pts, Tier 2 = 2pts, Tier 3 = 1pt
const TIER_POINTS = { 1: 3, 2: 2, 3: 1 };
const OPPONENT_BONUS = 1; // Bonus for answering opponent's theme correctly

// Helper: Get a random question from a player's themes
const getQuestionForTileOwner = (tileOwner) => {
  if (tileOwner === 'neutral' || !PLAYER_THEMES[tileOwner]) {
    // Neutral tile: pick from neutral questions pool
    const pool = neutralQuestions.length > 0 ? neutralQuestions : questions;
    const q = pool[Math.floor(Math.random() * pool.length)];
    return { ...q, tier: 2, tileOwner: 'neutral' }; // Neutral = 2 pts
  }

  // Pick a random theme from the tile owner's themes
  const playerThemes = PLAYER_THEMES[tileOwner];
  const themeInfo = playerThemes[Math.floor(Math.random() * playerThemes.length)];

  // Find questions matching this theme
  const themeQuestions = questions.filter(q => q.theme === themeInfo.theme);

  if (themeQuestions.length === 0) {
    // Fallback: pick any question if no matching theme questions
    const q = questions[Math.floor(Math.random() * questions.length)];
    return { ...q, tier: 2, tileOwner };
  }

  const q = themeQuestions[Math.floor(Math.random() * themeQuestions.length)];
  return { ...q, tier: themeInfo.tier, tileOwner };
};

// Grid size presets
const GRID_SIZES = {
  small: { side: 8, total: 64 },
  medium: { side: 12, total: 144 },
  large: { side: 15, total: 225 },
  full: { side: 18, total: 324 }
};

const PLAYER_NAMES = ['quentin', 'yann', 'mathurin', 'bastis', 'dan', 'lucas', 'victorien'];

// Initialize Grid with dynamic size, keeping same ratio per player
const initGrid = (sizeName = 'full') => {
  const size = GRID_SIZES[sizeName] || GRID_SIZES.full;
  const { side, total } = size;

  // Each player gets equal share, remainder goes to neutral
  const perPlayer = Math.floor(total / (PLAYER_NAMES.length + 1));
  const neutralCount = total - (perPlayer * PLAYER_NAMES.length);

  let types = [];
  for (const name of PLAYER_NAMES) {
    types.push(...Array(perPlayer).fill(name));
  }
  types.push(...Array(neutralCount).fill('neutral'));

  // Shuffle
  types.sort(() => Math.random() - 0.5);

  const tiles = [];
  for (let i = 0; i < total; i++) {
    tiles.push({
      id: i,
      type: types[i],
      revealed: false,
      x: i % side,
      y: Math.floor(i / side)
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

const PREDEFINED_PLAYERS_ORDER = ['quentin', 'mathurin', 'yann', 'bastis', 'dan', 'lucas', 'victorien'];

// ... (inside revealTile or wherever currentTurn is initialized)
// Update startGame logic
  socket.on('startGame', (sizeName) => {
    // Only admin can start the game
    const starter = gameState.players[socket.id];
    if (!starter || starter.name !== 'admin') return;

    // Clear any existing timer from a previous game
    if (activeTimerInterval) {
      clearInterval(activeTimerInterval);
      activeTimerInterval = null;
    }

    const validSize = GRID_SIZES[sizeName] ? sizeName : 'full';
    gameState.phase = 'MEMORIZE';
    gameState.gridSize = validSize;
    gameState.gridSide = GRID_SIZES[validSize].side;
    gameState.grid = initGrid(validSize);
    gameState.scores = { quentin: 0, yann: 0, mathurin: 0, bastis: 0, dan: 0, lucas: 0, victorien: 0 };
    gameState.activeQuestion = null;
    gameState.answerFeedback = null;
    gameState.selectedTile = null;
    gameState.currentTurn = null;
    gameState.memorizeTimer = 30;
    io.emit('gameState', gameState);

    // Countdown timer - broadcast every second
    activeTimerInterval = setInterval(() => {
      gameState.memorizeTimer -= 1;
      io.emit('gameState', gameState);

      if (gameState.memorizeTimer <= 0) {
        clearInterval(activeTimerInterval);
        activeTimerInterval = null;
        gameState.phase = 'GAME';
        gameState.memorizeTimer = 0;
        // Find first connected player in order
        const firstPlayer = PREDEFINED_PLAYERS_ORDER.find(name =>
            Object.values(gameState.players).some(p => p.name === name)
        );
        gameState.currentTurn = firstPlayer || 'quentin';
        io.emit('gameState', gameState);
      }
    }, 1000);
  });

  socket.on('restartGame', () => {
    // Only admin can restart the game
    const restarter = gameState.players[socket.id];
    if (!restarter || restarter.name !== 'admin') return;

    // Clear any active timer
    if (activeTimerInterval) {
      clearInterval(activeTimerInterval);
      activeTimerInterval = null;
    }

    gameState.phase = 'LOBBY';
    gameState.gridSize = 'full';
    gameState.gridSide = 18;
    gameState.grid = initGrid('full');
    gameState.scores = { quentin: 0, yann: 0, mathurin: 0, bastis: 0, dan: 0, lucas: 0, victorien: 0 };
    gameState.currentTurn = null;
    gameState.activeQuestion = null;
    gameState.answerFeedback = null;
    gameState.selectedTile = null;
    gameState.memorizeTimer = 0;
    gameState.lastPoints = undefined;

    // Reset all player positions to their start positions
    Object.values(gameState.players).forEach((p) => {
      const config = PLAYER_CONFIG[p.name];
      if (config) {
        p.x = config.startPos.x;
        p.y = config.startPos.y;
        p.z = config.startPos.z;
      }
    });

    io.emit('restartGame');
    io.emit('gameState', gameState);
  });

// Reveal tile and get question based on tile owner's themes
  socket.on('revealTile', (tileId) => {
      if (gameState.phase !== 'GAME') return;

      // Check turn
      const player = gameState.players[socket.id];
      if (!player || player.name !== gameState.currentTurn) return;

      if (gameState.activeQuestion) return; // Already answering
      if (gameState.selectedTile !== null && gameState.selectedTile !== undefined) return; // Already selecting

      const tile = gameState.grid.find(t => t.id === tileId);
      if (tile && !tile.revealed) {
          // Phase 1: Show selected tile blinking to everyone
          gameState.selectedTile = tileId;
          io.emit('gameState', gameState);

          // Phase 2: After 2 seconds, reveal the tile and show question
          setTimeout(() => {
              tile.revealed = true;
              gameState.selectedTile = null;

              // Get question from tile owner's themes
              const questionData = getQuestionForTileOwner(tile.type);

              gameState.activeQuestion = {
                  ...questionData,
                  tileId: tile.id,
                  answeringPlayer: player.name
              };

              io.emit('gameState', gameState);
          }, 2000);
      }
  });

  socket.on('answerQuestion', ({ answerIndex }) => {
      if (!gameState.activeQuestion) return;
      if (gameState.activeQuestion.selectedAnswer !== undefined) return; // Already answered

      const player = gameState.players[socket.id];
      if (!player || player.name !== gameState.activeQuestion.answeringPlayer) return;

      // Phase 1: Show selected answer to everyone for 5 seconds
      gameState.activeQuestion.selectedAnswer = answerIndex;
      io.emit('gameState', gameState);

      // Phase 2: After 5s, reveal correct/incorrect
      setTimeout(() => {
          if (!gameState.activeQuestion) return;

          const isCorrect = answerIndex === gameState.activeQuestion.correct;

          if (isCorrect) {
              // Calculate points based on tier
              const tier = gameState.activeQuestion.tier || 2;
              let points = TIER_POINTS[tier] || 2;

              // Bonus for answering opponent's theme
              const tileOwner = gameState.activeQuestion.tileOwner;
              if (tileOwner && tileOwner !== 'neutral' && tileOwner !== player.name) {
                  points += OPPONENT_BONUS;
              }

              gameState.scores[player.name] += points;
              gameState.lastPoints = points; // For UI feedback
          } else {
              gameState.lastPoints = 0;
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
      }, 5000);
  });

  socket.on('disconnect', () => {
    delete gameState.players[socket.id];
    io.emit('gameState', gameState);
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
