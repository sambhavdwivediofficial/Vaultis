use std::path::PathBuf;
use tauri::State;

use crate::{
    models::file::{FilePlaintext, UploadFileRequest},
    services::file_service::FileService,
    state::app_state::AppState,
};

/// Encrypt and store a file in the vault.
/// `source_path` is the absolute path to the file on disk.
#[tauri::command]
pub fn upload_file(
    state: State<AppState>,
    source_path: String,
    tags: Option<Vec<String>>,
    folder_id: Option<String>,
) -> Result<FilePlaintext, String> {
    guard_unlocked_rw(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    let data_dir = state.data_dir.read().clone();

    state
        .key_manager
        .with_key(|key| {
            FileService::upload_file(pool, key, &data_dir, UploadFileRequest {
                source_path,
                tags,
                folder_id,
            })
        })
        .map_err(|e| e.to_string())
}

/// Return decrypted metadata for a single file.
#[tauri::command]
pub fn get_file_metadata(state: State<AppState>, id: String) -> Result<FilePlaintext, String> {
    guard_unlocked(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    state
        .key_manager
        .with_key(|key| FileService::get_file_metadata(pool, key, &id))
        .map_err(|e| e.to_string())
}

/// List all non-trashed files (metadata only, not file bytes).
#[tauri::command]
pub fn list_files(state: State<AppState>) -> Result<Vec<FilePlaintext>, String> {
    guard_unlocked(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    state
        .key_manager
        .with_key(|key| FileService::list_files(pool, key))
        .map_err(|e| e.to_string())
}

/// Soft-delete a file (moves to trash).
#[tauri::command]
pub fn delete_file(state: State<AppState>, id: String) -> Result<(), String> {
    guard_unlocked_rw(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    FileService::delete_file(pool, &id).map_err(|e| e.to_string())
}

/// Restore a file from trash.
#[tauri::command]
pub fn restore_file(state: State<AppState>, id: String) -> Result<(), String> {
    guard_unlocked_rw(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    FileService::restore_file(pool, &id).map_err(|e| e.to_string())
}

/// Decrypt a file and export it to a user-chosen directory.
/// Returns the full path of the exported (plaintext) file.
#[tauri::command]
pub fn export_file(
    state: State<AppState>,
    id: String,
    export_dir: String,
) -> Result<String, String> {
    guard_unlocked(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    let data_dir = state.data_dir.read().clone();
    let export_path = PathBuf::from(&export_dir);

    let result = state
        .key_manager
        .with_key(|key| FileService::export_file(pool, key, &data_dir, &id, &export_path))
        .map_err(|e| e.to_string())?;

    Ok(result.to_string_lossy().into_owned())
}

/// Search files by name, MIME type, or tag.
#[tauri::command]
pub fn search_files(state: State<AppState>, query: String) -> Result<Vec<FilePlaintext>, String> {
    guard_unlocked(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    state
        .key_manager
        .with_key(|key| FileService::search_files(pool, key, &query))
        .map_err(|e| e.to_string())
}

// ── Shared guards ─────────────────────────────────────────────────────────

fn guard_unlocked(state: &AppState) -> Result<(), String> {
    if state.check_auto_lock() {
        return Err("Vault auto-locked due to inactivity.".into());
    }
    if !state.is_unlocked() {
        return Err("Vault is locked.".into());
    }
    Ok(())
}

fn guard_unlocked_rw(state: &AppState) -> Result<(), String> {
    guard_unlocked(state)?;
    if *state.read_only.read() {
        return Err("Operation not permitted in read-only mode.".into());
    }
    Ok(())
}

fn refresh_autolock(state: &AppState) {
    state.refresh_auto_lock(crate::utils::config::AUTO_LOCK_DEFAULT_SECS);
}