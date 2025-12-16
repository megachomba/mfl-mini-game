import { useGLTF, useAnimations } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import { useGraph } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

export const Character = ({ position, rotation, isMoving, color }: { position: [number, number, number], rotation: number, isMoving: boolean, color?: string }) => {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/models/soldier.glb');
  
  // Clone scene for each instance
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  useGraph(clone); // Ensure nodes are processed
  
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
      const idleAction = actions['Idle'];
      const runAction = actions['Run'];
      
      if (idleAction && runAction) {
          if (isMoving) {
              idleAction.fadeOut(0.2);
              runAction.reset().fadeIn(0.2).play();
          } else {
              runAction.fadeOut(0.2);
              idleAction.reset().fadeIn(0.2).play();
          }
      }
  }, [isMoving, actions]);

  // Color handling
  useEffect(() => {
      if (color) {
        clone.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                 const mesh = child as THREE.Mesh;
                 // The soldier has specific meshes. 'vanguard_Mesh' is the main body.
                 if (mesh.name === 'vanguard_Mesh') {
                    mesh.material = (mesh.material as THREE.Material).clone();
                    (mesh.material as THREE.MeshStandardMaterial).color.set(color);
                 }
            }
        });
      }
  }, [color, clone]);
  
  return (
    <group ref={group} position={position} rotation={[0, rotation, 0]} dispose={null}>
      {/* Offset to align feet with bottom of collider (assuming collider center is passed as position) */}
      <primitive object={clone} position={[0, -0.9, 0]} scale={1.0} />
    </group>
  );
};

useGLTF.preload('/models/soldier.glb');
