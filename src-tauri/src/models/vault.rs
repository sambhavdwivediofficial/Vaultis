use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/// Persisted vault metadata (stored in `vault.meta` as encrypted JSON).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultMeta {
    /// Unique identifier for this vault instance.
    pub vault_id: String,
    /// Argon2id salt (hex-encoded) used for deriving the master key.
    pub salt: String,
    /// Argon2id password hash stored for fast password verification
    /// before the expensive full key derivation.
    pub password_hash: String,
    /// Vault key encrypted with the recovery key (base64).
    /// `None` if the user skipped recovery key setup.
    pub recovery_encrypted_key: Option<String>,
    /// UTC timestamp of vault creation.
    pub created_at: DateTime<Utc>,
    /// UTC timestamp of last unlock.
    pub last_unlocked_at: Option<DateTime<Utc>>,
    /// Schema version for future migrations.
    pub schema_version: u32,
    /// Display name of the vault (shown in the UI).
    pub display_name: String,
}

impl VaultMeta {
    pub const CURRENT_SCHEMA_VERSION: u32 = 1;
}

/// Summary sent to the frontend after unlock.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultInfo {
    pub vault_id: String,
    pub display_name: String,
    pub created_at: DateTime<Utc>,
    pub last_unlocked_at: Option<DateTime<Utc>>,
    pub schema_version: u32,
}

impl From<VaultMeta> for VaultInfo {
    fn from(meta: VaultMeta) -> Self {
        Self {
            vault_id: meta.vault_id,
            display_name: meta.display_name,
            created_at: meta.created_at,
            last_unlocked_at: meta.last_unlocked_at,
            schema_version: meta.schema_version,
        }
    }
}