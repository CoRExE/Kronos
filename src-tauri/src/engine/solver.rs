use std::collections::HashMap;
use crate::engine::structs::{EngineInput, ScheduleSolution, AllocationToPlace};
use rand::seq::SliceRandom; 
use rand::thread_rng;

/// Type interne pour une solution temporaire (Map d'index -> (SlotID, RoomID))
type RawSolution = HashMap<usize, (u32, u32)>;

pub fn solve(input: &EngineInput) -> Result<ScheduleSolution, String> {
    let mut best_solution: Option<RawSolution> = None;
    let mut best_score = i32::MAX;

    // On lance la recherche 5 fois pour trouver la version la plus "confortable"
    // (Grâce au shuffle aléatoire, chaque itération donnera un résultat différent)
    for _ in 0..5 {
        let mut current_solution = HashMap::new(); 
        let mut shuffled_slots = input.time_slots.clone();
        let mut rng = thread_rng();
        shuffled_slots.shuffle(&mut rng);

        if backtracking(0, &input.allocations, &shuffled_slots, &input, &mut current_solution) {
            let score = calculate_comfort_score(&current_solution, &input);
            
            if score < best_score {
                best_score = score;
                best_solution = Some(current_solution);
            }
        }
    }

    if let Some(final_raw) = best_solution {
        println!("✨ Meilleure solution trouvée avec un score de confort de : {} (trous)", best_score);
        
        let placements = final_raw.into_iter().map(|(idx, (slot_id, room_id))| {
            let alloc = &input.allocations[idx];
            (alloc.id, slot_id, room_id)
        }).collect();
        Ok(ScheduleSolution { placements })
    } else {
        Err("Impossible de trouver un emploi du temps valide.".to_string())
    }
}

/// Calcule le nombre de "trous" (heures creuses) dans l'emploi du temps des professeurs.
/// Plus le score est bas, meilleur est l'emploi du temps.
fn calculate_comfort_score(solution: &RawSolution, input: &EngineInput) -> i32 {
    let mut holes = 0;

    // On regroupe les cours par PROFESSEUR et par JOUR
    // Map<TeacherID, Map<DayIndex, Vec<SlotID>>>
    let mut teacher_days: HashMap<i32, HashMap<u32, Vec<u32>>> = HashMap::new();

    for (&alloc_idx, &(slot_id, _)) in solution.iter() {
        let alloc = &input.allocations[alloc_idx];
        if let Some(t_id) = alloc.teacher_id {
            let day = *input.slot_day_map.get(&slot_id).unwrap_or(&0);
            teacher_days
                .entry(t_id)
                .or_insert_with(HashMap::new)
                .entry(day)
                .or_insert_with(Vec::new)
                .push(slot_id);
        }
    }

    // Pour chaque prof, chaque jour, on compte les sauts d'ID de créneaux
    for days in teacher_days.values() {
        for slots in days.values() {
            if slots.len() < 2 { continue; }
            
            let mut sorted_slots = slots.clone();
            sorted_slots.sort();

            // Un trou est détecté si la différence entre deux IDs de créneaux consécutifs
            // est supérieure à 1 (en supposant que les IDs en BDD se suivent chronologiquement).
            for i in 0..sorted_slots.len() - 1 {
                let diff = sorted_slots[i+1] as i32 - sorted_slots[i] as i32;
                if diff > 1 {
                    // On ajoute la pénalité proportionnelle à la taille du trou
                    holes += diff - 1;
                }
            }
        }
    }

    holes
}

fn backtracking(
    alloc_idx: usize, 
    allocs: &Vec<AllocationToPlace>,
    slots: &Vec<u32>,
    input: &EngineInput,
    solution: &mut RawSolution
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
    solution: &RawSolution, 
    allocs: &Vec<AllocationToPlace>,
    input: &EngineInput
) -> bool {
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

    for (&other_idx, &(other_slot, other_room)) in solution.iter() {
        if other_idx == current_idx { continue; } 
        
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
