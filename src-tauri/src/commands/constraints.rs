use tauri::State;
use rusqlite::OptionalExtension;
use crate::AppState;
use crate::models::Constraint;

/// Récupère toutes les contraintes d'un type pour une cible donnée.
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
    for item in iter {
        list.push(item.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

/// Ajoute ou bascule (toggle) une contrainte de créneau interdit.
#[tauri::command]
pub fn toggle_forbidden_slot(
    state: State<AppState>, 
    target_type: String, 
    target_id: i32, 
    slot_id: i32
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    // On vérifie si elle existe déjà pour la supprimer (toggle)
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
