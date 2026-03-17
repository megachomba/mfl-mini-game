import { useGLTF, useAnimations } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import { useGraph } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { getModelById, CHARACTER_MODELS } from '../data/characterModels';

interface CharacterProps {
  position: [number, number, number];
  rotation: number;
  isMoving: boolean;
  color?: string;
  modelId?: string;
}

export const Character = ({ position, rotation, isMoving, color, modelId = 'soldier' }: CharacterProps) => {
  const group = useRef<THREE.Group>(null);
  const modelConfig = getModelById(modelId);
  const { scene, animations } = useGLTF(modelConfig.file);

  // Clone scene for each instance
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  useGraph(clone);

  const { actions } = useAnimations(animations, group);

  useEffect(() => {
      const idleAction = actions[modelConfig.idleAnim];
      const runAction = actions[modelConfig.runAnim];

      if (idleAction && runAction) {
          if (isMoving) {
              idleAction.fadeOut(0.2);
              runAction.reset().fadeIn(0.2).play();
          } else {
              runAction.fadeOut(0.2);
              idleAction.reset().fadeIn(0.2).play();
          }
      }
  }, [isMoving, actions, modelConfig.idleAnim, modelConfig.runAnim]);

  // Color handling - only for soldier model which has the vanguard_Mesh
  useEffect(() => {
      if (color && modelId === 'soldier') {
        clone.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                 const mesh = child as THREE.Mesh;
                 if (mesh.name === 'vanguard_Mesh') {
                    mesh.material = (mesh.material as THREE.Material).clone();
                    (mesh.material as THREE.MeshStandardMaterial).color.set(color);
                 }
            }
        });
      }
  }, [color, clone, modelId]);

  return (
    <group ref={group} position={position} rotation={[0, rotation, 0]} dispose={null}>
      <primitive object={clone} position={[0, modelConfig.yOffset, 0]} scale={modelConfig.scale} />
    </group>
  );
};

// Preload all models
CHARACTER_MODELS.forEach(m => useGLTF.preload(m.file));
