import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Experience } from './components/Experience';
import { Suspense, useState } from 'react';
import { useGameStore } from './store';
import { UI } from './components/UI';
import { QuestionModal } from './components/QuestionModal';
import { KeyboardControls } from '@react-three/drei';

function App() {
  const { connect, setPlayerName } = useGameStore();
  const [chosen, setChosen] = useState(false);

  const handleLogin = (name: string) => {
    setPlayerName(name);
    setChosen(true);
    connect();
  };

  const keyboardMap = [
    { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
    { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
    { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
    { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
    { name: 'jump', keys: ['Space'] },
  ];

  if (!chosen) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
          MFL GRAND CONCOURS
        </h1>
        <div className="flex gap-4">
          {['quentin', 'yann', 'mathurin'].map((name) => (
            <button
              key={name}
              onClick={() => handleLogin(name)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold capitalize transition-all transform hover:scale-105"
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <KeyboardControls map={keyboardMap}>
      <Canvas shadows camera={{ position: [0, 10, 20], fov: 45 }}>
        <color attach="background" args={['#1a1a2e']} />
        <Suspense fallback={null}>
                <Physics>
                  <Experience />
                </Physics>        </Suspense>
      </Canvas>
      <UI />
      <QuestionModal />
    </KeyboardControls>
  );
}

export default App;