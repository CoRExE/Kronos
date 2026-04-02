use tauri::State;
use crate::AppState;
use crate::models::Teacher;

/// Récupère tous les enseignants triés par nom.
#[tauri::command]
pub fn get_all_teachers(state: State<AppState>) -> Result<Vec<Teacher>, String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    let mut stmt = conn.prepare(
        "SELECT id, name FROM teachers ORDER BY name ASC"
    ).map_err(|e| e.to_string())?;

    let teachers_iter = stmt.query_map([], |row| {
        Ok(Teacher {
            id: Some(row.get(0)?),
            name: row.get(1)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut teachers = Vec::new();
    for teacher in teachers_iter {
        teachers.push(teacher.map_err(|e| e.to_string())?);
    }

    Ok(teachers)
}

/// Crée un nouvel enseignant.
#[tauri::command]
pub fn create_teacher(state: State<AppState>, name: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    conn.execute(
        "INSERT INTO teachers (name) VALUES (?1)",
        [&name],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

/// Met à jour un enseignant.
#[tauri::command]
pub fn update_teacher(state: State<AppState>, id: i32, name: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    conn.execute(
        "UPDATE teachers SET name = ?1 WHERE id = ?2",
        (&name, &id),
    ).map_err(|e| e.to_string())?;

    Ok(())
}

/// Supprime un enseignant.
#[tauri::command]
pub fn delete_teacher(state: State<AppState>, id: i32) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    let count = conn.execute(
        "DELETE FROM teachers WHERE id = ?1",
        rusqlite::params![id],
    ).map_err(|e| format!("Erreur SQL: {}", e))?;

    if count == 0 {
        return Err(format!("Enseignant avec l'ID {} introuvable", id));
    }

    Ok(())
}
