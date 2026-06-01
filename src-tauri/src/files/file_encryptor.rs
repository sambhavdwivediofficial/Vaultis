use std::path::{Path, PathBuf};

use crate::{
    files::chunk_processor::encrypt_file_chunked,
    utils::errors::{VaultisError, VaultisResult},
};

/// Encrypt `source` to `dest` using chunked AES-256-GCM.
/// Returns `(nonce_hex, sha256_of_original)`.
pub fn encrypt_file(
    key: &[u8; 32],
    source: &Path,
    dest: &PathBuf,
) -> VaultisResult<(String, String)> {
    // Validate source exists
    if !source.exists() {
        return Err(VaultisError::FileNotFound(
            source.display().to_string(),
        ));
    }

    // Check file size limit
    let metadata = std::fs::metadata(source)?;
    if metadata.len() > crate::utils::config::MAX_FILE_SIZE_BYTES {
        return Err(VaultisError::FileTooLarge {
            max_mb: crate::utils::config::MAX_FILE_SIZE_BYTES / (1024 * 1024),
        });
    }

    encrypt_file_chunked(key, source, dest)
}