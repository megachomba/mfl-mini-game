import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls, PointerLockControls } from '@react-three/drei';
import { useGameStore } from '../store';
import * as THREE from 'three';

export const Player = () => {
  const rigidBody = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const lastUpdate = useRef(0);
  const [, getKeys] = useKeyboardControls();
  const { camera } = useThree();
  const { gameState, playerName } = useGameStore();

  // Pooled vectors to avoid allocations in useFrame
  const vectors = useMemo(() => ({
    forward: new THREE.Vector3(),
    right: new THREE.Vector3(),
    moveDir: new THREE.Vector3(),
    cameraDir: new THREE.Vector3(),
  }), []);

  // Get start position from server state if available
  const startPos = useRef([0, 2, 5]);
  const hasSpawned = useRef(false);
  
  useEffect(() => {
      if (gameState?.players && !hasSpawned.current) {
          const myPlayer = Object.values(gameState.players).find((p: any) => p.name === playerName) as any;
          if (myPlayer && myPlayer.startPos) {
              startPos.current = [myPlayer.startPos.x, myPlayer.startPos.y, myPlayer.startPos.z];
              if(rigidBody.current) {
                  rigidBody.current.setTranslation({x: myPlayer.startPos.x, y: myPlayer.startPos.y, z: myPlayer.startPos.z}, true);
                  hasSpawned.current = true;
              }
          }
      }
  }, [gameState, playerName]);


  useFrame((state) => {
    if (!rigidBody.current) return;

    const { forward, backward, left, right, jump } = getKeys();

    const currentVel = rigidBody.current.linvel();

    // Get Camera Direction (FPP) - reuse pooled vectors
    state.camera.getWorldDirection(vectors.forward);
    vectors.forward.y = 0;
    vectors.forward.normalize();

    vectors.right.crossVectors(vectors.forward, state.camera.up).normalize();

    // Calculate movement vector - reuse pooled vector
    vectors.moveDir.set(0, 0, 0);
    if (forward) vectors.moveDir.add(vectors.forward);
    if (backward) vectors.moveDir.sub(vectors.forward);
    if (right) vectors.moveDir.add(vectors.right);
    if (left) vectors.moveDir.sub(vectors.right);

    if (vectors.moveDir.length() > 0) {
        vectors.moveDir.normalize().multiplyScalar(8);
    }

    // Apply Velocity
    rigidBody.current.setLinvel({
        x: vectors.moveDir.x,
        y: currentVel.y,
        z: vectors.moveDir.z
    }, true);

    // Jump
    if (jump && Math.abs(currentVel.y) < 0.1) {
        rigidBody.current.setLinvel({ x: currentVel.x, y: 8, z: currentVel.z }, true);
    }

    // Sync position to server (Throttled)
    const now = Date.now();
    if(useGameStore.getState().socket && now - lastUpdate.current > 30) {
        lastUpdate.current = now;
        const pos = rigidBody.current.translation();

        // Get Rotation (Yaw) - reuse pooled vector
        state.camera.getWorldDirection(vectors.cameraDir);
        const rot = Math.atan2(vectors.cameraDir.x, vectors.cameraDir.z);

        useGameStore.getState().socket?.emit('move', { x: pos.x, y: pos.y, z: pos.z, rot });
    }

    // Sync Camera to Player Body
    const pos = rigidBody.current.translation();
    camera.position.set(pos.x, pos.y + 1.5, pos.z);
  });

  return (
    <>
        <PointerLockControls ref={controlsRef} />
        <RigidBody 
            ref={rigidBody} 
            position={startPos.current as [number, number, number]} 
            enabledRotations={[false, false, false]} // Lock all rotations, mouse looks
            colliders={false} 
            friction={0} 
            linearDamping={0}
        >
        <CapsuleCollider args={[0.75, 0.5]} />
        
        {/* Personal Light */}
        <pointLight position={[0, 2, 0]} intensity={2} distance={10} color="#fbbf24" />
        </RigidBody>
    </>
  );
};