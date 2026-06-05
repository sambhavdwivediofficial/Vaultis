// src-tauri/src/commands/vault.rs tauri commands related to vault management: creation, unlocking, locking, password changes, and deletion.
use tauri::State;
use std::fs;
use std::path::PathBuf;

use crate::{
    models::vault::VaultInfo,
    services::vault_service::VaultService,
    state::app_state::AppState,
    vault::lock_manager::spawn_auto_lock_monitor,
};

/// Check whether a vault has been created on this machine.
#[tauri::command]
pub fn vault_exists(state: State<AppState>) -> bool {
    let data_dir = state.data_dir.read().clone();
    VaultService::vault_exists(&data_dir)
}

/// Create a new vault. Returns the recovery key display string.
/// Must only be called once; subsequent calls return an error if vault already exists.
#[tauri::command]
pub fn create_vault(
    state: State<AppState>,
    password: String,
    display_name: String,
) -> Result<String, String> {
    let data_dir = state.data_dir.read().clone();

    if VaultService::vault_exists(&data_dir) {
        return Err("Vault already exists. Delete the existing vault first.".into());
    }

    let recovery = VaultService::create_vault(&data_dir, &password, &display_name)
        .map_err(|e| e.to_string())?;

    // Initialize pool after creation
    state.init_pool().map_err(|e| e.to_string())?;

    // Run DB migrations (schema already applied; this is a no-op on re-run)
    crate::database::migrations::run_migrations(&data_dir).map_err(|e| e.to_string())?;

    // Immediately unlock with the just-created password
    let key = VaultService::unlock_vault(&data_dir, &password)
        .map_err(|e| e.to_string())?;
    state.key_manager.set_key(key);
    state.reset_failed_attempts();

    tracing::info!("Vault created and unlocked — display_name={display_name}");
    Ok(recovery.display)
}

/// Unlock the vault with the master password.
/// Returns throttle delay seconds if too many failed attempts.
#[tauri::command]
pub fn unlock_vault(
    app_handle: tauri::AppHandle,
    state: State<AppState>,
    password: String,
    auto_lock_secs: Option<u64>,
) -> Result<VaultInfo, String> {
    let data_dir = state.data_dir.read().clone();

    // Throttle check
    {
        let count = *state.failed_attempts.read();
        if count > 0 {
            if let Some(&(_, delay)) = crate::utils::config::ATTEMPT_DELAY_SECONDS
                .iter()
                .rev()
                .find(|&&(threshold, _)| count >= threshold)
            {
                // Check if delay has passed
                let elapsed = state
                    .last_failed_at
                    .read()
                    .map(|t| t.elapsed().as_secs())
                    .unwrap_or(u64::MAX);
                if elapsed < delay {
                    return Err(format!(
                        "Too many failed attempts. Wait {} more seconds.",
                        delay.saturating_sub(elapsed)
                    ));
                }
            }
        }
    }

    // Attempt unlock
    match VaultService::unlock_vault(&data_dir, &password) {
        Ok(key) => {
            state.key_manager.set_key(key);
            state.reset_failed_attempts();
            state.init_pool().map_err(|e| e.to_string())?;

            // Start auto-lock monitor
            let secs = auto_lock_secs.unwrap_or(crate::utils::config::AUTO_LOCK_DEFAULT_SECS);
            state.set_auto_lock(secs);
            spawn_auto_lock_monitor(app_handle);

            let info = VaultService::get_vault_info(&data_dir).map_err(|e| e.to_string())?;
            tracing::info!("Vault unlocked — vault_id={}", info.vault_id);
            Ok(info)
        }
        Err(e) => {
            let delay = state.record_failed_attempt();
            let msg = if delay > 0 {
                format!("{e} — wait {delay} seconds before next attempt.")
            } else {
                e.to_string()
            };
            Err(msg)
        }
    }
}

/// Lock the vault immediately (clears in-memory key).
#[tauri::command]
pub fn lock_vault(state: State<AppState>) -> Result<(), String> {
    state.emergency_lock();
    tracing::info!("Vault locked by user");
    Ok(())
}

/// Change the master password. Vault must be unlocked.
#[tauri::command]
pub fn change_master_password(
    state: State<AppState>,
    current_password: String,
    new_password: String,
) -> Result<(), String> {
    if !state.is_unlocked() {
        return Err("Vault is locked.".into());
    }
    if *state.read_only.read() {
        return Err("Cannot change password in read-only mode.".into());
    }
    let data_dir = state.data_dir.read().clone();
    VaultService::change_password(&data_dir, &current_password, &new_password)
        .map_err(|e| e.to_string())?;

    // Re-derive and set new key
    let new_key = VaultService::unlock_vault(&data_dir, &new_password)
        .map_err(|e| e.to_string())?;
    state.key_manager.set_key(new_key);

    tracing::info!("Master password changed");
    Ok(())
}

/// Return public vault metadata. Does not require unlock.
#[tauri::command]
pub fn get_vault_info(state: State<AppState>) -> Result<VaultInfo, String> {
    let data_dir = state.data_dir.read().clone();
    VaultService::get_vault_info(&data_dir).map_err(|e| e.to_string())
}

/// Check whether the vault is currently unlocked.
#[tauri::command]
pub fn vault_is_unlocked(state: State<AppState>) -> bool {
    // Also check auto-lock expiry
    if state.check_auto_lock() {
        return false;
    }
    state.is_unlocked()
}

#[tauri::command]
pub async fn delete_vault_permanently(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    
    let data_dir = state.data_dir.read().clone();
    
    if data_dir.to_string_lossy().is_empty() {
        return Err("No vault path set".to_string());
    }
 
    // Lock the vault and clear in-memory keys
    state.emergency_lock();
 
    // Close DB pool to release file locks (critical for Windows)
    state.close_pool();
 
    // Give Windows time to release file handles
    tokio::time::sleep(std::time::Duration::from_millis(300)).await;
 
    // Get vault database file path
    let vault_db_path = data_dir.join("vault.db");
    
    // Securely wipe and delete vault database file
    if vault_db_path.exists() {
        if let Ok(file_size) = fs::metadata(&vault_db_path).map(|m| m.len()) {
            if let Ok(mut file) = fs::OpenOptions::new().write(true).open(&vault_db_path) {
                use std::io::Write;
                let zeros = vec![0u8; 4096];
                for _ in 0..(file_size as usize / 4096 + 1) {
                    let _ = file.write_all(&zeros);
                }
            }
        }
        
        if let Err(e) = fs::remove_file(&vault_db_path) {
            return Err(format!("Failed to delete vault file: {}", e));
        }
    }
 
    // Delete entire vault data directory
    if data_dir.exists() {
        if let Err(e) = fs::remove_dir_all(&data_dir) {
            return Err(format!("Failed to delete vault directory: {}", e));
        }
    }
 
    // Clear data_dir from state
    {
        let mut data_dir_lock = state.data_dir.write();
        *data_dir_lock = PathBuf::new();
    }
 
    Ok(serde_json::json!({
        "ok": true,
        "message": "Vault deleted permanently."
    }))
}