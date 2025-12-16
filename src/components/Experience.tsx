import { Environment, MeshReflectorMaterial } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { Grid } from './Grid';
import { Player } from './Player';
import { OtherPlayers } from './OtherPlayers';
import { FunObjects } from './FunObjects';
import { Desk } from './Desk';
import { Audience } from './Audience';
import { Bleachers } from './Bleachers';
import { useGameStore } from '../store';

export const Experience = () => {
  const { playerName } = useGameStore();

  return (
    <>
      <Environment preset="studio" />
      
      <ambientLight intensity={0.2} />
      
      {/* Stage Lights */}
      <spotLight position={[10, 20, 10]} angle={0.3} penumbra={1} intensity={200} castShadow shadow-bias={-0.0001} />
      <spotLight position={[-10, 20, 10]} angle={0.3} penumbra={1} intensity={200} castShadow shadow-bias={-0.0001} />
      <pointLight position={[0, 10, -10]} intensity={100} color="#4c1d95" />

      {/* Shiny Studio Floor */}
      <RigidBody type="fixed" friction={2} restitution={0.5}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <MeshReflectorMaterial
            blur={[200, 100]}
            resolution={512}
            mixBlur={1}
            mixStrength={40}
            roughness={0.3}
            depthScale={0.8}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#151515"
            metalness={0.4}
            mirror={0.5}
          />
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
      
      {/* Desks (Pupitres) */}
      <Desk position={[-12, 0, 8]} color="#3b82f6" label="Quentin" />
      <Desk position={[-7, 0, 8]} color="#22c55e" label="Mathurin" />
      <Desk position={[-2, 0, 8]} color="#ef4444" label="Yann" />
      <Desk position={[3, 0, 8]} color="#f97316" label="Bastis" />
      <Desk position={[8, 0, 8]} color="#8b5cf6" label="Jacques" />
      <Desk position={[13, 0, 8]} color="#06b6d4" label="Lucas" />
      <Desk position={[18, 0, 8]} color="#ec4899" label="Victorien" />

      {/* Fun Objects */}
      <FunObjects />
      
      <Bleachers />
      <Audience />

      {/* Current Player */}
      {playerName && <Player />}
      
      {/* Other Players (Networked) */}
      <OtherPlayers />
      
    </>
  );
};
