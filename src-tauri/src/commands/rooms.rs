use tauri::State;
use crate::AppState;
use crate::models::Room;

/// Récupère toutes les salles.
#[tauri::command]
pub fn get_all_rooms(state: State<AppState>) -> Result<Vec<Room>, String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    let mut stmt = conn.prepare(
        "SELECT id, name, capacity, type FROM rooms ORDER BY name ASC"
    ).map_err(|e| e.to_string())?;

    let rooms_iter = stmt.query_map([], |row| {
        Ok(Room {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            capacity: row.get(2)?,
            room_type: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut rooms = Vec::new();
    for room in rooms_iter {
        rooms.push(room.map_err(|e| e.to_string())?);
    }

    Ok(rooms)
}

/// Crée une nouvelle salle.
#[tauri::command]
pub fn create_room(state: State<AppState>, name: String, capacity: i32, room_type: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    conn.execute(
        "INSERT INTO rooms (name, capacity, type) VALUES (?1, ?2, ?3)",
        (&name, &capacity, &room_type),
    ).map_err(|e| e.to_string())?;

    Ok(())
}

/// Met à jour une salle existante.
#[tauri::command]
pub fn update_room(state: State<AppState>, id: i32, name: String, capacity: i32, room_type: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    conn.execute(
        "UPDATE rooms SET name = ?1, capacity = ?2, type = ?3 WHERE id = ?4",
        (&name, &capacity, &room_type, &id),
    ).map_err(|e| e.to_string())?;

    Ok(())
}

/// Supprime une salle (si pas utilisée).
#[tauri::command]
pub fn delete_room(state: State<AppState>, id: i32) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    // Vérifier si la salle est utilisée dans l'emploi du temps actuel
    let used_count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM scheduled_lessons WHERE room_id = ?1",
        [id],
        |row| row.get(0),
    ).unwrap_or(0);

    if used_count > 0 {
        return Err(format!("Impossible de supprimer cette salle : elle est utilisée dans {} cours planifiés.", used_count));
    }

    conn.execute("DELETE FROM rooms WHERE id = ?1", [id]).map_err(|e| e.to_string())?;

    Ok(())
}
