use tauri::State;
use crate::AppState;
use crate::models::StudentGroup;

/// Récupère tous les groupes triés par nom.
#[tauri::command]
pub fn get_all_groups(state: State<AppState>) -> Result<Vec<StudentGroup>, String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    let mut stmt = conn.prepare(
        "SELECT id, name, head_count FROM student_groups ORDER BY name ASC"
    ).map_err(|e| e.to_string())?;

    let groups_iter = stmt.query_map([], |row| {
        Ok(StudentGroup {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            head_count: row.get(2)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut groups = Vec::new();
    for group in groups_iter {
        groups.push(group.map_err(|e| e.to_string())?);
    }

    Ok(groups)
}

/// Crée un nouveau groupe.
#[tauri::command]
pub fn create_group(state: State<AppState>, name: String, head_count: i32) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    conn.execute(
        "INSERT INTO student_groups (name, head_count) VALUES (?1, ?2)",
        (&name, &head_count),
    ).map_err(|e| e.to_string())?;

    Ok(())
}

/// Met à jour un groupe existant.
#[tauri::command]
pub fn update_group(state: State<AppState>, id: i32, name: String, head_count: i32) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    conn.execute(
        "UPDATE student_groups SET name = ?1, head_count = ?2 WHERE id = ?3",
        (&name, &head_count, &id),
    ).map_err(|e| e.to_string())?;

    Ok(())
}

/// Supprime un groupe (avec vérification des dépendances).
#[tauri::command]
pub fn delete_group(state: State<AppState>, id: i32) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    // 1. Vérifier si le groupe existe
    let exists: bool = conn
        .query_row(
            "SELECT 1 FROM student_groups WHERE id = ?1",
            rusqlite::params![id],
            |_| Ok(true),
        )
        .unwrap_or(false);
    
    if !exists {
        return Err(format!("Groupe avec l'ID {} introuvable", id));
    }

    // 2. Vérifier si le groupe a des allocations
    let used_count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM allocations WHERE group_id = ?1",
            rusqlite::params![id],
            |row| row.get(0),
        )
        .unwrap_or(0);
    
    if used_count > 0 {
        return Err(format!(
            "Impossible de supprimer : ce groupe a {} allocation(s) de cours.", 
            used_count
        ));
    }

    // 3. Suppression
    conn.execute(
        "DELETE FROM student_groups WHERE id = ?1",
        rusqlite::params![id],
    ).map_err(|e| format!("Erreur SQL: {}", e))?;

    Ok(())
}
