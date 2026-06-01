use tauri::State;
// use zeroize::Zeroizing;

use crate::{
    models::vault::VaultInfo,
    services::vault_service::VaultService,
    state::app_state::AppState,
    vault::lock_manager::spawn_auto_lock_monitor,
    // utils::errors::VaultisResult,
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