use rusqlite::Connection;
use crate::engine::structs::{EngineInput, AllocationToPlace};

pub fn load_data(conn: &Connection) -> Result<EngineInput, String> {
    // 1. Charger les slots disponibles
    let mut stmt = conn.prepare("SELECT id FROM time_slots ORDER BY id ASC").map_err(|e| e.to_string())?;
    let slots_iter = stmt.query_map([], |row| {
        Ok(row.get::<_, u32>(0)?)
    }).map_err(|e| e.to_string())?;

    let mut time_slots = Vec::new();
    for slot in slots_iter {
        time_slots.push(slot.map_err(|e| e.to_string())?);
    }

    if time_slots.is_empty() {
        return Err("Aucun créneau horaire (Time Slot) défini. Configurez la grille d'abord.".to_string());
    }

    // 2. Charger les allocations
    let mut stmt = conn.prepare("SELECT id, group_id, subject_id, teacher_id, count FROM allocations").map_err(|e| e.to_string())?;
    let allocs_iter = stmt.query_map([], |row| {
        Ok((
            row.get::<_, i32>(0)?, // id
            row.get::<_, i32>(1)?, // group
            row.get::<_, i32>(2)?, // subject
            row.get::<_, Option<i32>>(3)?, // teacher
            row.get::<_, i32>(4)?, // count
        ))
    }).map_err(|e| e.to_string())?;

    let mut allocations_to_place = Vec::new();

    // 3. Expansion : Si count=3, on crée 3 items à placer
    for alloc_res in allocs_iter {
        let (id, group_id, subject_id, teacher_id, count) = alloc_res.map_err(|e| e.to_string())?;
        
        for _ in 0..count {
            allocations_to_place.push(AllocationToPlace {
                id, // On garde le même ID parent pour référence, ou on générera un UUID unique si besoin de distinguer
                group_id,
                subject_id,
                teacher_id
            });
        }
    }

    if allocations_to_place.is_empty() {
        return Err("Aucune allocation définie. Ajoutez des cours dans l'onglet Allocations.".to_string());
    }

    Ok(EngineInput {
        time_slots,
        allocations: allocations_to_place
    })
}
