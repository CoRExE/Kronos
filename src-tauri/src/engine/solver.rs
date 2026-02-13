use std::collections::HashMap;
use crate::engine::structs::{EngineInput, ScheduleSolution, AllocationToPlace};
use rand::seq::SliceRandom; 
use rand::thread_rng;

pub fn solve(input: &EngineInput) -> Result<ScheduleSolution, String> {
    let mut solution = HashMap::new(); 
    
    // 1. HEURISTIQUE DE TRI (Fail-First)
    // On trie les allocations de la plus "difficile" à la plus "facile"
    let mut sorted_allocs = input.allocations.clone();
    sorted_allocs.sort_by(|a, b| {
        let score_a = calculate_difficulty(a, input);
        let score_b = calculate_difficulty(b, input);
        score_b.cmp(&score_a) // Décroissant (plus dur en premier)
    });

    // 2. HEURISTIQUE DE RÉPARTITION (Shuffle des slots)
    let mut shuffled_slots = input.time_slots.clone();
    let mut rng = thread_rng();
    shuffled_slots.shuffle(&mut rng);

    if backtracking(0, &sorted_allocs, &shuffled_slots, &input, &mut solution) {
        let placements = solution.into_iter().map(|(idx, (slot_id, room_id))| {
            let alloc = &sorted_allocs[idx];
            (alloc.id, slot_id, room_id)
        }).collect();
        Ok(ScheduleSolution { placements })
    } else {
        Err("Impossible de trouver un emploi du temps valide. Essayez d'ajouter des salles ou de libérer des créneaux.".to_string())
    }
}

/// Calcule un score de difficulté pour une allocation (Heuristique MCV)
fn calculate_difficulty(alloc: &AllocationToPlace, input: &EngineInput) -> i32 {
    let mut score = 0;

    // A. Rareté de la salle (Plus il y a de salles de ce type, moins c'est dur)
    let room_count = input.rooms.iter().filter(|(_, t)| t == &alloc.required_room_type).count() as i32;
    score += (10 - room_count) * 10; // Max 100 points

    // B. Indisponibilité du Professeur
    if let Some(t_id) = alloc.teacher_id {
        if let Some(forbidden) = input.teacher_forbidden_slots.get(&t_id) {
            score += (forbidden.len() as i32) * 5; // 5 pts par créneau interdit
        }
    }

    // C. Indisponibilité du Groupe
    if let Some(forbidden) = input.group_forbidden_slots.get(&alloc.group_id) {
        score += (forbidden.len() as i32) * 5;
    }

    score
}

fn backtracking(
    alloc_idx: usize, 
    allocs: &Vec<AllocationToPlace>,
    slots: &Vec<u32>,
    input: &EngineInput,
    solution: &mut HashMap<usize, (u32, u32)>
) -> bool {
    if alloc_idx >= allocs.len() { return true; }
    let current_alloc = &allocs[alloc_idx];

    for &slot_id in slots {
        for &(room_id, ref room_type) in &input.rooms {
            if room_type != &current_alloc.required_room_type { continue; }

            if is_valid(slot_id, room_id, current_alloc, alloc_idx, solution, allocs, input) {
                solution.insert(alloc_idx, (slot_id, room_id));
                if backtracking(alloc_idx + 1, allocs, slots, input, solution) { return true; }
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
    solution: &HashMap<usize, (u32, u32)>, 
    allocs: &Vec<AllocationToPlace>,
    input: &EngineInput
) -> bool {
    // 1. Indisponibilités directes (Prof / Groupe)
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

    // 2. Vérifier les conflits avec les cours DÉJÀ placés
    for (&other_idx, &(other_slot, other_room)) in solution.iter() {
        if other_idx == current_idx { continue; } // Ne pas se comparer à soi-même
        
        let other_alloc = &allocs[other_idx];
        
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
                        same_subject_count_today += 1;
                        if !input.allow_consecutive_subjects {
                            let diff = (target_slot as i32 - other_slot as i32).abs();
                            if diff == 1 { return false; }
                        }
                    }
                }
            }
        }
    }
    if same_subject_count_today >= input.max_daily_hours_per_subject { return false; }
    true
}
