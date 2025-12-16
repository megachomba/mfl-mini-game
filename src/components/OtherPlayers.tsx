import { useGameStore } from '../store';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Character } from './Character';

export const OtherPlayers = () => {
  const { gameState, playerName } = useGameStore();

  if (!gameState || !gameState.players) return null;

  return (
    <>
      {Object.values(gameState.players).map((p: any) => {
        if (p.name === playerName) return null;
        return <RemotePlayerWrapper key={p.id} p={p} />;
      })}
    </>
  );
};

const RemotePlayerWrapper = ({ p }: { p: any }) => {
    const position = useRef([p.x, p.y, p.z]);
    const rotation = useRef(p.rot || 0);
    const isMoving = useRef(false);

    // Pooled vectors to avoid allocations in useFrame
    const vectors = useMemo(() => ({
        target: new THREE.Vector3(),
        current: new THREE.Vector3(),
    }), []);

    useFrame((_state, delta) => {
        vectors.target.set(p.x, p.y, p.z);
        vectors.current.set(position.current[0], position.current[1], position.current[2]);

        const dist = vectors.current.distanceTo(vectors.target);
        isMoving.current = dist > 0.01;

        // Lerp Position
        vectors.current.lerp(vectors.target, 10 * delta);
        position.current = [vectors.current.x, vectors.current.y, vectors.current.z];

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
