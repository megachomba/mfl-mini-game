import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store';

// Preload audio
const correctAudio = new Audio('/audio/correct.mp3');
const incorrectAudio = new Audio('/audio/wrong.mp3');

// FPS counter hook
const useFPS = () => {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let animationId: number;

    const updateFPS = () => {
      frameCount.current++;
      const now = performance.now();
      const delta = now - lastTime.current;

      if (delta >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / delta));
        frameCount.current = 0;
        lastTime.current = now;
      }

      animationId = requestAnimationFrame(updateFPS);
    };

    animationId = requestAnimationFrame(updateFPS);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return fps;
};

export const UI = () => {
  const { gameState, playerName, latency } = useGameStore();
  const fps = useFPS();

  // Audio Effect Hook
  useEffect(() => {
    if (gameState?.answerFeedback === 'correct') {
        correctAudio.currentTime = 0;
        correctAudio.play().catch(e => console.warn('Audio play failed', e));
    } else if (gameState?.answerFeedback === 'incorrect') {
        incorrectAudio.currentTime = 0;
        incorrectAudio.play().catch(e => console.warn('Audio play failed', e));
    }
  }, [gameState?.answerFeedback]);

  if (!gameState) return <div className="absolute top-4 left-4 text-white font-mono animate-pulse">Connecting to MFL Studio...</div>;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* Broadcast Header */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-4">
             <div className="bg-red-600 text-white px-3 py-1 font-bold text-sm rounded animate-pulse">LIVE</div>
             <h1 className="text-3xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 filter drop-shadow-lg">
                MFL GRAND CONCOURS
             </h1>
        </div>
        
        {/* Phase Indicator */}
        <div className="flex flex-col items-end">
            <div className="text-sm text-gray-400 uppercase tracking-widest">Current Phase</div>
            <div className="text-2xl font-bold text-white drop-shadow-md">{gameState.phase}</div>
            {gameState.phase === 'LOBBY' && (
                <button 
                    className="mt-2 pointer-events-auto bg-white text-black px-4 py-1 rounded font-bold hover:scale-105 transition-transform shadow-lg hover:shadow-xl border-2 border-transparent hover:border-blue-500"
                    onClick={() => useGameStore.getState().socket?.emit('startGame')}
                >
                    START SHOW
                </button>
            )}
        </div>
      </div>

      {/* Player Name Display */}
      {playerName && (
        <div className="absolute top-24 left-6 text-white font-bold text-lg bg-black/50 px-3 py-1 rounded-md">
          Playing as: <span className="text-yellow-400">{playerName.toUpperCase()}</span>
        </div>
      )}

      {/* Scoreboard (Bottom Left) */}
      <div className="absolute bottom-8 left-8 bg-black/60 backdrop-blur-md border-l-4 border-blue-500 p-4 rounded-r-lg shadow-2xl text-white transform skew-x-[-5deg]">
         <div className="skew-x-[5deg]">
            <h3 className="text-xs uppercase text-blue-400 font-bold mb-2">Scores</h3>
            <ul className="space-y-2 font-mono text-lg">
                <li className="flex justify-between gap-8 border-b border-gray-700 pb-1">
                    <span>QUENTIN</span> 
                    <span className="font-bold text-yellow-400">{gameState.scores.quentin}</span>
                </li>
                <li className="flex justify-between gap-8 border-b border-gray-700 pb-1">
                    <span>YANN</span> 
                    <span className="font-bold text-red-400">{gameState.scores.yann}</span>
                </li>
                <li className="flex justify-between gap-8">
                    <span>MATHURIN</span> 
                    <span className="font-bold text-green-400">{gameState.scores.mathurin}</span>
                </li>
            </ul>
         </div>
      </div>

      {/* Turn Indicator (Bottom Right) */}
      <div className="absolute bottom-8 right-8">
         <div className="bg-gradient-to-l from-blue-900/80 to-black/60 backdrop-blur-md p-4 rounded-l-lg border-r-4 border-yellow-400 shadow-2xl text-right">
            <div className="text-xs text-gray-400 uppercase">Current Turn</div>
            <div className="text-4xl font-black text-white italic tracking-tighter uppercase">
                {gameState.currentTurn || "WAITING"}
            </div>
         </div>
      </div>
      
      {/* Crosshair (Center Screen) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-2 h-2 bg-white/80 rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]"></div>
      </div>

      {/* Performance Stats (Bottom Center) */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-4 font-mono text-xs text-gray-400 bg-black/40 px-3 py-1 rounded">
        <span className={fps < 30 ? 'text-red-400' : fps < 55 ? 'text-yellow-400' : 'text-green-400'}>
          FPS: {fps}
        </span>
        <span className={latency > 100 ? 'text-red-400' : latency > 50 ? 'text-yellow-400' : 'text-green-400'}>
          Ping: {latency}ms
        </span>
      </div>
    </div>
  );
};