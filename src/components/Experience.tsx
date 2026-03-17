import { Environment, PointerLockControls } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { Grid } from './Grid';
import { Player } from './Player';
import { OtherPlayers } from './OtherPlayers';
import { FunObjects } from './FunObjects';
import { Desk } from './Desk';
import { Audience } from './Audience';
import { Bleachers } from './Bleachers';
import { useGameStore } from '../store';

const SpectatorPlayer = () => {
  const { camera } = useThree();
  const [, getKeys] = useKeyboardControls();
  const lastUpdate = useRef(0);

  const vectors = useMemo(() => ({
    forward: new THREE.Vector3(),
    right: new THREE.Vector3(),
    up: new THREE.Vector3(0, 1, 0),
    moveDir: new THREE.Vector3(),
  }), []);

  // Set initial position
  const initialized = useRef(false);
  if (!initialized.current) {
    camera.position.set(0, 10, 20);
    initialized.current = true;
  }

  useFrame(() => {
    const { forward, backward, left, right, jump } = getKeys();

    camera.getWorldDirection(vectors.forward);
    vectors.forward.normalize();
    vectors.right.crossVectors(vectors.forward, vectors.up).normalize();

    vectors.moveDir.set(0, 0, 0);
    if (forward) vectors.moveDir.add(vectors.forward);
    if (backward) vectors.moveDir.sub(vectors.forward);
    if (right) vectors.moveDir.add(vectors.right);
    if (left) vectors.moveDir.sub(vectors.right);
    if (jump) vectors.moveDir.add(vectors.up);

    if (vectors.moveDir.length() > 0) {
      vectors.moveDir.normalize().multiplyScalar(0.3);
      camera.position.add(vectors.moveDir);
    }

    // Broadcast position
    const now = Date.now();
    if (useGameStore.getState().socket && now - lastUpdate.current > 30) {
      lastUpdate.current = now;
      const pos = camera.position;
      useGameStore.getState().socket?.emit('move', { x: pos.x, y: pos.y, z: pos.z, rot: 0 });
    }
  });

  return <PointerLockControls />;
};

export const Experience = () => {
  const playerName = useGameStore((s) => s.playerName);

  return (
    <>
      <Environment preset="studio" />
      
      <ambientLight intensity={0.4} />

      {/* Single shadow-casting spotlight instead of two */}
      <spotLight position={[0, 20, 10]} angle={0.4} penumbra={1} intensity={200} castShadow shadow-mapSize-width={512} shadow-mapSize-height={512} shadow-bias={-0.0001} />
      {/* Fill light — no shadows */}
      <spotLight position={[-10, 15, 5]} angle={0.5} penumbra={1} intensity={80} />
      <pointLight position={[0, 10, -10]} intensity={100} color="#4c1d95" />

      {/* Studio Floor — simple material instead of expensive MeshReflectorMaterial */}
      <RigidBody type="fixed" friction={2} restitution={0.5}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#151515" metalness={0.4} roughness={0.3} />
        </mesh>
      </RigidBody>

      {/* Studio Structure - Decorative Trusses/Pillars */}
      <group>
          {[-20, 20].map((x) => (
              <mesh key={x} position={[x, 10, -10]}>
                  <boxGeometry args={[2, 20, 2]} />
                  <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
              </mesh>
          ))}
          <mesh position={[0, 20, -10]}>
              <boxGeometry args={[42, 2, 2]} />
              <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
          </mesh>
      </group>

      {/* The Game Grid (TV Screen) */}
      <Grid />
      
      {/* Desks (Pupitres) - Two rows */}
      {/* Front row (4 desks) */}
      <Desk position={[-6, 0, 10]} color="#8B4513" label="Quentin" />
      <Desk position={[-1, 0, 10]} color="#22c55e" label="Mathurin" />
      <Desk position={[4, 0, 10]} color="#ef4444" label="Yann" />
      <Desk position={[9, 0, 10]} color="#f97316" label="Bastis" />
      {/* Back row (3 desks, offset to see between front row) */}
      <Desk position={[-3.5, 0, 6]} color="#8b5cf6" label="Dan" />
      <Desk position={[1.5, 0, 6]} color="#06b6d4" label="Lucas" />
      <Desk position={[6.5, 0, 6]} color="#ec4899" label="Victorien" />

      {/* Fun Objects */}
      <FunObjects />
      
      <Bleachers />
      <Audience />

      {/* Current Player */}
      {playerName && playerName !== 'admin' && <Player />}
      {playerName === 'admin' && <SpectatorPlayer />}
      
      {/* Other Players (Networked) */}
      <OtherPlayers />
      
    </>
  );
};
