use std::collections::HashMap;
use crate::engine::structs::{EngineInput, ScheduleSolution, AllocationToPlace};

pub fn solve(input: &EngineInput) -> Result<ScheduleSolution, String> {
    let mut solution = HashMap::new(); // Map<Index dans input.allocations, SlotID>
    
    if backtracking(0, &input, &mut solution) {
        // Conversion de la Map interne vers le format de sortie
        let placements = solution.into_iter().map(|(idx, slot_id)| {
            let alloc = &input.allocations[idx];
            (alloc.id, slot_id)
        }).collect();

        Ok(ScheduleSolution { placements })
    } else {
        Err("Impossible de trouver un emploi du temps valide avec ces contraintes.".to_string())
    }
}

// Fonction récursive
fn backtracking(
    alloc_idx: usize, 
    input: &EngineInput, 
    solution: &mut HashMap<usize, u32>
) -> bool {
    // Cas de base : Tout est placé !
    if alloc_idx >= input.allocations.len() {
        return true;
    }

    let current_alloc = &input.allocations[alloc_idx];

    // Essayer chaque slot disponible
    for &slot_id in &input.time_slots {
        if is_valid(slot_id, current_alloc, solution, input) {
            // Placer
            solution.insert(alloc_idx, slot_id);

            // Récurser
            if backtracking(alloc_idx + 1, input, solution) {
                return true;
            }

            // Backtrack (Annuler)
            solution.remove(&alloc_idx);
        }
    }

    false // Aucun slot ne convient pour ce cours à ce stade
}

fn is_valid(
    target_slot: u32, 
    alloc: &AllocationToPlace, 
    solution: &HashMap<usize, u32>, 
    input: &EngineInput
) -> bool {
    // Vérifier les conflits avec les cours DÉJÀ placés
    for (&other_idx, &other_slot) in solution.iter() {
        // Si ce n'est pas le même créneau, pas de conflit direct possible
        if other_slot != target_slot {
            continue;
        }

        let other_alloc = &input.allocations[other_idx];

        // 1. Conflit GROUPE : Le même groupe ne peut pas être à 2 endroits
        if alloc.group_id == other_alloc.group_id {
            return false;
        }

        // 2. Conflit PROFESSEUR : Le même prof ne peut pas être à 2 endroits
        // (Uniquement si un prof est assigné aux deux)
        if let (Some(t1), Some(t2)) = (alloc.teacher_id, other_alloc.teacher_id) {
            if t1 == t2 {
                return false;
            }
        }
    }

    true
}
