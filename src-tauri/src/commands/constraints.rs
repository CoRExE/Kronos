use tauri::State;
use rusqlite::OptionalExtension;
use crate::AppState;
use crate::models::Constraint;

/// Max heures par jour
#[tauri::command]
pub fn get_global_max_daily_hours(state: State<AppState>) -> Result<i32, String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;
    let val: i32 = conn.query_row(
        "SELECT value FROM project_config WHERE key = 'global_max_daily_subject_hours'",
        [],
        |row| {
            let s: String = row.get(0)?;
            Ok(s.parse::<i32>().unwrap_or(2))
        }
    ).unwrap_or(2);
    Ok(val)
}

#[tauri::command]
pub fn set_global_max_daily_hours(state: State<AppState>, hours: i32) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;
    conn.execute(
        "INSERT OR REPLACE INTO project_config (key, value) VALUES ('global_max_daily_subject_hours', ?1)",
        [hours.to_string()],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

/// NOUVEAU : Autoriser cours consécutifs ?
#[tauri::command]
pub fn get_allow_consecutive_subjects(state: State<AppState>) -> Result<bool, String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;
    let val: String = conn.query_row(
        "SELECT value FROM project_config WHERE key = 'allow_consecutive_subjects'",
        [],
        |row| row.get(0),
    ).unwrap_or("false".to_string());
    Ok(val == "true")
}

#[tauri::command]
pub fn set_allow_consecutive_subjects(state: State<AppState>, allow: bool) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;
    conn.execute(
        "INSERT OR REPLACE INTO project_config (key, value) VALUES ('allow_consecutive_subjects', ?1)",
        [allow.to_string()],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

/// CRUD Standard Contraintes
#[tauri::command]
pub fn get_constraints(state: State<AppState>, target_type: String, target_id: i32) -> Result<Vec<Constraint>, String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;
    let mut stmt = conn.prepare(
        "SELECT id, rule_type, target_type, target_id, param_value FROM constraints 
         WHERE target_type = ?1 AND target_id = ?2"
    ).map_err(|e| e.to_string())?;
    let iter = stmt.query_map([&target_type, &target_id.to_string()], |row| {
        Ok(Constraint {
            id: Some(row.get(0)?),
            rule_type: row.get(1)?,
            target_type: row.get(2)?,
            target_id: row.get(3)?,
            param_value: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut list = Vec::new();
    for item in iter { list.push(item.map_err(|e| e.to_string())?); }
    Ok(list)
}

#[tauri::command]
pub fn toggle_forbidden_slot(state: State<AppState>, target_type: String, target_id: i32, slot_id: i32) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;
    let existing_id: Option<i32> = conn.query_row(
        "SELECT id FROM constraints WHERE rule_type = 'FORBIDDEN_SLOT' AND target_type = ?1 AND target_id = ?2 AND param_value = ?3",
        [&target_type, &target_id.to_string(), &slot_id.to_string()],
        |row| row.get(0)
    ).optional().map_err(|e| e.to_string())?;
    if let Some(id) = existing_id {
        conn.execute("DELETE FROM constraints WHERE id = ?1", [id]).map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "INSERT INTO constraints (rule_type, target_type, target_id, param_value) VALUES ('FORBIDDEN_SLOT', ?1, ?2, ?3)",
            [&target_type, &target_id.to_string(), &slot_id.to_string()],
        ).map_err(|e| e.to_string())?;
    }
    Ok(())
}
