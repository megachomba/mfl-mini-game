# Project Status & Context: MFL Mini-Game

## Objectif
Créer un jeu multijoueur 3D web (style "Le Grand Concours") pour 3 joueurs prédéfinis (Quentin, Yann, Mathurin) avec des thèmes spécifiques (MFL, LoL, Cyclisme, etc.).

## Stack Technique
- **Frontend:** React, Vite, TypeScript
- **3D:** Three.js, React Three Fiber, React Three Rapier (Physique)
- **State:** Zustand
- **Backend:** Node.js, Socket.io
- **Styling:** Tailwind CSS

## Architecture
- **Scene:** Plateau TV avec écran géant (Grille 10x10).
- **Gameplay:** 
    - Phase Mémorisation (20s).
    - Phase Tour par tour : Déplacement physique du joueur vers son pupitre ou sur la grille.
    - Interaction : Questions affichées sur pupitres interactifs.
- **Fun:** Physique activée, objets interactifs (ballons), liberté de mouvement.

## Thèmes Joueurs
- **Quentin:** Thibaut Pinot, LoL 2025, Cyclisme > 2010.
- **Yann:** MFL (Web3 Football), Drapeaux, Physique Quantique.
- **Mathurin:** WoW BC (Mage), OSS 117, Harry Potter.

## État Actuel
- Projet initialisé (Vite).
- En cours : Installation dépendances 3D/Network, Setup serveur.
