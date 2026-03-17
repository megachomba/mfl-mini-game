import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Experience } from './components/Experience';
import { Suspense, useState } from 'react';
import { useGameStore } from './store';
import { UI } from './components/UI';
import { QuestionModal } from './components/QuestionModal';
import { KeyboardControls } from '@react-three/drei';
import { CHARACTER_MODELS } from './data/characterModels';

function App() {
  const connect = useGameStore((s) => s.connect);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const setSelectedModel = useGameStore((s) => s.setSelectedModel);
  const [chosen, setChosen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState('soldier');
  const [step, setStep] = useState<'name' | 'model'>('name');
  const [playerNameLocal, setPlayerNameLocal] = useState('');

  const handleSelectName = (name: string) => {
    setPlayerNameLocal(name);
    setStep('model');
  };

  const handleConfirm = () => {
    setPlayerName(playerNameLocal);
    setSelectedModel(selectedModelId);
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

        {step === 'name' && (
          <>
            <p className="text-gray-400 mb-4">Choose your player</p>
            <div className="flex gap-4 flex-wrap justify-center">
              {['quentin', 'yann', 'mathurin', 'bastis', 'dan', 'lucas', 'victorien'].map((name) => (
                <button
                  key={name}
                  onClick={() => handleSelectName(name)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold capitalize transition-all transform hover:scale-105"
                >
                  {name}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setPlayerName('admin');
                setSelectedModel('soldier');
                setChosen(true);
                connect();
              }}
              className="mt-6 px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-gray-300 text-sm transition-all transform hover:scale-105 border border-gray-500"
            >
              ADMIN (Spectator)
            </button>
          </>
        )}

        {step === 'model' && (
          <>
            <p className="text-gray-400 mb-2">
              Playing as <span className="text-white font-bold capitalize">{playerNameLocal}</span>
            </p>
            <p className="text-gray-400 mb-6">Choose your character model</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 max-w-3xl mb-8">
              {CHARACTER_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModelId(model.id)}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                    selectedModelId === model.id
                      ? 'border-blue-500 bg-blue-600/20 shadow-lg shadow-blue-500/20'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                  }`}
                >
                  <div className="w-16 h-16 mb-2 flex items-center justify-center text-3xl">
                    {model.id === 'soldier' && '🪖'}
                    {model.id === 'knight' && '⚔️'}
                    {model.id === 'barbarian' && '🪓'}
                    {model.id === 'mage' && '🧙'}
                    {model.id === 'rogue' && '🗡️'}
                    {model.id === 'rogue_hooded' && '🥷'}
                    {model.id === 'skeleton_warrior' && '💀'}
                    {model.id === 'skeleton_mage' && '☠️'}
                    {model.id === 'skeleton_rogue' && '🦴'}
                  </div>
                  <span className="text-sm font-medium text-center">{model.name}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setStep('name')}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition-all"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold transition-all transform hover:scale-105"
              >
                Join Game
              </button>
            </div>
          </>
        )}
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
