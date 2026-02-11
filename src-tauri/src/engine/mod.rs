pub mod structs;
pub mod loader;
pub mod solver;

use rusqlite::Connection;

/// Point d'entrée principal du moteur
pub fn run_generation(conn: &mut Connection) -> Result<(), String> {
    println!("🚀 Démarrage du moteur de génération...");

    // 1. Chargement des données
    let input = loader::load_data(conn)?;
    println!("📦 Données chargées : {} créneaux, {} cours à placer.", input.time_slots.len(), input.allocations.len());

    // 2. Résolution
    let solution = solver::solve(&input)?;
    println!("🎉 Solution trouvée ! {} cours placés.", solution.placements.len());

    // 3. Sauvegarde (Transaction)
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    
    // Nettoyer l'ancien emploi du temps
    tx.execute("DELETE FROM scheduled_lessons", []).map_err(|e| e.to_string())?;

    // Insérer les nouveaux cours
    let mut stmt = tx.prepare("INSERT INTO scheduled_lessons (allocation_id, slot_id, room_id) VALUES (?1, ?2, ?3)").map_err(|e| e.to_string())?;
    
    for (alloc_id, slot_id, room_id) in solution.placements {
        stmt.execute(rusqlite::params![alloc_id, slot_id, room_id]).map_err(|e| e.to_string())?;
    }
    drop(stmt); // Libérer le statement pour pouvoir commit

    tx.commit().map_err(|e| e.to_string())?;
    println!("💾 Sauvegarde terminée.");

    Ok(())
}
