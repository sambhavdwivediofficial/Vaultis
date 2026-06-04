// backup.rs
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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBackupOptions {
    pub include_metadata: Option<bool>,
    pub encryption_method: Option<String>,
    pub compression_level: Option<u32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreBackupOptions {
    pub password: Option<String>,
    pub include_metadata: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BackupEntry {
    pub path: String,
    pub file_name: String,
    pub size_bytes: u64,
    pub modified_at: Option<String>,
}

#[tauri::command]
pub fn create_backup(
    state: State<AppState>,
    options: CreateBackupOptions,
) -> Result<String, String> {
    guard_unlocked(&state)?;

    let data_dir = state.data_dir.read().clone();
    let compression = options.compression_level;
    
    tracing::info!(
        "Creating backup with: compression={:?}, metadata={:?}, encryption={:?}",
        options.compression_level,
        options.include_metadata,
        options.encryption_method
    );

    let backup_path = BackupService::create_backup(&data_dir, compression).map_err(|e| e.to_string())?;

    tracing::info!("Backup created: {}", backup_path.display());
    Ok(backup_path.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn restore_backup(
    state: State<AppState>,
    backup_path: String,
    options: RestoreBackupOptions,
) -> Result<BackupManifest, String> {
    state.emergency_lock();

    let data_dir = state.data_dir.read().clone();
    let path = PathBuf::from(&backup_path);

    tracing::info!(
        "Restoring backup: {}, metadata={:?}",
        backup_path,
        options.include_metadata
    );

    importer_restore_backup(&data_dir, &path).map_err(|e| e.to_string())
}

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

#[tauri::command]
pub fn delete_backup(backup_path: String) -> Result<(), String> {
    let path = PathBuf::from(&backup_path);
    BackupService::delete_backup(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_vault(
    state: State<AppState>,
    dest_dir: String,
) -> Result<ExportResult, String> {
    guard_unlocked(&state)?;

    let data_dir = state.data_dir.read().clone();
    let pool = state.pool().map_err(|e| e.to_string())?;

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