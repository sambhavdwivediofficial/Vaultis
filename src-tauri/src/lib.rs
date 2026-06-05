// src-tauri/src/lib.rs main entry point for the Tauri backend, setting up commands, state management, and plugins.
pub mod backup;
pub mod commands;
pub mod crypto;
pub mod database;
pub mod files;
pub mod models;
pub mod services;
pub mod state;
pub mod utils;
pub mod vault;

use tauri::{Manager, Emitter};
use tracing::info;

use crate::commands::{
    backup::*, files::*, notes::*, passwords::*, settings::*, vault::*,
};
use crate::state::app_state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logging first
    utils::logger::init_logger();

    info!("Vaultis — built by Sambhav Dwivedi");

    tauri::Builder::default()
        // ── Plugins ────────────────────────────────────────────────────────
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        // ── Managed State ──────────────────────────────────────────────────
        .manage(AppState::new())
        // ── Setup ──────────────────────────────────────────────────────────
        .setup(|app| {
            let app_handle = app.handle().clone();

            // Initialize database on first run
            let state = app_handle.state::<AppState>();
            let data_dir = utils::paths::get_app_data_dir(&app_handle)
                .expect("Failed to resolve app data directory");

            {
                let mut path_lock = state.data_dir.write();
                *path_lock = data_dir.clone();
            }

            // Run migrations
            database::migrations::run_migrations(&data_dir)
                .expect("Database migration failed");

            info!("Vaultis initialized — data dir: {}", data_dir.display());

            // Register emergency lock shortcut (Ctrl+Shift+L)
            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, ShortcutState};
                let shortcut = Shortcut::new(
                    Some(Modifiers::CONTROL | Modifiers::SHIFT),
                    Code::KeyL,
                );
                let handle = app_handle.clone();
                app.handle()
                    .plugin(
                        tauri_plugin_global_shortcut::Builder::new()
                            .with_handler(move |_app, s, event| {
                                if s == &shortcut
                                    && event.state() == ShortcutState::Pressed
                                {
                                    let st = handle.state::<AppState>();
                                    st.emergency_lock();
                                    handle
                                        .emit("vault:emergency-locked", ())
                                        .unwrap_or_default();
                                    tracing::warn!("Emergency lock triggered via Ctrl+Shift+L");
                                }
                            })
                            .build(),
                    )
                    .unwrap_or_else(|e| {
                        tracing::warn!("Could not register global shortcut: {e}");
                    });
            }

            Ok(())
        })
        // ── Commands ───────────────────────────────────────────────────────
        .invoke_handler(tauri::generate_handler![
            // Vault
            vault_exists,
            create_vault,
            unlock_vault,
            lock_vault,
            change_master_password,
            get_vault_info,
            delete_vault_permanently,
            vault_is_unlocked,
            // Notes
            create_note,
            get_note,
            list_notes,
            list_trashed_notes,
            update_note,
            delete_note,
            restore_note,
            search_notes,
            // Files
            upload_file,
            get_file_metadata,
            list_files,
            list_trashed_files,
            delete_file,
            restore_file,
            export_file,
            search_files,
            // Passwords
            create_password,
            get_password,
            list_passwords,
            list_trashed_passwords,
            update_password,
            delete_password,
            restore_password,
            search_passwords,
            generate_password,
            // Settings
            get_settings,
            update_settings,
            reset_settings,
            // Backup
            create_backup,
            restore_backup,
            list_backups,
            delete_backup,
            export_vault,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Vaultis");
}