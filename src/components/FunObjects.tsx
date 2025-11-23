import { RigidBody } from '@react-three/rapier';

export const FunObjects = () => {
  return (
    <>
      {/* Bouncers / Obstacles */}
      <Bumper position={[-8, 1, 5]} />
      <Bumper position={[8, 1, 5]} />
    </>
  );
};

const Bumper = ({ position }: { position: [number, number, number] }) => {
    return (
        <RigidBody type="fixed" position={position} restitution={2}>
            <mesh castShadow receiveShadow>
                <cylinderGeometry args={[1, 1.5, 1, 32]} />
                <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.5} />
            </mesh>
        </RigidBody>
    )
}