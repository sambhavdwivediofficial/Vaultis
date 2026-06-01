use std::{
    io::{Read, Write},
    path::{Path, PathBuf},
};
use flate2::{read::GzDecoder, write::GzEncoder, Compression};
use tar::{Archive, Builder};

use crate::utils::errors::{VaultisError, VaultisResult};

/// Create a gzip-compressed tar archive from a list of `(source_path, archive_name)` pairs.
/// Returns the number of bytes written to `dest`.
pub fn create_archive(
    entries: &[(PathBuf, String)],
    dest: &Path,
) -> VaultisResult<u64> {
    let file = std::fs::File::create(dest)
        .map_err(|e| VaultisError::BackupFailed(format!("Cannot create archive file: {e}")))?;

    let encoder = GzEncoder::new(file, Compression::best());
    let mut builder = Builder::new(encoder);

    for (source, archive_name) in entries {
        if source.is_file() {
            builder
                .append_path_with_name(source, archive_name)
                .map_err(|e| VaultisError::BackupFailed(format!("Failed to add {archive_name}: {e}")))?;
        } else if source.is_dir() {
            builder
                .append_dir_all(archive_name, source)
                .map_err(|e| VaultisError::BackupFailed(format!("Failed to add dir {archive_name}: {e}")))?;
        }
    }

    builder
        .finish()
        .map_err(|e| VaultisError::BackupFailed(format!("Failed to finalize archive: {e}")))?;

    let size = std::fs::metadata(dest)
        .map(|m| m.len())
        .unwrap_or(0);

    tracing::debug!("Archive created: {} ({} bytes)", dest.display(), size);
    Ok(size)
}

/// Extract a gzip-compressed tar archive to `dest_dir`.
/// Creates `dest_dir` if it does not exist.
pub fn extract_archive(archive_path: &Path, dest_dir: &Path) -> VaultisResult<Vec<PathBuf>> {
    if !archive_path.exists() {
        return Err(VaultisError::FileNotFound(archive_path.display().to_string()));
    }

    std::fs::create_dir_all(dest_dir)?;

    let file = std::fs::File::open(archive_path)
        .map_err(|e| VaultisError::RestoreFailed(format!("Cannot open archive: {e}")))?;

    let decoder = GzDecoder::new(file);
    let mut archive = Archive::new(decoder);

    let mut extracted: Vec<PathBuf> = Vec::new();

    for entry in archive
        .entries()
        .map_err(|e| VaultisError::RestoreFailed(format!("Archive read error: {e}")))?
    {
        let mut entry = entry
            .map_err(|e| VaultisError::RestoreFailed(format!("Archive entry error: {e}")))?;
        let path = entry
            .path()
            .map_err(|e| VaultisError::RestoreFailed(e.to_string()))?
            .into_owned();
        let full_path = dest_dir.join(&path);

        entry
            .unpack(&full_path)
            .map_err(|e| VaultisError::RestoreFailed(format!("Extract failed for {}: {e}", path.display())))?;

        extracted.push(full_path);
    }

    tracing::debug!(
        "Archive extracted: {} ({} files)",
        archive_path.display(),
        extracted.len()
    );

    Ok(extracted)
}

/// Validate that a file looks like a valid gzip archive (checks magic bytes).
pub fn is_valid_archive(path: &Path) -> bool {
    let mut file = match std::fs::File::open(path) {
        Ok(f) => f,
        Err(_) => return false,
    };
    let mut magic = [0u8; 2];
    matches!(file.read_exact(&mut magic), Ok(_) if magic == [0x1f, 0x8b])
}

/// Return the uncompressed size of a gzip archive by reading its ISIZE trailer field.
/// For very large files this may wrap around (gzip trailer is 32-bit); use as an estimate only.
pub fn estimate_uncompressed_size(path: &Path) -> VaultisResult<u64> {
    let meta = std::fs::metadata(path)?;
    if meta.len() < 4 {
        return Ok(0);
    }
    let mut file = std::fs::File::open(path)?;
    // Seek to last 4 bytes (ISIZE field in gzip format)
    use std::io::Seek;
    file.seek(std::io::SeekFrom::End(-4))?;
    let mut buf = [0u8; 4];
    file.read_exact(&mut buf)?;
    Ok(u32::from_le_bytes(buf) as u64)
}

// Ensure Write trait is used
const _: fn() = || {
    let _: &dyn Write = &std::io::sink();
};