use rusqlite::{Connection, Result};
use std::fs;
use tauri::AppHandle;
use tauri::Manager;

/// Initialise la connexion à la base de données réelle.
pub fn init_db(app_handle: &AppHandle) -> Result<Connection> {
    let app_dir = app_handle.path().app_data_dir().expect("failed to get app data dir");
    
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).expect("failed to create app data dir");
    }

    let db_path = app_dir.join("kronos.db");
    
    // En mode debug, on l'affiche pour info
    #[cfg(debug_assertions)]
    println!("💾 Database path: {:?}", db_path);

    let conn = Connection::open(db_path)?;

    // On applique le schéma
    apply_schema(&conn)?;

    Ok(conn)
}

/// Applique le schéma SQL à la connexion donnée.
/// Séparé pour faciliter les tests unitaires (en mémoire).
fn apply_schema(conn: &Connection) -> Result<()> {
    let schema = include_str!("schema.sql");
    conn.execute_batch(schema)?;
    Ok(())
}

// ----------------------------------------------------------------------------
// 🧪 TESTS UNITAIRES
// ----------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_database_schema_creation() {
        // 1. Créer une BDD volatile en mémoire
        let conn = Connection::open_in_memory().expect("Failed to create in-memory DB");

        // 2. Appliquer le schéma
        apply_schema(&conn).expect("Failed to apply schema");

        // 3. Vérifier que la table 'project_config' a été créée
        let table_exists: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='project_config')",
            [],
            |row| row.get(0),
        ).unwrap();

        assert!(table_exists, "Table 'project_config' should exist after schema application");

        // 4. Vérifier qu'on peut insérer et lire une config
        conn.execute(
            "INSERT INTO project_config (key, value) VALUES (?1, ?2)",
            ["test_key", "test_value"],
        ).expect("Failed to insert config");

        let value: String = conn.query_row(
            "SELECT value FROM project_config WHERE key = 'test_key'",
            [],
            |row| row.get(0),
        ).unwrap();

        assert_eq!(value, "test_value");
    }
}