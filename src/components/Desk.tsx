import { RoundedBox, Text } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { useGameStore } from "../store";

// Preload button click audio
const buttonClickAudio = new Audio('/audio/button-click.mp3');
const playButtonSound = () => {
  buttonClickAudio.currentTime = 0;
  buttonClickAudio.play().catch(e => console.warn('Audio play failed', e));
};

interface DeskProps {
  position: [number, number, number];
  color: string;
  label?: string;
}

export const Desk = ({ position, color, label }: DeskProps) => {
  const { playerName, gameState } = useGameStore();

  const isMyDesk =
    label && playerName && label.toLowerCase() === playerName.toLowerCase();
  const activeQ = gameState?.activeQuestion;
  const isAnswering =
    activeQ && activeQ.answeringPlayer === playerName && isMyDesk;

  /* 
  const [pressed, setPressed] = useState(false);
  const handleBuzz = (e: any) => {
    e.stopPropagation();
    if (isMyDesk) {
      setPressed(true);
      useGameStore.getState().socket?.emit("buzz");
      setTimeout(() => setPressed(false), 200);
    }
  };
  */

  const handleAnswer = (idx: number) => {
    if (isAnswering) {
      playButtonSound();
      useGameStore
        .getState()
        .socket?.emit("answerQuestion", { answerIndex: idx });
    }
  };

  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="hull">
        {/* Desk Base */}
        <RoundedBox args={[2, 1.2, 1.5]} radius={0.1} position={[0, 0.6, 0]}>
          <meshStandardMaterial
            color="#1e293b"
            metalness={0.5}
            roughness={0.2}
          />
        </RoundedBox>

        {/* Desk Top */}
        <RoundedBox
          args={[2.2, 0.1, 1.7]}
          radius={0.05}
          position={[0, 1.25, 0]}
        >
          <meshStandardMaterial
            color="#334155"
            metalness={0.2}
            roughness={0.8}
          />
        </RoundedBox>

        {/* Front Panel (Color Coded) */}
        <mesh position={[0, 0.6, 0.76]}>
          <planeGeometry args={[1.8, 1]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.2}
          />
        </mesh>

        {/* Player Name on Front Panel */}
        {label && (
          <Text
            position={[0, 0.6, 0.77]}
            fontSize={0.25}
            color="white"
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
            outlineWidth={0.02}
            outlineColor="#000"
            anchorY="middle"
          >
            {label.toUpperCase()}
          </Text>
        )}

        {/* INTERFACE AREA */}
        <group position={[0, 2, 0.5]} rotation={[-Math.PI / 6, 0, 0]}>
          {/* Screen Background */}
          <mesh position={[0, 0, -0.02]}>
            <planeGeometry args={[2.1, 1.4]} />
            <meshStandardMaterial
              color="#000"
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>

          {activeQ ? (
            // QUESTION MODE
            <group position={[0, 0, 0]}>
              {/* Question Text */}
              <Text
                position={[0, 0.4, 0.01]}
                fontSize={0.09}
                color="white"
                maxWidth={1.9}
                textAlign="center"
                anchorY="middle"
              >
                {activeQ.question}
              </Text>

              {/* Answers */}
              {activeQ.answers.map((ans: string, idx: number) => {
                // 2x2 Grid for buttons
                const row = Math.floor(idx / 2); // 0 or 1
                const col = idx % 2; // 0 or 1
                const xPos = col === 0 ? -0.5 : 0.5;
                const yPos = row === 0 ? 0.1 : -0.25;

                return (
                  <group key={idx} position={[xPos, yPos, 0.02]}>
                    <mesh
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnswer(idx);
                      }}
                      onPointerOver={() =>
                        isAnswering && (document.body.style.cursor = "pointer")
                      }
                      onPointerOut={() => (document.body.style.cursor = "auto")}
                    >
                      <boxGeometry args={[0.9, 0.25, 0.05]} />
                      <meshStandardMaterial
                        color={isAnswering ? "#1e40af" : "#333"}
                        emissive={isAnswering ? "#1e40af" : "#000"}
                        emissiveIntensity={0.5}
                      />
                    </mesh>
                    <Text
                      position={[0, 0, 0.04]}
                      fontSize={0.07}
                      color="white"
                      maxWidth={0.85}
                    >
                      {ans}
                    </Text>
                  </group>
                );
              })}

              {/* Status Text if not my turn */}
              {!isAnswering && (
                <Text position={[0, -0.5, 0.05]} fontSize={0.08} color="red">
                  {activeQ.answeringPlayer === label?.toLowerCase()
                    ? "WAITING..."
                    : "LOCKED"}
                </Text>
              )}
            </group>
            ) : (
                // BUZZER MODE
                null
            )}
        </group>
      </RigidBody>
    </group>
  );
};
