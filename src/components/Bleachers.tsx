import { useMemo } from 'react';
import * as THREE from 'three';

// Shared materials to reduce draw calls
const materialEven = new THREE.MeshStandardMaterial({ color: "#334155", roughness: 0.8 });
const materialOdd = new THREE.MeshStandardMaterial({ color: "#475569", roughness: 0.8 });
const wallMaterial = new THREE.MeshStandardMaterial({ color: "#1e293b" });

export const Bleachers = () => {
  const levels = 5;
  const depth = 2;
  const height = 1;
  const radius = 25;

  // Generate segments for a curved bleacher
  const segments = useMemo(() => {
    const segs = [];
    const angleStep = (Math.PI / 1.5) / 20;

    for (let l = 0; l < levels; l++) {
        for (let i = -10; i <= 10; i++) {
            const angle = i * angleStep;
            const x = Math.sin(angle) * (radius + l * depth);
            const z = Math.cos(angle) * (radius + l * depth);
            const y = l * height;

            const rot = angle;

            segs.push({ x, y, z, rot, level: l });
        }
    }
    return segs;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* Main Structure - shadows disabled for performance */}
      {segments.map((seg, i) => (
          <mesh
            key={i}
            position={[seg.x, seg.y, seg.z]}
            rotation={[0, seg.rot, 0]}
            material={seg.level % 2 === 0 ? materialEven : materialOdd}
          >
            <boxGeometry args={[4, 1, 2]} />
          </mesh>
      ))}

      {/* Side Walls/Railings */}
       <mesh position={[20, 2.5, 20]} rotation={[0, -Math.PI/4, 0]} material={wallMaterial}>
         <boxGeometry args={[2, 10, 30]} />
       </mesh>
       <mesh position={[-20, 2.5, 20]} rotation={[0, Math.PI/4, 0]} material={wallMaterial}>
         <boxGeometry args={[2, 10, 30]} />
       </mesh>
    </group>
  );
};
