use rusqlite::{Connection, Result};
use std::fs;
use tauri::AppHandle;
use tauri::Manager;

const DB_FILE_NAME: &str = "kronos.db";

pub fn init(app_handle: &AppHandle) -> Result<()> {
    // Determine the database path
    let app_dir = app_handle.path().app_data_dir().map_err(|e| {
        rusqlite::Error::SqliteFailure(
            rusqlite::ffi::Error::new(1), // SQLITE_ERROR
            Some(format!("Failed to get app data dir: {}", e)),
        )
    })?;

    // Ensure the directory exists
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).map_err(|e| {
            rusqlite::Error::SqliteFailure(
                rusqlite::ffi::Error::new(1),
                Some(format!("Failed to create app data dir: {}", e)),
            )
        })?;
    }

    let db_path = app_dir.join(DB_FILE_NAME);
    let conn = Connection::open(db_path)?;

    // Create tables
    conn.execute(
        "CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT NOT NULL,
            hours_per_week INTEGER NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS slots (
            id INTEGER PRIMARY KEY,
            day_index INTEGER NOT NULL,
            hour_index INTEGER NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS constraints (
            id INTEGER PRIMARY KEY,
            type TEXT NOT NULL,
            target_subject_id INTEGER,
            value INTEGER NOT NULL,
            FOREIGN KEY(target_subject_id) REFERENCES subjects(id)
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS generated_schedules (
            id INTEGER PRIMARY KEY,
            subject_id INTEGER NOT NULL,
            slot_id INTEGER NOT NULL,
            version_id INTEGER NOT NULL,
            FOREIGN KEY(subject_id) REFERENCES subjects(id),
            FOREIGN KEY(slot_id) REFERENCES slots(id)
        )",
        [],
    )?;

    println!("Database initialized successfully");

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_table_creation() {
        let conn = Connection::open_in_memory().unwrap();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS subjects (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                color TEXT NOT NULL,
                hours_per_week INTEGER NOT NULL
            )",
            [],
        )
        .unwrap();

        // Verify table exists
        let mut stmt = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='subjects'")
            .unwrap();
        let exists = stmt.exists([]).unwrap();
        assert!(exists, "subjects table should exist");
    }
}
