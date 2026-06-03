use tauri::State;

use crate::{
    models::password::{
        CreatePasswordRequest, GeneratePasswordOptions, PasswordPlaintext,
        UpdatePasswordRequest,
    },
    services::password_service::PasswordService,
    state::app_state::AppState,
};

/// Create a new password entry.
#[tauri::command]
pub fn create_password(
    state: State<AppState>,
    name: String,
    username: String,
    password: String,
    url: Option<String>,
    notes: Option<String>,
    totp_secret: Option<String>,
    tags: Option<Vec<String>>,
    folder_id: Option<String>,
    is_favorite: Option<bool>,
) -> Result<PasswordPlaintext, String> {
    guard_unlocked_rw(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    state
        .key_manager
        .with_key(|key| {
            PasswordService::create_password(
                pool,
                key,
                CreatePasswordRequest {
                    name,
                    username,
                    password,
                    url,
                    notes,
                    totp_secret,
                    tags,
                    folder_id,
                    is_favorite,
                },
            )
        })
        .map_err(|e| e.to_string())
}

/// Fetch a single password entry by ID.
/// Also updates `last_used_at`.
#[tauri::command]
pub fn get_password(state: State<AppState>, id: String) -> Result<PasswordPlaintext, String> {
    guard_unlocked(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    state
        .key_manager
        .with_key(|key| PasswordService::get_password(pool, key, &id))
        .map_err(|e| e.to_string())
}

/// List all non-trashed password entries.
#[tauri::command]
pub fn list_passwords(state: State<AppState>) -> Result<Vec<PasswordPlaintext>, String> {
    guard_unlocked(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    state
        .key_manager
        .with_key(|key| PasswordService::list_passwords(pool, key))
        .map_err(|e| e.to_string())
}

/// List all TRASHED password entries (for Trash page).
#[tauri::command]
pub fn list_trashed_passwords(state: State<AppState>) -> Result<Vec<PasswordPlaintext>, String> {
    guard_unlocked(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    state
        .key_manager
        .with_key(|key| PasswordService::list_trashed_passwords(pool, key))
        .map_err(|e| e.to_string())
}

/// Update an existing password entry.
#[tauri::command]
pub fn update_password(
    state: State<AppState>,
    id: String,
    name: Option<String>,
    username: Option<String>,
    password: Option<String>,
    url: Option<String>,
    notes: Option<String>,
    totp_secret: Option<String>,
    tags: Option<Vec<String>>,
    folder_id: Option<String>,
    is_favorite: Option<bool>,
) -> Result<PasswordPlaintext, String> {
    guard_unlocked_rw(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    state
        .key_manager
        .with_key(|key| {
            PasswordService::update_password(
                pool,
                key,
                UpdatePasswordRequest {
                    id,
                    name,
                    username,
                    password,
                    url,
                    notes,
                    totp_secret,
                    tags,
                    folder_id,
                    is_favorite,
                },
            )
        })
        .map_err(|e| e.to_string())
}

/// Soft-delete a password entry.
#[tauri::command]
pub fn delete_password(state: State<AppState>, id: String) -> Result<(), String> {
    guard_unlocked_rw(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    PasswordService::delete_password(pool, &id).map_err(|e| e.to_string())
}

/// Restore a password from trash.
#[tauri::command]
pub fn restore_password(state: State<AppState>, id: String) -> Result<(), String> {
    guard_unlocked_rw(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    PasswordService::restore_password(pool, &id).map_err(|e| e.to_string())
}

/// Search password entries.
#[tauri::command]
pub fn search_passwords(
    state: State<AppState>,
    query: String,
) -> Result<Vec<PasswordPlaintext>, String> {
    guard_unlocked(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    state
        .key_manager
        .with_key(|key| PasswordService::search_passwords(pool, key, &query))
        .map_err(|e| e.to_string())
}

/// Generate a secure random password using specified options.
/// Does NOT require vault to be unlocked.
#[tauri::command]
pub fn generate_password(
    length: usize,
    uppercase: bool,
    lowercase: bool,
    digits: bool,
    symbols: bool,
    exclude_ambiguous: bool,
) -> Result<String, String> {
    PasswordService::generate_password(GeneratePasswordOptions {
        length,
        uppercase,
        lowercase,
        digits,
        symbols,
        exclude_ambiguous,
    })
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