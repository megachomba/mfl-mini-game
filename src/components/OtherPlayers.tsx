import { useGameStore, usePlayerPositions } from '../store';
import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Character } from './Character';

export const OtherPlayers = () => {
  const gameState = useGameStore((s) => s.gameState);
  const playerName = useGameStore((s) => s.playerName);

  if (!gameState || !gameState.players) return null;

  const otherPlayers = Object.values(gameState.players).filter(
    (p: any) => p.name !== playerName && p.name !== 'admin'
  );

  return (
    <>
      {otherPlayers.map((p: any) => (
        <RemotePlayerWrapper key={p.id} playerId={p.id} initialPos={p} color={p.color} modelId={p.modelId} />
      ))}
    </>
  );
};

const RemotePlayerWrapper = memo(({ playerId, initialPos, color, modelId }: {
  playerId: string;
  initialPos: any;
  color: string;
  modelId: string;
}) => {
  const position = useRef<[number, number, number]>([initialPos.x, initialPos.y, initialPos.z]);
  const rotation = useRef(initialPos.rot || 0);
  const isMoving = useRef(false);

  const vectors = useMemo(() => ({
    target: new THREE.Vector3(),
    current: new THREE.Vector3(),
  }), []);

  // Read positions from the separate high-frequency store — no React re-renders
  useFrame((_state, delta) => {
    const pos = usePlayerPositions.getState().positions[playerId];
    if (!pos) return;

    vectors.target.set(pos.x, pos.y, pos.z);
    vectors.current.set(position.current[0], position.current[1], position.current[2]);

    const dist = vectors.current.distanceTo(vectors.target);
    isMoving.current = dist > 0.01;

    vectors.current.lerp(vectors.target, 10 * delta);
    position.current = [vectors.current.x, vectors.current.y, vectors.current.z];

    let diff = (pos.rot || 0) - rotation.current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    rotation.current += diff * 10 * delta;
  });

  return (
    <Character
      position={position.current}
      rotation={rotation.current}
      isMoving={isMoving.current}
      color={color}
      modelId={modelId}
    />
  );
});
