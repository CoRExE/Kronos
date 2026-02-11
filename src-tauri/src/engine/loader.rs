use std::collections::{HashMap, HashSet};
use rusqlite::Connection;
use crate::engine::structs::{EngineInput, AllocationToPlace};

pub fn load_data(conn: &Connection) -> Result<EngineInput, String> {
    // 1. Charger les slots disponibles ET leur jour
    let mut stmt = conn.prepare("SELECT id, day_index FROM time_slots ORDER BY id ASC").map_err(|e| e.to_string())?;
    let slots_iter = stmt.query_map([], |row| {
        Ok((
            row.get::<_, u32>(0)?, // id
            row.get::<_, u32>(1)?  // day_index
        ))
    }).map_err(|e| e.to_string())?;

    let mut time_slots = Vec::new();
    let mut slot_day_map = HashMap::new();

    for slot_res in slots_iter {
        let (id, day) = slot_res.map_err(|e| e.to_string())?;
        time_slots.push(id);
        slot_day_map.insert(id, day);
    }

    if time_slots.is_empty() {
        return Err("Aucun créneau horaire (Time Slot) défini.".to_string());
    }

    // 2. Charger les salles
    let mut stmt = conn.prepare("SELECT id FROM rooms").map_err(|e| e.to_string())?;
    let rooms_iter = stmt.query_map([], |row| Ok(row.get::<_, u32>(0)?)).map_err(|e| e.to_string())?;
    let mut rooms = Vec::new();
    for r in rooms_iter {
        rooms.push(r.map_err(|e| e.to_string())?);
    }

    if rooms.is_empty() {
        return Err("Aucune salle définie. Ajoutez des salles pour le mode établissement.".to_string());
    }

    // 3. Charger les contraintes d'indisponibilité
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

    // 4. Charger les allocations
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

    // 5. Charger la config globale
    let max_daily_hours: i32 = conn.query_row(
        "SELECT value FROM project_config WHERE key = 'global_max_daily_subject_hours'",
        [],
        |row| {
            let s: String = row.get(0)?;
            Ok(s.parse::<i32>().unwrap_or(2))
        }
    ).unwrap_or(2);

    let allow_consecutive: bool = conn.query_row(
        "SELECT value FROM project_config WHERE key = 'allow_consecutive_subjects'",
        [],
        |row| {
            let s: String = row.get(0)?;
            Ok(s == "true")
        }
    ).unwrap_or(false);

    Ok(EngineInput {
        time_slots,
        slot_day_map,
        rooms,
        allocations: allocations_to_place,
        max_daily_hours_per_subject: max_daily_hours,
        allow_consecutive_subjects: allow_consecutive,
        teacher_forbidden_slots: teacher_forbidden,
        group_forbidden_slots: group_forbidden,
    })
}