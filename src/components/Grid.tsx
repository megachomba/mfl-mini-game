import React, { memo, useMemo, useRef, useCallback } from 'react';
import { useGameStore } from '../store';
import { Text, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const tileRevealAudio = new Audio('/audio/tile-reveal.mp3');
const playTileSound = () => {
  tileRevealAudio.currentTime = 0;
  tileRevealAudio.play().catch(e => console.warn('Audio play failed', e));
};

const COLORS: Record<string, string> = {
  quentin: '#8B4513',
  yann: '#ff1a1a',
  mathurin: '#00e639',
  bastis: '#ff8c00',
  dan: '#7c3aed',
  lucas: '#00d4ff',
  victorien: '#ff1493',
  neutral: '#8b8b8b',
  hidden: '#fbbf24',
};

export const Grid = () => {
  const gameState = useGameStore((s) => s.gameState);
  const playerName = useGameStore((s) => s.playerName);

  if (!gameState || !gameState.grid) return null;

  // Extract values to pass to memoized tiles
  const { phase, currentTurn, activeQuestion, grid, selectedTile, gridSide = 18 } = gameState;
  const hasActiveQuestion = !!activeQuestion;
  const isSelecting = selectedTile !== null && selectedTile !== undefined;

  // Get theme name to display
  const themeText = activeQuestion?.theme || null;

  // Scale TV frame to fit grid - grid always occupies 11 units width, add padding
  const screenSize = 11;
  const padding = 1.5;
  const screenW = screenSize + padding;
  const screenH = screenSize + padding;
  const bezelW = screenW + 1;
  const bezelH = screenH + 1;
  const chinY = -(bezelH / 2) - 0.2;

  return (
    <group position={[0, 8, -18]}> {/* Lifted up and pushed back for grand view */}

       {/* TV Frame / Bezel */}
       <group>
            {/* Main Bezel */}
            <RoundedBox args={[bezelW, bezelH, 1]} radius={0.5} position={[0, 0, -0.6]}>
                <meshBasicMaterial color="#0f172a" />
            </RoundedBox>

            {/* Screen Background - no reflections */}
            <mesh position={[0, 0, -0.2]}>
                <planeGeometry args={[screenW, screenH]} />
                <meshBasicMaterial color="#000" />
            </mesh>

            {/* Bottom Chin with Logo */}
            <mesh position={[0, chinY, -0.5]}>
                <boxGeometry args={[bezelW, 1, 0.8]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} />
            </mesh>
            <Text position={[0, chinY, -0.05]} fontSize={0.4} color="#94a3b8" letterSpacing={0.1}>
                MFL TV
            </Text>
       </group>

      {/* Theme display on screen */}
      {themeText && (
        <group position={[0, screenH / 2 + 0.5, 0.5]}>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[screenW, 0.8]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
          <Text
            fontSize={0.4}
            color="#fbbf24"
            maxWidth={screenW - 1}
            textAlign="center"
            anchorY="middle"
          >
            {`Thème: ${themeText}`}
          </Text>
        </group>
      )}

      {grid.map((tile: any) => {
        const isHidden = phase === 'GAME' && !tile.revealed;
        const isMyTurn = currentTurn === playerName;
        const canInteract = isMyTurn && isHidden && phase === 'GAME' && !hasActiveQuestion && !isSelecting;
        return (
          <Tile
            key={tile.id}
            tile={tile}
            isHidden={isHidden}
            canInteract={canInteract}
            isSelected={tile.id === selectedTile}
            gridSide={gridSide}
          />
        );
      })}

      {/* Feedback Overlay */}
      {gameState.answerFeedback && (
          <group position={[0, 0, 2]}>
             <mesh>
                <planeGeometry args={[screenW, screenH]} />
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

// Blinking tile wrapper - only used for the selected tile
const BlinkingTile = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<any>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      // Blink by toggling visibility at ~4Hz
      const visible = Math.sin(clock.getElapsedTime() * 12) > 0;
      ref.current.visible = visible;
    }
  });

  return <group ref={ref}>{children}</group>;
};

// Tile only receives the data it needs — no shared game-level props that change frequently
const Tile = memo(({ tile, isHidden, canInteract, isSelected, gridSide }: {
  tile: any;
  isHidden: boolean;
  canInteract: boolean;
  isSelected: boolean;
  gridSide: number;
}) => {
  const color = isSelected ? '#ffffff' : isHidden ? COLORS.hidden : (COLORS[tile.type] || COLORS.neutral);

  const position = useMemo(() => {
    const screenWidth = 11;
    const spacing = screenWidth / gridSide;
    const center = (gridSide - 1) / 2;
    return [(tile.x - center) * spacing, (center - tile.y) * spacing, 0] as [number, number, number];
  }, [tile.x, tile.y, gridSide]);

  const tileSize = useMemo(() => (11 / gridSide) * 0.88, [gridSide]);

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    if (canInteract) {
      playTileSound();
      useGameStore.getState().socket?.emit('revealTile', tile.id);
    }
  }, [canInteract, tile.id]);

  const handlePointerOver = useCallback(() => {
    if (canInteract) document.body.style.cursor = 'pointer';
  }, [canInteract]);

  const handlePointerOut = useCallback(() => { document.body.style.cursor = 'auto'; }, []);

  const tileNumber = tile.id + 1;
  const fontSize = tileSize * 0.4;

  const tileContent = (
    <group position={position}>
      <mesh onClick={handleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <boxGeometry args={[tileSize, tileSize, 0.06]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Text
        position={[0, 0, 0.04]}
        fontSize={fontSize}
        color={isHidden ? '#000' : '#fff'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={fontSize * 0.08}
        outlineColor={isHidden ? '#fbbf24' : color}
      >
        {`${tileNumber}`}
      </Text>
    </group>
  );

  if (isSelected) {
    return <BlinkingTile>{tileContent}</BlinkingTile>;
  }

  return tileContent;
});
