# 🗺 Roadmap Kronos

## Phase 1 : Socle & Configuration (En cours)

- [x] Initialisation Tauri + React + Rusqlite.
- [ ] Implémentation du script SQL `init_db`.
- [ ] **Wizard de Démarrage** :
  - [ ] Écran de bienvenue.
  - [ ] Choix du Profil : "Classe Unique" vs "Établissement".
  - [ ] Sauvegarde de la config dans `project_config`.
- [ ] Gestion des Matières (CRUD).

## Phase 2 : Définition des Besoins

- [ ] Interface "Grille Horaire" (Définir les créneaux, jours travaillés).
- [ ] Interface "Allocations" :
  - [ ] Tableau : Liste des matières vs Volume horaire souhaité.
  - [ ] Formulaire dynamique selon le profil (masquer profs si "Classe Unique").

## Phase 3 : Moteur de Génération (Rust Core)

- [ ] Structure Rust `Schedule` en mémoire.
- [ ] Algo Backtracking basique (placer les cours sans conflits).
- [ ] Commande `generate` connectée au Front.
- [ ] Affichage brut du résultat.

## Phase 4 : UX & Raffinement

- [ ] Visualisation type "Emploi du temps" (Libairie : FullCalendar ou dnd-kit).
- [ ] Drag & Drop pour modification manuelle post-génération.
- [ ] Export PDF.

## Phase 5 : Optimisation & Génétique (Futur)

- [ ] Implémentation du système de Score (Fitness Function).
- [ ] Implémentation de la boucle d'Algorithme Génétique (Population -> Selection -> Mutation).
- [ ] Gestion des contraintes avancées (Professeur principal, Salle spécifique...).
