use tauri::State;
use crate::AppState;
use crate::engine;
use crate::models::ScheduledLessonView;

#[tauri::command]
pub async fn generate_schedule(state: State<'_, AppState>) -> Result<(), String> {
    // Note: On utilise async pour ne pas bloquer l'UI, même si ici le calcul est synchrone.
    // Idéalement, il faudrait spawner un thread dédié si le calcul devient long.
    
    let mut conn = state.db.lock().map_err(|_| "Failed to lock DB")?;
    
    engine::run_generation(&mut conn)?;

    Ok(())
}

/// Récupère l'emploi du temps complet avec tous les détails.
#[tauri::command]
pub fn get_scheduled_lessons(state: State<AppState>) -> Result<Vec<ScheduledLessonView>, String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    let sql = r#"
        SELECT 
            sl.id,
            ts.day_index,
            ts.start_time,
            ts.end_time,
            g.name as group_name,
            s.name as subject_name,
            t.name as teacher_name,
            s.color as subject_color
        FROM scheduled_lessons sl
        JOIN time_slots ts ON sl.slot_id = ts.id
        JOIN allocations a ON sl.allocation_id = a.id
        JOIN student_groups g ON a.group_id = g.id
        JOIN subjects s ON a.subject_id = s.id
        LEFT JOIN teachers t ON a.teacher_id = t.id
        ORDER BY ts.day_index, ts.start_time
    "#;

    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    
    let rows = stmt.query_map([], |row| {
        Ok(ScheduledLessonView {
            id: row.get(0)?,
            day_index: row.get(1)?,
            start_time: row.get(2)?,
            end_time: row.get(3)?,
            group_name: row.get(4)?,
            subject_name: row.get(5)?,
            teacher_name: row.get(6)?, // Optionnel
            subject_color: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut lessons = Vec::new();
    for row in rows {
        lessons.push(row.map_err(|e| e.to_string())?);
    }

    Ok(lessons)
}
