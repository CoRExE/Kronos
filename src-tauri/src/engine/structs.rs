// Structures optimisées pour le calcul (In-Memory)

use std::collections::HashSet;

#[derive(Debug, Clone)]
pub struct EngineInput {
    pub time_slots: Vec<u32>, // IDs des créneaux disponibles
    pub allocations: Vec<AllocationToPlace>,
    
    // Contraintes : TargetType_ID -> Set de SlotIDs interdits
    // On utilisera une clé composite ou deux maps distinctes pour simplifier
    pub teacher_forbidden_slots: std::collections::HashMap<i32, HashSet<u32>>,
    pub group_forbidden_slots: std::collections::HashMap<i32, HashSet<u32>>,
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
