use std::collections::{HashMap, HashSet};
use rusqlite::Connection;
use crate::engine::structs::{EngineInput, AllocationToPlace};

pub fn load_data(conn: &Connection) -> Result<EngineInput, String> {
    // ... (1. Charger les slots)
    let mut stmt = conn.prepare("SELECT id FROM time_slots ORDER BY id ASC").map_err(|e| e.to_string())?;
    let slots_iter = stmt.query_map([], |row| {
        Ok(row.get::<_, u32>(0)?)
    }).map_err(|e| e.to_string())?;

    let mut time_slots = Vec::new();
    for slot in slots_iter {
        time_slots.push(slot.map_err(|e| e.to_string())?);
    }

    if time_slots.is_empty() {
        return Err("Aucun créneau horaire (Time Slot) défini.".to_string());
    }

    // --- NOUVEAU : Charger les contraintes ---
    let mut teacher_forbidden = HashMap::new();
    let mut group_forbidden = HashMap::new();

    let mut stmt = conn.prepare(
        "SELECT target_type, target_id, param_value FROM constraints WHERE rule_type = 'FORBIDDEN_SLOT'"
    ).map_err(|e| e.to_string())?;

    let const_iter = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?, // target_type
            row.get::<_, i32>(1)?,    // target_id
            row.get::<_, String>(2)?, // param_value (SlotID)
        ))
    }).map_err(|e| e.to_string())?;

    for res in const_iter {
        let (t_type, t_id, p_val) = res.map_err(|e| e.to_string())?;
        let slot_id = p_val.parse::<u32>().unwrap_or(0);
        
        if t_type == "TEACHER" {
            teacher_forbidden.entry(t_id).or_insert_with(HashSet::new).insert(slot_id);
        } else if t_type == "GROUP" {
            group_forbidden.entry(t_id).or_insert_with(HashSet::new).insert(slot_id);
        }
    }

    // ... (2. Charger les allocations)
    let mut stmt = conn.prepare("SELECT id, group_id, subject_id, teacher_id, count FROM allocations").map_err(|e| e.to_string())?;
    let allocs_iter = stmt.query_map([], |row| {
        Ok((
            row.get::<_, i32>(0)?, 
            row.get::<_, i32>(1)?, 
            row.get::<_, i32>(2)?, 
            row.get::<_, Option<i32>>(3)?, 
            row.get::<_, i32>(4)?,
        ))
    }).map_err(|e| e.to_string())?;

    let mut allocations_to_place = Vec::new();
    for alloc_res in allocs_iter {
        let (id, group_id, subject_id, teacher_id, count) = alloc_res.map_err(|e| e.to_string())?;
        for _ in 0..count {
            allocations_to_place.push(AllocationToPlace { id, group_id, subject_id, teacher_id });
        }
    }

    Ok(EngineInput {
        time_slots,
        allocations: allocations_to_place,
        teacher_forbidden_slots: teacher_forbidden,
        group_forbidden_slots: group_forbidden,
    })
}
