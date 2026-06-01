use std::path::{Path, PathBuf};

use crate::{
    files::chunk_processor::decrypt_file_chunked,
    utils::errors::{VaultisError, VaultisResult},
};

/// Decrypt `source` (a `.valts` file) to `dest`.
pub fn decrypt_file(
    key: &[u8; 32],
    source: &Path,
    dest: &PathBuf,
) -> VaultisResult<()> {
    if !source.exists() {
        return Err(VaultisError::FileNotFound(
            source.display().to_string(),
        ));
    }

    // Create parent directory for dest if needed
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent)?;
    }

    decrypt_file_chunked(key, source, dest)
}