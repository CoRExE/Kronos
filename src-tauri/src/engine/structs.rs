// Structures optimisées pour le calcul (In-Memory)

use std::collections::{HashMap, HashSet};

#[derive(Debug, Clone)]
pub struct EngineInput {
    pub time_slots: Vec<u32>, // IDs des créneaux disponibles
    pub slot_day_map: HashMap<u32, u32>, // SlotID -> DayIndex
    pub allocations: Vec<AllocationToPlace>,
    
    // Configuration globale
    pub max_daily_hours_per_subject: i32,
    pub allow_consecutive_subjects: bool, // NOUVEAU

    // Contraintes : TargetType_ID -> Set de SlotIDs interdits
    pub teacher_forbidden_slots: HashMap<i32, HashSet<u32>>,
    pub group_forbidden_slots: HashMap<i32, HashSet<u32>>,
}

#[allow(dead_code)]
#[derive(Debug, Clone)]
pub struct AllocationToPlace {
    pub id: i32,       // ID de l'allocation (clé primaire BDD)
    pub group_id: i32,
    pub teacher_id: Option<i32>,
    pub subject_id: i32,
}

#[derive(Debug, Clone)]
pub struct ScheduleSolution {
    // Clé: AllocationToPlace ID -> Valeur: TimeSlot ID
    pub placements: Vec<(i32, u32)>, 
}
