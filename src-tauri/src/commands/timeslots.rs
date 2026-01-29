use tauri::State;
use crate::AppState;
use crate::models::TimeSlot;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct GenerationRule {
    pub day_index: i32,
    pub start_time: String, // "08:00"
    pub end_time: String,   // "12:00"
    pub slot_type: String,  // "LESSON"
}

/// Récupère la configuration actuelle (durée du slot).
#[tauri::command]
pub fn get_slot_duration(state: State<AppState>) -> Result<i32, String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;
    
    let duration: i32 = conn.query_row(
        "SELECT value FROM project_config WHERE key = 'slot_duration'",
        [],
        |row| {
            let s: String = row.get(0)?;
            Ok(s.parse::<i32>().unwrap_or(60))
        },
    ).unwrap_or(60); // Valeur par défaut si non définie

    Ok(duration)
}

/// Sauvegarde la durée du slot.
#[tauri::command]
pub fn set_slot_duration(state: State<AppState>, duration: i32) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;
    
    conn.execute(
        "INSERT OR REPLACE INTO project_config (key, value) VALUES ('slot_duration', ?1)",
        [duration.to_string()],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

/// Récupère tous les créneaux générés.
#[tauri::command]
pub fn get_time_slots(state: State<AppState>) -> Result<Vec<TimeSlot>, String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    let mut stmt = conn.prepare(
        "SELECT id, day_index, start_time, end_time, type FROM time_slots ORDER BY day_index, start_time"
    ).map_err(|e| e.to_string())?;

    let slots_iter = stmt.query_map([], |row| {
        Ok(TimeSlot {
            id: Some(row.get(0)?),
            day_index: row.get(1)?,
            start_time: row.get(2)?,
            end_time: row.get(3)?,
            type_: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut slots = Vec::new();
    for slot in slots_iter {
        slots.push(slot.map_err(|e| e.to_string())?);
    }

    Ok(slots)
}

/// Génère la grille complète en fonction des règles fournies.
/// ATTENTION : Cela efface la grille existante !
#[tauri::command]
pub fn generate_time_slots(state: State<AppState>, rules: Vec<GenerationRule>, slot_duration_minutes: i32) -> Result<(), String> {
    let mut conn = state.db.lock().map_err(|_| "Failed to lock DB")?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // 1. Sauvegarder la durée du slot
    tx.execute(
        "INSERT OR REPLACE INTO project_config (key, value) VALUES ('slot_duration', ?1)",
        [slot_duration_minutes.to_string()],
    ).map_err(|e| e.to_string())?;

    // 2. Effacer les slots existants
    // TODO: Gérer le cas où des cours sont déjà planifiés dessus (cascade delete ou warning)
    tx.execute("DELETE FROM time_slots", []).map_err(|e| e.to_string())?;

    // 3. Générer les nouveaux slots
    for rule in rules {
        // Parsing simple de l'heure "HH:MM" -> minutes depuis minuit
        let start_min = parse_time(&rule.start_time)?;
        let end_min = parse_time(&rule.end_time)?;
        
        let mut current = start_min;
        while current + slot_duration_minutes <= end_min {
            let s_time = format_time(current);
            let e_time = format_time(current + slot_duration_minutes);
            
            tx.execute(
                "INSERT INTO time_slots (day_index, start_time, end_time, type) VALUES (?1, ?2, ?3, ?4)",
                rusqlite::params![rule.day_index, s_time, e_time, rule.slot_type],
            ).map_err(|e| e.to_string())?;

            current += slot_duration_minutes;
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    
    println!("✅ Grille générée avec succès.");
    Ok(())
}

// Helpers (privés) pour manipuler les heures

fn parse_time(time_str: &str) -> Result<i32, String> {
    let parts: Vec<&str> = time_str.split(':').collect();
    if parts.len() != 2 {
        return Err(format!("Format d'heure invalide: {}", time_str));
    }
    let h: i32 = parts[0].parse().map_err(|_| "Heure invalide")?;
    let m: i32 = parts[1].parse().map_err(|_| "Minute invalide")?;
    Ok(h * 60 + m)
}

fn format_time(minutes: i32) -> String {
    let h = minutes / 60;
    let m = minutes % 60;
    format!("{:02}:{:02}", h, m)
}
