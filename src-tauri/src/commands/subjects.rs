use tauri::State;
use crate::AppState;
use crate::models::Subject;

#[tauri::command]
pub fn get_all_subjects(state: State<AppState>) -> Result<Vec<Subject>, String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;
    let mut stmt = conn.prepare("SELECT id, name, short_code, color FROM subjects ORDER BY name ASC").map_err(|e| e.to_string())?;
    let subjects_iter = stmt.query_map([], |row| {
        Ok(Subject {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            short_code: row.get(2)?,
            color: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut subjects = Vec::new();
    for subject in subjects_iter { subjects.push(subject.map_err(|e| e.to_string())?); }
    Ok(subjects)
}

#[tauri::command]
pub fn create_subject(state: State<AppState>, name: String, short_code: Option<String>, color: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;
    conn.execute("INSERT INTO subjects (name, short_code, color) VALUES (?1, ?2, ?3)", (&name, &short_code, &color)).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_subject(state: State<AppState>, id: i32, name: String, short_code: Option<String>, color: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;
    conn.execute(
        "UPDATE subjects SET name = ?1, short_code = ?2, color = ?3 WHERE id = ?4",
        (&name, &short_code, &color, &id),
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_subject(state: State<AppState>, id: i32) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;
    let used_count: i32 = conn.query_row("SELECT COUNT(*) FROM allocations WHERE subject_id = ?1", [id], |row| row.get(0)).unwrap_or(0);
    if used_count > 0 { return Err(format!("Utilisée dans {} allocation(s).", used_count)); }
    conn.execute("DELETE FROM subjects WHERE id = ?1", [id]).map_err(|e| e.to_string())?;
    Ok(())
}
