use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Key, Nonce,
};
use base64::Engine;
use zeroize::Zeroizing;

use crate::utils::{
    config::{AES_NONCE_SIZE, AES_KEY_SIZE},
    errors::{VaultisError, VaultisResult},
};
use crate::crypto::random::generate_nonce;

/// Encrypt `plaintext` with AES-256-GCM.
///
/// Returns `(ciphertext_with_tag, nonce)`.
/// The nonce is random and must be stored alongside the ciphertext to decrypt.
pub fn encrypt(key: &[u8; AES_KEY_SIZE], plaintext: &[u8]) -> VaultisResult<(Vec<u8>, [u8; AES_NONCE_SIZE])> {
    let nonce_bytes = generate_nonce()?;
    let cipher_key = Key::<Aes256Gcm>::from_slice(key);
    let cipher = Aes256Gcm::new(cipher_key);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|_| VaultisError::EncryptionFailed("AES-GCM encrypt failed".into()))?;

    Ok((ciphertext, nonce_bytes))
}

/// Decrypt `ciphertext` (which includes the GCM auth tag) with AES-256-GCM.
///
/// Returns the plaintext wrapped in `Zeroizing` so the buffer is cleared on drop.
pub fn decrypt(
    key: &[u8; AES_KEY_SIZE],
    ciphertext: &[u8],
    nonce_bytes: &[u8; AES_NONCE_SIZE],
) -> VaultisResult<Zeroizing<Vec<u8>>> {
    let cipher_key = Key::<Aes256Gcm>::from_slice(key);
    let cipher = Aes256Gcm::new(cipher_key);
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| VaultisError::DecryptionFailed)?;

    Ok(Zeroizing::new(plaintext))
}

/// Encrypt bytes and encode the result as base64.
/// Format stored: `<base64(nonce)>.<base64(ciphertext_with_tag)>`
pub fn encrypt_to_base64(key: &[u8; AES_KEY_SIZE], plaintext: &[u8]) -> VaultisResult<String> {
    let (ciphertext, nonce) = encrypt(key, plaintext)?;
    let enc = base64::engine::general_purpose::STANDARD_NO_PAD;
    Ok(format!("{}.{}", enc.encode(nonce), enc.encode(ciphertext)))
}

/// Decode a base64 payload produced by `encrypt_to_base64` and decrypt it.
pub fn decrypt_from_base64(key: &[u8; AES_KEY_SIZE], encoded: &str) -> VaultisResult<Zeroizing<Vec<u8>>> {
    let enc = base64::engine::general_purpose::STANDARD_NO_PAD;
    let parts: Vec<&str> = encoded.splitn(2, '.').collect();
    if parts.len() != 2 {
        return Err(VaultisError::DecryptionFailed);
    }

    let nonce_vec = enc.decode(parts[0])?;
    let ciphertext = enc.decode(parts[1])?;

    if nonce_vec.len() != AES_NONCE_SIZE {
        return Err(VaultisError::DecryptionFailed);
    }

    let mut nonce_arr = [0u8; AES_NONCE_SIZE];
    nonce_arr.copy_from_slice(&nonce_vec);

    decrypt(key, &ciphertext, &nonce_arr)
}

/// Encrypt a UTF-8 string and return a base64-encoded encrypted string.
pub fn encrypt_string(key: &[u8; AES_KEY_SIZE], plaintext: &str) -> VaultisResult<String> {
    encrypt_to_base64(key, plaintext.as_bytes())
}

/// Decrypt a base64-encoded encrypted string back to UTF-8.
pub fn decrypt_string(key: &[u8; AES_KEY_SIZE], encoded: &str) -> VaultisResult<String> {
    let plaintext_bytes = decrypt_from_base64(key, encoded)?;
    String::from_utf8(plaintext_bytes.to_vec())
        .map_err(|e| VaultisError::Internal(format!("UTF-8 decode failed: {e}")))
}