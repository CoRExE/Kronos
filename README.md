# ⏳ Kronos

> **Générateur d'emploi du temps automatisé, local et performant.**

Kronos est une application de bureau conçue avec **Tauri** pour simplifier la création d'emplois du temps scolaires. Elle s'adapte à la complexité de l'établissement, du simple instituteur gérant sa classe unique au proviseur gérant un lycée complet.

🔗 **Dépôt :** [https://github.com/CoRExE/Kronos.git](https://github.com/CoRExE/Kronos.git)

## 🎯 Pourquoi Kronos ?

La création d'emplois du temps est un casse-tête. Kronos résout ce problème via une approche locale (pas de données dans le cloud) et modulaire.

### Deux Modes de Fonctionnement (Profils)

1. **Mode "Classe Unique" (Primaire / Maternelle)** :
    * Interface simplifiée.
    * Pas de gestion de conflits de professeurs ou de salles.
    * Focus sur la répartition pédagogique et les quotas horaires.
2. **Mode "Établissement" (Secondaire / Supérieur)** :
    * Gestion complète des ressources partagées.
    * Détection des collisions (Professeurs, Salles, Groupes).
    * Contraintes avancées (Disponibilités enseignants, Salles spécifiques).

## 🛠 Stack Technique

* **Application Desktop :** [Tauri v2](https://tauri.app/)
* **Frontend :** React + TypeScript + Shadcn/UI
* **Backend & Algorithmes :** Rust
* **Base de données :** SQLite (via `rusqlite`) - Embarquée, fichier local `.db`.

## 🚀 Démarrage Rapide

### Pré-requis

* Node.js & npm/pnpm
* Rust & Cargo

### Installation

```bash
git clone https://github.com/CoRExE/Kronos.git
cd Kronos
pnpm install
pnpm run tauri dev
```

## 📚 Documentation

La documentation détaillée se trouve dans le dossier `/docs` :

* **Architecture Technique** : Modèle de données et flux.
* **Algorithmes** : Backtracking et Génétique.
* **Roadmap** : Plan de développement.
