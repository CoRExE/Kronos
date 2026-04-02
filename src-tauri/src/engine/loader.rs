use std::collections::{HashMap, HashSet};
use rusqlite::Connection;
use crate::engine::structs::{EngineInput, AllocationToPlace, LockedLesson};

pub fn load_data(conn: &Connection) -> Result<EngineInput, String> {
    // 1. Slots
    let mut stmt = conn.prepare("SELECT id, day_index FROM time_slots ORDER BY id ASC").map_err(|e| e.to_string())?;
    let slots_iter = stmt.query_map([], |row| Ok((row.get::<_, u32>(0)?, row.get::<_, u32>(1)?))).map_err(|e| e.to_string())?;
    let mut time_slots = Vec::new();
    let mut slot_day_map = HashMap::new();
    for slot_res in slots_iter {
        let (id, day) = slot_res.map_err(|e| e.to_string())?;
        time_slots.push(id);
        slot_day_map.insert(id, day);
    }
    if time_slots.is_empty() { return Err("Aucun créneau horaire défini.".to_string()); }

    // 2. Salles
    let mut stmt = conn.prepare("SELECT id, type FROM rooms").map_err(|e| e.to_string())?;
    let rooms_iter = stmt.query_map([], |row| Ok((row.get::<_, u32>(0)?, row.get::<_, String>(1)?))).map_err(|e| e.to_string())?;
    let mut rooms = Vec::new();
    for r in rooms_iter { rooms.push(r.map_err(|e| e.to_string())?); }
    if rooms.is_empty() { return Err("Aucune salle définie.".to_string()); }

    // 3. Contraintes Indispo
    let mut teacher_forbidden = HashMap::new();
    let mut group_forbidden = HashMap::new();
    let mut stmt = conn.prepare("SELECT target_type, target_id, param_value FROM constraints WHERE rule_type = 'FORBIDDEN_SLOT'").map_err(|e| e.to_string())?;
    let const_iter = stmt.query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, i32>(1)?, row.get::<_, String>(2)?))).map_err(|e| e.to_string())?;
    for res in const_iter {
        let (t_type, t_id, p_val) = res.map_err(|e| e.to_string())?;
        let slot_id = p_val.parse::<u32>().unwrap_or(0);
        if t_type == "TEACHER" { teacher_forbidden.entry(t_id).or_insert_with(HashSet::new).insert(slot_id); } 
        else if t_type == "GROUP" { group_forbidden.entry(t_id).or_insert_with(HashSet::new).insert(slot_id); }
    }

    // 4. Charger les cours VERROUILLÉS
    let mut stmt = conn.prepare("SELECT allocation_id, slot_id, room_id FROM scheduled_lessons WHERE is_locked = 1").map_err(|e| e.to_string())?;
    let locked_iter = stmt.query_map([], |row| Ok(LockedLesson {
        allocation_id: row.get(0)?,
        slot_id: row.get(1)?,
        room_id: row.get(2)?,
    })).map_err(|e| e.to_string())?;
    
    let mut locked_lessons = Vec::new();
    let mut locked_counts: HashMap<i32, i32> = HashMap::new();
    for res in locked_iter {
        let lesson = res.map_err(|e| e.to_string())?;
        *locked_counts.entry(lesson.allocation_id).or_insert(0) += 1;
        locked_lessons.push(lesson);
    }

    // 5. Allocations (Soustraction des verrous)
    let mut stmt = conn.prepare(
        "SELECT a.id, a.group_id, a.subject_id, a.teacher_id, a.count, s.required_room_type 
         FROM allocations a 
         JOIN subjects s ON a.subject_id = s.id"
    ).map_err(|e| e.to_string())?;
    
    let allocs_iter = stmt.query_map([], |row| {
        Ok((
            row.get::<_, i32>(0)?, 
            row.get::<_, i32>(1)?, 
            row.get::<_, i32>(2)?, 
            row.get::<_, Option<i32>>(3)?, 
            row.get::<_, i32>(4)?,
            row.get::<_, String>(5)?
        ))
    }).map_err(|e| e.to_string())?;

    let mut allocations_to_place = Vec::new();
    for alloc_res in allocs_iter {
        let (id, group_id, subject_id, teacher_id, count, room_type) = alloc_res.map_err(|e| e.to_string())?;
        
        // On ne place que le RESTE (Total demandé - Déjà verrouillé)
        let locked_for_this = *locked_counts.get(&id).unwrap_or(&0);
        let remaining = count - locked_for_this;
        
        for _ in 0..remaining {
            allocations_to_place.push(AllocationToPlace { id, group_id, subject_id, teacher_id, required_room_type: room_type.clone() });
        }
    }

    // 6. Config globale
    let max_daily_hours: i32 = conn.query_row("SELECT value FROM project_config WHERE key = 'global_max_daily_subject_hours'", [], |row| Ok(row.get::<String, _>(0)?.parse::<i32>().unwrap_or(2))).unwrap_or(2);
    let allow_consecutive: bool = conn.query_row("SELECT value FROM project_config WHERE key = 'allow_consecutive_subjects'", [], |row| Ok(row.get::<String, _>(0)? == "true")).unwrap_or(false);

    Ok(EngineInput {
        time_slots, slot_day_map, rooms, allocations: allocations_to_place, locked_lessons,
        max_daily_hours_per_subject: max_daily_hours,
        allow_consecutive_subjects: allow_consecutive,
        teacher_forbidden_slots: teacher_forbidden,
        group_forbidden_slots: group_forbidden,
    })
}
