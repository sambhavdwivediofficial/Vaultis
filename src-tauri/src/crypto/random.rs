use rand::{RngCore, SeedableRng};
use rand::rngs::OsRng;
use crate::utils::errors::{VaultisError, VaultisResult};
use crate::utils::config::{SALT_SIZE, AES_NONCE_SIZE};

/// Generate `n` cryptographically random bytes using the OS RNG.
pub fn random_bytes(n: usize) -> VaultisResult<Vec<u8>> {
    let mut buf = vec![0u8; n];
    OsRng.try_fill_bytes(&mut buf)
        .map_err(|e| VaultisError::Internal(format!("RNG failure: {e}")))?;
    Ok(buf)
}

/// Generate a random 32-byte Argon2 salt.
pub fn generate_salt() -> VaultisResult<[u8; SALT_SIZE]> {
    let mut salt = [0u8; SALT_SIZE];
    OsRng.try_fill_bytes(&mut salt)
        .map_err(|e| VaultisError::Internal(format!("Salt generation failed: {e}")))?;
    Ok(salt)
}

/// Generate a random 12-byte AES-GCM nonce.
pub fn generate_nonce() -> VaultisResult<[u8; AES_NONCE_SIZE]> {
    let mut nonce = [0u8; AES_NONCE_SIZE];
    OsRng.try_fill_bytes(&mut nonce)
        .map_err(|e| VaultisError::Internal(format!("Nonce generation failed: {e}")))?;
    Ok(nonce)
}

/// Generate a random UUID-like identifier (not RFC-4122; just 16 random bytes as hex).
pub fn random_id() -> VaultisResult<String> {
    let bytes = random_bytes(16)?;
    Ok(hex::encode(bytes))
}

/// Generate a secure random password of the requested length from a character set.
pub fn secure_random_password(length: usize, charset: &[u8]) -> VaultisResult<String> {
    if charset.is_empty() {
        return Err(VaultisError::Internal("Empty charset for password generation".into()));
    }
    let mut rng = rand::rngs::StdRng::from_entropy();
    let mut password = String::with_capacity(length);
    for _ in 0..length {
        let idx = (rng.next_u32() as usize) % charset.len();
        password.push(charset[idx] as char);
    }
    Ok(password)
}