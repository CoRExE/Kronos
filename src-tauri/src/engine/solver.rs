use std::collections::HashMap;
use crate::engine::structs::{EngineInput, ScheduleSolution, AllocationToPlace};

pub fn solve(input: &EngineInput) -> Result<ScheduleSolution, String> {
    let mut solution = HashMap::new(); // Map<Index dans input.allocations, SlotID>
    
    if backtracking(0, &input, &mut solution) {
        let placements = solution.into_iter().map(|(idx, slot_id)| {
            let alloc = &input.allocations[idx];
            (alloc.id, slot_id)
        }).collect();

        Ok(ScheduleSolution { placements })
    } else {
        Err("Impossible de trouver un emploi du temps valide respectant toutes les contraintes.".to_string())
    }
}

fn backtracking(
    alloc_idx: usize, 
    input: &EngineInput, 
    solution: &mut HashMap<usize, u32>
) -> bool {
    if alloc_idx >= input.allocations.len() {
        return true;
    }

    let current_alloc = &input.allocations[alloc_idx];

    for &slot_id in &input.time_slots {
        if is_valid(slot_id, current_alloc, solution, input) {
            solution.insert(alloc_idx, slot_id);
            if backtracking(alloc_idx + 1, input, solution) {
                return true;
            }
            solution.remove(&alloc_idx);
        }
    }

    false
}

fn is_valid(
    target_slot: u32, 
    alloc: &AllocationToPlace, 
    solution: &HashMap<usize, u32>, 
    input: &EngineInput
) -> bool {
    // 1. Vérifier les interdictions (Contraintes directes)
    
    // Professeur indisponible ?
    if let Some(t_id) = alloc.teacher_id {
        if let Some(forbidden) = input.teacher_forbidden_slots.get(&t_id) {
            if forbidden.contains(&target_slot) {
                return false;
            }
        }
    }

    // Groupe indisponible ?
    if let Some(forbidden) = input.group_forbidden_slots.get(&alloc.group_id) {
        if forbidden.contains(&target_slot) {
            return false;
        }
    }

    // 2. Vérifier les conflits avec les cours DÉJÀ placés
    for (&other_idx, &other_slot) in solution.iter() {
        if other_slot != target_slot {
            continue;
        }

        let other_alloc = &input.allocations[other_idx];

        // Conflit GROUPE
        if alloc.group_id == other_alloc.group_id {
            return false;
        }

        // Conflit PROFESSEUR
        if let (Some(t1), Some(t2)) = (alloc.teacher_id, other_alloc.teacher_id) {
            if t1 == t2 {
                return false;
            }
        }
    }

    true
}