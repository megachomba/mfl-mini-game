import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store';

const CROWD_COUNT = 200; // More people for the bleachers

export const Audience = () => {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.InstancedMesh>(null);
  const { gameState } = useGameStore();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Define Bleachers Parameters to match Bleachers.tsx logic
  const levels = 5;
  const radius = 25;
  const depth = 2;
  const height = 1;

  const crowdData = useMemo(() => {
    const data = [];
    const angleStep = (Math.PI / 1.5) / 20; // Match bleachers
    
    for (let i = 0; i < CROWD_COUNT; i++) {
        // Randomly pick a spot on the bleachers
        const level = Math.floor(Math.random() * levels);
        const angleIndex = Math.floor(Math.random() * 21) - 10; // -10 to 10
        
        // Add some randomness to position so they aren't perfect grid
        const angleJitter = (Math.random() - 0.5) * 0.05;
        const angle = (angleIndex * angleStep) + angleJitter;
        
        const r = radius + level * depth + (Math.random() - 0.5) * 0.5;
        const x = Math.sin(angle) * r;
        const z = Math.cos(angle) * r;
        const y = level * height + 1.5; // +1.5 to sit/stand on top of the block

        const color = new THREE.Color().setHSL(Math.random(), 0.7, 0.5);
        const speed = 0.5 + Math.random() * 1.0;
        const offset = Math.random() * 100;
        
        data.push({ x, y, z, rot: angle + Math.PI, color, speed, offset });
    }
    return data;
  }, []);

  useFrame((state) => {
    if (!bodyRef.current || !headRef.current) return;

    const isCheering = gameState?.answerFeedback === 'correct';
    const time = state.clock.getElapsedTime();

    crowdData.forEach((p, i) => {
      const { x, y, z, rot, speed, offset } = p;
      let currentY = y;

      // Animation
      if (isCheering) {
         currentY += Math.abs(Math.sin(time * 10 + offset)) * 1.0; // Jump
      } else {
         currentY += Math.sin(time * speed + offset) * 0.05; // Breathe/Idle
      }

      // Update Body
      dummy.position.set(x, currentY, z);
      dummy.rotation.set(0, rot, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      bodyRef.current!.setMatrixAt(i, dummy.matrix);

      // Update Head (Relative to Body)
      // Head is 0.5 units above body center (Body height 0.6, Head height 0.4)
      dummy.position.set(x, currentY + 0.55, z);
      dummy.updateMatrix();
      headRef.current!.setMatrixAt(i, dummy.matrix);
    });

    bodyRef.current.instanceMatrix.needsUpdate = true;
    headRef.current.instanceMatrix.needsUpdate = true;
  });
  
  // Set Colors Once
  useEffect(() => {
      if (bodyRef.current && !bodyRef.current.userData.colorsSet) {
          crowdData.forEach((p, i) => {
              bodyRef.current!.setColorAt(i, p.color);
              // Heads are skin colored usually, let's vary slightly
              const skinTone = new THREE.Color().setHSL(0.08 + Math.random() * 0.05, 0.6, 0.5 + Math.random() * 0.3);
              headRef.current!.setColorAt(i, skinTone);
          });
          bodyRef.current.instanceColor!.needsUpdate = true;
          if(headRef.current && headRef.current.instanceColor) {
               headRef.current.instanceColor.needsUpdate = true;
          }
          bodyRef.current.userData.colorsSet = true;
      }
  }, [crowdData]);

  return (
    <group>
        {/* Bodies */}
        <instancedMesh ref={bodyRef} args={[undefined, undefined, CROWD_COUNT]} frustumCulled={false}>
            <boxGeometry args={[0.5, 0.6, 0.3]} />
            <meshStandardMaterial roughness={0.8} />
        </instancedMesh>
        
        {/* Heads */}
        <instancedMesh ref={headRef} args={[undefined, undefined, CROWD_COUNT]} frustumCulled={false}>
            <boxGeometry args={[0.3, 0.35, 0.3]} />
            <meshStandardMaterial roughness={0.5} />
        </instancedMesh>
    </group>
  );
};
