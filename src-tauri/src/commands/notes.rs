use tauri::State;

use crate::{
    models::note::{CreateNoteRequest, NotePlaintext, UpdateNoteRequest},
    services::note_service::NoteService,
    state::app_state::AppState,
};

/// Create a new encrypted note.
#[tauri::command]
pub fn create_note(
    state: State<AppState>,
    title: String,
    content: String,
    tags: Option<Vec<String>>,
    folder_id: Option<String>,
    color: Option<String>,
) -> Result<NotePlaintext, String> {
    guard_unlocked_rw(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    state
        .key_manager
        .with_key(|key| {
            NoteService::create_note(
                &pool,
                key,
                CreateNoteRequest { title, content, tags, folder_id, color },
            )
        })
        .map_err(|e| e.to_string())
}

/// Fetch a single note by ID (decrypted).
#[tauri::command]
pub fn get_note(state: State<AppState>, id: String) -> Result<NotePlaintext, String> {
    guard_unlocked(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    state
        .key_manager
        .with_key(|key| NoteService::get_note(&pool, key, &id))
        .map_err(|e| e.to_string())
}

/// List all non-trashed notes (decrypted).
#[tauri::command]
pub fn list_notes(state: State<AppState>) -> Result<Vec<NotePlaintext>, String> {
    guard_unlocked(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    state
        .key_manager
        .with_key(|key| NoteService::list_notes(&pool, key))
        .map_err(|e| e.to_string())
}

/// List all TRASHED notes (for Trash page).
#[tauri::command]
pub fn list_trashed_notes(state: State<AppState>) -> Result<Vec<NotePlaintext>, String> {
    guard_unlocked(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    state
        .key_manager
        .with_key(|key| NoteService::list_trashed_notes(&pool, key))
        .map_err(|e| e.to_string())
}

/// Update an existing note.
#[tauri::command]
pub fn update_note(
    state: State<AppState>,
    id: String,
    title: Option<String>,
    content: Option<String>,
    tags: Option<Vec<String>>,
    folder_id: Option<String>,
    color: Option<String>,
    is_pinned: Option<bool>,
) -> Result<NotePlaintext, String> {
    guard_unlocked_rw(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    state
        .key_manager
        .with_key(|key| {
            NoteService::update_note(
                &pool,
                key,
                UpdateNoteRequest { id, title, content, tags, folder_id, color, is_pinned },
            )
        })
        .map_err(|e| e.to_string())
}

/// Soft-delete a note (moves to trash).
#[tauri::command]
pub fn delete_note(state: State<AppState>, id: String) -> Result<(), String> {
    guard_unlocked_rw(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    NoteService::delete_note(&pool, &id).map_err(|e| e.to_string())
}

/// Restore a note from trash.
#[tauri::command]
pub fn restore_note(state: State<AppState>, id: String) -> Result<(), String> {
    guard_unlocked_rw(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    NoteService::restore_note(&pool, &id).map_err(|e| e.to_string())
}

/// Full-text search across decrypted notes.
#[tauri::command]
pub fn search_notes(state: State<AppState>, query: String) -> Result<Vec<NotePlaintext>, String> {
    guard_unlocked(&state)?;
    refresh_autolock(&state);

    let pool = state.pool().map_err(|e| e.to_string())?;
    state
        .key_manager
        .with_key(|key| NoteService::search_notes(&pool, key, &query))
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
    let secs = crate::utils::config::AUTO_LOCK_DEFAULT_SECS;
    state.refresh_auto_lock(secs);
}