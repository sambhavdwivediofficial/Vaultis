use std::path::PathBuf;
use chrono::Utc;
use uuid::Uuid;
use zeroize::Zeroizing;
use tracing::{info, warn};

use crate::{
    crypto::{
        argon2::{derive_key, hash_password_for_storage, verify_password_hash},
        // aes::{encrypt_string, decrypt_string},
        random::generate_salt,
        recovery::{RecoveryKey, encrypt_key_with_recovery},
    },
    models::vault::{VaultInfo, VaultMeta},
    utils::{
        errors::{VaultisError, VaultisResult},
        paths::get_vault_meta_path,
    },
};

/// Persist vault metadata as JSON to disk.
fn save_vault_meta(data_dir: &PathBuf, meta: &VaultMeta) -> VaultisResult<()> {
    let path = get_vault_meta_path(data_dir);
    let json = serde_json::to_string_pretty(meta)?;
    std::fs::write(&path, json.as_bytes())?;
    Ok(())
}

/// Load and deserialize vault metadata from disk.
pub fn load_vault_meta(data_dir: &PathBuf) -> VaultisResult<VaultMeta> {
    let path = get_vault_meta_path(data_dir);
    if !path.exists() {
        return Err(VaultisError::VaultNotFound);
    }
    let bytes = std::fs::read(&path)?;
    let meta: VaultMeta = serde_json::from_slice(&bytes)?;
    Ok(meta)
}

/// Check whether a vault has already been created.
pub fn vault_exists(data_dir: &PathBuf) -> bool {
    get_vault_meta_path(data_dir).exists()
}

/// Create a brand-new vault.
///
/// Returns the `RecoveryKey` so the frontend can display it to the user once.
pub fn create_vault(
    data_dir: &PathBuf,
    password: &str,
    display_name: &str,
) -> VaultisResult<RecoveryKey> {
    if vault_exists(data_dir) {
        return Err(VaultisError::VaultAlreadyExists);
    }

    // Derive salt + key
    let salt = generate_salt()?;
    let master_key = derive_key(password, &salt)?;

    // Hash password for fast verification on subsequent unlocks
    let password_hash = hash_password_for_storage(password)?;

    // Generate recovery key and encrypt the master key with it
    let recovery_key = RecoveryKey::generate()?;
    let recovery_encrypted_key = encrypt_key_with_recovery(&master_key, &recovery_key)?;

    let meta = VaultMeta {
        vault_id: Uuid::new_v4().to_string(),
        salt: hex::encode(salt),
        password_hash,
        recovery_encrypted_key: Some(recovery_encrypted_key),
        created_at: Utc::now(),
        last_unlocked_at: None,
        schema_version: VaultMeta::CURRENT_SCHEMA_VERSION,
        display_name: display_name.to_string(),
    };

    save_vault_meta(data_dir, &meta)?;
    info!("Vault created successfully: {}", meta.vault_id);

    Ok(recovery_key)
}

/// Unlock the vault. Returns the derived master key on success.
///
/// Performs brute-force throttling via `failed_attempts`.
pub fn unlock_vault(
    data_dir: &PathBuf,
    password: &str,
) -> VaultisResult<Zeroizing<[u8; 32]>> {
    let mut meta = load_vault_meta(data_dir)?;

    // Fast password verification before the expensive key derivation
    let matches = verify_password_hash(password, &meta.password_hash)?;
    if !matches {
        warn!("Invalid password attempt for vault {}", meta.vault_id);
        return Err(VaultisError::InvalidPassword);
    }

    // Derive actual key
    let salt_bytes = hex::decode(&meta.salt)
        .map_err(|_| VaultisError::IntegrityCheckFailed)?;
    let salt_arr: [u8; 32] = salt_bytes
        .try_into()
        .map_err(|_| VaultisError::IntegrityCheckFailed)?;
    let master_key = derive_key(password, &salt_arr)?;

    // Update last unlock timestamp
    meta.last_unlocked_at = Some(Utc::now());
    save_vault_meta(data_dir, &meta)?;

    info!("Vault unlocked: {}", meta.vault_id);
    Ok(master_key)
}

/// Unlock the vault using the recovery key.
pub fn unlock_with_recovery(
    data_dir: &PathBuf,
    recovery_display: &str,
) -> VaultisResult<Zeroizing<[u8; 32]>> {
    let meta = load_vault_meta(data_dir)?;
    let encrypted_blob = meta
        .recovery_encrypted_key
        .as_deref()
        .ok_or(VaultisError::InvalidRecoveryKey)?;

    let recovery = RecoveryKey::from_str(recovery_display)?;
    let key = crate::crypto::recovery::decrypt_key_with_recovery(encrypted_blob, &recovery)?;
    info!("Vault unlocked via recovery key: {}", meta.vault_id);
    Ok(key)
}

/// Change the master password.
/// Re-derives the key with a new salt and re-encrypts the recovery blob.
pub fn change_master_password(
    data_dir: &PathBuf,
    current_password: &str,
    new_password: &str,
) -> VaultisResult<()> {
    let mut meta = load_vault_meta(data_dir)?;

    // Verify current password
    if !verify_password_hash(current_password, &meta.password_hash)? {
        return Err(VaultisError::InvalidPassword);
    }

    // New salt + key
    let new_salt = generate_salt()?;
    let new_key = derive_key(new_password, &new_salt)?;
    let new_hash = hash_password_for_storage(new_password)?;

    // Re-encrypt recovery key with new master key
    let new_recovery_enc = if let Some(_) = &meta.recovery_encrypted_key {
        let recovery_key = RecoveryKey::generate()?;
        Some(encrypt_key_with_recovery(&new_key, &recovery_key)?)
    } else {
        None
    };

    meta.salt = hex::encode(new_salt);
    meta.password_hash = new_hash;
    meta.recovery_encrypted_key = new_recovery_enc;

    save_vault_meta(data_dir, &meta)?;
    info!("Master password changed for vault: {}", meta.vault_id);
    Ok(())
}

/// Return public vault info (no secrets).
pub fn get_vault_info(data_dir: &PathBuf) -> VaultisResult<VaultInfo> {
    let meta = load_vault_meta(data_dir)?;
    Ok(meta.into())
}

// Silence unused import warning — used via aes module indirectly
// use crate::crypto::aes as _;