# 📅 Kronos

Un générateur d'emplois du temps automatisé et performant, conçu pour résoudre les contraintes complexes du milieu éducatif (enseignants, salles, volume horaire).

## 🚀 Vision du Projet

L'objectif est de fournir une application de bureau locale (Desktop), capable de générer des plannings scolaires en respectant deux types de critères :

1. **Validité (Contraintes Fortes)** : Aucun conflit de cours, respect des volumes horaires.
2. **Qualité (Contraintes Faibles)** : Équilibrage de la charge, regroupement des cours, préférences des enseignants.

## 🛠 Stack Technique

* **Core :** [Tauri v2](https://tauri.app/) (Performance & Sécurité)
* **Backend / Algorithmique :** Rust (Rapidité de calcul pour les algorithmes NP-complet)
* **Database :** SQLite (via `rusqlite`) - Stockage local sans configuration.
* **Frontend :** React + TypeScript (Interface réactive)
* **UI Library :** Shadcn/UI + TailwindCSS

## 📦 Installation & Démarrage

### Pré-requis

* Node.js & npm/pnpm
* Rust & Cargo

### Lancer le projet

```bash
# Installation des dépendances front
npm install

# Lancer en mode développement (Front + Rust)
npm run tauri dev
```

## 📂 Structure du projet

La documentation détaillée se trouve dans le dossier ./docs :

* Architecture & Base de données : Comment les données circulent.
* Algorithmes : Explication du Backtracking et de l'Algorithme Génétique.
* Roadmap : Les étapes du développement.
