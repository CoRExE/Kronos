# 🏗 Architecture Technique

## Vue d'ensemble

L'application suit une architecture **Frontend-Driven** pilotée par un **Backend Embedded**.
Le Frontend gère l'état visuel. Le Backend (Rust) agit comme une API locale qui expose des "Commandes" pour :

1. Le CRUD (Create, Read, Update, Delete) des données via SQLite.
2. Le calcul intensif (Génération d'emploi du temps).

## Flux de Données

1. **Frontend** : L'utilisateur définit les matières et contraintes.
2. **Tauri Command** : Appel d'une fonction Rust (`save_constraints`, `generate_schedule`).
3. **Rust (Engine)** :
    * Lecture des données depuis SQLite (via `rusqlite`).
    * Exécution de l'algorithme en mémoire (RAM) pour la performance.
    * Sauvegarde du résultat final dans SQLite.
4. **Frontend** : Réception du résultat et affichage.

## 💾 Schéma de Base de Données (SQLite)

Le modèle relationnel est conçu pour être simple et extensible.

### Tables Principales

**1. `subjects` (Matières)**

* `id` (PK): Integer
* `name`: Text
* `color`: Text (Hex code pour l'affichage)
* `hours_per_week`: Integer (Volume horaire à placer)

**2. `slots` (Créneaux horaires abstraits)**

* `id` (PK): Integer
* `day_index`: Integer (0=Lundi, 1=Mardi...)
* `hour_index`: Integer (0=8h00, 1=9h00...)
* *Note : Permet de définir les "cases" disponibles dans une semaine.*

**3. `constraints` (Règles)**

* `id` (PK): Integer
* `type`: Text (Ex: 'MAX_HOURS_DAY', 'FIXED_SLOT')
* `target_subject_id`: Integer (Nullable, si la règle s'applique à une matière précise)
* `value`: Integer (La valeur de la contrainte, ex: "4" heures max)

**4. `generated_schedules` (Résultats)**

* `id` (PK): Integer
* `subject_id`: FK -> subjects
* `slot_id`: FK -> slots
* `version_id`: Integer (Pour gérer plusieurs versions d'emploi du temps)
