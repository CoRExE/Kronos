# 🧠 Stratégie Algorithmique

La génération d'emploi du temps est un problème NP-complet (CSP). Pour le résoudre efficacement, nous combinons deux approches.

## 1. Phase de Construction : Backtracking (CSP)

L'objectif de cette phase est de **trouver une solution valide** (qui respecte toutes les contraintes dures).

* **Principe** : On remplit la grille case par case.
* **Mécanisme** :
    1. Sélectionner la matière la plus contrainte (Heuristique *Most Constrained Variable*).
    2. Tenter de la placer dans un créneau vide.
    3. Vérifier la validité (Fonction `isValid()`).
    4. Si valide, passer à la matière suivante.
    5. Si blocage, revenir en arrière (**Backtrack**) et tenter un autre créneau.
* **Résultat** : Un emploi du temps "correct" mais potentiellement mal optimisé (trous dans la journée, répartition inégale).

## 2. Phase d'Optimisation : Algorithme Génétique

Une fois une ou plusieurs solutions valides trouvées, ou si l'espace de recherche est trop grand, l'algorithme génétique tente d'améliorer la **qualité** de la solution (Contraintes Souples).

* **Population** : Un ensemble de N emplois du temps complets.
* **Fitness Function (Score)** : Une fonction qui note un emploi du temps.
* * +100 pts : Tous les cours sont placés.
* * -10 pts : Un "trou" d'une heure entre deux cours.
* * -5 pts : Une journée trop chargée (> 6h).
* **Évolution** :
* **Sélection** : On garde les meilleurs emplois du temps.
* **Crossover** : On mélange le Lundi de l'emploi du temps A avec le Mardi de l'emploi du temps B.
* **Mutation** : On déplace aléatoirement un cours d'un créneau à un autre.

## Structure de Données (Rust)

Pour la performance, nous n'utilisons pas d'objets complexes pendant le calcul, mais des structures légères stockées dans la Stack ou des Vectors contigus.

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
