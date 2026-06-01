use argon2::{
    password_hash::{PasswordHasher, SaltString},
    Argon2, Params, Version, Algorithm,
};
use zeroize::Zeroizing;

use crate::utils::{
    config::{ARGON2_ITERATIONS, ARGON2_MEMORY_KIB, ARGON2_PARALLELISM, AES_KEY_SIZE},
    errors::{VaultisError, VaultisResult},
};

/// Derive a 256-bit encryption key from a master password + salt using Argon2id.
/// The returned key is wrapped in `Zeroizing<[u8; 32]>` so it is wiped from
/// memory when the wrapper is dropped.
pub fn derive_key(password: &str, salt: &[u8; 32]) -> VaultisResult<Zeroizing<[u8; AES_KEY_SIZE]>> {
    let params = Params::new(
        ARGON2_MEMORY_KIB,
        ARGON2_ITERATIONS,
        ARGON2_PARALLELISM,
        Some(AES_KEY_SIZE),
    )
    .map_err(|e| VaultisError::KeyDerivationFailed(e.to_string()))?;

    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);

    let mut output_key = Zeroizing::new([0u8; AES_KEY_SIZE]);

    argon2
        .hash_password_into(
            password.as_bytes(),
            salt.as_slice(),
            output_key.as_mut_slice(),
        )
        .map_err(|e| VaultisError::KeyDerivationFailed(e.to_string()))?;

    Ok(output_key)
}

/// Derive a key and return it as a `Vec<u8>` for callers that need heap storage.
/// Still wrapped in `Zeroizing` so memory is cleared on drop.
pub fn derive_key_vec(password: &str, salt: &[u8; 32]) -> VaultisResult<Zeroizing<Vec<u8>>> {
    let key = derive_key(password, salt)?;
    Ok(Zeroizing::new(key.to_vec()))
}

/// Compute a password hash suitable for storage (for vault password verification).
/// Uses Argon2id with a random salt; stores salt + hash together as a single string.
pub fn hash_password_for_storage(password: &str) -> VaultisResult<String> {
    let salt_bytes = crate::crypto::random::generate_salt()?;
    let salt_b64 = base64::engine::general_purpose::STANDARD_NO_PAD
        .encode(salt_bytes);
    // SaltString expects base64url-encoded salt
    let salt = SaltString::from_b64(&salt_b64)
        .map_err(|e| VaultisError::KeyDerivationFailed(e.to_string()))?;

    let params = Params::new(
        ARGON2_MEMORY_KIB,
        ARGON2_ITERATIONS,
        ARGON2_PARALLELISM,
        Some(AES_KEY_SIZE),
    )
    .map_err(|e| VaultisError::KeyDerivationFailed(e.to_string()))?;

    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);

    let hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| VaultisError::KeyDerivationFailed(e.to_string()))?;

    Ok(hash.to_string())
}

/// Verify a raw password against a stored Argon2id hash string.
pub fn verify_password_hash(password: &str, hash_str: &str) -> VaultisResult<bool> {
    use argon2::password_hash::{PasswordHash, PasswordVerifier};

    let parsed = PasswordHash::new(hash_str)
        .map_err(|_| VaultisError::InvalidPassword)?;

    let argon2 = Argon2::default();
    match argon2.verify_password(password.as_bytes(), &parsed) {
        Ok(_) => Ok(true),
        Err(argon2::password_hash::Error::Password) => Ok(false),
        Err(e) => Err(VaultisError::KeyDerivationFailed(e.to_string())),
    }
}

use base64::Engine;