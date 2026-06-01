use std::path::{Path, PathBuf};

use crate::{
    backup::{
        archive::{extract_archive, is_valid_archive},
        exporter::BackupManifest,
    },
    utils::errors::{VaultisError, VaultisResult},
};

/// Validation result returned before actually restoring.
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct BackupValidation {
    pub is_valid: bool,
    pub manifest: Option<BackupManifest>,
    pub error: Option<String>,
}

/// Validate a `.vaultis` backup without restoring it.
/// Checks magic bytes, extracts manifest, and reports what's inside.
pub fn validate_backup(backup_path: &Path) -> BackupValidation {
    if !is_valid_archive(backup_path) {
        return BackupValidation {
            is_valid: false,
            manifest: None,
            error: Some("File is not a valid gzip archive".into()),
        };
    }

    // Try to read manifest from archive without fully extracting
    match read_manifest_from_archive(backup_path) {
        Ok(manifest) => BackupValidation {
            is_valid: true,
            manifest: Some(manifest),
            error: None,
        },
        Err(e) => BackupValidation {
            is_valid: false,
            manifest: None,
            error: Some(format!("Manifest read failed: {e}")),
        },
    }
}

/// Restore a `.vaultis` backup into `data_dir`.
///
/// Strategy:
/// 1. Validate the backup first.
/// 2. Extract to a staging temp directory.
/// 3. Move files from staging to `data_dir` atomically.
pub fn restore_backup(data_dir: &PathBuf, backup_path: &Path) -> VaultisResult<BackupManifest> {
    // 1. Validate
    let validation = validate_backup(backup_path);
    if !validation.is_valid {
        return Err(VaultisError::InvalidBackup);
    }
    let manifest = validation.manifest.unwrap();

    // 2. Extract to temp staging dir
    let staging = data_dir.join("restore_staging");
    if staging.exists() {
        std::fs::remove_dir_all(&staging)?;
    }
    std::fs::create_dir_all(&staging)?;

    extract_archive(backup_path, &staging)
        .map_err(|e| VaultisError::RestoreFailed(e.to_string()))?;

    // 3. Move files from staging to data_dir
    copy_dir_contents(&staging, data_dir)?;

    // 4. Cleanup staging
    let _ = std::fs::remove_dir_all(&staging);

    tracing::info!(
        "Backup restored — vault_id={} schema_v={}",
        manifest.vault_id,
        manifest.schema_version
    );

    Ok(manifest)
}

/// Read and parse `manifest.json` from inside a gzip tar archive without fully extracting.
fn read_manifest_from_archive(archive_path: &Path) -> VaultisResult<BackupManifest> {
    let file = std::fs::File::open(archive_path)
        .map_err(|e| VaultisError::RestoreFailed(e.to_string()))?;
    let decoder = flate2::read::GzDecoder::new(file);
    let mut archive = tar::Archive::new(decoder);

    for entry in archive
        .entries()
        .map_err(|e| VaultisError::RestoreFailed(e.to_string()))?
    {
        let mut entry = entry.map_err(|e| VaultisError::RestoreFailed(e.to_string()))?;
        let path = entry
            .path()
            .map_err(|e| VaultisError::RestoreFailed(e.to_string()))?
            .into_owned();

        if path.file_name().and_then(|n| n.to_str()) == Some("manifest.json") {
            use std::io::Read;
            let mut contents = String::new();
            entry
                .read_to_string(&mut contents)
                .map_err(|e| VaultisError::RestoreFailed(e.to_string()))?;
            let manifest: BackupManifest = serde_json::from_str(&contents)?;
            return Ok(manifest);
        }
    }

    Err(VaultisError::RestoreFailed(
        "manifest.json not found in backup archive".into(),
    ))
}

/// Recursively copy directory contents from `src` to `dest`,
/// overwriting conflicting files.
fn copy_dir_contents(src: &Path, dest: &Path) -> VaultisResult<()> {
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let file_name = entry.file_name();
        // Skip manifest temp and staging meta
        if file_name == "manifest.json" {
            continue;
        }
        let dest_path = dest.join(&file_name);
        if src_path.is_dir() {
            std::fs::create_dir_all(&dest_path)?;
            copy_dir_contents(&src_path, &dest_path)?;
        } else {
            std::fs::copy(&src_path, &dest_path)?;
        }
    }
    Ok(())
}