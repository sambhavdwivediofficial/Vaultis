// use base64::Engine;
use zeroize::Zeroizing;

use crate::utils::{
    config::{AES_KEY_SIZE, RECOVERY_SEGMENTS, RECOVERY_SEGMENT_LEN, RECOVERY_KEY_SIZE},
    errors::{VaultisError, VaultisResult},
};
use crate::crypto::{aes, random};

/// A recovery key consists of `RECOVERY_SEGMENTS` groups of `RECOVERY_SEGMENT_LEN` hex chars.
/// Example: `A3F2-9C81-B742-DE04-5F1A-B3C9-8D2E-4A7F-1B6C-9E05-2D8A-7F4B-3C1E-9A6D-5B2F-8E04`
#[derive(Debug, Clone)]
pub struct RecoveryKey {
    /// The raw 32-byte entropy backing the recovery key.
    entropy: Zeroizing<[u8; RECOVERY_KEY_SIZE]>,
    /// Display string in `XXXX-XXXX-...-XXXX` format (16 segments).
    pub display: String,
}

impl RecoveryKey {
    /// Generate a new random recovery key.
    pub fn generate() -> VaultisResult<Self> {
        let bytes = random::random_bytes(RECOVERY_KEY_SIZE)?;
        let mut entropy = Zeroizing::new([0u8; RECOVERY_KEY_SIZE]);
        entropy.copy_from_slice(&bytes);
        let display = format_recovery_key(&entropy);
        Ok(Self { entropy, display })
    }

    /// Parse a recovery key from a user-supplied string.
    /// Accepts formats with or without dashes, case-insensitive.
    pub fn from_str(s: &str) -> VaultisResult<Self> {
        let clean: String = s.chars().filter(|c| c.is_alphanumeric()).collect();
        let expected_len = RECOVERY_SEGMENTS * RECOVERY_SEGMENT_LEN; // 64
        if clean.len() != expected_len {
            return Err(VaultisError::InvalidRecoveryKey);
        }
        let bytes = hex::decode(&clean.to_uppercase())
            .map_err(|_| VaultisError::InvalidRecoveryKey)?;
        if bytes.len() != RECOVERY_KEY_SIZE {
            return Err(VaultisError::InvalidRecoveryKey);
        }
        let mut entropy = Zeroizing::new([0u8; RECOVERY_KEY_SIZE]);
        entropy.copy_from_slice(&bytes);
        let display = format_recovery_key(&entropy);
        Ok(Self { entropy, display })
    }

    /// Returns the raw 32-byte entropy.
    pub fn raw(&self) -> &[u8; RECOVERY_KEY_SIZE] {
        &self.entropy
    }
}

/// Format 32 bytes as `XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX` uppercase hex groups.
fn format_recovery_key(entropy: &[u8; RECOVERY_KEY_SIZE]) -> String {
    let hex_str = hex::encode_upper(entropy.as_slice()); // 64 hex chars
    hex_str
        .chars()
        .collect::<Vec<char>>()
        .chunks(RECOVERY_SEGMENT_LEN)
        .map(|chunk| chunk.iter().collect::<String>())
        .collect::<Vec<String>>()
        .join("-")
}

/// Encrypt the vault's master key using the recovery key so it can be recovered later.
/// Returns base64-encoded encrypted key blob.
pub fn encrypt_key_with_recovery(
    vault_key: &[u8; AES_KEY_SIZE],
    recovery: &RecoveryKey,
) -> VaultisResult<String> {
    aes::encrypt_to_base64(recovery.raw(), vault_key)
}

/// Decrypt the vault master key using a recovery key.
pub fn decrypt_key_with_recovery(
    encrypted_blob: &str,
    recovery: &RecoveryKey,
) -> VaultisResult<Zeroizing<[u8; AES_KEY_SIZE]>> {
    let plaintext = aes::decrypt_from_base64(recovery.raw(), encrypted_blob)?;
    if plaintext.len() != AES_KEY_SIZE {
        return Err(VaultisError::InvalidRecoveryKey);
    }
    let mut key = Zeroizing::new([0u8; AES_KEY_SIZE]);
    key.copy_from_slice(&plaintext);
    Ok(key)
}

use base64 as _; // ensure import is used via aes module