import { useGameStore } from '../store';
import { RoundedBox } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const OtherPlayers = () => {
  const { gameState, playerName } = useGameStore();

  if (!gameState || !gameState.players) return null;

  return (
    <>
      {Object.values(gameState.players).map((p: any) => {
        if (p.name === playerName) return null; // Don't render self
        return <RemotePlayer key={p.id} position={[p.x, p.y, p.z]} rotation={p.rot || 0} color={p.color} />;
      })}
    </>
  );
};

const RemotePlayer = ({ position, rotation, color }: { position: [number, number, number], rotation: number, color?: string }) => {
    const group = useRef<any>(null);
    const leftArm = useRef<any>(null);
    const rightArm = useRef<any>(null);
    const leftLeg = useRef<any>(null);
    const rightLeg = useRef<any>(null);
    
    useFrame((state) => {
        if (group.current) {
            const currentPos = group.current.position;
            const targetPos = new THREE.Vector3(position[0], position[1], position[2]);
            
            // Calculate velocity for animation
            const dist = currentPos.distanceTo(targetPos);
            const isMoving = dist > 0.01;
            
            // Lerp position
            group.current.position.lerp(targetPos, 0.2);
            
            // Lerp rotation
             const currentRot = group.current.rotation.y;
             // Handle wrapping around PI/-PI
             let diff = rotation - currentRot;
             while (diff > Math.PI) diff -= Math.PI * 2;
             while (diff < -Math.PI) diff += Math.PI * 2;
             
             group.current.rotation.y += diff * 0.2;

            // Animation
            if (isMoving) {
                const time = state.clock.getElapsedTime() * 15;
                if(leftArm.current) leftArm.current.rotation.x = Math.sin(time) * 0.5;
                if(rightArm.current) rightArm.current.rotation.x = Math.cos(time) * 0.5;
                if(leftLeg.current) leftLeg.current.rotation.x = Math.cos(time) * 0.5;
                if(rightLeg.current) rightLeg.current.rotation.x = Math.sin(time) * 0.5;
            } else {
                // Reset limbs
                const lerpSpeed = 0.1;
                if(leftArm.current) leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, 0, lerpSpeed);
                if(rightArm.current) rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, 0, lerpSpeed);
                if(leftLeg.current) leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, 0, lerpSpeed);
                if(rightLeg.current) rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, 0, lerpSpeed);
            }
        }
    });

    // Default color if none provided
    const playerColor = color || "#9ca3af";

    return (
        <group ref={group} position={position}>
            {/* Torso */}
            <RoundedBox position={[0, 0.4, 0]} args={[0.8, 0.9, 0.5]} radius={0.1}>
                <meshStandardMaterial color={playerColor} metalness={0.6} roughness={0.3} />
            </RoundedBox>
            
            {/* Head */}
            <group position={[0, 1.1, 0]}>
                <RoundedBox args={[0.5, 0.5, 0.5]} radius={0.1}>
                    <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
                </RoundedBox>
                {/* Visor */}
                <RoundedBox position={[0, 0, 0.2]} args={[0.4, 0.15, 0.1]} radius={0.05}>
                        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} />
                </RoundedBox>
            </group>

             {/* Arms */}
             <group ref={leftArm} position={[-0.5, 0.6, 0]}>
                <RoundedBox position={[0, -0.3, 0]} args={[0.25, 0.8, 0.25]} radius={0.05}>
                        <meshStandardMaterial color="#475569" />
                </RoundedBox>
             </group>
             <group ref={rightArm} position={[0.5, 0.6, 0]}>
                <RoundedBox position={[0, -0.3, 0]} args={[0.25, 0.8, 0.25]} radius={0.05}>
                        <meshStandardMaterial color="#475569" />
                </RoundedBox>
             </group>

            {/* Legs */}
            <group ref={leftLeg} position={[-0.25, -0.1, 0]}>
                 <RoundedBox position={[0, -0.5, 0]} args={[0.3, 1.0, 0.3]} radius={0.05}>
                    <meshStandardMaterial color="#1e293b" />
                 </RoundedBox>
            </group>
            <group ref={rightLeg} position={[0.25, -0.1, 0]}>
                 <RoundedBox position={[0, -0.5, 0]} args={[0.3, 1.0, 0.3]} radius={0.05}>
                    <meshStandardMaterial color="#1e293b" />
                 </RoundedBox>
            </group>
        </group>
    );
}
