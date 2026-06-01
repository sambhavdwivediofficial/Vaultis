use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::{
    backup::{
        exporter::{export_vault as exporter_export_vault, ExportResult},
        importer::{restore_backup as importer_restore_backup},
        exporter::BackupManifest,
    },
    services::{backup_service::BackupService, note_service::NoteService, password_service::PasswordService},
    state::app_state::AppState,
};

/// Info returned for each backup file in the list.
#[derive(Debug, Serialize, Deserialize)]
pub struct BackupEntry {
    pub path: String,
    pub file_name: String,
    pub size_bytes: u64,
    pub modified_at: Option<String>,
}

/// Create an encrypted backup of the vault to the default backups directory.
/// Returns the path of the created backup file.
#[tauri::command]
pub fn create_backup(state: State<AppState>) -> Result<String, String> {
    guard_unlocked(&state)?;

    let data_dir = state.data_dir.read().clone();
    let backup_path = BackupService::create_backup(&data_dir).map_err(|e| e.to_string())?;

    tracing::info!("Backup created: {}", backup_path.display());
    Ok(backup_path.to_string_lossy().into_owned())
}

/// Restore vault state from a `.vaultis` backup file.
/// Vault must be locked before restoring (to prevent key conflicts).
#[tauri::command]
pub fn restore_backup(state: State<AppState>, backup_path: String) -> Result<BackupManifest, String> {
    // Force lock before restore to avoid key/state conflicts
    state.emergency_lock();

    let data_dir = state.data_dir.read().clone();
    let path = PathBuf::from(&backup_path);

    importer_restore_backup(&data_dir, &path).map_err(|e| e.to_string())
}

/// List all backup files in the backups directory.
#[tauri::command]
pub fn list_backups(state: State<AppState>) -> Result<Vec<BackupEntry>, String> {
    let data_dir = state.data_dir.read().clone();
    let paths = BackupService::list_backups(&data_dir).map_err(|e| e.to_string())?;

    let entries = paths
        .into_iter()
        .map(|p| {
            let size = std::fs::metadata(&p).map(|m| m.len()).unwrap_or(0);
            let modified_at = std::fs::metadata(&p)
                .ok()
                .and_then(|m| m.modified().ok())
                .map(|t| {
                    let dt: chrono::DateTime<chrono::Utc> = t.into();
                    dt.to_rfc3339()
                });
            BackupEntry {
                file_name: p.file_name().and_then(|n| n.to_str()).unwrap_or("").to_string(),
                path: p.to_string_lossy().into_owned(),
                size_bytes: size,
                modified_at,
            }
        })
        .collect();

    Ok(entries)
}

/// Delete a specific backup file.
#[tauri::command]
pub fn delete_backup(backup_path: String) -> Result<(), String> {
    let path = PathBuf::from(&backup_path);
    BackupService::delete_backup(&path).map_err(|e| e.to_string())
}

/// Export the complete vault to a user-chosen directory.
/// Requires vault to be unlocked (to count notes/passwords for manifest).
#[tauri::command]
pub fn export_vault(
    state: State<AppState>,
    dest_dir: String,
) -> Result<ExportResult, String> {
    guard_unlocked(&state)?;

    let data_dir = state.data_dir.read().clone();
    let pool = state.pool().map_err(|e| e.to_string())?;

    // Collect counts for manifest
    let (note_count, password_count, vault_id) = state
        .key_manager
        .with_key(|key| {
            let notes = NoteService::list_notes(pool, key)?;
            let passwords = PasswordService::list_passwords(pool, key)?;
            let info = crate::services::vault_service::VaultService::get_vault_info(&data_dir)?;
            Ok((notes.len(), passwords.len(), info.vault_id))
        })
        .map_err(|e: crate::utils::errors::VaultisError| e.to_string())?;

    let dest = PathBuf::from(&dest_dir);
    exporter_export_vault(&data_dir, &dest, &vault_id, note_count, password_count)
        .map_err(|e| e.to_string())
}

// ── Guard ─────────────────────────────────────────────────────────────────

fn guard_unlocked(state: &AppState) -> Result<(), String> {
    if state.check_auto_lock() {
        return Err("Vault auto-locked due to inactivity.".into());
    }
    if !state.is_unlocked() {
        return Err("Vault is locked.".into());
    }
    Ok(())
}