import { memo, useMemo } from 'react';
import { useGameStore } from '../store';
import { Text, RoundedBox } from '@react-three/drei';

// Preload tile reveal audio
const tileRevealAudio = new Audio('/audio/tile-reveal.mp3');
const playTileSound = () => {
  tileRevealAudio.currentTime = 0;
  tileRevealAudio.play().catch(e => console.warn('Audio play failed', e));
};

const COLORS = {
  quentin: '#3b82f6', // blue
  yann: '#ef4444', // red
  mathurin: '#22c55e', // green
  bastis: '#f97316', // orange
  jacques: '#8b5cf6', // purple
  lucas: '#06b6d4', // cyan
  victorien: '#ec4899', // pink
  neutral: '#9ca3af', // gray
  hidden: '#fbbf24', // gold
};

export const Grid = () => {
  const { gameState, playerName } = useGameStore();

  if (!gameState || !gameState.grid) return null;

  // Extract values to pass to memoized tiles
  const { phase, currentTurn, activeQuestion, grid } = gameState;
  const hasActiveQuestion = !!activeQuestion;

  return (
    <group position={[0, 8, -18]}> {/* Lifted up and pushed back for grand view */}

       {/* TV Frame / Bezel */}
       <group>
            {/* Main Bezel */}
            <RoundedBox args={[13, 11, 1]} radius={0.5} position={[0, 0, -0.6]}>
                <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
            </RoundedBox>

            {/* Screen "Glass" Background */}
            <mesh position={[0, 0, -0.2]}>
                <planeGeometry args={[12, 10]} />
                <meshStandardMaterial color="#000" metalness={0.2} roughness={0.2} />
            </mesh>

            {/* Bottom Chin with Logo */}
            <mesh position={[0, -5.2, -0.5]}>
                <boxGeometry args={[13, 1, 0.8]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} />
            </mesh>
            <Text position={[0, -5.2, -0.05]} fontSize={0.4} color="#94a3b8" letterSpacing={0.1}>
                MFL TV
            </Text>
       </group>

      {grid.map((tile: any) => (
        <Tile
          key={tile.id}
          tile={tile}
          phase={phase}
          currentTurn={currentTurn}
          playerName={playerName}
          hasActiveQuestion={hasActiveQuestion}
        />
      ))}

      {/* Feedback Overlay */}
      {gameState.answerFeedback && (
          <group position={[0, 0, 2]}>
             <mesh>
                <planeGeometry args={[12, 10]} />
                <meshBasicMaterial color="black" transparent opacity={0.8} />
             </mesh>
             <Text 
                fontSize={3} 
                color={gameState.answerFeedback === 'correct' ? '#4ade80' : '#f87171'} 
                font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
                outlineWidth={0.2}
                outlineColor="#000"
             >
                {gameState.answerFeedback === 'correct' ? 'CORRECT!' : 'WRONG!'}
             </Text>
          </group>
      )}
    </group>
  );
};

// Memoized tile component - prevents re-renders when other tiles change
const Tile = memo(({ tile, phase, currentTurn, playerName, hasActiveQuestion }: {
  tile: any;
  phase: string;
  currentTurn: string | null;
  playerName: string | null;
  hasActiveQuestion: boolean;
}) => {
  const isHidden = phase === 'GAME' && !tile.revealed;
  const isMyTurn = currentTurn === playerName;
  const canInteract = isMyTurn && isHidden && phase === 'GAME' && !hasActiveQuestion;

  // Memoize color calculation
  const color = useMemo(() => {
    if (phase === 'GAME' && !tile.revealed) {
      return COLORS.hidden;
    }
    return COLORS[tile.type as keyof typeof COLORS];
  }, [phase, tile.revealed, tile.type]);

  // Memoize position calculation
  const position = useMemo(() => {
    const spacing = 0.6;
    const xPos = (tile.x - 8.5) * spacing;
    const yPos = (tile.y - 8.5) * spacing;
    return [xPos, yPos, 0] as [number, number, number];
  }, [tile.x, tile.y]);

  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          if (canInteract) {
            playTileSound();
            useGameStore.getState().socket?.emit('revealTile', tile.id);
          }
        }}
        onPointerOver={() => {
          if (canInteract) document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        {/* Simple box instead of RoundedBox - much cheaper */}
        <boxGeometry args={[0.52, 0.52, 0.06]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHidden ? 0.3 : 0.5}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>
      {/* Question mark indicator - simple mesh instead of Text */}
      {isHidden && (
        <mesh position={[0, 0, 0.04]}>
          <circleGeometry args={[0.12, 16]} />
          <meshBasicMaterial color="#000" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
});
