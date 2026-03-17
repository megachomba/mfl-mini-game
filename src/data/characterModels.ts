export interface CharacterModel {
  id: string;
  name: string;
  file: string;
  idleAnim: string;
  runAnim: string;
  yOffset: number;
  scale: number;
}

export const CHARACTER_MODELS: CharacterModel[] = [
  { id: 'soldier', name: 'Soldier', file: '/models/soldier.glb', idleAnim: 'Idle', runAnim: 'Run', yOffset: -0.9, scale: 1.0 },
  { id: 'knight', name: 'Knight', file: '/models/Knight.glb', idleAnim: 'Idle', runAnim: 'Running_A', yOffset: -0.9, scale: 0.6 },
  { id: 'barbarian', name: 'Barbarian', file: '/models/Barbarian.glb', idleAnim: 'Idle', runAnim: 'Running_A', yOffset: -0.9, scale: 0.6 },
  { id: 'mage', name: 'Mage', file: '/models/Mage.glb', idleAnim: 'Idle', runAnim: 'Running_A', yOffset: -0.9, scale: 0.6 },
  { id: 'rogue', name: 'Rogue', file: '/models/Rogue.glb', idleAnim: 'Idle', runAnim: 'Running_A', yOffset: -0.9, scale: 0.6 },
  { id: 'rogue_hooded', name: 'Hooded Rogue', file: '/models/Rogue_Hooded.glb', idleAnim: 'Idle', runAnim: 'Running_A', yOffset: -0.9, scale: 0.6 },
  { id: 'skeleton_warrior', name: 'Skeleton', file: '/models/Skeleton_Warrior.glb', idleAnim: 'Idle', runAnim: 'Running_A', yOffset: -0.9, scale: 0.6 },
  { id: 'skeleton_mage', name: 'Bone Mage', file: '/models/Skeleton_Mage.glb', idleAnim: 'Idle', runAnim: 'Running_A', yOffset: -0.9, scale: 0.6 },
  { id: 'skeleton_rogue', name: 'Bone Rogue', file: '/models/Skeleton_Rogue.glb', idleAnim: 'Idle', runAnim: 'Running_A', yOffset: -0.9, scale: 0.6 },
];

export const getModelById = (id: string): CharacterModel => {
  return CHARACTER_MODELS.find(m => m.id === id) || CHARACTER_MODELS[0];
};
