# Project Status & Context: MFL Mini-Game

## Objectif
Jeu multijoueur 3D web (style "Le Grand Concours") pour 7 joueurs avec des thèmes personnalisés.

## Stack Technique
- **Frontend:** React, Vite, TypeScript
- **3D:** Three.js, React Three Fiber, React Three Rapier (Physique)
- **State:** Zustand
- **Backend:** Node.js, Socket.io
- **Styling:** Tailwind CSS

## Architecture
- **Scene:** Plateau TV avec écran géant (Grille 10x10).
- **Gameplay:**
    - Phase Mémorisation (20s) - voir les couleurs de la grille
    - Phase Tour par tour : Choisir une tuile, répondre à une question
    - Interaction : Questions affichées sur pupitres interactifs
- **Fun:** Physique activée, objets interactifs (ballons), liberté de mouvement

---

## Règles du Jeu

### Grille
- **324 tuiles** (18x18)
- **40 tuiles par joueur** (7 joueurs = 280 tuiles) + **44 tuiles neutres**
- Chaque tuile a la **couleur du joueur** dont c'est le thème
- **N'importe qui peut choisir n'importe quelle tuile**

### Thèmes et Tiers
Chaque joueur a choisi **3 thèmes**, classés par niveau de connaissance :
- **Tier 1** = Thème où le joueur a le PLUS de connaissances = Questions les plus DIFFICILES
- **Tier 2** = Connaissance moyenne = Difficulté moyenne
- **Tier 3** = Moins de connaissances = Questions les plus FACILES

**Le piège :** Les joueurs ne savaient pas que leur meilleur thème aurait les questions les plus dures !

### Scoring
| Tier | Difficulté | Points |
|------|------------|--------|
| Tier 1 | Difficile | 3 pts |
| Tier 2 | Moyen | 2 pts |
| Tier 3 | Facile | 1 pt |

**Bonus :** Points supplémentaires si tu réponds correctement à une tuile d'un **autre joueur** (son thème, pas le tien)

---

## Joueurs et Thèmes

| Joueur | Couleur | Tier 1 (Expert = Difficile) | Tier 2 (Moyen) | Tier 3 (Moins connu = Facile) |
|--------|---------|----------------------------|----------------|-------------------------------|
| **Quentin** | Bleu #3b82f6 | Thibaut Pinot | League of Legends 2025 | Cyclisme Route > 2010 |
| **Yann** | Rouge #ef4444 | MFL (Web3) | Drapeaux | Physique Quantique |
| **Mathurin** | Vert #22c55e | WoW: Burning Crusade (Mage) | OSS 117 | Harry Potter |
| **Bastis** | Orange #f97316 | La Guitare | Rap Français Ancien (avant 2010) | Corps de Fonctions Asymptotiquement Optimaux |
| **Jacques** | Violet #8b5cf6 | Voiture | Blockchain | Piano |
| **Lucas** | Cyan #06b6d4 | New Zealand | NBA Players (2015-2025) | AS Saint-Étienne 2025-26 |
| **Victorien** | Rose #ec4899 | Sum 41 | Jeux Vidéo | Géographie |

---

## Questions Requises

Chaque thème doit avoir des questions avec des niveaux de difficulté variés (1=facile, 2=moyen, 3=difficile dans le JSON).

### Par Joueur (21 thèmes total)
- **Quentin:** Thibaut Pinot, LoL 2025, Cyclisme > 2010
- **Yann:** MFL (Web3), Drapeaux, Physique Quantique
- **Mathurin:** WoW BC (Mage), OSS 117, Harry Potter
- **Bastis:** La Guitare, Rap FR Ancien, Corps de Fonctions
- **Jacques:** Voiture, Blockchain, Piano
- **Lucas:** New Zealand, NBA Players, ASSE 2025-26
- **Victorien:** Sum 41, Jeux Vidéo, Géographie

---

## État Actuel
- [x] Projet initialisé (Vite)
- [x] Setup serveur Socket.io
- [x] Grille 10x10 avec couleurs joueurs
- [x] Phase mémorisation + tour par tour
- [x] Questions randomisées dans le JSON
- [ ] Lier les questions aux thèmes des joueurs
- [ ] Scoring par tier
- [ ] Bonus points pour thème adverse
