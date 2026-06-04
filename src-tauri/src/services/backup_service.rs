// backup_service.rs
use std::path::PathBuf;
use chrono::Utc;

use crate::utils::errors::VaultisResult;

pub struct BackupService;

impl BackupService {
    pub fn create_backup(data_dir: &PathBuf, compression_level: Option<u32>) -> VaultisResult<PathBuf> {
        let backups_dir = crate::utils::paths::get_backups_dir(data_dir)?;
        let timestamp = Utc::now().format("%Y%m%d_%H%M%S").to_string();
        let backup_path = backups_dir.join(format!(
            "vaultis_backup_{}.{}",
            timestamp,
            crate::utils::config::BACKUP_EXTENSION
        ));

        let file = std::fs::File::create(&backup_path)
            .map_err(|e| crate::utils::errors::VaultisError::BackupFailed(e.to_string()))?;

        let compression = match compression_level {
            Some(0) => flate2::Compression::none(),
            Some(1) => flate2::Compression::fast(),
            Some(2..=8) => flate2::Compression::new(compression_level.unwrap()),
            Some(9) | Some(10) | None => flate2::Compression::best(),
            _ => flate2::Compression::best(),
        };

        let encoder = flate2::write::GzEncoder::new(file, compression);
        let mut archive = tar::Builder::new(encoder);

        let db_path = crate::utils::paths::get_database_path(data_dir);
        let files_dir = crate::utils::paths::get_files_dir(data_dir)?;
        let meta_path = crate::utils::paths::get_vault_meta_path(data_dir);

        if db_path.exists() {
            archive
                .append_path_with_name(&db_path, "vaultis.db")
                .map_err(|e| crate::utils::errors::VaultisError::BackupFailed(e.to_string()))?;
        }
        if meta_path.exists() {
            archive
                .append_path_with_name(&meta_path, "vault.meta")
                .map_err(|e| crate::utils::errors::VaultisError::BackupFailed(e.to_string()))?;
        }
        if files_dir.exists() {
            archive
                .append_dir_all("files", &files_dir)
                .map_err(|e| crate::utils::errors::VaultisError::BackupFailed(e.to_string()))?;
        }

        archive
            .finish()
            .map_err(|e| crate::utils::errors::VaultisError::BackupFailed(e.to_string()))?;

        tracing::info!("Backup created: {}", backup_path.display());
        Ok(backup_path)
    }

    pub fn restore_backup(data_dir: &PathBuf, backup_path: &PathBuf) -> VaultisResult<()> {
        let file = std::fs::File::open(backup_path)
            .map_err(|e| crate::utils::errors::VaultisError::RestoreFailed(e.to_string()))?;
        let decoder = flate2::read::GzDecoder::new(file);
        let mut archive = tar::Archive::new(decoder);

        archive
            .unpack(data_dir)
            .map_err(|e| crate::utils::errors::VaultisError::RestoreFailed(e.to_string()))?;

        tracing::info!("Backup restored from: {}", backup_path.display());
        Ok(())
    }

    pub fn list_backups(data_dir: &PathBuf) -> VaultisResult<Vec<PathBuf>> {
        let backups_dir = crate::utils::paths::get_backups_dir(data_dir)?;
        let mut backups = Vec::new();
        for entry in std::fs::read_dir(&backups_dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some(crate::utils::config::BACKUP_EXTENSION) {
                backups.push(path);
            }
        }
        backups.sort();
        backups.reverse();
        Ok(backups)
    }

    /// Delete a backup file.
    pub fn delete_backup(backup_path: &PathBuf) -> VaultisResult<()> {
        std::fs::remove_file(backup_path)
            .map_err(|e| crate::utils::errors::VaultisError::BackupFailed(e.to_string()))?;
        Ok(())
    }
}