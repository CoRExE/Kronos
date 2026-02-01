use tauri::State;
use crate::AppState;
use crate::engine;

#[tauri::command]
pub async fn generate_schedule(state: State<'_, AppState>) -> Result<(), String> {
    // Note: On utilise async pour ne pas bloquer l'UI, même si ici le calcul est synchrone.
    // Idéalement, il faudrait spawner un thread dédié si le calcul devient long.
    
    let mut conn = state.db.lock().map_err(|_| "Failed to lock DB")?;
    
    engine::run_generation(&mut conn)?;

    Ok(())
}
