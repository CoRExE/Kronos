use std::collections::HashMap;
use crate::engine::structs::{EngineInput, ScheduleSolution, AllocationToPlace};
use rand::seq::SliceRandom; // Pour le mélange
use rand::thread_rng;

pub fn solve(input: &EngineInput) -> Result<ScheduleSolution, String> {
    let mut solution = HashMap::new(); 
    
    // HEURISTIQUE D'ÉQUILIBRAGE : On mélange les slots pour ne pas remplir 
    // l'emploi du temps de gauche à droite (Lundi -> Vendredi).
    let mut shuffled_slots = input.time_slots.clone();
    let mut rng = thread_rng();
    shuffled_slots.shuffle(&mut rng);

    if backtracking(0, &input, &shuffled_slots, &mut solution) {
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
    slots: &Vec<u32>,
    solution: &mut HashMap<usize, u32>
) -> bool {
    if alloc_idx >= input.allocations.len() {
        return true;
    }

    let current_alloc = &input.allocations[alloc_idx];

    for &slot_id in slots {
        if is_valid(slot_id, current_alloc, solution, input) {
            solution.insert(alloc_idx, slot_id);
            if backtracking(alloc_idx + 1, input, slots, solution) {
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
    if let Some(t_id) = alloc.teacher_id {
        if let Some(forbidden) = input.teacher_forbidden_slots.get(&t_id) {
            if forbidden.contains(&target_slot) { return false; }
        }
    }
    if let Some(forbidden) = input.group_forbidden_slots.get(&alloc.group_id) {
        if forbidden.contains(&target_slot) { return false; }
    }

    let target_day = match input.slot_day_map.get(&target_slot) {
        Some(&d) => d,
        None => return false,
    };

    let mut same_subject_count_today = 0;

    // 2. Vérifier les conflits avec les cours DÉJÀ placés
    for (&other_idx, &other_slot) in solution.iter() {
        let other_alloc = &input.allocations[other_idx];

        // --- Conflit Temporel (Même heure) ---
        if other_slot == target_slot {
            if alloc.group_id == other_alloc.group_id { return false; }
            if let (Some(t1), Some(t2)) = (alloc.teacher_id, other_alloc.teacher_id) {
                if t1 == t2 { return false; }
            }
        }

        // --- Contraintes sur le même groupe ---
        if alloc.group_id == other_alloc.group_id {
            if let Some(&other_day) = input.slot_day_map.get(&other_slot) {
                if other_day == target_day {
                    if alloc.subject_id == other_alloc.subject_id {
                        same_subject_count_today += 1;

                        // --- CONTRAINTE DE CONSÉCUTIVITÉ ---
                        if !input.allow_consecutive_subjects {
                            // On vérifie si target_slot et other_slot sont adjacents
                            // (On utilise la valeur absolue de la différence d'ID car les IDs sont chronologiques)
                            let diff = (target_slot as i32 - other_slot as i32).abs();
                            if diff == 1 {
                                return false; // Trop proche !
                            }
                        }
                    }
                }
            }
        }
    }

    if same_subject_count_today >= input.max_daily_hours_per_subject {
        return false;
    }

    true
}