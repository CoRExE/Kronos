# 🔧 Améliorations Futures du Schéma de Données

Ce document recense les limitations identifiées du schéma actuel (V1) et les pistes d'évolution pour supporter des cas d'usage complexes (Lycée, Fac, Contraintes avancées).

## 1. Gestion des Sous-groupes et Spécialités (Lycée/Supérieur)

### Le Problème

Actuellement, `ALLOCATION` lie un cours à un `student_group` unique.
Le système considère tous les groupes comme indépendants.
*Exemple :* Si on crée un groupe "Terminale A" et un groupe "Terminale A - Spé Maths", le système ne sait pas que ce sont les mêmes élèves. Il pourrait placer un cours de Philo (Classe entière) en même temps que la Spé Maths.

### La Solution envisagée

Introduire une notion de hiérarchie ou d'inclusion entre les groupes.

#### Option A : Table de Composition

Ajouter une table `group_composition` :

```sql
CREATE TABLE group_composition (
    parent_id INTEGER, -- ex: ID de "Terminale A"
    child_id INTEGER,  -- ex: ID de "Gr. Spé Maths"
    PRIMARY KEY (parent_id, child_id),
    FOREIGN KEY (parent_id) REFERENCES student_groups(id),
    FOREIGN KEY (child_id) REFERENCES student_groups(id)
);
```

**Impact Algorithmique :**
Lors de la vérification `isValid(slot, group_id)` :

1. Vérifier si `group_id` est libre.
2. Vérifier si tous ses **parents** sont libres (ex: Pas de cours pour la classe entière ?).
3. Vérifier si tous ses **enfants** sont libres (ex: Pas de cours pour un sous-groupe ?).

## 2. Périodicité (Semaines A / B)

### Le Problème

Le schéma actuel assume une semaine type répétée à l'infini.
Les cours de type "1h tous les 15 jours" (TP de Sciences, AP) ne sont pas supportés.

### La Solution envisagée

Ajouter un champ de périodicité dans `allocations`.

```sql
ALTER TABLE allocations ADD COLUMN frequency TEXT DEFAULT 'WEEKLY'; -- 'WEEKLY', 'A', 'B'
```

Et adapter la table `scheduled_lessons` pour savoir à quelle semaine elle s'applique (ou dupliquer les slots).

## 3. Contraintes de Salles Avancées

### Le Problème

Actuellement, on a juste une capacité et un type basique.
On ne gère pas :

- Salles distantes (temps de trajet entre deux cours).
- Équipements spécifiques (Projecteur, Paillasse chimie).

### La Solution envisagée

Table de tags/attributs sur les salles et sur les matières (`subject_requirements`).
