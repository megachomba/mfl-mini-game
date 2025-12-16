import { useMemo, useRef } from 'react';
import { useFrame, useGraph } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { useGameStore } from '../store';

const CROWD_COUNT = 80;

export const Audience = () => {
  const { scene } = useGLTF('/models/audience.glb');
  const { gameState } = useGameStore();
  
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
        const y = level * height + 0.5; // Adjust for model height

        const scale = 0.4 + Math.random() * 0.1; // Vary size slightly
        const speed = 0.5 + Math.random() * 1.0;
        const offset = Math.random() * 100;
        
        data.push({ x, y, z, rot: angle + Math.PI, scale, speed, offset });
    }
    return data;
  }, []);

  return (
    <group>
      {crowdData.map((data, i) => (
        <AudienceMember key={i} data={data} scene={scene} isCheering={gameState?.answerFeedback === 'correct'} />
      ))}
    </group>
  );
};

const AudienceMember = ({ data, scene, isCheering }: { data: any, scene: THREE.Group, isCheering: boolean }) => {
  const group = useRef<THREE.Group>(null);
  // Clone the scene for this instance
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  useGraph(clone); // This ensures nodes are processed if needed, but we just display the group
  
  useFrame((state) => {
    if (!group.current) return;
    
    const time = state.clock.getElapsedTime();
    const { speed, offset } = data;
    
    let yOffset = 0;
    
    // Animation Logic
    if (isCheering) {
       yOffset = Math.abs(Math.sin(time * 10 + offset)) * 0.5; // Jump
       // Rotate slightly
       group.current.rotation.y = data.rot + Math.sin(time * 20) * 0.2;
    } else {
       yOffset = Math.sin(time * speed + offset) * 0.02; // Breathe
       group.current.rotation.y = data.rot;
    }
    
    group.current.position.y = data.y + yOffset;
  });

  return (
    <primitive 
        ref={group}
        object={clone} 
        position={[data.x, data.y, data.z]} 
        scale={[data.scale, data.scale, data.scale]}
        rotation={[0, data.rot, 0]}
    />
  );
};

useGLTF.preload('/models/audience.glb');
