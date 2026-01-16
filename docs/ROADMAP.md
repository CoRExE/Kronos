# 🗺 Roadmap du Projet

## Phase 1 : Fondations & CRUD (MVP Technique)

- [x] Initialisation du projet Tauri + React.
- [ ] Configuration de `rusqlite` et création automatique des tables au démarrage.
- [ ] Interface Frontend :
  - [ ] Page de gestion des Matières (Ajout/Suppression/Couleur).
  - [ ] Page de configuration de la Grille (Combien de jours ? Quelle amplitude horaire ?).
- [ ] Connexion Front <-> Back pour sauvegarder ces données.

## Phase 2 : Le Moteur Backtracking (MVP Fonctionnel)

- [ ] Implémentation de la structure `Schedule` en Rust (en mémoire).
- [ ] Création de la fonction de validation `is_valid(schedule, slot, subject)`.
- [ ] Implémentation du Backtracking récursif simple.
- [ ] Commande Tauri `generate_schedule` qui renvoie un JSON brut.
- [ ] Visualisation basique dans le Front (Grille HTML simple).

## Phase 3 : Interface Graphique Avancée

- [ ] Intégration d'une librairie de calendrier (ex: FullCalendar ou grille CSS Grid custom).
- [ ] Drag & Drop manuel pour ajuster les cours après génération.
- [ ] Affichage des conflits en rouge.

## Phase 4 : Optimisation & Génétique

- [ ] Implémentation du système de Score (Fitness Function).
- [ ] Implémentation de la boucle d'Algorithme Génétique (Population -> Selection -> Mutation).
- [ ] Gestion des contraintes avancées (Professeur principal, Salle spécifique...).
- [ ] Export PDF / Image de l'emploi du temps.
