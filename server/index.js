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
const players = ['quentin', 'yann', 'mathurin', 'bastis', 'jacques', 'lucas', 'victorien'];
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
    jacques: 0,
    lucas: 0,
    victorien: 0
  },
  currentTurn: null,
  activeQuestion: null, // { question, tileId, answeringPlayer }
  answerFeedback: null // 'correct' | 'incorrect' | null
};

// Predefined players configuration
const PLAYER_CONFIG = {
  quentin: { color: '#3b82f6', startPos: { x: -12, y: 2, z: 11 } }, // Blue
  mathurin: { color: '#22c55e', startPos: { x: -7, y: 2, z: 11 } },  // Green
  yann: { color: '#ef4444', startPos: { x: -2, y: 2, z: 11 } },      // Red
  bastis: { color: '#f97316', startPos: { x: 3, y: 2, z: 11 } },    // Orange
  jacques: { color: '#8b5cf6', startPos: { x: 8, y: 2, z: 11 } },   // Purple
  lucas: { color: '#06b6d4', startPos: { x: 13, y: 2, z: 11 } },    // Cyan
  victorien: { color: '#ec4899', startPos: { x: 18, y: 2, z: 11 } } // Pink
};

// Player themes: Tier 1 = most knowledge = hardest questions = most points
// Tier 2 = medium, Tier 3 = least knowledge = easiest = fewer points
const PLAYER_THEMES = {
  quentin: [
    { theme: 'Thibaut Pinot', tier: 1 },
    { theme: 'League of Legends 2025', tier: 2 },
    { theme: 'Cyclisme Route > 2010', tier: 3 }
  ],
  yann: [
    { theme: 'MFL (Web3)', tier: 1 },
    { theme: 'Drapeaux', tier: 2 },
    { theme: 'Physique Quantique', tier: 3 }
  ],
  mathurin: [
    { theme: 'WoW: Burning Crusade (Mage)', tier: 1 },
    { theme: 'OSS 117', tier: 2 },
    { theme: 'Harry Potter', tier: 3 }
  ],
  bastis: [
    { theme: 'La Guitare', tier: 1 },
    { theme: 'Rap Français Ancien (avant 2010)', tier: 2 },
    { theme: 'Corps de Fonctions Asymptotiquement Optimaux', tier: 3 }
  ],
  jacques: [
    { theme: 'Voiture', tier: 1 },
    { theme: 'Blockchain', tier: 2 },
    { theme: 'Piano', tier: 3 }
  ],
  lucas: [
    { theme: 'New Zealand', tier: 1 },
    { theme: 'NBA Players (2015-2025)', tier: 2 },
    { theme: 'AS Saint-Étienne 2025-26', tier: 3 }
  ],
  victorien: [
    { theme: 'Sum 41', tier: 1 },
    { theme: 'Jeux Vidéo', tier: 2 },
    { theme: 'Géographie', tier: 3 }
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

// Initialize Grid (18x18 = 324 tiles)
const initGrid = () => {
  const tiles = [];
  // 40 tiles per player (7 players = 280) + 44 Neutral = 324
  let types = [
    ...Array(40).fill('quentin'),
    ...Array(40).fill('yann'),
    ...Array(40).fill('mathurin'),
    ...Array(40).fill('bastis'),
    ...Array(40).fill('jacques'),
    ...Array(40).fill('lucas'),
    ...Array(40).fill('victorien'),
    ...Array(44).fill('neutral')
  ];

  // Shuffle
  types.sort(() => Math.random() - 0.5);

  for(let i=0; i<324; i++) {
    tiles.push({
      id: i,
      type: types[i],
      revealed: false,
      x: i % 18,
      y: Math.floor(i / 18)
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

const PREDEFINED_PLAYERS_ORDER = ['quentin', 'mathurin', 'yann', 'bastis', 'jacques', 'lucas', 'victorien'];

// ... (inside revealTile or wherever currentTurn is initialized)
// Update startGame logic
  socket.on('startGame', () => {
    gameState.phase = 'MEMORIZE';
    gameState.grid = initGrid();
    gameState.scores = { quentin: 0, yann: 0, mathurin: 0, bastis: 0, jacques: 0, lucas: 0, victorien: 0 };
    gameState.memorizeTimer = 30;
    io.emit('gameState', gameState);

    // Countdown timer - broadcast every second
    const timerInterval = setInterval(() => {
      gameState.memorizeTimer -= 1;
      io.emit('gameState', gameState);

      if (gameState.memorizeTimer <= 0) {
        clearInterval(timerInterval);
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

// Reveal tile and get question based on tile owner's themes
  socket.on('revealTile', (tileId) => {
      if (gameState.phase !== 'GAME') return;

      // Check turn
      const player = gameState.players[socket.id];
      if (!player || player.name !== gameState.currentTurn) return;

      if (gameState.activeQuestion) return; // Already answering

      const tile = gameState.grid.find(t => t.id === tileId);
      if (tile && !tile.revealed) {
          tile.revealed = true;

          // Get question from tile owner's themes
          const questionData = getQuestionForTileOwner(tile.type);

          gameState.activeQuestion = {
              ...questionData,
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
      }
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
