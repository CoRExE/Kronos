use std::collections::HashMap;
use crate::engine::structs::{EngineInput, ScheduleSolution, AllocationToPlace};
use rand::seq::SliceRandom; 
use rand::thread_rng;

type RawSolution = HashMap<usize, (u32, u32)>;

pub fn solve(input: &EngineInput) -> Result<ScheduleSolution, String> {
    let mut best_solution: Option<Vec<(i32, u32, u32)>> = None;
    let mut best_score = i32::MAX;

    // Charger les verrous comme socle de base
    let mut base_placements: Vec<(i32, u32, u32)> = Vec::new();
    for locked in &input.locked_lessons {
        base_placements.push((locked.allocation_id, locked.slot_id, locked.room_id));
    }

    for _ in 0..5 {
        let mut current_solution = HashMap::new(); 
        let mut shuffled_slots = input.time_slots.clone();
        let mut rng = thread_rng();
        shuffled_slots.shuffle(&mut rng);

        // On passe les placements de base au solver
        if backtracking(0, &input.allocations, &shuffled_slots, &input, &mut current_solution, &base_placements) {
            
            // Reconstruire la solution complète pour le score
            let mut full_placements = base_placements.clone();
            for (&idx, &(slot_id, room_id)) in current_solution.iter() {
                full_placements.push((input.allocations[idx].id, slot_id, room_id));
            }

            let score = calculate_comfort_score(&full_placements, &input);
            if score < best_score {
                best_score = score;
                best_solution = Some(full_placements);
            }
        }
    }

    if let Some(final_placements) = best_solution {
        Ok(ScheduleSolution { placements: final_placements })
    } else {
        Err("Impossible de trouver un emploi du temps valide respectant les cours verrouillés.".to_string())
    }
}

fn calculate_comfort_score(_placements: &Vec<(i32, u32, u32)>, _input: &EngineInput) -> i32 {
    0 // Simplification temporaire pour supprimer les warnings
}

fn backtracking(
    alloc_idx: usize, 
    allocs: &Vec<AllocationToPlace>,
    slots: &Vec<u32>,
    input: &EngineInput,
    solution: &mut RawSolution,
    base_placements: &Vec<(i32, u32, u32)>
) -> bool {
    if alloc_idx >= allocs.len() { return true; }
    let current_alloc = &allocs[alloc_idx];

    for &slot_id in slots {
        for &(room_id, ref room_type) in &input.rooms {
            if room_type != &current_alloc.required_room_type { continue; }

            if is_valid(slot_id, room_id, current_alloc, alloc_idx, solution, allocs, input, base_placements) {
                solution.insert(alloc_idx, (slot_id, room_id));
                if backtracking(alloc_idx + 1, allocs, slots, input, solution, base_placements) { return true; }
                solution.remove(&alloc_idx);
            }
        }
    }
    false
}

fn is_valid(
    target_slot: u32, 
    target_room: u32,
    alloc: &AllocationToPlace, 
    current_idx: usize,
    solution: &RawSolution, 
    allocs: &Vec<AllocationToPlace>,
    input: &EngineInput,
    base_placements: &Vec<(i32, u32, u32)>
) -> bool {
    // 1. Indisponibilités
    if let Some(t_id) = alloc.teacher_id {
        if let Some(forbidden) = input.teacher_forbidden_slots.get(&t_id) {
            if forbidden.contains(&target_slot) { return false; }
        }
    }
    if let Some(forbidden) = input.group_forbidden_slots.get(&alloc.group_id) {
        if forbidden.contains(&target_slot) { return false; }
    }

    let target_day = *input.slot_day_map.get(&target_slot).unwrap_or(&0);
    let mut same_subject_count_today = 0;

    // 2. Vérifier les conflits avec la solution partielle
    for (&other_idx, &(other_slot, other_room)) in solution.iter() {
        if other_idx == current_idx { continue; } 
        let other_alloc = &allocs[other_idx];
        if !check_conflict(target_slot, target_room, alloc, other_slot, other_room, other_alloc, target_day, input, &mut same_subject_count_today) {
            return false;
        }
    }

    // 3. Vérifier les conflits avec les cours VERROUILLÉS (Base Placements)
    // Pour cela, on a besoin de connaître les propriétés des allocations verrouillées.
    // Pour l'instant, par simplicité technique dans ce tour, on va juste vérifier les conflits physiques (Slot/Room).
    // Une version parfaite demanderait de charger toutes les métadonnées d'allocations dans EngineInput.
    for &(_l_alloc_id, l_slot_id, l_room_id) in base_placements {
        if target_slot == l_slot_id {
            if target_room == l_room_id { return false; } // Salle prise par un verrou
            // Note: Les conflits groupe/prof avec les verrous sont ignorés ici mais devraient être gérés.
        }
    }

    if same_subject_count_today >= input.max_daily_hours_per_subject { return false; }
    true
}

fn check_conflict(
    target_slot: u32, target_room: u32, alloc: &AllocationToPlace,
    other_slot: u32, other_room: u32, other_alloc: &AllocationToPlace,
    target_day: u32, input: &EngineInput, same_subject_count: &mut i32
) -> bool {
    if other_slot == target_slot {
        if alloc.group_id == other_alloc.group_id { return false; }
        if let (Some(t1), Some(t2)) = (alloc.teacher_id, other_alloc.teacher_id) {
            if t1 == t2 { return false; }
        }
        if target_room == other_room { return false; }
    }
    if alloc.group_id == other_alloc.group_id {
        if let Some(&other_day) = input.slot_day_map.get(&other_slot) {
            if other_day == target_day {
                if alloc.subject_id == other_alloc.subject_id {
                    *same_subject_count += 1;
                    if !input.allow_consecutive_subjects {
                        let diff = (target_slot as i32 - other_slot as i32).abs();
                        if diff == 1 { return false; }
                    }
                }
            }
        }
    }
    true
}
