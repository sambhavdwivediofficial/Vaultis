use std::{
    io::{Read, Write},
    path::Path,
};
use sha2::{Digest, Sha256};

use crate::{
    crypto::{aes::encrypt, random::generate_nonce},
    utils::{
        config::{AES_NONCE_SIZE, CHUNK_SIZE_BYTES},
        errors::{VaultisError, VaultisResult},
    },
};

/// Encrypt a source file in `CHUNK_SIZE_BYTES` chunks and write the result to `dest`.
///
/// Output format per chunk:
/// `[nonce: 12 bytes][ciphertext+tag: N+16 bytes][chunk_len: 4 bytes LE]`
///
/// A terminator chunk of zero length signals EOF.
///
/// Returns `(nonce_hex, sha256_hex)` of the *original* file.
pub fn encrypt_file_chunked(
    key: &[u8; 32],
    source: &Path,
    dest: &Path,
) -> VaultisResult<(String, String)> {
    let mut reader = std::fs::File::open(source)
        .map_err(|e| VaultisError::FileReadError(e.to_string()))?;
    let mut writer = std::fs::File::create(dest)
        .map_err(|e| VaultisError::FileWriteError(e.to_string()))?;

    let file_nonce = generate_nonce()?;
    let mut hasher = Sha256::new();
    let mut buf = vec![0u8; CHUNK_SIZE_BYTES];

    loop {
        let n = reader
            .read(&mut buf)
            .map_err(|e| VaultisError::FileReadError(e.to_string()))?;

        if n == 0 {
            // Write terminator: nonce(12) + ciphertext of empty = tag only(16) + len(0 as u32 LE)
            let empty_nonce = generate_nonce()?;
            let (empty_ct, _) = encrypt(key, &[])?;
            write_chunk(&mut writer, &empty_nonce, &empty_ct, 0)?;
            break;
        }

        hasher.update(&buf[..n]);
        let chunk = &buf[..n];
        let chunk_nonce = generate_nonce()?;
        let (ciphertext, _) = encrypt(key, chunk)?;

        write_chunk(&mut writer, &chunk_nonce, &ciphertext, n as u32)?;
    }

    writer.flush().map_err(|e| VaultisError::FileWriteError(e.to_string()))?;

    let hash = hex::encode(hasher.finalize());
    let nonce_hex = hex::encode(file_nonce);
    Ok((nonce_hex, hash))
}

/// Decrypt a chunked-encrypted file and write plaintext to `dest`.
pub fn decrypt_file_chunked(
    key: &[u8; 32],
    source: &Path,
    dest: &Path,
) -> VaultisResult<()> {
    let mut reader = std::fs::File::open(source)
        .map_err(|e| VaultisError::FileReadError(e.to_string()))?;
    let mut writer = std::fs::File::create(dest)
        .map_err(|e| VaultisError::FileWriteError(e.to_string()))?;

    loop {
        // Read nonce
        let mut nonce = [0u8; AES_NONCE_SIZE];
        if let Err(e) = reader.read_exact(&mut nonce) {
            if e.kind() == std::io::ErrorKind::UnexpectedEof {
                break;
            }
            return Err(VaultisError::FileReadError(e.to_string()));
        }

        // Read original chunk length
        let mut len_buf = [0u8; 4];
        reader
            .read_exact(&mut len_buf)
            .map_err(|e| VaultisError::FileReadError(e.to_string()))?;
        let original_len = u32::from_le_bytes(len_buf) as usize;

        if original_len == 0 {
            // Terminator chunk
            break;
        }

        // Read ciphertext length: original + GCM tag (16)
        let ct_len = original_len + 16;
        let mut ciphertext = vec![0u8; ct_len];
        reader
            .read_exact(&mut ciphertext)
            .map_err(|e| VaultisError::FileReadError(e.to_string()))?;

        let plaintext = crate::crypto::aes::decrypt(key, &ciphertext, &nonce)?;
        writer
            .write_all(&plaintext)
            .map_err(|e| VaultisError::FileWriteError(e.to_string()))?;
    }

    writer.flush().map_err(|e| VaultisError::FileWriteError(e.to_string()))?;
    Ok(())
}

fn write_chunk(
    writer: &mut std::fs::File,
    nonce: &[u8; AES_NONCE_SIZE],
    ciphertext: &[u8],
    original_len: u32,
) -> VaultisResult<()> {
    writer
        .write_all(nonce)
        .map_err(|e| VaultisError::FileWriteError(e.to_string()))?;
    writer
        .write_all(&original_len.to_le_bytes())
        .map_err(|e| VaultisError::FileWriteError(e.to_string()))?;
    writer
        .write_all(ciphertext)
        .map_err(|e| VaultisError::FileWriteError(e.to_string()))?;
    Ok(())
}