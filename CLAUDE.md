# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start Vite dev server (frontend only)
node server/index.js # Start Socket.io game server on port 3000

# Build & Lint
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint
npm run preview      # Preview production build
```

Both the frontend dev server and backend server must run simultaneously for the game to work.

## Architecture

This is a multiplayer 3D trivia game show ("MFL Grand Concours") built with React Three Fiber and Socket.io.

### Frontend (React + Three.js)
- **Entry**: `src/main.tsx` → `src/App.tsx`
- **3D Scene**: `src/components/Experience.tsx` - Main scene composition with studio lighting, floor, player desks, grid display, and audience
- **State**: `src/store.ts` - Zustand store managing Socket.io connection and game state synchronization
- **Player Control**: First-person controls via `@react-three/drei` PointerLockControls with WASD/arrow movement

### Backend (Node.js + Socket.io)
- **Server**: `server/index.js` - Express + Socket.io server managing game state, player connections, turn logic, and question/answer flow
- **Questions**: `src/data/questions.json` - Trivia question bank

### Key Components
| Component | Purpose |
|-----------|---------|
| `Player.tsx` | Local player physics (Rapier capsule collider), camera sync, movement input, position broadcasting |
| `OtherPlayers.tsx` | Renders remote players with interpolated positions via `Character.tsx` |
| `Character.tsx` | Animated GLB soldier model with Idle/Run states, per-instance color |
| `Grid.tsx` | 10x10 tile grid displayed on TV screen, handles tile reveals and question feedback |
| `Desk.tsx` | Player desk with question UI, answer buttons for active player |
| `Audience.tsx` | 80 crowd members with cheering animation on correct answers |
| `UI.tsx` | HUD overlay: scores, turn indicator, phase display, audio feedback |

### Game Flow
1. **LOBBY** → Players select character (quentin/yann/mathurin), connect via Socket.io
2. **MEMORIZE** (20s) → Grid displayed with colors revealed for memorization
3. **GAME** → Turn-based tile reveals, questions appear on desks, correct answers score points

### Networking
- Player positions broadcast at 30ms throttle via `move` event
- Game state broadcast to all clients on changes via `gameState` event
- Events: `join`, `move`, `startGame`, `revealTile`, `answerQuestion`

### Assets
- GLB models: `/public/models/soldier.glb` (players), `/public/models/audience.glb` (crowd)
- Audio: `/public/audio/correct.mp3`, `/public/audio/wrong.mp3`
