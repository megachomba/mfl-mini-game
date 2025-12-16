import { useGameStore } from '../store';
import { Text, RoundedBox } from '@react-three/drei';

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
  const { gameState } = useGameStore();

  if (!gameState || !gameState.grid) return null;

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

      {gameState.grid.map((tile: any) => (
        <Tile key={tile.id} tile={tile} phase={gameState.phase} />
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

const Tile = ({ tile, phase }: { tile: any, phase: string }) => {
  const { gameState, playerName } = useGameStore();
  const isHidden = phase === 'GAME' && !tile.revealed;
  const isMyTurn = gameState.currentTurn === playerName;
  const canInteract = isMyTurn && isHidden && phase === 'GAME' && !gameState.activeQuestion;
  
  let color = COLORS[tile.type as keyof typeof COLORS];
  if (phase === 'GAME' && !tile.revealed) {
      color = COLORS.hidden;
  }
  
  // Grid is 10x10. x: 0..9, y: 0..9. 
  // Width 10, Height 10. Center is 4.5, 4.5.
  // We scale tiles slightly to fit nicely in 12x10 area
  // Spacing: 1.1 units
  const xPos = (tile.x - 4.5) * 1.1;
  const yPos = (tile.y - 4.5) * 1.0;

  return (
    <group position={[xPos, yPos, 0]}>
        <mesh 
            onClick={(e) => {
                e.stopPropagation();
                if (canInteract) {
                    useGameStore.getState().socket?.emit('revealTile', tile.id);
                }
            }}
            onPointerOver={() => {
                if (canInteract) document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => document.body.style.cursor = 'auto'}
        >
        <RoundedBox args={[1.0, 0.9, 0.1]} radius={0.05} smoothness={4}>
            <meshStandardMaterial 
                color={color} 
                emissive={color}
                emissiveIntensity={isHidden ? 0.2 : 0.5}
                roughness={0.2}
                metalness={0.5}
            />
        </RoundedBox>
        
        {isHidden && (
            <Text 
                position={[0, 0, 0.06]} 
                fontSize={0.5} 
                color="black"
                font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
            >
                ?
            </Text>
        )}
        </mesh>
    </group>
  );
};
