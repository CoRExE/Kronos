use tauri::State;
use crate::AppState;
use crate::models::AllocationView;

/// Récupère toutes les allocations enrichies (avec noms).
#[tauri::command]
pub fn get_allocations(state: State<AppState>) -> Result<Vec<AllocationView>, String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    let mut stmt = conn.prepare(
        r#"
        SELECT 
            a.id, 
            g.name as group_name, 
            s.name as subject_name, 
            t.name as teacher_name, 
            s.color as subject_color,
            a.count
        FROM allocations a
        JOIN student_groups g ON a.group_id = g.id
        JOIN subjects s ON a.subject_id = s.id
        LEFT JOIN teachers t ON a.teacher_id = t.id
        ORDER BY g.name, s.name
        "#
    ).map_err(|e| e.to_string())?;

    let allocs_iter = stmt.query_map([], |row| {
        Ok(AllocationView {
            id: row.get(0)?,
            group_name: row.get(1)?,
            subject_name: row.get(2)?,
            teacher_name: row.get(3)?, // Optionnel
            subject_color: row.get(4)?,
            count: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut allocs = Vec::new();
    for alloc in allocs_iter {
        allocs.push(alloc.map_err(|e| e.to_string())?);
    }

    Ok(allocs)
}

/// Crée une nouvelle allocation.
#[tauri::command]
pub fn create_allocation(
    state: State<AppState>, 
    group_id: i32, 
    subject_id: i32, 
    teacher_id: Option<i32>, 
    count: i32
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    conn.execute(
        "INSERT INTO allocations (group_id, subject_id, teacher_id, count) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![group_id, subject_id, teacher_id, count],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

/// Supprime une allocation.
#[tauri::command]
pub fn delete_allocation(state: State<AppState>, id: i32) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    conn.execute(
        "DELETE FROM allocations WHERE id = ?1",
        rusqlite::params![id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}
