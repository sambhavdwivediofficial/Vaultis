use std::path::{Path, PathBuf};
use chrono::Utc;
use serde::{Deserialize, Serialize};

use crate::{
    backup::archive::create_archive,
    utils::{
        config::{APP_AUTHOR, APP_NAME, APP_REPO, BACKUP_EXTENSION},
        errors::{VaultisError, VaultisResult},
        paths::{get_database_path, get_encrypted_file_path, get_files_dir, get_vault_meta_path},
    },
};

/// Metadata embedded inside every `.vaultis` backup archive as `manifest.json`.
#[derive(Debug, Serialize, Deserialize)]
pub struct BackupManifest {
    pub app_name: String,
    pub app_version: String,
    pub author: String,
    pub repository: String,
    pub created_at: String,
    pub vault_id: String,
    pub schema_version: u32,
    pub file_count: usize,
    pub note_count: usize,
    pub password_count: usize,
    pub encrypted: bool,
}

/// Result returned to the frontend / backup command.
#[derive(Debug, Serialize, Deserialize)]
pub struct ExportResult {
    pub backup_path: String,
    pub size_bytes: u64,
    pub created_at: String,
}

/// Export the complete vault to a `.vaultis` archive file.
///
/// The archive contains:
/// - `vault.meta`      — vault metadata (already contains only hashes, no raw secrets)
/// - `vaultis.db`      — encrypted SQLite database
/// - `files/`          — all `.valts` encrypted file blobs
/// - `manifest.json`   — human-readable backup metadata
pub fn export_vault(
    data_dir: &PathBuf,
    dest_dir: &Path,
    vault_id: &str,
    note_count: usize,
    password_count: usize,
) -> VaultisResult<ExportResult> {
    std::fs::create_dir_all(dest_dir)?;

    let timestamp = Utc::now().format("%Y%m%d_%H%M%S").to_string();
    let archive_name = format!("vaultis_export_{}.{}", timestamp, BACKUP_EXTENSION);
    let archive_path = dest_dir.join(&archive_name);

    // Gather files to archive
    let mut entries: Vec<(PathBuf, String)> = Vec::new();

    let meta_path = get_vault_meta_path(data_dir);
    if meta_path.exists() {
        entries.push((meta_path, "vault.meta".into()));
    }

    let db_path = get_database_path(data_dir);
    if db_path.exists() {
        entries.push((db_path, "vaultis.db".into()));
    }

    let files_dir = get_files_dir(data_dir)?;
    let file_count = if files_dir.exists() {
        entries.push((files_dir.clone(), "files".into()));
        std::fs::read_dir(&files_dir)
            .map(|rd| rd.count())
            .unwrap_or(0)
    } else {
        0
    };

    // Write manifest to a temp file then include it
    let manifest = BackupManifest {
        app_name: APP_NAME.into(),
        app_version: env!("CARGO_PKG_VERSION").into(),
        author: APP_AUTHOR.into(),
        repository: APP_REPO.into(),
        created_at: Utc::now().to_rfc3339(),
        vault_id: vault_id.to_string(),
        schema_version: 1,
        file_count,
        note_count,
        password_count,
        encrypted: true,
    };

    let manifest_json = serde_json::to_string_pretty(&manifest)?;
    let manifest_tmp = data_dir.join("manifest_tmp.json");
    std::fs::write(&manifest_tmp, manifest_json.as_bytes())?;
    entries.push((manifest_tmp.clone(), "manifest.json".into()));

    let size_bytes = create_archive(&entries, &archive_path)?;

    // Remove temp manifest
    let _ = std::fs::remove_file(&manifest_tmp);

    tracing::info!(
        "Vault exported → {} ({} bytes, {} files, {} notes, {} passwords)",
        archive_path.display(),
        size_bytes,
        file_count,
        note_count,
        password_count
    );

    Ok(ExportResult {
        backup_path: archive_path.to_string_lossy().into_owned(),
        size_bytes,
        created_at: Utc::now().to_rfc3339(),
    })
}

/// Export a single encrypted file blob to a destination path (without decrypting).
/// Useful for secure sharing — the recipient needs the master password to decrypt.
pub fn export_encrypted_file(
    data_dir: &PathBuf,
    file_id: &str,
    dest_dir: &Path,
    encrypted_name: &str,
) -> VaultisResult<PathBuf> {
    let source = get_encrypted_file_path(data_dir, file_id)?;
    if !source.exists() {
        return Err(VaultisError::FileNotFound(source.display().to_string()));
    }
    let dest = dest_dir.join(encrypted_name);
    std::fs::copy(&source, &dest)?;
    Ok(dest)
}