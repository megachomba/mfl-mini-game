import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { useGameStore } from '../store';

const CROWD_COUNT = 25; // Reduced from 80 for performance

export const Audience = () => {
  const { scene } = useGLTF('/models/audience.glb');
  const { gameState } = useGameStore();
  const groupRefs = useRef<(THREE.Group | null)[]>([]);

  // Define Bleachers Parameters
  const levels = 5;
  const radius = 25;
  const depth = 2;
  const height = 1;

  const crowdData = useMemo(() => {
    const data = [];
    const angleStep = (Math.PI / 1.5) / 20;

    for (let i = 0; i < CROWD_COUNT; i++) {
        const level = Math.floor(Math.random() * levels);
        const angleIndex = Math.floor(Math.random() * 21) - 10;

        const angleJitter = (Math.random() - 0.5) * 0.05;
        const angle = (angleIndex * angleStep) + angleJitter;

        const r = radius + level * depth + (Math.random() - 0.5) * 0.5;
        const x = Math.sin(angle) * r;
        const z = Math.cos(angle) * r;
        const y = level * height + 0.5;

        const scale = 0.4 + Math.random() * 0.1;
        const speed = 0.5 + Math.random() * 1.0;
        const offset = Math.random() * 100;

        data.push({ x, y, z, rot: angle + Math.PI, scale, speed, offset });
    }
    return data;
  }, []);

  // Pre-clone all scenes once
  const clones = useMemo(() => {
    return crowdData.map(() => SkeletonUtils.clone(scene));
  }, [scene, crowdData]);

  const isCheering = gameState?.answerFeedback === 'correct';

  // Single useFrame for ALL audience members - much more efficient
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < CROWD_COUNT; i++) {
      const group = groupRefs.current[i];
      if (!group) continue;

      const data = crowdData[i];
      let yOffset = 0;

      if (isCheering) {
        yOffset = Math.abs(Math.sin(time * 10 + data.offset)) * 0.5;
        group.rotation.y = data.rot + Math.sin(time * 20) * 0.2;
      } else {
        yOffset = Math.sin(time * data.speed + data.offset) * 0.02;
        group.rotation.y = data.rot;
      }

      group.position.y = data.y + yOffset;
    }
  });

  return (
    <group>
      {clones.map((clone, i) => (
        <primitive
          key={i}
          ref={(el: THREE.Group | null) => { groupRefs.current[i] = el; }}
          object={clone}
          position={[crowdData[i].x, crowdData[i].y, crowdData[i].z]}
          scale={[crowdData[i].scale, crowdData[i].scale, crowdData[i].scale]}
          rotation={[0, crowdData[i].rot, 0]}
        />
      ))}
    </group>
  );
};

useGLTF.preload('/models/audience.glb');
