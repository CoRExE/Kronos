use std::sync::Mutex;
use rusqlite::Connection;
use tauri::{State, Manager};

// Modules
mod db;
mod models;
mod commands;
mod engine; // Le moteur CSP

use commands::subjects;
use commands::groups;
use commands::timeslots;
use commands::teachers;
use commands::allocations;
use commands::generator;
use commands::constraints;

// Structure de l'état global pour partager la connexion BDD
pub struct AppState {
    db: Mutex<Connection>,
}

// ----------------------------------------------------------------------------
// COMMANDES TAURI (Appelables depuis le React)
// ----------------------------------------------------------------------------

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Vérifie si l'application a déjà été configurée (Wizard terminé).
/// Retourne true si une config existe, false sinon.
#[tauri::command]
fn check_is_configured(state: State<AppState>) -> Result<bool, String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;
    
    // On vérifie simplement si une valeur pour 'school_mode' existe
    let count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM project_config WHERE key = 'school_mode'",
        [],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    Ok(count > 0)
}

/// Sauvegarde la configuration initiale choisie dans le Wizard.
#[tauri::command]
fn setup_app(state: State<AppState>, school_mode: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "Failed to lock DB")?;

    // Validation basique
    if school_mode != "SINGLE_CLASS" && school_mode != "MULTI_CLASS" {
        return Err("Invalid school mode".to_string());
    }

    conn.execute(
        "INSERT OR REPLACE INTO project_config (key, value) VALUES ('school_mode', ?1)",
        [&school_mode],
    ).map_err(|e| e.to_string())?;
    
    println!("✅ App configured in mode: {}", school_mode);
    
    Ok(())
}

// ----------------------------------------------------------------------------
// ENTRY POINT
// ----------------------------------------------------------------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // 1. Initialisation de la BDD (crée le fichier et les tables si besoin)
            match db::init_db(app.handle()) {
                Ok(conn) => {
                    // 2. On stocke la connexion dans l'état global géré par Tauri
                    app.manage(AppState { db: Mutex::new(conn) });
                }
                Err(e) => {
                    eprintln!("❌ Database initialization failed: {}", e);
                    // On pourrait panic ici, mais pour l'instant on laisse couler
                    // (L'app plantera proprement si on essaie d'utiliser la DB)
                    return Err(Box::new(e)); 
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet, 
            check_is_configured, 
            setup_app,
            // Subjects Commands
            subjects::get_all_subjects,
            subjects::create_subject,
            subjects::update_subject,
            subjects::delete_subject,
            // Groups Commands
            groups::get_all_groups,
            groups::create_group,
            groups::update_group,
            groups::delete_group,
            // TimeSlots Commands
            timeslots::get_slot_duration,
            timeslots::set_slot_duration,
            timeslots::get_time_slots,
            timeslots::generate_time_slots,
            // Teachers Commands
            teachers::get_all_teachers,
            teachers::create_teacher,
            teachers::update_teacher,
            teachers::delete_teacher,
            // Allocations Commands
            allocations::get_allocations,
            allocations::create_allocation,
            allocations::delete_allocation,
            // Constraints
            constraints::get_constraints,
            constraints::toggle_forbidden_slot,
            // Generator & Schedule
            generator::generate_schedule,
            generator::get_scheduled_lessons
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}