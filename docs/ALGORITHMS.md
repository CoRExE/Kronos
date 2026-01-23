# 🧠 Moteur de Génération

Le cœur de Kronos repose sur la résolution de problèmes de satisfaction de contraintes (CSP). Pour le résoudre efficacement, nous combinons deux approches dans une **Stratégie Hybride**.

## Stratégie Hybride

### 1. Phase de Validité : Backtracking

L'objectif de cette phase est de **remplir la grille sans violer de règles strictes**.

* **But** : Trouver une solution valide.
* **Méthode** : *Backtracking* avec heuristique (Matière la plus difficile à placer en premier - *Most Constrained Variable*).

**Mécanisme détaillé** :

1. Sélectionner la matière la plus contrainte.
2. Tenter de la placer dans un créneau vide.
3. Vérifier la validité (Fonction `isValid()`).
4. Si valide, passer à la matière suivante.
5. Si blocage, revenir en arrière (**Backtrack**) et tenter un autre créneau.

### 2. Phase de Qualité : Algorithme Génétique

Une fois une solution valide trouvée (ou si l'espace de recherche est trop grand), l'objectif est d'**optimiser le confort** (éviter les trous, équilibrer la semaine).

* **But** : Améliorer la qualité de la solution via des contraintes souples.
* **Méthode** : Algorithme génétique (Population -> Sélection -> Crossover -> Mutation).

**Fonctionnement** :

* **Population** : Un ensemble de N emplois du temps complets.
* **Fitness Function (Score)** :
  * +100 pts : Tous les cours sont placés.
  * -10 pts : Un "trou" d'une heure entre deux cours.
  * -5 pts : Une journée trop chargée (> 6h).
* **Évolution** : Sélection des meilleurs, Crossover (mélange des jours entre emplois du temps), et Mutation (déplacement aléatoire d'un cours).

## Impact du Profil sur l'Algorithme

Le choix du profil (`SINGLE_CLASS` vs `MULTI_CLASS`) modifie la fonction de validation `isValid()`.

### Mode "Classe Unique" (Primaire)

La fonction de validation est **allégée**.
$$isValid(slot, lesson)$$
Vérifie uniquement :

1. Le créneau est-il libre pour ce groupe ?
2. La contrainte "Max heures par jour" de la matière est-elle respectée ?
3. *Pas de vérification de collision Professeur ou Salle.*

### Mode "Établissement" (Secondaire)

La fonction est **stricte**.
$$isValid(slot, lesson)$$
Vérifie :

1. Le créneau est-il libre pour ce groupe ?
2. Le créneau est-il libre pour ce **Professeur** ?
3. Le créneau est-il libre pour la **Salle** (si applicable) ?
4. Contraintes pédagogiques (Max heures, répartition).

## Structure mémoire (Rust)

Pour optimiser la vitesse, nous n'utilisons pas la BDD pendant le calcul. Les données sont converties en vecteurs d'entiers (`u16`) pour une manipulation rapide en RAM (Stack ou Vectors contigus).

```rust
// Exemple conceptuel
struct TimeSlot {
    day: u8,
    hour: u8,
}

struct ScheduleGenome {
    // Un simple vecteur où l'index représente le SlotID
    // et la valeur représente le SubjectID.
    // 0 = Vide.
    grid: Vec<u16>
}
```
