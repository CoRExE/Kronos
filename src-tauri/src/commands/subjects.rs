use tauri::State;
use crate::AppState;
use crate::models::Subject;

/// Récupère toutes les matières triées par nom.
#[tauri::command]
pub fn get_all_subjects(state: State<AppState>) -> Result<Vec<Subject>, String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    let mut stmt = conn.prepare(
        "SELECT id, name, short_code, color FROM subjects ORDER BY name ASC"
    ).map_err(|e| e.to_string())?;

    let subjects_iter = stmt.query_map([], |row| {
        Ok(Subject {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            short_code: row.get(2)?,
            color: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut subjects = Vec::new();
    for subject in subjects_iter {
        subjects.push(subject.map_err(|e| e.to_string())?);
    }

    Ok(subjects)
}

/// Crée une nouvelle matière.
#[tauri::command]
pub fn create_subject(state: State<AppState>, name: String, short_code: Option<String>, color: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    conn.execute(
        "INSERT INTO subjects (name, short_code, color) VALUES (?1, ?2, ?3)",
        (&name, &short_code, &color),
    ).map_err(|e| e.to_string())?;

    Ok(())
}

/// Met à jour une matière existante.
#[tauri::command]
pub fn update_subject(state: State<AppState>, id: i32, name: String, short_code: Option<String>, color: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    conn.execute(
        "UPDATE subjects SET name = ?1, short_code = ?2, color = ?3 WHERE id = ?4",
        (&name, &short_code, &color, &id),
    ).map_err(|e| e.to_string())?;

    Ok(())
}

/// Supprime une matière de façon sécurisée (vérifie les dépendances).
#[tauri::command]
pub fn delete_subject(state: State<AppState>, id: i32) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;
    
    // 1. Vérifier si la matière existe
    let exists: bool = conn
        .query_row(
            "SELECT 1 FROM subjects WHERE id = ?1",
            rusqlite::params![id],
            |_| Ok(true),
        )
        .unwrap_or(false);
    
    if !exists {
        return Err(format!("Matière avec l'ID {} introuvable", id));
    }
    
    // 2. Vérifier si la matière est utilisée dans des allocations
    let used_count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM allocations WHERE subject_id = ?1",
            rusqlite::params![id],
            |row| row.get(0),
        )
        .unwrap_or(0);
    
    if used_count > 0 {
        return Err(format!(
            "Impossible de supprimer : cette matière est utilisée dans {} allocation(s). Supprimez d'abord les allocations liées.", 
            used_count
        ));
    }
    
    // 3. Suppression effective
    conn.execute(
        "DELETE FROM subjects WHERE id = ?1",
        rusqlite::params![id],
    ).map_err(|e| format!("Erreur SQL lors de la suppression: {}", e))?;

    Ok(())
}