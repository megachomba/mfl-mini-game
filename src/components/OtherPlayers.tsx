import { useGameStore } from '../store';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Character } from './Character';

export const OtherPlayers = () => {
  const { gameState, playerName } = useGameStore();

  if (!gameState || !gameState.players) return null;

  return (
    <>
      {Object.values(gameState.players).map((p: any) => {
        if (p.name === playerName) return null; // Don't render self
        return <RemotePlayerWrapper key={p.id} p={p} />;
      })}
    </>
  );
};

const RemotePlayerWrapper = ({ p }: { p: any }) => {
    const position = useRef([p.x, p.y, p.z]);
    const rotation = useRef(p.rot || 0);
    const isMoving = useRef(false);
    
    useFrame((_state, delta) => {
        const targetPos = new THREE.Vector3(p.x, p.y, p.z);
        const currentPos = new THREE.Vector3(...position.current);
        
        const dist = currentPos.distanceTo(targetPos);
        isMoving.current = dist > 0.01;
        
        // Lerp Position
        currentPos.lerp(targetPos, 10 * delta);
        position.current = [currentPos.x, currentPos.y, currentPos.z];
        
        // Lerp Rotation
        let diff = (p.rot || 0) - rotation.current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        rotation.current += diff * 10 * delta;
    });

    return (
        <Character 
            position={position.current as [number, number, number]} 
            rotation={rotation.current} 
            isMoving={isMoving.current} 
            color={p.color}
        />
    );
};
