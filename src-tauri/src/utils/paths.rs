use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::utils::{config, errors::VaultisResult};

/// Returns the app data directory, creating it if needed.
pub fn get_app_data_dir(app: &AppHandle) -> VaultisResult<PathBuf> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| crate::utils::errors::VaultisError::Internal(e.to_string()))?;
    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}

/// Returns the encrypted files directory, creating it if needed.
pub fn get_files_dir(data_dir: &PathBuf) -> VaultisResult<PathBuf> {
    let dir = data_dir.join(config::FILES_DIR);
    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}

/// Returns the backups directory, creating it if needed.
pub fn get_backups_dir(data_dir: &PathBuf) -> VaultisResult<PathBuf> {
    let dir = data_dir.join(config::BACKUPS_DIR);
    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}

/// Returns the logs directory, creating it if needed.
pub fn get_logs_dir(data_dir: &PathBuf) -> VaultisResult<PathBuf> {
    let dir = data_dir.join(config::LOGS_DIR);
    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}

/// Returns the full path to the SQLite database file.
pub fn get_database_path(data_dir: &PathBuf) -> PathBuf {
    data_dir.join(config::DATABASE_FILENAME)
}

/// Returns the full path to the vault metadata file.
pub fn get_vault_meta_path(data_dir: &PathBuf) -> PathBuf {
    data_dir.join(config::VAULT_META_FILENAME)
}

/// Returns the encrypted storage path for a specific file UUID.
pub fn get_encrypted_file_path(data_dir: &PathBuf, file_id: &str) -> VaultisResult<PathBuf> {
    let files_dir = get_files_dir(data_dir)?;
    Ok(files_dir.join(format!("{}.{}", file_id, config::ENCRYPTED_FILE_EXTENSION)))
}

/// Returns the path for a backup file by name.
pub fn get_backup_path(data_dir: &PathBuf, name: &str) -> VaultisResult<PathBuf> {
    let backups_dir = get_backups_dir(data_dir)?;
    Ok(backups_dir.join(format!("{}.{}", name, config::BACKUP_EXTENSION)))
}